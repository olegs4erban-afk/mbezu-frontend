// ─────────────────────────────────────────────────────────────
// tilda-cart-page.mjs — наполнить страницу /cart (аудит 3.5: мёртвый экран).
// Вставляет T123-блок (та же робо-механика, что у форм: ВСЕ БЛОКИ → Другое → T123)
// и пишет в него мини-контейнер: заголовок, автооткрытие нативной корзины,
// кнопки «Открыть корзину» и «В каталог». Страница остаётся noindex.
// ─────────────────────────────────────────────────────────────
import { withSession, PROJECTID, publishPage } from './tilda-session.mjs';

const PAGE = '142949956';
const HTML = `<!-- MBezu · cart · заглушка-мост (Sprint 15, аудит 3.5) -->
<link rel="stylesheet" href="https://cdn.mbezu.ru/e/style.css">
<div style="min-height:60vh;display:grid;place-items:center;background:var(--bg,#ede5d6);padding:60px 24px;text-align:center">
  <div>
    <h1 class="display" style="margin:0 0 12px;font-size:clamp(40px,6vw,72px);font-weight:500;letter-spacing:-.03em;color:var(--ink,#2a2520)">Корзина</h1>
    <p style="margin:0 0 28px;font-size:16px;color:var(--ink-2,#6b5d4a);max-width:420px">Корзина открывается поверх любой страницы — сейчас откроем её здесь.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn btn-solid" style="cursor:pointer" onclick="typeof tcart__openCart==='function'&&tcart__openCart()">Открыть корзину</button>
      <a class="btn btn-ghost" style="text-decoration:none" href="/catalog">В каталог</a>
    </div>
  </div>
</div>
<script>
(function(){var n=0,t=setInterval(function(){n++;if(typeof tcart__openCart==='function'){clearInterval(t);tcart__openCart();}else if(n>40)clearInterval(t);},250);})();
</script>`;

await withSession(async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(`https://tilda.ru/page/?pageid=${PAGE}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);

  // уже есть наш T123? (идемпотентность)
  const existing = await page.evaluate(async ({ PAGE, PROJECTID }) => {
    const r = await fetch('/page/get/getpage/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ pageid: PAGE, projectid: PROJECTID }).toString(),
    });
    const j = JSON.parse(await r.text());
    const t123 = (j.records || []).find((x) => String(x.tplid) === '131');
    if (!t123) return null;
    const m = String(t123.html || '').match(/recordid="([0-9]+)"/);
    return m ? m[1] : null;
  }, { PAGE, PROJECTID });

  let rec = existing;
  if (!rec) {
    const before = await page.evaluate(() => [...document.querySelectorAll('[id^="record"]')].map((e) => e.id));
    const click = async (finder, label, wait = 4000) => {
      const p = await page.evaluate(finder);
      if (!p) throw new Error('не найдено: ' + label);
      await page.mouse.click(p.x, p.y);
      await page.waitForTimeout(wait);
    };
    await click(() => {
      const el = [...document.querySelectorAll('a,button,div')].find((e) => (e.innerText || '').trim() === 'ВСЕ БЛОКИ');
      if (!el) return null; const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, 'ВСЕ БЛОКИ');
    await click(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const el = [...document.querySelectorAll('a,div,li')].filter(vis).find((e) => (e.innerText || '').trim() === 'Другое');
      if (!el) return null; const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, 'категория Другое');
    await click(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 60 && r.height > 40; };
      const el = [...document.querySelectorAll('.tp-library__tpl-body')].filter(vis)
        .find((e) => /T123|HTML/i.test(e.innerText || ''));
      if (!el) {
        console.log('ДОСТУПНЫЕ:', [...document.querySelectorAll('.tp-library__tpl-body')].filter(vis)
          .map((e) => (e.innerText || '').replace(/s+/g, ' ').slice(0, 40)).slice(0, 12).join(' | '));
        return null;
      }
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, 'шаблон T123/HTML', 8000);
    const after = await page.evaluate(() => [...document.querySelectorAll('[id^="record"]')].map((e) => e.id));
    rec = after.filter((id) => !before.includes(id)).map((id) => id.replace('record', ''))[0];
    console.log('вставлен T123:', rec);
  } else console.log('T123 уже есть:', rec);
  if (!rec) throw new Error('нет recordid');

  const wr = await page.evaluate(async ({ PAGE, rec, HTML, PROJECTID }) => {
    const r = await fetch('/page/submit/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ comm: 'saverecord', pageid: PAGE, recordid: rec, projectid: PROJECTID, code: HTML, commfileexist: '' }).toString(),
    });
    return { status: r.status, body: (await r.text()).slice(0, 30).trim() };
  }, { PAGE, rec, HTML, PROJECTID });
  console.log('контейнер:', JSON.stringify(wr));
  console.log('publish:', await publishPage(page, PAGE).catch((e) => String(e).slice(0, 40)));
});
