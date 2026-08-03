// ─────────────────────────────────────────────────────────────
// tilda-republish.mjs — перепубликация всех страниц проекта.
// Нужна после правки head-кода сайта: Tilda впекает head в опубликованный
// HTML, и без перепубликации домен продолжает отдавать старую версию
// (проверено: в админке новый код, на домене — старый).
// ─────────────────────────────────────────────────────────────
import { withSession, PROJECTID, publishPage, pace } from './tilda-session.mjs';
import { JUNK } from './tilda-unpublish-junk.mjs';

// Чёрный список: страницы, снятые с публикации осознанно. Первый прогон этого
// скрипта воскресил их все — вернулись дубль главной, мусорные страницы и
// /tracking в sitemap. Больше их не трогаем.

await withSession(async ({ page }) => {
  await page.goto(`https://tilda.ru/projects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  // Собираем pageid всех страниц проекта из ссылок вида /page/?pageid=…
  const ids = await page.evaluate(() => {
    const found = new Map();
    for (const a of document.querySelectorAll('a,div,li')) {
      const s = (a.getAttribute && (a.getAttribute('href') || a.getAttribute('data-pageid') || '')) || '';
      const m = String(s).match(/pageid=(\d+)/);
      if (m) {
        const row = a.closest('[class*="page"],li,tr') || a;
        found.set(m[1], (row.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 46));
      }
      const dp = a.getAttribute && a.getAttribute('data-pageid');
      if (dp) found.set(dp, (a.innerText || '').trim().slice(0, 46));
    }
    return [...found.entries()].map(([id, title]) => ({ id, title }));
  });

  const skipped = ids.filter((p) => JUNK.includes(p.id));
  const targets = ids.filter((p) => !JUNK.includes(p.id));
  console.log(`страниц найдено: ${ids.length}, публикуем: ${targets.length}`);
  targets.forEach((p) => console.log(`   ${p.id}  ${p.title}`));
  if (skipped.length) console.log('  пропускаем (сняты осознанно):', skipped.map((p) => p.id).join(', '));
  if (!targets.length) { console.log('  ✗ публиковать нечего'); return; }

  let ok = 0, fail = 0;
  for (const p of targets) {
    await pace();
    try {
      const res = await publishPage(page, p.id);
      const good = res === 200 || res === true || (res && res.status === 200);
      console.log(`   publish ${p.id}: ${good ? '200' : JSON.stringify(res)}`);
      good ? ok++ : fail++;
    } catch (e) {
      console.log(`   publish ${p.id}: ОШИБКА ${String(e).slice(0, 70)}`);
      fail++;
    }
  }
  console.log(`\n  опубликовано: ${ok}, с ошибкой: ${fail}`);
});
