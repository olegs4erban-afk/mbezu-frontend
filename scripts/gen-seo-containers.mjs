// Sprint 14 (Ф2) — SEO-контейнеры для Tilda T123.
// Проблема: в блок Tilda попадал пустой <div id="root"> → робот (особенно Яндекс,
// который JS почти не исполняет) видел страницу без единого заголовка и текста.
// Решение: кладём в блок ГОТОВУЮ prerendered-разметку той же страницы + её JSON-LD,
// а React монтируется в тот же #root и заменяет содержимое тем же контентом
// (одинаковый контент для робота и человека — это не клоакинг).
//
// Контейнер = stable CSS alias + prerendered markup + stable loader:
//   <link rel="stylesheet" href="https://cdn.mbezu.ru/e/style.css">
//   <div id="root">…prerendered…</div>
//   <script type="module" src="https://cdn.mbezu.ru/e/<page>.js"></script>
// Хешей внутри нет → кеш-бастинг Sprint 12 сохраняется.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const OUT = 'backup/s14';
const CDN = 'https://cdn.mbezu.ru';
// расширяемо: [имя контейнера, prerendered html, имя лоадера, доп. <style>]
const PAGES = [
  ['home', 'index.html', 'home'],
  ['about', 'about/index.html', 'about'],
  ['catalog', 'catalog/index.html', 'catalog', '<style>#rec2291453131{display:none !important;}</style>'],
  ['commission', 'commission/index.html', 'commission'],
  ['legal', 'legal/index.html', 'legal'],
];

mkdirSync(OUT, { recursive: true });

/** Вырезать содержимое <div id="root">…</div> (последний </div> перед скриптами). */
function rootInner(html) {
  const open = '<div id="root">';
  const i = html.indexOf(open);
  if (i < 0) return '';
  const rest = html.slice(i + open.length);
  const end = rest.lastIndexOf('</div>');
  return end < 0 ? '' : rest.slice(0, end);
}

/** JSON-LD блоки из <head> — переносим в блок, чтобы разметку видел робот на mbezu.ru. */
function jsonLdBlocks(html) {
  return (html.match(/<script type="application\/ld\+json"[\s\S]*?<\/script>/g) || []).join('\n');
}

let made = 0;
const report = [];
for (const [name, file, loader, extra] of PAGES) {
  const p = join(DIST, file);
  if (!existsSync(p)) { console.log(`skip ${name}: no ${file}`); continue; }
  const html = readFileSync(p, 'utf-8');
  const inner = rootInner(html);
  if (!inner.trim()) { console.log(`skip ${name}: prerendered #root is EMPTY`); continue; }
  const ld = jsonLdBlocks(html);
  const h1 = (inner.match(/<h1/g) || []).length;
  const h2 = (inner.match(/<h2/g) || []).length;

  const out = [
    `<!-- MBezu · ${name} · prerendered SEO-контейнер (Sprint 14 Ф2). Пересобирается: npm run build && node scripts/gen-seo-containers.mjs -->`,
    `<link rel="stylesheet" href="${CDN}/e/style.css">`,
    extra || '',
    `<div id="root">${inner}</div>`,
    ld,
    `<script type="module" src="${CDN}/e/${loader}.js"></script>`,
    '',
  ].filter(Boolean).join('\n');

  writeFileSync(join(OUT, `c-${name}.html`), out, 'utf-8');
  made++;
  report.push({ name, kb: Math.round(out.length / 1024), h1, h2, ld: (ld.match(/<script/g) || []).length });
}
for (const r of report) console.log(`  ✓ ${OUT}/c-${r.name}.html — ${r.kb}KB · h1=${r.h1} h2=${r.h2} jsonld=${r.ld}`);
console.log(`[seo-containers] ${made} готово`);
