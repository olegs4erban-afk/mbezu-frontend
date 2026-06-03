// Runtime audit (Phase 2). Loads each route in headless Chromium against the
// preview server, captures console errors/warnings + pageerrors, verifies #root
// is mounted & non-empty, screenshots, and checks model-viewer stays lazy.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const ROUTES = [
  ['home', '/'],
  ['about', '/about.html'],
  ['catalog', '/catalog.html'],
  ['painting', '/painting.html?id=MN-01'],
  ['painting-clean', '/painting/mn-01.html'],
  ['commission', '/commission.html'],
  ['cart', '/cart.html'],
  ['tracking', '/tracking.html'],
  ['legal', '/legal.html'],
];

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) { console.log(`server up after ~${i}s`); return true; } } catch { /* not ready */ }
    await new Promise((res) => setTimeout(res, 1000));
  }
  return false;
}

mkdirSync('audit/screens', { recursive: true });
if (!(await waitForServer(BASE + '/'))) {
  console.log('SERVER NOT REACHABLE at ' + BASE);
  process.exit(2);
}
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
const results = [];

for (const [name, path] of ROUTES) {
  const page = await ctx.newPage();
  const consoleMsgs = [];
  const pageErrors = [];
  const jsReqs = [];
  const failedRes = [];
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
  page.on('request', (r) => { const u = r.url(); if (u.endsWith('.js')) jsReqs.push(u.split('/').pop()); });
  page.on('response', (r) => { if (r.status() >= 400) failedRes.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => failedRes.push(`FAILED ${r.url()} (${r.failure()?.errorText || ''})`));

  let status = 0;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
    status = resp ? resp.status() : 0;
    await page.waitForFunction(() => {
      const r = document.getElementById('root');
      return r && r.children.length > 0;
    }, { timeout: 8000 }).catch(() => {});
  } catch (e) {
    pageErrors.push('goto: ' + (e.message || e));
  }

  const root = await page.evaluate(() => {
    const r = document.getElementById('root');
    return { children: r ? r.children.length : 0, textLen: r ? (r.innerText || '').length : 0 };
  }).catch(() => ({ children: 0, textLen: 0 }));

  await page.screenshot({ path: `audit/screens/${name}.png`, fullPage: true }).catch(() => {});

  const errors = [...pageErrors, ...consoleMsgs.filter((m) => m.type === 'error').map((m) => m.text)];
  const warnings = consoleMsgs.filter((m) => m.type === 'warning').map((m) => m.text);
  const modelViewerLoaded = jsReqs.some((f) => f && f.startsWith('model-viewer'));

  results.push({ name, path, status, root, errors, warnings, failedRes, modelViewerLoaded });
  const ok = status >= 200 && status < 400 && root.children > 0 && errors.length === 0;
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(15)} HTTP ${status} · root children=${root.children} text=${root.textLen} · errors=${errors.length} warn=${warnings.length} · failedRes=${failedRes.length} · MV=${modelViewerLoaded}`);
  if (failedRes.length) failedRes.slice(0, 3).forEach((e) => console.log('     RES:', e.slice(0, 160)));
  await page.close();
}

await browser.close();
writeFileSync('audit/runtime-results.json', JSON.stringify(results, null, 2));

// ── write AUDIT.md (runtime section) ─────────────────────────
const row = (r) => `| ${r.name} | ${r.status} | ${r.root.children}/${r.root.textLen} | ${r.errors.length} | ${r.warnings.length} | ${r.failedRes.length} | ${r.modelViewerLoaded ? 'yes' : 'no'} |`;
const md = [
  '# AUDIT — mbezu-frontend (Sprint 3)',
  '',
  '## Phase 2 — Runtime audit',
  '',
  'Headless Chromium (1366×900) против `npm run preview`. Скриншоты: `audit/screens/<route>.png`.',
  '`MV` = загружен ли тяжёлый `model-viewer` чанк (должно быть **no** везде — он ленивый).',
  '',
  '| Route | HTTP | root children/text | console errors | warns | failed res | MV loaded |',
  '|-------|------|--------------------|----------------|-------|-----------|-----------|',
  ...results.map(row),
  '',
  '### Детали ошибок/упавших ресурсов',
  ...results.flatMap((r) => [
    ...r.errors.map((e) => `- **${r.name}** console-error: \`${String(e).slice(0, 200)}\``),
    ...r.failedRes.map((e) => `- **${r.name}** failed-resource: \`${String(e).slice(0, 200)}\``),
  ]),
  (results.every((r) => !r.errors.length && !r.failedRes.length) ? '- (нет)' : ''),
  '',
].join('\n');
writeFileSync('AUDIT.md', md);

const anyErr = results.some((r) => r.errors.length || r.root.children === 0 || r.status >= 400);
console.log(anyErr ? 'RUNTIME AUDIT: issues found (see AUDIT.md)' : 'RUNTIME AUDIT: all routes clean');
process.exit(0);
