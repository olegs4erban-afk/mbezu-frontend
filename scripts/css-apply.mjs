// Settings → Вставка кода → find site CSS field (across frames), surgically swap accent literals to gold.
// INSPECT-only by default; APPLY=1 to write+save. Read current value first; abort if no #b85c3a present.
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const PROJECTID = '13712449';
const APPLY = process.env.APPLY === '1';
const REPL = [['b85c3a', 'a08a4e'], ['d4825a', 'c2a85e'], ['e8a988', 'b3a583'], ['8c3e22', '7d6a38'], ['184, 92, 58', '160, 138, 78'], ['184,92,58', '160,138,78']];
const env = {};
for (const line of readFileSync('C:/Users/PKa/.claude/skills/tilda/.env', 'utf-8').split(/\r?\n/)) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim(); }
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
await page.goto('https://tilda.cc/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
await page.fill('input[name="email"], input[type="email"]', env.TILDA_EMAIL).catch(() => {});
await page.fill('input[name="password"], input[type="password"]', env.TILDA_PASSWORD).catch(() => {});
await page.click('button[type="submit"], button:has-text("Войти")').catch(() => {});
await page.waitForTimeout(6000);
await page.goto(`https://tilda.cc/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
mkdirSync('audit', { recursive: true });
// click left-menu "Вставка кода" — pick the VISIBLE match (skip hidden mobile dup)
{
  const items = page.getByText('Вставка кода', { exact: true });
  const n = await items.count();
  let clicked = false;
  for (let i = 0; i < n; i++) {
    const it = items.nth(i);
    if (await it.isVisible().catch(() => false)) {
      await it.scrollIntoViewIfNeeded().catch(() => {});
      await it.click({ timeout: 5000 }).then(() => { clicked = true; }).catch((e) => console.log('click', i, e.message.split('\n')[0]));
      if (clicked) break;
    }
  }
  console.log('Вставка кода clicked:', clicked, '| matches:', n);
}
await page.waitForTimeout(4000);
await page.screenshot({ path: 'audit/css-panel.png', fullPage: true }).catch(() => {});
// open the CSS editor ("Редактировать CSS")
await page.getByText('Редактировать CSS', { exact: false }).first().click({ timeout: 8000 }).then(() => console.log('clicked Редактировать CSS')).catch((e) => console.log('edit-css click err', e.message.split('\n')[0]));
await page.waitForTimeout(5000);
await page.screenshot({ path: 'audit/css-editor.png', fullPage: true }).catch(() => {});

console.log('frames:', page.frames().length);
let target = null; // {frameIndex, kind:'textarea'|'cm', selectorInfo}
for (let fi = 0; fi < page.frames().length; fi++) {
  const fr = page.frames()[fi];
  const found = await fr.evaluate(() => {
    const res = { tas: [], cms: [] };
    document.querySelectorAll('textarea').forEach((t, i) => { const v = t.value || ''; if (/b85c3a|--accent|:root/i.test(v)) res.tas.push({ i, len: v.length, head: v.slice(0, 60) }); });
    document.querySelectorAll('.CodeMirror').forEach((el, i) => { let v = ''; try { v = el.CodeMirror && el.CodeMirror.getValue ? el.CodeMirror.getValue() : ''; } catch (e) { /* */ } if (/b85c3a|--accent|:root/i.test(v)) res.cms.push({ i, len: v.length, head: v.slice(0, 60) }); });
    return res;
  }).catch(() => ({ tas: [], cms: [] }));
  if (found.tas.length || found.cms.length) { console.log(`frame[${fi}] url=${fr.url().slice(0, 80)} tas=${JSON.stringify(found.tas)} cms=${JSON.stringify(found.cms)}`); if (!target) target = { fi, found }; }
}
if (!target) { console.log('CSS field NOT found in any frame'); await browser.close(); process.exit(5); }

const fr = page.frames()[target.fi];
const cur = await fr.evaluate(() => {
  for (const t of document.querySelectorAll('textarea')) if (/b85c3a|--accent/i.test(t.value || '')) return { kind: 'ta', val: t.value };
  for (const el of document.querySelectorAll('.CodeMirror')) { try { const v = el.CodeMirror.getValue(); if (/b85c3a|--accent/i.test(v)) return { kind: 'cm', val: v }; } catch (e) { /* */ } }
  return null;
});
if (!cur) { console.log('could not read current CSS value'); await browser.close(); process.exit(5); }
writeFileSync('backup/custom-css-live-before.css', cur.val, 'utf-8');
let next = cur.val; for (const [a, b] of REPL) next = next.split(a).join(b);
const changed = next !== cur.val;
console.log(`current CSS: kind=${cur.kind} len=${cur.val.length} hasB85=${/b85c3a/i.test(cur.val)} | willChange=${changed} | newHasGold=${/a08a4e/i.test(next)} newHasTerr=${/b85c3a/i.test(next)}`);

if (APPLY && changed) {
  const setres = await fr.evaluate((next) => {
    const r = { ace: false, cm: false, ta: false };
    // ACE editor (Tilda uses ACE for custom CSS)
    try { if (window.ace) { for (const el of document.querySelectorAll('.ace_editor')) { const ed = window.ace.edit(el); ed.setValue(next, -1); r.ace = true; } } } catch (e) { /* */ }
    for (const el of document.querySelectorAll('.CodeMirror')) { try { if (el.CodeMirror) { el.CodeMirror.setValue(next); r.cm = true; } } catch (e) { /* */ } }
    for (const t of document.querySelectorAll('textarea')) if (t.value && t.value.length > 200) { t.value = next; t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true })); r.ta = true; }
    return r;
  }, next);
  console.log('set via:', JSON.stringify(setres));
  await page.waitForTimeout(1500);
  // VERIFY the editor now holds gold before saving
  const verify = await fr.evaluate(() => {
    let v = '';
    try { if (window.ace) { const el = document.querySelector('.ace_editor'); if (el) v = window.ace.edit(el).getValue(); } } catch (e) { /* */ }
    if (!v) for (const t of document.querySelectorAll('textarea')) if (t.value && t.value.length > 200) v = t.value;
    return { hasGold: /a08a4e/i.test(v), hasTerr: /b85c3a/i.test(v), len: v.length };
  });
  console.log('pre-save editor state:', JSON.stringify(verify));
  if (!verify.hasGold || verify.hasTerr) { console.log('!! editor not gold — NOT saving'); await browser.close(); process.exit(6); }
  // Save — editcustomcss page button is "Сохранить"
  let saved = false;
  for (const label of ['Сохранить', 'Сохранить изменения']) {
    const b = page.getByText(label, { exact: true });
    if (await b.count().catch(() => 0)) { await b.first().click({ timeout: 8000 }).then(() => { saved = true; console.log('clicked', label); }).catch((e) => console.log('save click err', e.message.split('\n')[0])); if (saved) break; }
  }
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'audit/css-saved.png', fullPage: true }).catch(() => {});
  console.log('APPLIED + saved');
} else {
  console.log('INSPECT-only (set APPLY=1 to write). backup -> backup/custom-css-live-before.css');
}
await browser.close();
