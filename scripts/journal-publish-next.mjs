// ─────────────────────────────────────────────────────────────
// journal-publish-next.mjs (Sprint 15, шаг 12 плана роста) — автопостинг журнала.
//
// Публикует ОДНУ следующую статью из очереди content/journal-queue/:
//   queue.json — порядок и статус; <key>.json — title/descr/blocks/cover.
// Запуск раз в 2–3 недели (ритм из аудита):  npm run journal:next
// Идемпотентен: уже опубликованные помечены published/postuid и пропускаются.
//
// Контракты Tilda Feeds — см. память tilda-feeds-contract и скилл tilda:
// posts_Add {title,feeduid,partuid} → uid; posts_Edit = PUT (title обязателен);
// в posts_GetList uid — ключ объекта; posts_Active — toggle.
// ─────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';
import { withSession, PROJECTID } from './tilda-session.mjs';

const FEEDUID = '482342553881';
const QDIR = 'content/journal-queue';
const queue = JSON.parse(readFileSync(`${QDIR}/queue.json`, 'utf8'));

const next = queue.find((q) => !q.published);
if (!next) {
  console.log('Очередь пуста — все статьи опубликованы. Пора писать новые (темы: аудит шаг 12).');
  process.exit(0);
}
const art = JSON.parse(readFileSync(`${QDIR}/${next.key}.json`, 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const cover = `https://cdn.mbezu.ru/assets/cards/${next.cover}.webp`;
console.log(`Публикуем: «${art.title}» (${next.key}), дата ${today}`);

await withSession(async ({ page }) => {
  await page.goto(`https://tilda.ru/identity/gofeeds/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.goto(`https://feeds.tilda.ru/posts/?feeduid=${FEEDUID}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const out = await page.evaluate(async ({ feeduid, projectid, title, descr, date, image, text }) => {
    const call = async (params) => {
      const r = await fetch('/submit/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams(params).toString(),
      });
      return r.json();
    };
    // идемпотентность: пост с таким title уже есть?
    const list0 = await call({ action: 'posts_GetList', feeduid, projectid, items: 200 });
    let uid = (Object.entries((list0.data && list0.data.posts) || {})
      .find(([, p]) => (p.title || '') === title) || [])[0] || null;
    if (!uid) {
      const add = await call({ action: 'posts_Add', feeduid, projectid, title, partuid: '' });
      if (add.error) return { err: 'add: ' + add.error };
      uid = add.data && add.data.uid;
    }
    const edit = await call({
      action: 'posts_Edit', feeduid, projectid, postuid: uid,
      title, descr, date: date + ' 12:00',
      image, mediadata: image, mediatype: 'image', text, parts: '',
    });
    if (edit.error) return { err: 'edit: ' + edit.error, uid };
    const list1 = await call({ action: 'posts_GetList', feeduid, projectid, items: 200 });
    const row = (list1.data && list1.data.posts && list1.data.posts[uid]) || null;
    if (row && row.active !== 'y') {
      const act = await call({ action: 'posts_Active', feeduid, projectid, postuid: uid });
      if (act.error) return { err: 'active: ' + act.error, uid };
    }
    return { uid };
  }, { feeduid: FEEDUID, projectid: PROJECTID, title: art.title, descr: art.descr, date: today, image: cover, text: JSON.stringify(art.blocks) });

  if (out.err) { console.log('✗', out.err); process.exitCode = 1; return; }
  next.published = today;
  next.postuid = out.uid;
  writeFileSync(`${QDIR}/queue.json`, JSON.stringify(queue, null, 2) + String.fromCharCode(10));
  const left = queue.filter((q) => !q.published).length;
  console.log(`✓ опубликована, postuid=${out.uid}. В очереди осталось: ${left}.`);
  console.log('  Проверка: https://mbezu.ru/journal (карточка) и страница /tpost/' + out.uid + '-…');
  console.log('  Не забудь закоммитить queue.json.');
});
