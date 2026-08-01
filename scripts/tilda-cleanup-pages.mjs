// ─────────────────────────────────────────────────────────────
// tilda-cleanup-pages.mjs (Sprint 15, Ф4) — служебные страницы:
//   • /cart (142949956) → «не индексировать» (nosearch): Tilda сама добавит Disallow
//   • /painting/mn-01 (143103886) и Blank page (143107666) → снять с публикации:
//     обе висят в sitemap, первая пустая (89 символов текста), вторая — заглушка.
// После каждого действия — проверка факта. APPLY=0 — только показать.
// ─────────────────────────────────────────────────────────────
import { withSession, pace, publishPage, PROJECTID } from './tilda-session.mjs';

const APPLY = process.env.APPLY !== '0';
const UA = 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)';
const NOINDEX = [{ id: '142949956', path: '/cart', label: 'корзина' }];
const UNPUBLISH = [
  { id: '143103886', path: '/painting/mn-01', label: 'пустая страница работы' },
  { id: '143107666', path: '/page143107666.html', label: 'Blank page' },
];

const probe = async (path) => {
  const r = await fetch(`https://mbezu.ru${path}?cb=${Date.now()}`, { headers: { 'User-Agent': UA }, redirect: 'manual' });
  const html = r.status === 200 ? await r.text() : '';
  return { status: r.status, noindex: /<meta[^>]+name="robots"[^>]+noindex/i.test(html) };
};

const openEditor = async (page, pid) => {
  await page.goto(`https://tilda.ru/page/?pageid=${pid}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4500);
};
const openSettings = async (page) => {
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('a,button,div')].find((e) => /^настройки страницы$/i.test((e.innerText || '').trim()));
      el && el.click();
    });
    try {
      await page.waitForFunction(() => !!document.querySelector('#formpageedit [name="nosearch"]'), { timeout: 15000 });
      await page.waitForTimeout(800);
      return true;
    } catch { await page.waitForTimeout(2000); }
  }
  return false;
};

await withSession(async ({ page }) => {
  // ── noindex ──
  for (const p of NOINDEX) {
    const before = await probe(p.path);
    console.log(`  ${p.path} до: ${JSON.stringify(before)}`);
    if (!APPLY || before.noindex) continue;
    await openEditor(page, p.id);
    if (!(await openSettings(page))) { console.error(`  ✗ настройки ${p.id} не открылись`); continue; }
    const res = await page.evaluate(async () => {
      const f = document.querySelector('#formpageedit');
      const cb = f.querySelector('[name="nosearch"]');
      if (!cb) return 'чекбокса nosearch нет';
      if (!cb.checked) cb.click();
      const body = new URLSearchParams();
      for (const [k, v] of new FormData(f).entries()) if (typeof v === 'string') body.append(k, v);
      const r = await fetch('/projects/submit/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: body.toString(),
      });
      return `nosearch=${cb.checked}, сохранение ${r.status}`;
    });
    console.log(`  ${p.path}: ${res}`);
    await pace();
    await publishPage(page, p.id);
    await page.waitForTimeout(8000);
    console.log(`  ${p.path} после: ${JSON.stringify(await probe(p.path))}`);
  }

  // ── снятие с публикации ──
  for (const p of UNPUBLISH) {
    const before = await probe(p.path);
    console.log(`  ${p.path} (${p.label}) до: ${JSON.stringify(before)}`);
    if (!APPLY || before.status === 404) continue;
    const st = await page.evaluate(async ({ id, PROJECTID }) => {
      const r = await fetch('/page/unpublish/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ pageid: id, projectid: PROJECTID }).toString(),
      });
      return r.status;
    }, { id: p.id, PROJECTID });
    console.log(`  снятие ${p.id}: ${st}`);
    await page.waitForTimeout(7000);
    console.log(`  ${p.path} после: ${JSON.stringify(await probe(p.path))}`);
    await pace();
  }

  // корень не пострадал?
  console.log(`\n  контроль: / → ${JSON.stringify(await probe('/'))}`);
});
