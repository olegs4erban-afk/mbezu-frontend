// gen-containers.tsx — Phase 5/6. Generates thin-container docs from the REAL
// build (reads asset hashes from dist/*.html):
//   • painting-containers.md — per-artwork containers (photo + price + size only)
//   • page-containers.md     — the 7 standard pages (home/about/.../legal)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ARTWORKS, seriesById, formatPrice } from '../src/common/data';
import { seoFor } from '../src/common/seo';

const CDN = 'https://cdn.mbezu.ru';
const toCdn = (p: string) => CDN + p;

const NO_PHOTO = new Set(['MN-03']);
const PROVISIONAL = new Set(['ST-08', 'TD-01', 'TD-02']);

interface Assets { css: string[]; preloads: string[]; entry: string }

function extractAssets(file: string): Assets {
  const html = readFileSync(resolve('dist', file), 'utf-8');
  return {
    css: [...html.matchAll(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+)"/g)].map((m) => m[1]),
    preloads: [...html.matchAll(/<link rel="modulepreload"[^>]*href="(\/assets\/[^"]+)"/g)].map((m) => m[1]),
    entry: (html.match(/<script type="module"[^>]*src="(\/assets\/[^"]+)"/) || [])[1] || '',
  };
}

function container(a: Assets, comment: string, bakeId?: string): string {
  const l: string[] = [`<!-- ${comment} -->`, '<div id="root"></div>'];
  if (bakeId) l.push(`<script>window.__MB_ART_ID=${JSON.stringify(bakeId)};</script>`);
  for (const c of a.css) l.push(`<link rel="stylesheet" href="${toCdn(c)}">`);
  for (const p of a.preloads) l.push(`<link rel="modulepreload" crossorigin href="${toCdn(p)}">`);
  if (a.entry) l.push(`<script type="module" crossorigin src="${toCdn(a.entry)}"></script>`);
  return l.join('\n');
}

if (!existsSync(resolve('dist/painting/index.html'))) {
  console.error('dist missing — run `npm run build` first.');
  process.exit(1);
}

// ── painting-containers.md ───────────────────────────────────
const pa = extractAssets('painting/index.html');
const eligible = ARTWORKS.filter((a: any) => a.image && !NO_PHOTO.has(a.id) && !PROVISIONAL.has(a.id));
const excluded = ARTWORKS.filter((a: any) => !(a.image && !NO_PHOTO.has(a.id) && !PROVISIONAL.has(a.id)));

const P: string[] = [];
P.push('# painting-containers.md — тонкие Tilda-контейнеры (Уровень 3)');
P.push('');
P.push('> ⚠️ Материал для шага с владельцем. **Ничего из этого в Tilda НЕ вставлено.**');
P.push('> Хеши чанков = ТЕКУЩАЯ сборка. После пересборки перегенерировать: `npm run containers`.');
P.push('');
P.push('## На каждую painting-страницу Tilda');
P.push('1. Создать страницу с alias вида `/painting/mn-01`.');
P.push('2. Блок T123 (Custom HTML) → вставить сниппет работы (он сам тянет `common`+`painting` с CDN).');
P.push('3. SEO-настройки страницы Tilda → Title/Description/OG-image из блока ниже.');
P.push('4. Убрать Babel-standalone из HEAD (если был). Опубликовать, проверить в incognito.');
P.push('');
P.push('Работа выбирается через `window.__MB_ART_ID` (вход `painting` читает его первым).');
P.push('');
P.push('### Базовый шаблон (общий, `<ID>` заменить)');
P.push('```html'); P.push(container(pa, 'MBezu · painting · <ID>', '<ID>')); P.push('```'); P.push('');
P.push(`## Готовые контейнеры — ${eligible.length} работ (фото + цена + размер)`);
P.push('');
for (const a of eligible as any[]) {
  const series = seriesById(a.series);
  const seo = seoFor('painting', { id: a.id });
  P.push(`### ${a.id} · ${a.title}${a.subtitle ? ' (' + a.subtitle + ')' : ''}`);
  P.push(`- Серия: **${series?.title}** · ${a.shape === 'round' ? `⌀ ${a.w} см` : `${a.w}×${a.h} см`} · ${formatPrice(a.price)} · ${a.status}`);
  P.push(`- **SEO Title:** ${seo.title}`);
  P.push(`- **SEO Description:** ${seo.description}`);
  P.push(`- **OG image:** ${seo.ogImage}`);
  P.push(`- **Canonical:** ${seo.canonical}`);
  P.push('```html'); P.push(container(pa, `MBezu · painting · ${a.id}`, a.id)); P.push('```'); P.push('');
}
P.push('## Отложены (НЕ генерируем — см. TODO-incomplete.md)');
for (const a of excluded as any[]) {
  const reason = NO_PHOTO.has(a.id) ? 'нет фото' : (PROVISIONAL.has(a.id) ? 'цена/размер «уточнить»' : 'нет данных');
  P.push(`- **${a.id} · ${a.title}** — ${reason}.`);
}
P.push('');
writeFileSync(resolve('painting-containers.md'), P.join('\n'), 'utf-8');

// ── page-containers.md (7 standard pages) ────────────────────
const PAGES: Array<[string, string]> = [
  ['home', 'index.html'], ['about', 'about/index.html'], ['catalog', 'catalog/index.html'],
  ['commission', 'commission/index.html'], ['cart', 'cart/index.html'],
  ['tracking', 'tracking/index.html'], ['legal', 'legal/index.html'],
];
const G: string[] = [];
G.push('# page-containers.md — тонкие Tilda-контейнеры для 7 стандартных страниц');
G.push('');
G.push('> ⚠️ Материал для шага с владельцем. **В Tilda НЕ вставлено.** Хеши = текущая сборка.');
G.push('> На каждую страницу Tilda: T123 → сниппет ниже; SEO Title/Description из блока; убрать Babel из HEAD; publish; проверить incognito.');
G.push('');
for (const [name, file] of PAGES) {
  if (!existsSync(resolve('dist', file))) continue;
  const a = extractAssets(file);
  const seo = seoFor(name);
  G.push(`### ${name}  (Tilda alias: \`/${name === 'home' ? '' : name}\`)`);
  G.push(`- **SEO Title:** ${seo.title}`);
  if (seo.description) G.push(`- **SEO Description:** ${seo.description}`);
  if (seo.noindex) G.push('- **robots:** noindex (служебная страница)');
  G.push('```html'); G.push(container(a, `MBezu · ${name}`)); G.push('```'); G.push('');
}
writeFileSync(resolve('page-containers.md'), G.join('\n'), 'utf-8');

console.log(`painting-containers.md: ${eligible.length} containers, ${excluded.length} excluded`);
console.log(`page-containers.md: ${PAGES.length} page containers`);
