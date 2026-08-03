// ─────────────────────────────────────────────────────────────
// tilda-head-code.mjs — правка head-кода сайта в Tilda.
//
// Где лежит (нашёл перебором, Sprint 15):
//   Настройки сайта → «Вставка кода» → кнопка «Редактировать код»
//   → модалка с редактором Ace; значение — в textarea[name="headcode"].
//   Хешем #tab=… вкладки НЕ переключаются, нужен клик по кнопке.
//
// Что чиним (аудит, направления 7 и 8):
//   • 4 скрипта с unpkg.com на 4,1 МБ на КАЖДОЙ странице, включая нативный
//     товар и корзину: @babel/standalone 3064 КБ, model-viewer 913 КБ,
//     react-dom + react UMD 140 КБ. Проверено curl'ом по 7 страницам:
//     type="text/babel" — 0, <model-viewer> — 0, window.React — 0.
//     Никто их не использует.
//   • og:site_name и Organization.name = «M.Bez» → «MBezu».
//   • свой og:type — дубль тильдовского, убираем.
//
//   node scripts/tilda-head-code.mjs          — показать план, ничего не писать
//   node scripts/tilda-head-code.mjs --apply  — записать и сверить
// ─────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs';
import { withSession, PROJECTID, pace } from './tilda-session.mjs';

const APPLY = process.argv.includes('--apply');
const DEAD = ['@babel/standalone', '@google/model-viewer', 'react-dom@18', 'react@18'];

function patchHead(src) {
  let out = src;
  const removed = [];
  for (const needle of DEAD) {
    const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`[ \\t]*<script\\b[^>]*src="[^"]*${esc}[^"]*"[^>]*>\\s*</script>[ \\t]*\\r?\\n?`, 'gi');
    const before = out;
    out = out.replace(re, '');
    if (out !== before) removed.push(needle);
  }
  const b0 = out;
  out = out.replace(/(<meta[^>]+property="og:site_name"[^>]+content=")M\.Bez(")/i, '$1MBezu$2');
  out = out.replace(/("name"\s*:\s*")M\.Bez(")/g, '$1MBezu$2');
  const brandFixed = out !== b0;

  const t0 = out;
  out = out.replace(/[ \t]*<meta[^>]+property="og:type"[^>]*>[ \t]*\r?\n?/i, '');
  const typeFixed = out !== t0;

  return { out, removed, brandFixed, typeFixed };
}

const openEditor = async (page) => {
  await page.goto(`https://tilda.ru/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((e) => (e.innerText || '').trim() === 'Вставка кода');
    if (!b) throw new Error('вкладка «Вставка кода» не найдена');
    b.click();
  });
  await page.waitForTimeout(4000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button,a')].filter((e) => /редактировать код/i.test(e.innerText || ''))[0];
    if (!b) throw new Error('кнопка «Редактировать код» не найдена');
    b.click();
  });
  await page.waitForTimeout(5000);
  return page.evaluate(() => (document.querySelector('textarea[name="headcode"]') || {}).value || '');
};

await withSession(async ({ page }) => {
  const src = await openEditor(page);
  if (!src) { console.log('  ✗ поле headcode пустое или не найдено — ничего не делаю'); return; }

  mkdirSync('backup', { recursive: true });
  writeFileSync('backup/tilda-head-before.html', src, 'utf8');
  console.log(`  снимок исходника: backup/tilda-head-before.html (${src.length} симв.)`);

  const { out, removed, brandFixed, typeFixed } = patchHead(src);
  console.log('\n  план правки:');
  console.log('    убрать скриптов:', removed.length ? removed.join(', ') : 'ни одного');
  console.log('    M.Bez → MBezu  :', brandFixed ? 'да' : 'не найдено');
  console.log('    свой og:type   :', typeFixed ? 'убрать' : 'не найден');
  console.log(`    длина: ${src.length} → ${out.length} симв.`);

  if (!APPLY) { console.log('\n  прогон без записи. Применить: node scripts/tilda-head-code.mjs --apply'); return; }
  if (out === src) { console.log('\n  нечего менять — выхожу.'); return; }

  await pace();
  // Пишем ЧЕРЕЗ Ace: у редактора своя модель, правка скрытой textarea в неё не попадёт.
  const written = await page.evaluate((v) => {
    const ta = document.querySelector('textarea[name="headcode"]');
    const host = document.querySelector('.ace_editor');
    let viaAce = false;
    if (window.ace && host) {
      try { window.ace.edit(host).setValue(v, -1); viaAce = true; } catch { /* упадём на textarea */ }
    }
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, v);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return { viaAce, taLen: ta ? ta.value.length : -1 };
  }, out);
  console.log('\n  записано в редактор:', JSON.stringify(written));

  await pace();
  // Кнопка «Сохранить» — точное совпадение текста; в Tilda встречается латинская C.
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')]
      .filter((e) => e.offsetParent !== null)
      .find((e) => /^(Сохранить|Cохранить)$/.test((e.innerText || '').trim()));
    if (!b) return false;
    b.click();
    return true;
  });
  console.log('  «Сохранить» нажата:', clicked);
  await page.waitForTimeout(7000);

  // Сверка №1 — перечитать поле, открыв редактор заново.
  const after = await openEditor(page);
  const stillDead = DEAD.filter((d) => after.includes(d));
  console.log('\n  сверка в админке:');
  console.log('    длина:', after.length);
  console.log('    мёртвые скрипты остались:', stillDead.length ? stillDead.join(', ') : 'нет');
  console.log('    og:site_name = M.Bez:', /og:site_name[^>]*M\.Bez/.test(after) ? 'ДА — не записалось' : 'нет');

  const ok = after.length > 0 && stillDead.length === 0 && !/og:site_name[^>]*M\.Bez/.test(after);
  console.log(ok ? '\n  ✓ записано и сверено в админке' : '\n  ✗ правка не подтвердилась — исходник в backup/tilda-head-before.html');
});
