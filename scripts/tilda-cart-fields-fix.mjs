// ─────────────────────────────────────────────────────────────
// tilda-cart-fields-fix.mjs — поля формы заказа (корзина 706, Header 143102566).
// Контракт тот же, что у блоков форм: /page/edit/ comm=editrecordcontent (чтение),
// /page/submit/ comm=saverecord + forminputs (запись).
// Было: Your Name / Your Email / Your Phone. Становится: Имя / Email / Телефон
// + Город + Адрес доставки + чекбокс согласия ПД (аудит: «в чекауте нет адреса
// и согласия — риск 152-ФЗ на чеке 25–100 тыс. ₽»).
// Снапшот исходного контента: audit/cart-content-read.json.
// ─────────────────────────────────────────────────────────────
import { withSession, PROJECTID, publishPage } from './tilda-session.mjs';

const PAGE = '143102566';
const REC = '2293310791';

await withSession(async ({ page }) => {
  await page.goto(`https://tilda.ru/page/?pageid=${PAGE}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  const cur = await page.evaluate(async ({ PAGE, REC }) => {
    const r = await fetch('/page/edit/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ comm: 'editrecordcontent', pageid: PAGE, recordid: REC, tab: 'content' }).toString(),
    });
    const j = JSON.parse(await r.text());
    return { list: JSON.parse(String(j.record.list).replace(/&quot;/g, '"')), buttontitle: j.record.buttontitle, formactiontype: j.record.formactiontype };
  }, { PAGE, REC });
  console.log('сейчас полей:', cur.list.length, '| кнопка:', cur.buttontitle, '| actiontype:', cur.formactiontype);

  const byNm = (nm) => cur.list.find((f) => f.li_nm === nm) || {};
  const mk = (over, i) => ({ lid: String(Date.now()) + String(200 + i), ls: String(200 + i * 10), loff: '', li_parent_id: null, li_req: 'y', ...over });
  const inputs = [
    { ...byNm('Name'), li_title: 'Имя', li_req: 'y' },
    { ...byNm('Email'), li_title: 'Email', li_req: 'y' },
    { ...byNm('Phone'), li_title: 'Телефон', li_req: 'y' },
    mk({ li_type: 'in', li_nm: 'city', li_title: 'Город', li_ph: 'Москва' }, 1),
    mk({ li_type: 'in', li_nm: 'address', li_title: 'Адрес доставки или пункт выдачи СДЭК', li_ph: 'улица, дом, квартира' }, 2),
    mk({ li_type: 'cb', li_nm: 'consent', li_title: 'Согласен(на) на обработку персональных данных (152-ФЗ)' }, 3),
  ];

  const res = await page.evaluate(async ({ PAGE, REC, inputs, buttontitle, formactiontype }) => {
    const body = new URLSearchParams();
    body.set('comm', 'saverecord');
    body.set('recordid', REC);
    body.set('pageid', PAGE);
    body.set('forminputs', JSON.stringify(inputs));
    body.set('buttontitle', 'Оформить заказ');
    body.set(`formactiontype${REC}`, String(formactiontype ?? '2'));
    const r = await fetch('/page/submit/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body.toString(),
    });
    return { status: r.status, body: (await r.text()).slice(0, 40).trim() };
  }, { PAGE, REC, inputs, buttontitle: cur.buttontitle, formactiontype: cur.formactiontype });
  console.log('saverecord:', JSON.stringify(res));

  // перечитать и сверить
  const after = await page.evaluate(async ({ PAGE, REC }) => {
    const r = await fetch('/page/edit/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ comm: 'editrecordcontent', pageid: PAGE, recordid: REC, tab: 'content' }).toString(),
    });
    const j = JSON.parse(await r.text());
    return JSON.parse(String(j.record.list).replace(/&quot;/g, '"')).map((f) => `${f.li_type}:${f.li_nm}:«${f.li_title}»`);
  }, { PAGE, REC });
  console.log('после:', after.join(' | '));
  console.log('publish:', await publishPage(page, PAGE).catch((e) => String(e).slice(0, 40)));
});
