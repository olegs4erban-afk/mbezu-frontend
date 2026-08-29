// ─────────────────────────────────────────────────────────────
// tilda-lead-receivers.mjs — скрытые формы-приёмники заявок (Sprint 15 Ф0).
//
//   форма A rec3437474901 [data-mbezu-lead]   — все ПД → «Заявки» Tilda.
//   форма B rec3437480401 [data-mbezu-notify] — только lead_ref/source/page/city/budget/ts.
//   Оба блока BF201N вставлены на Header (143102566) — сайт-wide.
//
// Контракт снят с живого сохранения (audit/form-save-0.txt):
//   POST /page/submit/  comm=saverecord + recordid + pageid +
//   forminputs=[{lid,ls,loff,li_parent_id,li_type,li_ph,li_req,li_nm}] + buttontitle…
//   li_type: 'in' — текстовое поле; li_nm — имя переменной (транспорт находит по [name=…]).
//
// Telegram/Email-каналы требуют подключения сервисов в Настройках → Формы
// (действия владельца в Telegram) — до тех пор обе формы шлют в «Заявки»,
// что уже закрывает потерю 100% лидов.
// ─────────────────────────────────────────────────────────────
import { withSession, PROJECTID, publishPage, pace } from './tilda-session.mjs';

const PAGE = '143102566';
const A = { rec: '3437474901', btitle: 'Заявка (форма A · не удалять)', fields: ['lead_ref', 'name', 'phone', 'email', 'city', 'message', 'notes', 'size', 'style', 'palette', 'budget', 'weeks', 'source', 'page', 'ts', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] };
const B = { rec: '3437480401', btitle: 'Уведомление (форма B · не удалять)', fields: ['lead_ref', 'source', 'page', 'city', 'budget', 'ts'] };

const makeInputs = (names) => names.map((nm, i) => ({
  lid: String(Date.now()) + String(100 + i),
  ls: String(10 + i * 10),
  loff: '',
  li_parent_id: null,
  li_type: 'in',
  li_ph: nm,
  li_req: '',
  li_nm: nm,
}));

await withSession(async ({ page }) => {
  await page.goto(`https://tilda.ru/page/?pageid=${PAGE}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  for (const f of [A, B]) {
    const res = await page.evaluate(async ({ PAGE, f, inputs }) => {
      const body = new URLSearchParams();
      body.set('comm', 'saverecord');
      body.set('recordid', f.rec);
      body.set('pageid', PAGE);
      body.set('forminputs', JSON.stringify(inputs));
      body.set('btitle', '');
      body.set('bdescr', '');
      body.set('buttontitle', 'Отправить');
      body.set('formtitlesuccess', '');
      body.set('formmsgsuccess', 'Заявка принята');
      body.set('formbtnsuccess', '');
      body.set('formmsgurl', '');
      body.set(`formactiontype${f.rec}`, '2');
      body.set('formaction', '');
      body.set('formtarget', '');
      body.set('formajax', '');
      body.set('text', '');
      const r = await fetch('/page/submit/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: body.toString(),
      });
      return { status: r.status, body: (await r.text()).slice(0, 60).trim() };
    }, { PAGE, f, inputs: makeInputs(f.fields) });
    console.log(`форма ${f.rec}: полей ${f.fields.length} → saverecord ${JSON.stringify(res)}`);
    await pace(1200, 2200);
  }
  console.log('publish Header:', await publishPage(page, PAGE).catch((e) => String(e).slice(0, 40)));
});
