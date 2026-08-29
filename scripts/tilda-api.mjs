// ─────────────────────────────────────────────────────────────
// tilda-api.mjs — Tilda Export API (Business-тариф, ключи в .secrets/tilda-api.json).
//
// Это ЧТЕНИЕ без браузера и без headed-сессии: страницы, их список, HTML блоков.
// Записи в API нет — правки по-прежнему через tilda-push.mjs (headed Playwright).
//
//   node scripts/tilda-api.mjs projects        — список проектов
//   node scripts/tilda-api.mjs pages           — все страницы проекта (id, alias, published)
//   node scripts/tilda-api.mjs page <pageid>   — мета страницы
//   node scripts/tilda-api.mjs pagefull <id>   — страница с HTML всех блоков
// ─────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';

const { publickey, secretkey, projectid } = JSON.parse(readFileSync('.secrets/tilda-api.json', 'utf8'));
const BASE = 'https://api.tildacdn.info/v1';

async function call(method, params = {}) {
  const qs = new URLSearchParams({ publickey, secretkey, ...params });
  const r = await fetch(`${BASE}/${method}/?${qs}`);
  const j = await r.json();
  if (j.status !== 'FOUND') throw new Error(`${method}: ${JSON.stringify(j).slice(0, 200)}`);
  return j.result;
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'projects') {
  console.log(JSON.stringify(await call('getprojectslist'), null, 1));
} else if (cmd === 'pages') {
  const pages = await call('getpageslist', { projectid });
  console.log(`страниц: ${pages.length}`);
  for (const p of pages) console.log(` ${p.id}  ${p.published ? 'pub  ' : 'DRAFT'}  ${(p.alias || '—').padEnd(14)} ${p.title.slice(0, 50)}`);
} else if (cmd === 'page' && arg) {
  console.log(JSON.stringify(await call('getpage', { pageid: arg }), null, 1).slice(0, 3000));
} else if (cmd === 'pagefull' && arg) {
  const p = await call('getpagefull', { pageid: arg });
  console.log(`title: ${p.title}\nhtml: ${p.html?.length} симв.`);
} else {
  console.log('команды: projects | pages | page <id> | pagefull <id>');
}
