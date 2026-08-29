// ─────────────────────────────────────────────────────────────
// tilda-lead-receivers2.mjs — приёмники A/B на конкретной странице.
//   1) вставляет 2 блока BF201N из библиотеки (UI: ВСЕ БЛОКИ → Форма);
//   2) пишет их поля по снятому контракту (comm=saverecord + forminputs);
//   3) публикует страницу.
//   node scripts/tilda-lead-receivers2.mjs <pageid>
// Идемпотентность: если на странице уже есть форма с полем lead_ref — выходим.
// ─────────────────────────────────────────────────────────────
import { withSession, PROJECTID, publishPage, pace } from './tilda-session.mjs';

const PAGE = process.argv[2];
if (!PAGE) { console.log('usage: node scripts/tilda-lead-receivers2.mjs <pageid>'); process.exit(1); }

const FIELDS_A = ['lead_ref', 'name', 'phone', 'email', 'city', 'message', 'notes', 'size', 'style', 'palette', 'budget', 'weeks', 'source', 'page', 'ts', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
const FIELDS_B = ['lead_ref', 'source', 'page', 'city', 'budget', 'ts'];

const makeInputs = (names) => names.map((nm, i) => ({
  lid: String(Date.now()) + String(100 + i),
  ls: String(10 + i * 10), loff: '', li_parent_id: null,
  li_type: 'in', li_ph: nm, li_req: '', li_nm: nm,
}));

await withSession(async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(`https://tilda.ru/page/?pageid=${PAGE}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);

  const recsBefore = await page.evaluate(() => [...document.querySelectorAll('[id^="record"]')].map((e) => e.id));
  console.log('блоков на странице:', recsBefore.length);

  const insertOne = async () => {
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
      const el = [...document.querySelectorAll('a,div,li')].filter(vis).find((e) => (e.innerText || '').trim() === 'Форма');
      if (!el) return null; const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, 'категория Форма');
    await click(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 60 && r.height > 40; };
      const el = [...document.querySelectorAll('.tp-library__tpl-body')].filter(vis).find((e) => /BF201N/.test(e.innerText || ''));
      if (!el) return null; const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, 'BF201N', 8000);
  };

  await insertOne();
  await insertOne();
  const recsAfter = await page.evaluate(() => [...document.querySelectorAll('[id^="record"]')].map((e) => e.id));
  const fresh = recsAfter.filter((id) => !recsBefore.includes(id)).map((id) => id.replace('record', ''));
  console.log('новые блоки:', fresh.join(', '));
  if (fresh.length < 2) throw new Error('вставилось меньше двух блоков');

  const [recA, recB] = fresh;
  for (const [rec, names, label] of [[recA, FIELDS_A, 'A (все ПД)'], [recB, FIELDS_B, 'B (обезличенная)']]) {
    const res = await page.evaluate(async ({ PAGE, rec, inputs }) => {
      const body = new URLSearchParams();
      body.set('comm', 'saverecord');
      body.set('recordid', rec);
      body.set('pageid', PAGE);
      body.set('forminputs', JSON.stringify(inputs));
      body.set('btitle', ''); body.set('bdescr', '');
      body.set('buttontitle', 'Отправить');
      body.set('formtitlesuccess', ''); body.set('formmsgsuccess', 'Заявка принята');
      body.set('formbtnsuccess', ''); body.set('formmsgurl', '');
      body.set(`formactiontype${rec}`, '2');
      body.set('formaction', ''); body.set('formtarget', ''); body.set('formajax', '');
      body.set('text', '');
      const r = await fetch('/page/submit/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: body.toString(),
      });
      return { status: r.status, body: (await r.text()).slice(0, 40).trim() };
    }, { PAGE, rec, inputs: makeInputs(names) });
    console.log(`форма ${label} rec${rec}: ${JSON.stringify(res)}`);
    await pace(1200, 2000);
  }
  console.log('publish:', await publishPage(page, PAGE).catch((e) => String(e).slice(0, 40)));
  console.log('RECIDS', PAGE, recA, recB);
});
