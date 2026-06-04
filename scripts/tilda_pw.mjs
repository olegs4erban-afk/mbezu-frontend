// Sprint 5 · Option 1 — Tilda /about T123 edit via real editor session (Playwright).
// Injects login cookies, opens the page editor (warms session), then does
// read/save/publish via in-page fetch from the tilda.ru origin (reliable method).
// Modes: probe | snapshot | swap | rollback | verify
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const PAGEID = '142948406', PROJECTID = '13712449', RECORDID = '2337667041';
const BACKUP = 'C:/MBezu/mbezu-frontend/backup/about-T123.html';
const CONTAINER = 'C:/MBezu/mbezu-frontend/backup/about-container.html';
const mode = process.argv[2] || 'probe';

const raw = JSON.parse(readFileSync('C:/MBezu/.tilda_cookies.json', 'utf-8'));
const cookies = raw.map((c) => ({
  name: c.name, value: c.value,
  domain: c.domain && c.domain.startsWith('.') ? c.domain : ('.' + (c.domain || 'tilda.ru').replace(/^\./, '')),
  path: c.path || '/', secure: true, sameSite: 'Lax',
}));

const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.addCookies(cookies);
const page = await ctx.newPage();
await page.goto(`https://tilda.ru/page/?pageid=${PAGEID}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000); // let editor JS init
const url = page.url();
console.log('editor url:', url, '| logged in:', !/\/login/.test(url));

// in-page POST helper (same-origin, credentials included)
async function ipost(path, params) {
  return await page.evaluate(async ({ path, params }) => {
    const body = new URLSearchParams(params).toString();
    const r = await fetch(path, { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body });
    const t = await r.text();
    let j = null; try { j = JSON.parse(t); } catch { /* */ }
    return { status: r.status, len: t.length, j, head: t.slice(0, 200) };
  }, { path, params });
}

function codeOf(res) {
  const rec = res.j && res.j.record ? res.j.record : null;
  return rec ? (rec.code || '') : '';
}

if (mode === 'probe') {
  const tries = [
    ['editrecordsettings', { comm: 'editrecordsettings', pageid: PAGEID, recordid: RECORDID, tab: 'settings' }],
    ['editrecordsettings+pid', { comm: 'editrecordsettings', pageid: PAGEID, projectid: PROJECTID, recordid: RECORDID }],
    ['editrecordcontent', { comm: 'editrecordcontent', pageid: PAGEID, projectid: PROJECTID, recordid: RECORDID }],
    ['getrecordcode', { comm: 'getrecordcode', pageid: PAGEID, projectid: PROJECTID, recordid: RECORDID }],
  ];
  for (const [label, p] of tries) {
    const res = await ipost('/page/edit/', p);
    console.log(`  ${label.padEnd(22)} status=${res.status} len=${res.len} codeLen=${codeOf(res).length} head=${JSON.stringify(res.head)}`);
  }
  // also try reading textarea via content editor UI
  const ta = await page.evaluate(async (rid) => {
    try { if (typeof window.edrec__editRecordContent === 'function') window.edrec__editRecordContent(rid); } catch (e) { return 'fn-err:' + e.message; }
    for (let i = 0; i < 40; i++) { const t = document.querySelector('textarea[name="code"]'); if (t && t.value) return 'len=' + t.value.length; await new Promise((r) => setTimeout(r, 250)); }
    const t = document.querySelector('textarea[name="code"]'); return t ? 'empty-or-len=' + t.value.length : 'no-textarea';
  }, RECORDID);
  console.log('  content-editor textarea[name=code]:', ta);
}

else if (mode === 'snapshot') {
  // prefer content-editor textarea (raw code); fall back to in-page editrecordsettings
  const code = await page.evaluate(async (rid) => {
    try { if (typeof window.edrec__editRecordContent === 'function') window.edrec__editRecordContent(rid); } catch { /* */ }
    for (let i = 0; i < 60; i++) { const t = document.querySelector('textarea[name="code"]'); if (t && t.value && t.value.length > 50) return t.value; await new Promise((r) => setTimeout(r, 250)); }
    const t = document.querySelector('textarea[name="code"]'); return t ? t.value : '';
  }, RECORDID);
  mkdirSync('C:/MBezu/mbezu-frontend/backup', { recursive: true });
  writeFileSync(BACKUP, code, 'utf-8');
  const react = code.includes('text/babel') || code.includes('data-presets') || code.includes('8/8');
  console.log(`SNAPSHOT len=${code.length} react=${react} → ${BACKUP}`);
  console.log('  head:', JSON.stringify(code.slice(0, 120)));
}

else if (mode === 'swap' || mode === 'rollback') {
  const code = readFileSync(mode === 'swap' ? CONTAINER : BACKUP, 'utf-8');
  const save = await ipost('/page/submit/', { comm: 'saverecord', pageid: PAGEID, projectid: PROJECTID, recordid: RECORDID, code });
  console.log(`${mode} saverecord: status=${save.status} body=${JSON.stringify(save.head)}`);
  if (!/OK/i.test(save.head || '')) { console.log('!! saverecord not OK — aborting publish'); await browser.close(); process.exit(2); }
  const pub = await ipost('/page/publish/', { pageid: PAGEID, projectid: PROJECTID });
  console.log(`${mode} publish: status=${pub.status} body=${JSON.stringify(pub.head)}`);
}

else if (mode === 'verify') {
  const res = await ipost('/page/edit/', { comm: 'editrecordsettings', pageid: PAGEID, recordid: RECORDID, tab: 'settings' });
  const c = codeOf(res);
  console.log(`current code len=${c.length} cdn=${c.includes('cdn.mbezu.ru')} babel=${c.includes('text/babel')}`);
}

await browser.close();
