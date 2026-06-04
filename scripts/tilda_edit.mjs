// Sprint 5 · Option 1 — /about T123 edit via REAL browser login + editor session.
// Browser login (tilda.cc) → open page editor → read/save T123 content reliably.
// Modes: snapshot | swap | rollback. Detects captcha → reports.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const PAGEID = '142948406', PROJECTID = '13712449', RECORDID = '2337667041';
const BACKUP = 'C:/MBezu/mbezu-frontend/backup/about-T123.html';
const CONTAINER = 'C:/MBezu/mbezu-frontend/backup/about-container.html';
const mode = process.argv[2] || 'snapshot';

const env = {};
for (const line of readFileSync('C:/Users/PKa/.claude/skills/tilda/.env', 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('https://tilda.cc/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
const bt = (await page.evaluate(() => document.body.innerText || '')).toLowerCase();
if (/captcha|капча/i.test(bt)) { console.log('CAPTCHA on login — cannot proceed headless'); await browser.close(); process.exit(3); }
try {
  await page.fill('input[name="email"], input[type="email"]', env.TILDA_EMAIL, { timeout: 8000 });
  await page.fill('input[name="password"], input[type="password"]', env.TILDA_PASSWORD, { timeout: 8000 });
  await page.click('button[type="submit"], button:has-text("Войти"), .t-sign__submit', { timeout: 8000 });
} catch (e) { console.log('login fill/submit failed:', e.message); }
await page.waitForTimeout(6000);
try { await page.waitForURL(/projects/i, { timeout: 15000 }); } catch { /* */ }
console.log('after login url:', page.url());
if (/\/login/.test(page.url())) { console.log('LOGIN FAILED — stopping'); await browser.close(); process.exit(3); }

let editorOk = false;
for (const base of ['https://tilda.cc', 'https://tilda.ru']) {
  await page.goto(`${base}/page/?pageid=${PAGEID}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const u = page.url();
  const hasEditor = await page.evaluate(() => typeof window.edrec__editRecordContent === 'function' || typeof window.tp__pagePublish === 'function' || !!document.getElementById('rec2337667041'));
  console.log(`editor@${base}: url=${u} hasEditorFns=${hasEditor}`);
  if (!/404|notpublished|\/login/.test(u) && hasEditor) { editorOk = true; break; }
}
if (!editorOk) { console.log('EDITOR did not load — stopping'); await browser.close(); process.exit(4); }

async function ipost(path, params) {
  return await page.evaluate(async ({ path, params }) => {
    const r = await fetch(path, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: new URLSearchParams(params).toString() });
    const t = await r.text(); return { status: r.status, head: t.slice(0, 160) };
  }, { path, params });
}

if (mode === 'snapshot') {
  const code = await page.evaluate(async (rid) => {
    try { if (typeof window.edrec__editRecordContent === 'function') window.edrec__editRecordContent(rid); } catch { /* */ }
    for (let i = 0; i < 80; i++) { const t = document.querySelector('textarea[name="code"]'); if (t && t.value && t.value.length > 50) return t.value; await new Promise((r) => setTimeout(r, 250)); }
    const t = document.querySelector('textarea[name="code"]'); return t ? t.value : '';
  }, RECORDID);
  mkdirSync('C:/MBezu/mbezu-frontend/backup', { recursive: true });
  writeFileSync(BACKUP, code, 'utf-8');
  const react = code.includes('text/babel') || code.includes('data-presets') || code.includes('8/8');
  console.log(`SNAPSHOT len=${code.length} react=${react} → ${BACKUP}`);
  console.log('  head:', JSON.stringify(code.slice(0, 120)));
} else if (mode === 'swap' || mode === 'rollback') {
  const code = readFileSync(mode === 'swap' ? CONTAINER : BACKUP, 'utf-8');
  const save = await ipost('/page/submit/', { comm: 'saverecord', pageid: PAGEID, projectid: PROJECTID, recordid: RECORDID, code });
  console.log(`${mode} saverecord: status=${save.status} body=${JSON.stringify(save.head)}`);
  if (!/OK/i.test(save.head)) { console.log('!! not OK — aborting publish'); await browser.close(); process.exit(2); }
  const pub = await ipost('/page/publish/', { pageid: PAGEID, projectid: PROJECTID });
  console.log(`${mode} publish: status=${pub.status} body=${JSON.stringify(pub.head)}`);
}
await browser.close();
