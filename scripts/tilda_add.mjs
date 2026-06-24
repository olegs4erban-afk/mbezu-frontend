// Add a 131 (T123) block to a page + set its code to the CDN container, then publish.
// Reversible: MODE=delete RECORDID=<added> removes it. Env: MODE=add|delete PAGEID CONTAINER [RECORDID]
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const MODE = process.env.MODE || 'add';
const PAGEID = process.env.PAGEID, PROJECTID = '13712449';
const CONTAINER = process.env.CONTAINER, RECORDID = process.env.RECORDID;
const RECID_OUT = process.env.RECID_OUT || 'C:/MBezu/mbezu-frontend/backup/legal-added-recid.txt';
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
  if (await page.evaluate(() => typeof window.tp__addRecord === 'function')) { ok = true; break; }
}
if (!ok) { console.log('editor not loaded'); await browser.close(); process.exit(4); }

async function ipost(path, params) {
  return await page.evaluate(async ({ path, params }) => {
    const r = await fetch(path, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: new URLSearchParams(params).toString() });
    return { status: r.status, head: (await r.text()).slice(0, 160) };
  }, { path, params });
}

if (MODE === 'add') {
  const before = await page.evaluate(() => [...document.querySelectorAll('[id^="rec"]')].map((e) => e.id).filter((id) => /^rec\d+$/.test(id)));
  const ADDAFTER = process.env.ADDAFTER || null; // place new block after this rec id (positioning)
  const ret = await page.evaluate(async (after) => {
    try { const r = await window.tp__addRecord(131, after, null); return r && (r.recordid || r.id || (typeof r === 'string' || typeof r === 'number' ? String(r) : JSON.stringify(r))); }
    catch (e) { return 'ERR:' + e.message; }
  }, ADDAFTER);
  // poll up to 20s for the new rec to appear in the editor DOM
  let added = [];
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => [...document.querySelectorAll('[id^="rec"]')].map((e) => e.id).filter((id) => /^rec\d+$/.test(id)));
    added = after.filter((x) => !before.includes(x)).map((x) => x.replace('rec', ''));
    if (added.length) break;
  }
  const recid = (ret && /^\d+$/.test(String(ret))) ? String(ret) : added[0];
  console.log('addRecord ret=', JSON.stringify(ret), '| diff-added=', added, '| using recid=', recid);
  if (!recid) { console.log('!! could not determine new recid — abort'); await browser.close(); process.exit(2); }
  const code = readFileSync(CONTAINER, 'utf-8');
  const save = await ipost('/page/submit/', { comm: 'saverecord', pageid: PAGEID, projectid: PROJECTID, recordid: recid, code });
  console.log('saverecord:', save.status, JSON.stringify(save.head));
  if (!/OK/i.test(save.head)) { console.log('!! saverecord not OK — abort (block added but empty; delete recid', recid, ')'); writeFileSync(RECID_OUT, recid); await browser.close(); process.exit(2); }
  const pub = await ipost('/page/publish/', { pageid: PAGEID, projectid: PROJECTID });
  console.log('publish:', pub.status, JSON.stringify(pub.head));
  writeFileSync(RECID_OUT, recid);
  console.log('ADDED recid', recid, '→', RECID_OUT);
} else if (MODE === 'delete') {
  const rid = RECORDID || readFileSync(RECID_OUT, 'utf-8').trim();
  const del = await ipost('/page/submit/', { comm: 'deleterecord', pageid: PAGEID, recordid: rid });
  console.log('deleterecord', rid, ':', del.status, JSON.stringify(del.head));
  const pub = await ipost('/page/publish/', { pageid: PAGEID, projectid: PROJECTID });
  console.log('publish:', pub.status, JSON.stringify(pub.head));
}
await browser.close();
