// ─────────────────────────────────────────────────────────────
// tilda-analytics.mjs — подключение Яндекс.Метрики и подтверждение прав
// в Яндекс.Вебмастере / Google Search Console через head-код сайта.
//
// Аккаунты создаёт владелец сайта (регистрацию и ввод паролей я не делаю).
// От тебя нужны только идентификаторы, дальше всё делает этот скрипт:
//
//   $env:METRIKA_ID='12345678'            # номер счётчика Метрики
//   $env:YANDEX_VERIFY='abcdef1234567890' # содержимое meta yandex-verification
//   $env:GOOGLE_VERIFY='xxxxxxxx'         # содержимое meta google-site-verification
//   node scripts/tilda-analytics.mjs --apply
//
// Любую из трёх переменных можно не задавать — соответствующий кусок
// просто не добавится. Повторный запуск не плодит дубли: всё помечено
// маркером и заменяется целиком.
//
// ВАЖНО (проверено на своей шкуре): Tilda впекает head в опубликованный HTML,
// поэтому после правки нужен перепубликс — запусти scripts/tilda-republish.mjs.
// ─────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs';
import { withSession, PROJECTID, pace } from './tilda-session.mjs';

const APPLY = process.argv.includes('--apply');
const METRIKA_ID = process.env.METRIKA_ID || '';
const YANDEX_VERIFY = process.env.YANDEX_VERIFY || '';
const GOOGLE_VERIFY = process.env.GOOGLE_VERIFY || '';

const MARK = 'MBezu · analytics';
const START = `<!-- ${MARK} · начало -->`;
const END = `<!-- ${MARK} · конец -->`;

function buildSnippet() {
  const parts = [START];
  if (YANDEX_VERIFY) parts.push(`<meta name="yandex-verification" content="${YANDEX_VERIFY}" />`);
  if (GOOGLE_VERIFY) parts.push(`<meta name="google-site-verification" content="${GOOGLE_VERIFY}" />`);
  if (METRIKA_ID) {
    // Код взят ровно тот, что выдаёт сама Метрика (вкладка HTML), только с
    // подставленным номером счётчика: свой сокращённый вариант не пишу, чтобы
    // не разойтись с тем, что Метрика ожидает при проверке счётчика.
    parts.push(`<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}', 'ym');

    ym(${METRIKA_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/${METRIKA_ID}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->`);
  }
  parts.push(END);
  return parts.join('\n');
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

if (!METRIKA_ID && !YANDEX_VERIFY && !GOOGLE_VERIFY) {
  console.log(`  Ни одного идентификатора не задано — делать нечего.

  Что нужно от тебя (я не регистрирую аккаунты):
    1. metrika.yandex.ru → создать счётчик для mbezu.ru → взять НОМЕР счётчика.
    2. webmaster.yandex.ru → добавить сайт https://mbezu.ru → способ «Мета-тег»
       → скопировать значение content.
    3. search.google.com/search-console → добавить ресурс с префиксом URL
       → способ «HTML-тег» → скопировать значение content.

  Потом:
    $env:METRIKA_ID='...'; $env:YANDEX_VERIFY='...'; $env:GOOGLE_VERIFY='...'
    node scripts/tilda-analytics.mjs --apply
    node scripts/tilda-republish.mjs
`);
  process.exit(0);
}

await withSession(async ({ page }) => {
  const src = await openEditor(page);
  if (!src) { console.log('  ✗ поле headcode не найдено'); return; }
  mkdirSync('backup', { recursive: true });
  writeFileSync('backup/tilda-head-before-analytics.html', src, 'utf8');

  const snippet = buildSnippet();
  const re = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const out = re.test(src) ? src.replace(re, snippet) : src.trimEnd() + '\n' + snippet + '\n';

  console.log('  что ставим:');
  console.log('    Метрика        :', METRIKA_ID || '—');
  console.log('    Яндекс.Вебмастер:', YANDEX_VERIFY ? 'мета-тег' : '—');
  console.log('    Search Console :', GOOGLE_VERIFY ? 'мета-тег' : '—');
  console.log(`    длина head: ${src.length} → ${out.length}`);
  if (!APPLY) { console.log('\n  прогон без записи. Применить: --apply'); return; }

  await pace();
  await page.evaluate((v) => {
    const host = document.querySelector('.ace_editor');
    if (window.ace && host) { try { window.ace.edit(host).setValue(v, -1); } catch { /* ниже */ } }
    const ta = document.querySelector('textarea[name="headcode"]');
    if (ta) {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, v);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, out);
  await pace();
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].filter((e) => e.offsetParent !== null)
      .find((e) => /^(Сохранить|Cохранить)$/.test((e.innerText || '').trim()));
    if (!b) return false; b.click(); return true;
  });
  console.log('  «Сохранить»:', clicked);
  await page.waitForTimeout(7000);

  const after = await openEditor(page);
  const ok = after.includes(MARK)
    && (!METRIKA_ID || after.includes(`ym(${METRIKA_ID}`))
    && (!YANDEX_VERIFY || after.includes(YANDEX_VERIFY));
  console.log(ok ? '\n  ✓ записано и сверено' : '\n  ✗ не подтвердилось — исходник в backup/tilda-head-before-analytics.html');
  console.log('  дальше обязательно: node scripts/tilda-republish.mjs');
});
