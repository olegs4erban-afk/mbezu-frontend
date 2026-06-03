// gen-containers.tsx — Phase 5. Generates painting-containers.md:
// per-artwork thin Tilda container snippet (loads common+painting chunks from CDN)
// + per-page SEO, ONLY for works with a real photo AND non-provisional price/size.
// Reads the REAL asset hashes from the current build (dist/painting.html).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ARTWORKS, seriesById, formatPrice, imageOf } from '../src/common/data';
import { seoFor } from '../src/common/seo';

const CDN = 'https://cdn.mbezu.ru';

// Exclusions (from data.jsx source markers — see TODO-incomplete.md)
const NO_PHOTO = new Set(['MN-03']);                 // нет фото
const PROVISIONAL = new Set(['ST-08', 'TD-01', 'TD-02']); // ⚠ цена/размер «уточнить»

const distPainting = resolve('dist/painting.html');
if (!existsSync(distPainting)) {
  console.error('dist/painting.html missing — run `npm run build` first.');
  process.exit(1);
}
const html = readFileSync(distPainting, 'utf-8');

const toCdn = (p: string) => CDN + p;
const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
const preloads = [...html.matchAll(/<link rel="modulepreload"[^>]*href="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
const entry = (html.match(/<script type="module"[^>]*src="(\/assets\/[^"]+)"/) || [])[1] || '';

function snippet(id: string): string {
  const lines: string[] = [];
  lines.push(`<!-- M.Bez · painting container · ${id} -->`);
  lines.push('<div id="root"></div>');
  lines.push(`<script>window.__MB_ART_ID=${JSON.stringify(id)};</script>`);
  for (const c of css) lines.push(`<link rel="stylesheet" href="${toCdn(c)}">`);
  for (const p of preloads) lines.push(`<link rel="modulepreload" crossorigin href="${toCdn(p)}">`);
  if (entry) lines.push(`<script type="module" crossorigin src="${toCdn(entry)}"></script>`);
  return lines.join('\n');
}

const eligible = ARTWORKS.filter((a: any) => a.image && !NO_PHOTO.has(a.id) && !PROVISIONAL.has(a.id));
const excluded = ARTWORKS.filter((a: any) => !(a.image && !NO_PHOTO.has(a.id) && !PROVISIONAL.has(a.id)));

const out: string[] = [];
out.push('# painting-containers.md — тонкие Tilda-контейнеры (Уровень 3)');
out.push('');
out.push('> ⚠️ Материал для шага с владельцем. **Ничего из этого в Tilda НЕ вставлено.**');
out.push('> Хеши чанков соответствуют ТЕКУЩЕЙ сборке. После пересборки — перегенерировать: `npm run containers`.');
out.push('');
out.push('## Как использовать (на каждую painting-страницу Tilda)');
out.push('1. Создать страницу в Tilda с человекочитаемым alias (например `/painting/mn-01`).');
out.push('2. Блок T123 (Custom HTML) → вставить сниппет ниже (он сам подтягивает `common` + `painting` чанки с CDN).');
out.push('3. В настройках страницы Tilda (SEO) — вписать Title / Description / OG-image из блока «SEO».');
out.push('4. Убрать из HEAD страницы Babel-standalone, если он там был.');
out.push('5. Опубликовать, проверить в incognito.');
out.push('');
out.push('Идентификатор работы передаётся через `window.__MB_ART_ID` (вход `painting` читает его в первую очередь).');
out.push('');
out.push('### Базовый шаблон контейнера (общий, `<ID>` заменить)');
out.push('```html');
out.push(snippet('<ID>'));
out.push('```');
out.push('');
out.push(`## Готовые контейнеры — ${eligible.length} работ (фото + цена + размер)`);
out.push('');

for (const a of eligible as any[]) {
  const series = seriesById(a.series);
  const seo = seoFor('painting', { id: a.id });
  out.push(`### ${a.id} · ${a.title}${a.subtitle ? ' (' + a.subtitle + ')' : ''}`);
  out.push(`- Серия: **${series?.title}** · ${a.shape === 'round' ? `⌀ ${a.w} см` : `${a.w}×${a.h} см`} · ${formatPrice(a.price)} · ${a.status}`);
  out.push(`- **SEO Title:** ${seo.title}`);
  out.push(`- **SEO Description:** ${seo.description}`);
  out.push(`- **OG image:** ${seo.ogImage}`);
  out.push(`- **Canonical:** ${seo.canonical}`);
  out.push('```html');
  out.push(snippet(a.id));
  out.push('```');
  out.push('');
}

out.push('## Отложены (НЕ генерируем — см. TODO-incomplete.md)');
for (const a of excluded as any[]) {
  const reason = NO_PHOTO.has(a.id) ? 'нет фото' : (PROVISIONAL.has(a.id) ? 'цена/размер «уточнить»' : 'нет данных');
  out.push(`- **${a.id} · ${a.title}** — ${reason}.`);
}
out.push('');

writeFileSync(resolve('painting-containers.md'), out.join('\n'), 'utf-8');
console.log(`painting-containers.md: ${eligible.length} containers, ${excluded.length} excluded`);
console.log('  assets:', { css, preloads, entry });
