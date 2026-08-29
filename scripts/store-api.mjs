// ─────────────────────────────────────────────────────────────
// store-api.mjs — чтение/запись товаров Tilda Store через API панели.
//
// Контракт снят с живого сохранения (audit/saveproduct-body.txt):
//   POST store.tilda.ru/store/submit/, тело: querystr=<urlencode(inner)>,
//   inner — 48 ключей; editions и characteristics — ФОРМОВЫЕ МАССИВЫ
//   (editions[uid][], characteristics[title][], …), а не JSON-строки.
//   Прямые плоские параметры и editions-как-JSON сервер отвергает
//   («Error in Store») — на этом уже спалились.
//
// getProduct(page, uid)            → полный JSON товара
// saveProduct(page, uid, patchFn)  → читает, даёт patchFn изменить, пишет, сверяет
// ─────────────────────────────────────────────────────────────
import { PROJECTID } from './tilda-session.mjs';

export async function getProduct(page, uid) {
  return page.evaluate(async ({ PROJECTID, uid }) => {
    const r = await fetch('/store/submit/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ comm: 'getproduct', projectid: PROJECTID, productuid: uid }).toString(),
    });
    return JSON.parse(await r.text());
  }, { PROJECTID, uid });
}

// Скалярные ключи контракта в порядке снятого сохранения.
const SCALARS = ['title', 'descr', 'text', 'gallery', 'li-tubutton', 'price', 'priceold', 'sku',
  'quantity', 'json_options', 'properties', 'partuids', 'mark', 'brand', 'pack_label',
  'pack_x', 'pack_y', 'pack_z', 'pack_m', 'seo_title', 'seo_descr', 'seo_keywords',
  'fb_title', 'fb_descr', 'unit', 'portion', 'vat', 'ffd_payment_method',
  'ffd_payment_object', 'buttonlink', 'off', 'externalid'];

export function buildInner(uid, j) {
  const p = new URLSearchParams();
  p.set('comm', 'saveproduct');
  p.set('productuid', String(uid));
  p.set('projectid', PROJECTID);
  for (const k of SCALARS) {
    const src = k === 'li-tubutton' ? '' : j[k];
    p.set(k, src == null ? '' : String(src));
  }
  const eds = typeof j.editions === 'string' ? (j.editions ? JSON.parse(j.editions) : []) : (j.editions || []);
  for (const e of eds) {
    for (const f of ['uid', 'img', 'sku', 'price', 'priceold', 'quantity', 'pack_x', 'pack_y', 'pack_z', 'pack_m', 'externalid']) {
      p.append(`editions[${f}][]`, e[f] == null ? '' : String(e[f]));
    }
  }
  const chars = typeof j.characteristics === 'string' ? (j.characteristics ? JSON.parse(j.characteristics) : []) : (j.characteristics || []);
  for (const c of chars) {
    p.append('characteristics[title][]', c.title ?? '');
    p.append('characteristics[value][]', c.value ?? '');
  }
  return p.toString();
}

export async function saveProduct(page, uid, patchFn) {
  const j = await getProduct(page, uid);
  // нормализуем editions/characteristics в массивы для patchFn
  j.editions = typeof j.editions === 'string' ? (j.editions ? JSON.parse(j.editions) : []) : (j.editions || []);
  j.characteristics = typeof j.characteristics === 'string' ? (j.characteristics ? JSON.parse(j.characteristics) : []) : (j.characteristics || []);
  patchFn(j);
  const inner = buildInner(uid, j);
  const resp = await page.evaluate(async (body) => {
    const r = await fetch('/store/submit/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body,
    });
    return (await r.text()).slice(0, 300);
  }, 'querystr=' + encodeURIComponent(inner));
  if (!resp.includes('"uid"')) throw new Error('saveproduct отвергнут: ' + resp.replace(/\s+/g, ' ').slice(0, 140));
  const after = await getProduct(page, uid);
  return after;
}
