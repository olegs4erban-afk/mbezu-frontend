// Republish a Tilda page (regenerate HTML from current blocks + Store products). No block edits.
// Env: PAGEID  [PROJECTID=13712449]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const PAGEID = process.env.PAGEID, PROJECTID = process.env.PROJECTID || '13712449';
if (!PAGEID) { console.log('need PAGEID'); process.exit(2); }
const env = {};
for (const line of readFileSync('C:/Users/PKa/.claude/skills/tilda/.env', 'utf-8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('https://tilda.cc/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
await page.fill('input[name="email"], input[type="email"]', env.TILDA_EMAIL).catch(() => {});
await page.fill('input[name="password"], input[type="password"]', env.TILDA_PASSWORD).catch(() => {});
await page.click('button[type="submit"], button:has-text("Войти")').catch(() => {});
await page.waitForTimeout(6000);
let ok = false;
for (const base of ['https://tilda.cc', 'https://tilda.ru']) {
  await page.goto(`${base}/page/?pageid=${PAGEID}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  if (!/404|notpublished|\/login/.test(page.url())) { ok = true; break; }
}
if (!ok) { console.log('editor not loaded'); await browser.close(); process.exit(4); }
const pub = await page.evaluate(async ({ PAGEID, PROJECTID }) => {
  const r = await fetch('/page/publish/', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: new URLSearchParams({ pageid: PAGEID, projectid: PROJECTID }).toString() });
  return { status: r.status, head: (await r.text()).slice(0, 200) };
}, { PAGEID, PROJECTID });
console.log(`publish pageid=${PAGEID}: status=${pub.status} body=${JSON.stringify(pub.head)}`);
await browser.close();
