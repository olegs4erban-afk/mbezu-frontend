// Снять с публикации страницы, которые были сняты раньше и которые
// tilda-republish.mjs по ошибке опубликовал заново:
//   140814006 — старая главная (Ф3.3, иначе дубль /)
//   143103886, 143107666 — мусор (Ф4, иначе снова попадут в sitemap)
//   142950276 — «Статус заказа», из-за неё в sitemap вернулся /tracking
import { withSession, PROJECTID, pace } from './tilda-session.mjs';

// ВАЖНО: этот же список зашит в tilda-republish.mjs как чёрный —
// иначе массовая перепубликация воскрешает снятые страницы (уже наступил).
export const JUNK = ['140814006', '143103886', '143107666', '142950276'];

await withSession(async ({ page }) => {
  await page.goto(`https://tilda.ru/projects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  for (const id of JUNK) {
    await pace();
    const res = await page.evaluate(async ({ id, PROJECTID }) => {
      const r = await fetch('/page/unpublish/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams({ pageid: id, projectid: PROJECTID }).toString(),
      });
      return { status: r.status, body: (await r.text()).slice(0, 120) };
    }, { id, PROJECTID });
    console.log(`  unpublish ${id}: ${res.status} ${res.body}`);
  }
});
