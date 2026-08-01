// ─────────────────────────────────────────────────────────────
// tilda-index-page.mjs (Sprint 15, Ф3.3) — смена индексной страницы.
// Порядок жёсткий: снапшот → переключение → НЕМЕДЛЕННАЯ проверка корня →
// при поломке автоматический откат. Ничего другого скрипт не делает.
//
// TO=142947296 (по умолчанию) · APPLY=0 — только показать текущее состояние.
// ─────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs';
import { withSession, PROJECTID } from './tilda-session.mjs';

const TO = process.env.TO || '142947296';
const APPLY = process.env.APPLY !== '0';
const UA = 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)';

/** Корень жив? Факт, а не отсутствие ошибки: 200 + H1 + узнаваемый текст главной. */
async function checkRoot() {
  try {
    const r = await fetch('https://mbezu.ru/?cb=' + Date.now(), { headers: { 'User-Agent': UA }, redirect: 'manual' });
    const html = r.status === 200 ? await r.text() : '';
    const h1 = (html.match(/<h1/g) || []).length;
    const ok = r.status === 200 && h1 === 1 && /живущие|интерьер/i.test(html) && html.length > 30000;
    return { ok, status: r.status, h1, bytes: html.length };
  } catch (e) { return { ok: false, status: 'ошибка сети', h1: 0, bytes: 0, err: String(e).slice(0, 40) }; }
}

const openIndexTab = async (page) => {
  await page.goto(`https://tilda.ru/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,div,li,button')].filter((e) => e.offsetParent !== null)
      .find((e) => /^главная страница$/i.test((e.innerText || '').trim()));
    el && el.click();
  });
  await page.waitForTimeout(4000);
};

const readIndex = (page) => page.evaluate(() => document.querySelector('select[name="indexpageid"]')?.value ?? null);

const setIndex = (page, val) => page.evaluate((v) => {
  const s = document.querySelector('select[name="indexpageid"]');
  if (!s) return 'select не найден';
  s.value = v;
  s.dispatchEvent(new Event('change', { bubbles: true }));
  // ⚠️ Только ТОЧНОЕ совпадение текста: поиск по вхождению «охранит» цепляет
  // родительский контейнер «Закрыть Сохранить изменения», клик по нему ничего не делает
  // (уже поймано: настройка молча не сохранялась).
  const btn = [...document.querySelectorAll('button,a,div,input[type=button],input[type=submit]')]
    .filter((e) => e.offsetParent !== null)
    .find((e) => /^сохранить изменения$/i.test((e.innerText || e.value || '').trim()));
  if (!btn) return 'кнопка «Сохранить изменения» не найдена';
  btn.click();
  return `выбрано ${s.value}, сохранение нажато`;
}, val);

await withSession(async ({ page }) => {
  await openIndexTab(page);
  const before = await readIndex(page);
  const rootBefore = await checkRoot();
  console.log(`  ДО: indexpageid=${before} · корень: ${JSON.stringify(rootBefore)}`);
  mkdirSync('backup', { recursive: true });
  writeFileSync('backup/index-page-before.json', JSON.stringify({ indexpageid: before, rootBefore, ts: new Date().toISOString() }, null, 1), 'utf-8');

  if (!APPLY) { console.log('  APPLY=0 — только чтение'); return; }
  if (before === TO) { console.log('  уже нужная страница, менять нечего'); return; }
  if (!rootBefore.ok) { console.error('  ✗ корень СЕЙЧАС нездоров — не меняю индексную, сначала разобраться'); process.exit(1); }

  console.log(`  переключаю ${before} → ${TO} …`);
  console.log('  ', await setIndex(page, TO));
  await page.waitForTimeout(9000);

  await openIndexTab(page);
  const after = await readIndex(page);
  console.log(`  в настройках теперь: ${after}`);
  // ✓ ставится по ФАКТУ смены, а не по «корень не упал»: иначе несработавшее
  // сохранение выглядит успехом (уже поймано — скрипт рапортовал успех при indexpageid=старый).
  if (after !== TO) {
    console.error(`\n  ✗ ПЕРЕКЛЮЧЕНИЕ НЕ СОХРАНИЛОСЬ: ожидали ${TO}, в настройках ${after}. Корень не трогали.\n`);
    process.exit(1);
  }

  // НЕМЕДЛЕННАЯ проверка корня, с несколькими попытками на распространение
  let root = null;
  for (let i = 1; i <= 6; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    root = await checkRoot();
    console.log(`   проверка корня #${i}: ${JSON.stringify(root)}`);
    if (root.ok) break;
  }

  if (!root.ok) {
    console.error('\n  ✗ КОРЕНЬ СЛОМАЛСЯ — откатываю индексную страницу обратно');
    await openIndexTab(page);
    console.log('  ', await setIndex(page, before));
    await page.waitForTimeout(9000);
    const back = await checkRoot();
    console.error(`  после отката корень: ${JSON.stringify(back)}`);
    process.exit(1);
  }
  console.log(`\n  ✓ Индексная страница = ${after}, корень жив (200, H1=1, ${root.bytes} байт)\n`);
});
