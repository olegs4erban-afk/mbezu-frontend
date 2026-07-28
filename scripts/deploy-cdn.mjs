// ─────────────────────────────────────────────────────────────
// deploy-cdn.mjs (Sprint 15, Ф1.2, шаг 3) — выкатка CDN-слоя и ОЖИДАНИЕ его появления.
//
// CDN собирает GitHub Actions из main. Без ожидания следующий шаг (tilda-push)
// зальёт контейнер, ссылающийся на ещё не выложенные ассеты, и домен на минуту
// отдаст битую страницу. Поэтому: push → опрос cdn, пока не отдаст свежий чанк.
//
// Ничего не коммитит сам: коммит — осознанное действие. Если есть незакоммиченные
// изменения в public/ или src/ — предупреждает и выходит с ошибкой.
// ─────────────────────────────────────────────────────────────
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const CDN = 'https://cdn.mbezu.ru';
const sh = (c) => execSync(c, { encoding: 'utf-8' }).trim();

// какие ассеты должны появиться: берём из свежесобранного стабильного лоадера
if (!existsSync('dist/e/home.js')) {
  console.error('  нет dist/e/home.js — сначала npm run build');
  process.exit(1);
}
const loader = readFileSync('dist/e/home.js', 'utf-8');
const expect = [...loader.matchAll(/\.\.(\/assets\/[^"']+)/g)].map((m) => m[1]);
if (!expect.length) { console.error('  не нашёл ассетов в dist/e/home.js'); process.exit(1); }

const dirty = sh('git status --porcelain -- src public seo scripts');
if (dirty) {
  console.error('  Незакоммиченные изменения — CDN соберётся из того, что в git:\n' + dirty);
  console.error('  Закоммить и повторить (деплой намеренно не коммитит за тебя).');
  process.exit(1);
}

const branch = sh('git rev-parse --abbrev-ref HEAD');
const ahead = sh(`git rev-list --count origin/${branch}..${branch}`);
if (Number(ahead) > 0) {
  console.log(`  push ${ahead} коммит(ов) → origin/${branch}`);
  execSync(`git push origin ${branch}`, { stdio: 'inherit' });
} else {
  console.log('  нечего пушить, проверяю что CDN уже отдаёт нужные ассеты');
}

const head = sh('git rev-parse --short HEAD');
console.log(`  жду CDN (${head}): ${expect.map((e) => e.split('/').pop()).join(', ')}`);
const deadline = Date.now() + 6 * 60 * 1000;
while (Date.now() < deadline) {
  const codes = await Promise.all(expect.map(async (a) => {
    try { return (await fetch(CDN + a, { method: 'HEAD' })).status; } catch { return 0; }
  }));
  if (codes.every((c) => c === 200)) {
    console.log('  ✓ CDN отдаёт свежую сборку\n');
    process.exit(0);
  }
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, 15000));
}
console.error('\n  CDN не выложил сборку за 6 минут — проверь GitHub Actions');
process.exit(1);
