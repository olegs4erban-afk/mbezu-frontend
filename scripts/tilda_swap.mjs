// Generic Tilda T123 editor via real browser-login editor session (Playwright).
// Env: MODE=snapshot|swap|rollback  PAGEID=..  RECORDID=..  BACKUP=path  CONTAINER=path
// Native Store blocks (706/776) are NEVER targeted — caller passes only React 131 records.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const MODE = process.env.MODE || 'snapshot';
const PAGEID = process.env.PAGEID, RECORDID = process.env.RECORDID;
const BACKUP = process.env.BACKUP, CONTAINER = process.env.CONTAINER;
const PROJECTID = '13712449';
if (!PAGEID || !RECORDID) { console.log('need PAGEID + RECORDID'); process.exit(2); }

const env = {};
for (const line of readFileSync('C:/Users/PKa/.claude/skills/tilda/.env', 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

await page.goto('https://tilda.cc/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
if (/captcha|капча/i.test((await page.evaluate(() => document.body.innerText || '')).toLowerCase())) { console.log('CAPTCHA — stop'); await browser.close(); process.exit(3); }
try {
  await page.fill('input[name="email"], input[type="email"]', env.TILDA_EMAIL, { timeout: 8000 });
  await page.fill('input[name="password"], input[type="password"]', env.TILDA_PASSWORD, { timeout: 8000 });
  await page.click('button[type="submit"], button:has-text("Войти"), .t-sign__submit', { timeout: 8000 });
} catch (e) { console.log('login submit:', e.message); }
await page.waitForTimeout(6000);
try { await page.waitForURL(/projects/i, { timeout: 15000 }); } catch { /* */ }
if (/\/login/.test(page.url())) { console.log('LOGIN FAILED'); await browser.close(); process.exit(3); }

let ok = false;
for (const base of ['https://tilda.cc', 'https://tilda.ru']) {
  await page.goto(`${base}/page/?pageid=${PAGEID}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const u = page.url();
  const fns = await page.evaluate(() => typeof window.edrec__editRecordContent === 'function' || typeof window.tp__pagePublish === 'function');
  console.log(`editor@${base}: url=${u} fns=${fns}`);
  if (!/404|notpublished|\/login/.test(u) && fns) { ok = true; break; }
}
if (!ok) { console.log('EDITOR not loaded'); await browser.close(); process.exit(4); }

async function ipost(path, params) {
  return await page.evaluate(async ({ path, params }) => {
    const r = await fetch(path, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: new URLSearchParams(params).toString() });
    return { status: r.status, head: (await r.text()).slice(0, 160) };
  }, { path, params });
}

if (MODE === 'snapshot') {
  const code = await page.evaluate(async (rid) => {
    try { if (typeof window.edrec__editRecordContent === 'function') window.edrec__editRecordContent(rid); } catch { /* */ }
    for (let i = 0; i < 80; i++) { const t = document.querySelector('textarea[name="code"]'); if (t && t.value && t.value.length > 30) return t.value; await new Promise((r) => setTimeout(r, 250)); }
    const t = document.querySelector('textarea[name="code"]'); return t ? t.value : '';
  }, RECORDID);
  mkdirSync(dirname(BACKUP), { recursive: true });
  writeFileSync(BACKUP, code, 'utf-8');
  console.log(`SNAPSHOT len=${code.length} react=${code.includes('text/babel') || code.includes('data-presets')} cdn=${code.includes('cdn.mbezu.ru')} → ${BACKUP}`);
  console.log('  head:', JSON.stringify(code.slice(0, 100)));
} else if (MODE === 'swap' || MODE === 'rollback') {
  const code = readFileSync(MODE === 'swap' ? CONTAINER : BACKUP, 'utf-8');
  const save = await ipost('/page/submit/', { comm: 'saverecord', pageid: PAGEID, projectid: PROJECTID, recordid: RECORDID, code });
  console.log(`${MODE} saverecord: status=${save.status} body=${JSON.stringify(save.head)}`);
  if (!/OK/i.test(save.head)) { console.log('!! not OK — abort'); await browser.close(); process.exit(2); }
  const pub = await ipost('/page/publish/', { pageid: PAGEID, projectid: PROJECTID });
  console.log(`${MODE} publish: status=${pub.status} body=${JSON.stringify(pub.head)}`);
}
await browser.close();
