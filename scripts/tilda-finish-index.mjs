// ─────────────────────────────────────────────────────────────
// tilda-finish-index.mjs (Sprint 15, Ф3.3, шаги 2–3) — после смены индексной:
//   1) очистить слаг у 142947296 (пустой = «/»), чтобы /home перестал существовать
//   2) снять 140814006 (Blank page) с публикации
// После КАЖДОГО шага — проверка корня; сломался → откат этого шага.
// APPLY=0 — только показать.
// ─────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs';
import { withSession, pace, publishPage, PROJECTID } from './tilda-session.mjs';

const APPLY = process.env.APPLY !== '0';
const HOME = '142947296';
const OLD = '140814006';
const UA = 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)';

const probe = async (path) => {
  try {
    const r = await fetch(`https://mbezu.ru${path}?cb=${Date.now()}`, { headers: { 'User-Agent': UA }, redirect: 'manual' });
    const html = r.status === 200 ? await r.text() : '';
    return { status: r.status, loc: r.headers.get('location') || '', h1: (html.match(/<h1/g) || []).length, bytes: html.length };
  } catch (e) { return { status: 'ошибка', err: String(e).slice(0, 30) }; }
};
const rootOk = (p) => p.status === 200 && p.h1 === 1 && p.bytes > 30000;

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
      await page.waitForFunction(() => !!document.querySelector('#formpageedit [name="alias"]'), { timeout: 15000 });
      await page.waitForTimeout(800);
      return true;
    } catch { await page.waitForTimeout(2000); }
  }
  return false;
};
const readAlias = (page) => page.evaluate(() => document.querySelector('#formpageedit [name="alias"]')?.value ?? null);
const writeAlias = (page, v) => page.evaluate(async (val) => {
  const f = document.querySelector('#formpageedit');
  const el = f.querySelector('[name="alias"]');
  el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  const body = new URLSearchParams();
  for (const [k, v2] of new FormData(f).entries()) if (typeof v2 === 'string') body.append(k, v2);
  const r = await fetch('/projects/submit/', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  });
  return r.status;
}, v);

await withSession(async ({ page }) => {
  const rootStart = await probe('/');
  console.log('  корень до начала:', JSON.stringify(rootStart));
  if (!rootOk(rootStart)) { console.error('  ✗ корень нездоров — не продолжаю'); process.exit(1); }

  // ── шаг 1: слаг ──
  await openEditor(page, HOME);
  if (!(await openSettings(page))) { console.error('  ✗ настройки страницы не открылись'); process.exit(1); }
  const aliasBefore = await readAlias(page);
  console.log(`  слаг ${HOME} сейчас: «${aliasBefore}»`);
  mkdirSync('backup', { recursive: true });
  writeFileSync('backup/index-alias-before.json', JSON.stringify({ pageid: HOME, alias: aliasBefore }, null, 1), 'utf-8');

  if (APPLY && aliasBefore) {
    console.log(`  очищаю слаг → publish=${await writeAlias(page, '')}`);
    await pace();
    await publishPage(page, HOME);
    await page.waitForTimeout(8000);

    await openEditor(page, HOME);
    await openSettings(page);
    const aliasAfter = await readAlias(page);
    const root = await probe('/');
    const home = await probe('/home');
    console.log(`  слаг после: «${aliasAfter}» · корень: ${JSON.stringify(root)} · /home: ${JSON.stringify(home)}`);
    if (!rootOk(root)) {
      console.error('  ✗ корень сломался — возвращаю слаг');
      await writeAlias(page, aliasBefore);
      await publishPage(page, HOME);
      process.exit(1);
    }
    if (aliasAfter) console.log('  ⚠ слаг не очистился — /home останется, закроем его 301 позже');
  }

  // ── шаг 2: снять старую индексную с публикации ──
  if (APPLY) {
    const un = await page.evaluate(async ({ OLD, PROJECTID }) => {
      const r = await fetch('/page/unpublish/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ pageid: OLD, projectid: PROJECTID }).toString(),
      });
      return r.status;
    }, { OLD, PROJECTID });
    console.log(`  снятие ${OLD} с публикации: ${un}`);
    await page.waitForTimeout(8000);
    const root = await probe('/');
    console.log('  корень после снятия:', JSON.stringify(root));
    if (!rootOk(root)) {
      console.error('  ✗ КОРЕНЬ СЛОМАЛСЯ после снятия старой страницы — публикую её обратно');
      await publishPage(page, OLD);
      await page.waitForTimeout(6000);
      console.error('  корень после отката:', JSON.stringify(await probe('/')));
      process.exit(1);
    }
  }

  console.log('\n  Финальные факты:');
  for (const p of ['/', '/home', '/catalog']) console.log(`   ${p.padEnd(10)} ${JSON.stringify(await probe(p))}`);
});
