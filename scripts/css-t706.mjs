// S12 Phase 4 — append/replace the t706 cart/checkout brand block in Tilda site custom CSS.
// Mechanism proven in S10 (css-apply.mjs): Settings → Вставка кода → Редактировать CSS (ACE).
// Snapshot current CSS first; idempotent via start/end markers. APPLY=1 to write+save.
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const PROJECTID = '13712449';
const APPLY = process.env.APPLY === '1';

const START = '/* ── S12: t706 cart/checkout brand MBezu (start) ── */';
const END = '/* ── S12: t706 cart/checkout brand MBezu (end) ── */';
const BLOCK = `${START}
.t706 .t706__cartwin { background: rgba(42,37,32,.5) !important; }
.t706 .t706__cartwin-content { background: #ede5d6 !important; border-radius: 20px !important; }
.t706 .t706__cartwin-content, .t706 .t706__cartwin-content * { font-family: 'Inter Tight', system-ui, sans-serif !important; }
.t706 .t706__cartwin-heading { color: #2a2520 !important; font-weight: 500 !important; letter-spacing: -0.02em; }
.t706 .t706__product-title, .t706 .t706__product-title a { color: #2a2520 !important; }
.t706 .t706__product-amount, .t706 .t706__product-price, .t706 .t706__cartwin-prodamount { color: #6b5d4a !important; }
.t706 .t706__cartwin-totalamount-label { color: #6b5d4a !important; }
.t706 .t706__cartwin-totalamount { color: #a08a4e !important; font-weight: 600 !important; }
.t706 .t706__product-del, .t706 .t706__product-plus, .t706 .t706__product-minus { color: #6b5d4a !important; }
.t706 .t-form .t-input, .t706 input.t-input { background: #f5efe2 !important; border: 1px solid rgba(42,37,32,.14) !important; border-radius: 14px !important; color: #2a2520 !important; }
.t706 .t-form .t-input:focus { border-color: #a08a4e !important; }
.t706 .t-input-title, .t706 .t-input-subtitle, .t706 .t-form label, .t706 .t-checkbox__labeltext, .t706 .t-radio__labeltext { color: #2a2520 !important; }
.t706 .t-submit, .t706 button[type="submit"] { background: #a08a4e !important; color: #ede5d6 !important; border: 0 !important; border-radius: 999px !important; letter-spacing: .08em; text-transform: uppercase; font-weight: 600 !important; }
.t706 .t-submit:hover { background: #7d6a38 !important; }
.t706 .t706__carticon-counter { background: #a08a4e !important; }
.t706 .t706__cartwin-form { padding-top: 8px !important; }
${END}`;

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
if (/captcha|recaptcha/i.test(await page.content())) { console.log('CAPTCHA at login — aborting'); await page.screenshot({ path: 'audit/t706-captcha.png' }); await browser.close(); process.exit(7); }
await page.goto(`https://tilda.cc/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
mkdirSync('audit', { recursive: true });
{
  const items = page.getByText('Вставка кода', { exact: true });
  const n = await items.count();
  let clicked = false;
  for (let i = 0; i < n; i++) {
    const it = items.nth(i);
    if (await it.isVisible().catch(() => false)) {
      await it.scrollIntoViewIfNeeded().catch(() => {});
      await it.click({ timeout: 5000 }).then(() => { clicked = true; }).catch(() => {});
      if (clicked) break;
    }
  }
  console.log('Вставка кода clicked:', clicked);
}
await page.waitForTimeout(4000);
await page.getByText('Редактировать CSS', { exact: false }).first().click({ timeout: 8000 }).then(() => console.log('opened CSS editor')).catch((e) => console.log('edit-css err', e.message.split('\n')[0]));
await page.waitForTimeout(5000);

let target = null;
for (let fi = 0; fi < page.frames().length; fi++) {
  const fr = page.frames()[fi];
  const ok = await fr.evaluate(() => {
    for (const t of document.querySelectorAll('textarea')) if (/--accent|a08a4e|:root/i.test(t.value || '')) return true;
    for (const el of document.querySelectorAll('.ace_editor')) { try { if (window.ace && /--accent|a08a4e|:root/i.test(window.ace.edit(el).getValue())) return true; } catch (e) { /* */ } }
    for (const el of document.querySelectorAll('.CodeMirror')) { try { if (el.CodeMirror && /--accent|a08a4e|:root/i.test(el.CodeMirror.getValue())) return true; } catch (e) { /* */ } }
    return false;
  }).catch(() => false);
  if (ok) { target = fi; break; }
}
if (target === null) { console.log('CSS field NOT found'); await page.screenshot({ path: 'audit/t706-nofield.png', fullPage: true }); await browser.close(); process.exit(5); }
const fr = page.frames()[target];
const cur = await fr.evaluate(() => {
  try { if (window.ace) { const el = document.querySelector('.ace_editor'); if (el) { const v = window.ace.edit(el).getValue(); if (v) return v; } } } catch (e) { /* */ }
  for (const el of document.querySelectorAll('.CodeMirror')) { try { const v = el.CodeMirror.getValue(); if (v) return v; } catch (e) { /* */ } }
  for (const t of document.querySelectorAll('textarea')) if ((t.value || '').length > 100) return t.value;
  return '';
});
if (!cur) { console.log('cannot read CSS'); await browser.close(); process.exit(5); }
writeFileSync('backup/custom-css-before-s12.css', cur, 'utf-8');
console.log(`current CSS: len=${cur.length} hasGold=${/a08a4e/i.test(cur)} hasS12=${cur.includes(START)}`);

// Strip any previous S12 block, then append fresh with a brace-balance guard:
// the pre-existing css is TRUNCATED (ends mid-`!important` inside @media, unbalanced
// braces) — anything appended without closing them lands inside the unclosed block
// and is silently dropped by the CSS parser (observed live: sheet had 0 t706 rules).
let base = cur;
if (base.includes(START) && base.includes(END)) {
  base = base.slice(0, base.indexOf(START)) + base.slice(base.indexOf(END) + END.length);
}
const missing = (base.match(/{/g) || []).length - (base.match(/}/g) || []).length;
const guard = missing > 0 ? `\n${'}'.repeat(missing)} /* s12: закрыты ${missing} незакрытых скобки усечённого css */\n` : '\n';
const next = base.trimEnd() + guard + '\n' + BLOCK + '\n';
console.log('brace guard:', missing);
console.log(`next len=${next.length} | willChange=${next !== cur}`);

if (APPLY && next !== cur) {
  const setres = await fr.evaluate((next) => {
    const r = { ace: false, cm: false, ta: false };
    try { if (window.ace) { for (const el of document.querySelectorAll('.ace_editor')) { window.ace.edit(el).setValue(next, -1); r.ace = true; } } } catch (e) { /* */ }
    for (const el of document.querySelectorAll('.CodeMirror')) { try { if (el.CodeMirror) { el.CodeMirror.setValue(next); r.cm = true; } } catch (e) { /* */ } }
    for (const t of document.querySelectorAll('textarea')) if (t.value && t.value.length > 100) { t.value = next; t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true })); r.ta = true; }
    return r;
  }, next);
  console.log('set via:', JSON.stringify(setres));
  await page.waitForTimeout(1500);
  const verify = await fr.evaluate((START) => {
    let v = '';
    try { if (window.ace) { const el = document.querySelector('.ace_editor'); if (el) v = window.ace.edit(el).getValue(); } } catch (e) { /* */ }
    if (!v) for (const t of document.querySelectorAll('textarea')) if (t.value && t.value.length > 100) v = t.value;
    return { hasS12: v.includes(START), len: v.length };
  }, START);
  console.log('pre-save:', JSON.stringify(verify));
  if (!verify.hasS12) { console.log('!! block not in editor — NOT saving'); await browser.close(); process.exit(6); }
  let saved = false;
  for (const label of ['Сохранить', 'Сохранить изменения']) {
    const btn = page.getByText(label, { exact: true });
    if (await btn.count().catch(() => 0)) { await btn.first().click({ timeout: 8000 }).then(() => { saved = true; console.log('clicked', label); }).catch(() => {}); if (saved) break; }
  }
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'audit/t706-css-saved.png', fullPage: true }).catch(() => {});
  console.log('APPLIED + saved:', saved);
} else {
  console.log(APPLY ? 'no change needed' : 'INSPECT-only (APPLY=1 to write); snapshot -> backup/custom-css-before-s12.css');
}
await browser.close();
