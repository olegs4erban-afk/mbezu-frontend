// Sprint 15 (Ф2.4) — одноразовый codemod: пробел перед <br/> в JSX.
// JSX схлопывает перенос строки между элементами в НИЧЕГО, поэтому
// `Картины,<br/><span>живущие</span>` робот читает как «Картины,живущиев».
// На экране {' '} перед <br/> не виден (перенос строки всё равно), для робота — пробел.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dirs = ['src/pages', 'src/common'];
let files = 0, hits = 0;
for (const dir of dirs) {
  for (const f of readdirSync(dir).filter((n) => /\.tsx$/.test(n))) {
    const p = join(dir, f);
    const src = readFileSync(p, 'utf-8');
    // <br/> без пробела/{' '} перед ним
    const out = src.replace(/(?<!\{' '\}\s*)<br\s*\/?>/g, (m, off, s) => {
      const before = s.slice(Math.max(0, off - 8), off);
      if (/\{' '\}\s*$/.test(before)) return m;   // уже починено
      if (/^\s*$/.test(before)) return m;          // в начале строки — текста перед ним нет
      hits++;
      return `{' '}${m}`;
    });
    if (out !== src) { writeFileSync(p, out, 'utf-8'); files++; console.log(`  ✓ ${p}`); }
  }
}
console.log(`[fix-br] файлов: ${files}, вставок {' '}: ${hits}`);
