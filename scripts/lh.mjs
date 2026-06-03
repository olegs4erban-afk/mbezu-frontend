// Lighthouse (Phase 3) — mobile audits for home/about/catalog/painting against
// the preview server. Reports → audit/lighthouse/. Scores appended to AUDIT.md.
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const TARGETS = [
  ['home', '/'],
  ['about', '/about.html'],
  ['catalog', '/catalog.html'],
  ['painting', '/painting.html?id=MN-01'],
];
const CATS = ['performance', 'accessibility', 'best-practices', 'seo'];

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return true; } catch { /* */ }
    await new Promise((res) => setTimeout(res, 1000));
  }
  return false;
}

mkdirSync('audit/lighthouse', { recursive: true });
if (!(await waitForServer(BASE + '/'))) { console.log('SERVER NOT REACHABLE'); process.exit(2); }

const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ['--no-sandbox', '--headless=new', '--disable-gpu', '--disable-dev-shm-usage'],
});

const rows = [];
for (const [name, path] of TARGETS) {
  try {
    const runner = await lighthouse(BASE + path, {
      port: chrome.port,
      output: ['html', 'json'],
      logLevel: 'error',
      onlyCategories: CATS,
      formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
    });
    const lhr = runner.lhr;
    writeFileSync(`audit/lighthouse/${name}.report.html`, runner.report[0]);
    writeFileSync(`audit/lighthouse/${name}.report.json`, runner.report[1]);
    const sc = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
    const row = { name, perf: sc('performance'), a11y: sc('accessibility'), bp: sc('best-practices'), seo: sc('seo') };
    rows.push(row);
    console.log(`${name.padEnd(10)} perf=${row.perf} a11y=${row.a11y} bp=${row.bp} seo=${row.seo}`);
  } catch (e) {
    console.log(`${name}: lighthouse FAILED — ${e.message || e}`);
    rows.push({ name, perf: 'ERR', a11y: 'ERR', bp: 'ERR', seo: 'ERR' });
  }
}
writeFileSync('audit/lh-results.json', JSON.stringify(rows, null, 2));

// append Phase 3 section to AUDIT.md (idempotent)
const section = [
  '## Phase 3 — Lighthouse (mobile)',
  '',
  'Цели: Perf ≥90, SEO 100, A11y ≥95, Best-Practices ≥95. Отчёты: `audit/lighthouse/<page>.report.html`.',
  '',
  '| Page | Performance | Accessibility | Best-Practices | SEO |',
  '|------|-------------|---------------|----------------|-----|',
  ...rows.map((r) => `| ${r.name} | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} |`),
  '',
].join('\n');

let md = existsSync('AUDIT.md') ? readFileSync('AUDIT.md', 'utf-8') : '# AUDIT — mbezu-frontend (Sprint 3)\n';
md = md.split('## Phase 3')[0].trimEnd() + '\n\n' + section;
writeFileSync('AUDIT.md', md);
console.log('Lighthouse done → AUDIT.md');

// Chrome temp cleanup can EPERM on Windows (file lock) — never let it crash the run.
try { await chrome.kill(); } catch (e) { console.log('chrome.kill cleanup ignored:', e.code || e.message); }
process.exit(0);
