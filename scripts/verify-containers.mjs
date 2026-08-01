// Sprint 15 — проверка СОБРАННЫХ контейнеров теми же правилами, что и verify-live.
// Ловит дефекты до заливки на домен (склейки, пустой H1, отсутствие JSON-LD),
// чтобы не тратить прогон деплоя и не светить брак на проде.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.CONTAINERS_OUT || 'out/containers';
const WORD = 'A-Za-zА-Яа-яЁё0-9';
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const gluedIn = (inner) => inner.match(new RegExp(`[${WORD},.!?:;»)]((?:<[^>]+>)+)[${WORD}«(]`));

let bad = 0;
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.html'))) {
  const html = readFileSync(join(DIR, f), 'utf-8');
  const heads = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/g)].map((m) => m[1]);
  const glued = heads.filter(gluedIn);
  const h1 = (html.match(/<h1/g) || []).length;
  const ld = (html.match(/application\/ld\+json/g) || []).length;
  const ok = glued.length === 0 && h1 === 1;
  if (!ok) bad++;
  console.log(`  ${ok ? '✓' : '✗'} ${f.padEnd(16)} h1=${h1} заголовков=${heads.length} jsonld=${ld} склеек=${glued.length}`);
  for (const g of glued.slice(0, 3)) console.log(`      → «${strip(g).slice(0, 70)}»`);
}
if (bad) { console.log(`\n  ${bad} контейнер(ов) с дефектами — деплой остановлен\n`); process.exit(1); }
console.log('\n  Контейнеры чистые: один H1, склеек нет.\n');
