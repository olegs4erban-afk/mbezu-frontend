// Sprint 12 — stable entry loaders (cache-busting).
// Problem: Tilda HTML (mbezu.ru) has no Cache-Control → browsers heuristically cache it,
// and it references HASHED chunk urls → after a deploy stale HTML points at deleted chunks.
// Fix: containers reference STABLE https://cdn.mbezu.ru/e/<page>.js (GH Pages max-age=600),
// which injects the current hashed css + imports the current hashed entry chunk.
// Regenerated on every build from the prerendered HTML → containers never need reswap again.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const PAGES = [
  ['home', 'index.html'],
  ['about', 'about/index.html'],
  ['catalog', 'catalog/index.html'],
  ['commission', 'commission/index.html'],
  ['legal', 'legal/index.html'],
  ['cart', 'cart/index.html'],
  ['tracking', 'tracking/index.html'],
  ['painting', 'painting/index.html'],
];

mkdirSync(join(DIST, 'e'), { recursive: true });
let made = 0;
for (const [name, htmlPath] of PAGES) {
  const p = join(DIST, htmlPath);
  if (!existsSync(p)) { console.log(`skip ${name}: no ${htmlPath}`); continue; }
  const html = readFileSync(p, 'utf-8');
  const entry = (html.match(/<script[^>]+type="module"[^>]+src="(\/assets\/[^"]+\.js)"/) || [])[1];
  const css = (html.match(/<link[^>]+rel="stylesheet"[^>]+href="(\/assets\/[^"]+\.css)"/) || [])[1];
  const preloads = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  if (!entry) { console.log(`skip ${name}: no module entry found`); continue; }
  const rel = (u) => '..' + u; // /assets/x → ../assets/x (loaders live in /e/)
  const lines = [
    '// auto-generated stable loader (scripts/gen-entry-loaders.mjs) — do not edit',
    "const u = (p) => new URL(p, import.meta.url).href;",
    ...preloads.map((pl) => `{ const l = document.createElement('link'); l.rel = 'modulepreload'; l.crossOrigin = 'anonymous'; l.href = u(${JSON.stringify(rel(pl))}); document.head.appendChild(l); }`),
    ...(css ? [`{ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u(${JSON.stringify(rel(css))}); document.head.appendChild(l); }`] : []),
    `import(u(${JSON.stringify(rel(entry))}));`,
    '',
  ];
  writeFileSync(join(DIST, 'e', `${name}.js`), lines.join('\n'), 'utf-8');
  made++;
  console.log(`e/${name}.js → ${entry}${css ? ' + ' + css : ''} (+${preloads.length} preloads)`);
}
console.log(`loaders: ${made}`);
