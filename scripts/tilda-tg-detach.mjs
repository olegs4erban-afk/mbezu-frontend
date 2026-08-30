// Снять Telegram с форм A и корзины (оставить ТОЛЬКО на обезличенных B).
// Схема 152-ФЗ: все ПД → «Заявки»+Email; Telegram — только lead_ref/source/…
// Гипотеза контракта: интеграция сохраняется параметром app-id-<id> в saverecord;
// пересохранение БЕЗ параметра должно снять галочку. Проверяем перечитыванием.
import { withSession, PROJECTID, pace } from './tilda-session.mjs';

const DETACH = [
  ['142947296', '3437563301', 'A · главная'],
  ['142949736', '3437569501', 'A · commission'],
  ['143102566', '3437474901', 'A · header'],
  ['143102566', '2293310791', 'КОРЗИНА 706'],
];

await withSession(async ({ page }) => {
  await page.goto(`https://tilda.ru/page/?pageid=142947296&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  for (const [pid, rec, label] of DETACH) {
    const r = await page.evaluate(async ({ pid, rec }) => {
      const read = async () => {
        const rr = await fetch('/page/edit/', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: new URLSearchParams({ comm: 'editrecordcontent', pageid: pid, recordid: rec, tab: 'content' }).toString(),
        });
        return JSON.parse(await rr.text());
      };
      const j = await read();
      const dec = (s) => String(s || '').replace(/&quot;/g, '"');
      const list = j.record.list ? JSON.parse(dec(j.record.list)) : [];
      const body = new URLSearchParams();
      body.set('comm', 'saverecord');
      body.set('recordid', rec);
      body.set('pageid', pid);
      body.set('forminputs', JSON.stringify(list));
      body.set('buttontitle', j.record.buttontitle || 'Отправить');
      body.set(`formactiontype${rec}`, String(j.record.formactiontype ?? '2'));
      // ЯВНО выключаем интеграцию: и без параметра, и с нулём — что сработает
      for (const it of (j.formintegrations || [])) body.set(it.name, '0');
      const sv = await fetch('/page/submit/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: body.toString(),
      });
      const svText = (await sv.text()).slice(0, 30);
      const after = await read();
      return { svText, checked: (after.formintegrations || []).map((x) => `${x.type}:${x.checked}`) };
    }, { pid, rec });
    console.log(`${label}: save=${r.svText} → интеграции: ${r.checked.join(',') || 'нет'}`);
    await pace(1200, 2000);
  }
});
