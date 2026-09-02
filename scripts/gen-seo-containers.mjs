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
const OUT = process.env.CONTAINERS_OUT || 'out/containers';
const CDN = 'https://cdn.mbezu.ru';
// расширяемо: [имя контейнера, prerendered html, имя лоадера, доп. <style>]
const PAGES = [
  ['home', 'index.html', 'home'],
  ['about', 'about/index.html', 'about'],
  ['catalog', 'catalog/index.html', 'catalog', '<style>#rec2291453131{display:none !important;}</style>'],
  ['commission', 'commission/index.html', 'commission'],
  ['legal', 'legal/index.html', 'legal'],
  // Sprint 15: посадочные серий — отдельные страницы Tilda /catalog/<slug>.
  // Лоадер тот же catalog: рантайм берёт серию из последнего сегмента пути.
  ['catalog-monohromnaya', 'catalog/monohromnaya/index.html', 'catalog'],
  ['catalog-ulitsy-mira', 'catalog/ulitsy-mira/index.html', 'catalog'],
  ['catalog-tihaya-sila', 'catalog/tihaya-sila/index.html', 'catalog'],
  ['catalog-tondo', 'catalog/tondo/index.html', 'catalog'],
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
  // Аудит r2 (SEO): в dist серий лежали и шаблонные LD каталога, и серийные — на живых сериях
  // робот видел по два BreadcrumbList/ItemList. Оставляем последний блок каждого @type (без регэкспов).
  const OPEN = '<script type="application/ld+json"', CLOSE = '</script>';
  const byType = new Map(); let i = 0;
  while ((i = html.indexOf(OPEN, i)) >= 0) {
    const e = html.indexOf(CLOSE, i); if (e < 0) break;
    const block = html.slice(i, e + CLOSE.length); i = e + CLOSE.length;
    const t = block.indexOf('"@type"'); const q1 = block.indexOf('"', block.indexOf(':', t) + 1); const q2 = block.indexOf('"', q1 + 1);
    const type = t >= 0 && q1 > 0 && q2 > q1 ? block.slice(q1 + 1, q2) : block;
    byType.set(type, block);
  }
  return [...byType.values()].join(String.fromCharCode(10));
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

  writeFileSync(join(OUT, `${name}.html`), out, 'utf-8');
  made++;
  report.push({ name, kb: Math.round(out.length / 1024), h1, h2, ld: (ld.match(/<script/g) || []).length });
}
for (const r of report) console.log(`  ✓ ${OUT}/${r.name}.html — ${r.kb}KB · h1=${r.h1} h2=${r.h2} jsonld=${r.ld}`);

// Ф1.5 — человекочитаемая шпаргалка на случай отказа автоклика
try {
  const seo = JSON.parse(readFileSync('seo/pages.json', 'utf-8')).pages;
  const rows = Object.entries(seo).map(([k, p]) => [
    `### ${k} — ${p.alias} (pageId ${p.pageId}, блок ${p.recordId ?? '—'})`,
    `- **Имя страницы (оно же og:title):** ${p.title}`,
    `- **meta_title:** ${p.metaTitle}`,
    `- **meta_descr:** ${p.metaDescr}`,
    `- **link_canonical:** ${p.canonical}`,
    `- **og:image (imgfile + fb_imgfile):** ${p.ogImage}`,
    `- **Контейнер T123:** \`${OUT}/${p.container}.html\``,
  ].join('\n'));
  writeFileSync('out/manual-steps.md', [
    '# Ручная заливка (фолбэк, если автоклик недоступен)', '',
    'Порядок на каждую страницу: открыть редактор → вставить контейнер в блок T123 →',
    'Настройки страницы → заполнить поля ниже → Сохранить → Опубликовать.', '',
    ...rows, '',
  ].join('\n'), 'utf-8');
  console.log('  ✓ out/manual-steps.md (фолбэк для ручной заливки)');
} catch (e) { console.log('  ! manual-steps не собран:', e.message); }

console.log(`[seo-containers] ${made} готово`);
