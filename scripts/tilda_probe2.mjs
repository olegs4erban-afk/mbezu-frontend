// Read-only probe: ADD-block fns (for /legal) + homepage/alias config (for opening root).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const env = {};
for (const line of readFileSync('C:/Users/PKa/.claude/skills/tilda/.env', 'utf-8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const PROJECTID = '13712449', LEGAL = '142950726', COMING = '140814006', HOME = '142947296';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('https://tilda.cc/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
await page.fill('input[name="email"], input[type="email"]', env.TILDA_EMAIL).catch(() => {});
await page.fill('input[name="password"], input[type="password"]', env.TILDA_PASSWORD).catch(() => {});
await page.click('button[type="submit"], button:has-text("Войти")').catch(() => {});
await page.waitForTimeout(6000);
await page.goto(`https://tilda.cc/page/?pageid=${LEGAL}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
console.log('editor url:', page.url());

const fns = await page.evaluate(() => ({
  addRecord: typeof window.tp__addRecord, delRecord: typeof window.tp__delRecord,
  pagePublish: typeof window.tp__pagePublish, addRecordFromLib: typeof window.tp__addRecordFromLibrary,
}));
console.log('editor fns:', JSON.stringify(fns));

async function ipost(path, params) {
  return await page.evaluate(async ({ path, params }) => {
    const r = await fetch(path, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: new URLSearchParams(params).toString() });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { /* */ } return { status: r.status, len: t.length, j, head: t.slice(0, 220) };
  }, { path, params });
}
// page info for coming-soon, home, legal — look for alias / homepage flags
for (const [lbl, pid] of [['coming-soon', COMING], ['home', HOME], ['legal', LEGAL]]) {
  for (const comm of ['getpageinfo', 'editpageinfo']) {
    const r = await ipost('/page/edit/', { comm, pageid: pid, projectid: PROJECTID });
    if (r.j) { const k = Object.keys(r.j.page || r.j.record || r.j); console.log(`${lbl} ${comm}: keys=${k.slice(0, 20)}`);
      const o = r.j.page || r.j; ['alias', 'filename', 'ishome', 'mainpage', 'home', 'url', 'title'].forEach((f) => { if (o && o[f] !== undefined) console.log(`    ${f}=${JSON.stringify(o[f])}`); }); break; }
    else console.log(`${lbl} ${comm}: non-json len=${r.len} head=${JSON.stringify(r.head)}`);
  }
}
// project settings (homepage)
const proj = await ipost('/project/edit/', { comm: 'getprojectinfo', projectid: PROJECTID });
console.log('project getprojectinfo:', proj.j ? `keys=${Object.keys(proj.j.project || proj.j).slice(0, 25)}` : `non-json head=${JSON.stringify(proj.head)}`);
if (proj.j) { const p = proj.j.project || proj.j; ['indexpageid', 'mainpageid', 'homepage', 'page404', 'indexpage'].forEach((f) => { if (p && p[f] !== undefined) console.log(`    ${f}=${JSON.stringify(p[f])}`); }); }
await browser.close();
