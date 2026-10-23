// ─────────────────────────────────────────────────────────────
// tilda-head-build.mjs — офлайн-сборка head-кода Tilda (без браузера и без сессии).
//
//   node scripts/tilda-head-build.mjs <снимок.html> <итог.html>
//
// <снимок.html> — текущий head-код проекта (MCP get_head_code → поле project.headcode,
// или «Настройки сайта → Вставка кода» в админке). Итог записывается через
// MCP update_project_head_code или вставкой в админке, затем — «Опубликовать все страницы».
// Сборка обязана быть идемпотентной: повторный прогон по итогу ничего не меняет.
// ─────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';
import { patchHead } from './tilda-head-lib.mjs';

const [, , inp, outp] = process.argv;
if (!inp || !outp) {
  console.error('usage: node scripts/tilda-head-build.mjs <снимок.html> <итог.html>');
  process.exit(2);
}
const src = readFileSync(inp, 'utf8');
const { out, removed } = patchHead(src);
const again = patchHead(out).out;
writeFileSync(outp, out, 'utf8');
console.log(`  ${inp}: ${src.length} → ${out.length} симв.` + (removed.length ? `; убрано: ${removed.join(', ')}` : ''));
console.log(again === out ? '  повторная сборка ничего не меняет ✓' : '  ✗ повторная сборка меняет итог — patchHead не идемпотентен');
if (again !== out) process.exit(1);
