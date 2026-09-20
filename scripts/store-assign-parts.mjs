// ─────────────────────────────────────────────────────────────
// store-assign-parts.mjs — разделы («группы товаров») нативного Tilda Store.
//
// Зачем. CSV-импорт колонку Categories проигнорировал: все 35 новых товаров
// легли в «Без раздела», а разделов «Миниатюры» и «Портреты на золоте»
// не появилось вообще. Разделы в Store — отдельная сущность:
//   • список             POST /store/submit/  comm=getpartslist
//   • создать            comm=createstorepart  (title, projectid)
//   • привязка к товару  поле partuids в comm=saveproduct (см. store-api.mjs)
//
// Скрипт идемпотентный: существующие разделы переиспользует, товар трогает
// только если раздел у него отличается от нужного.
//
//   node scripts/store-assign-parts.mjs            # показать план
//   APPLY=1 node scripts/store-assign-parts.mjs    # применить
// ─────────────────────────────────────────────────────────────
import { withSession, pace, PROJECTID } from './tilda-session.mjs';
import { getProduct, saveProduct } from './store-api.mjs';

const APPLY = process.env.APPLY === '1';
const BRAND = 'Mila Bezú'; // у товаров Sprint 8 бренд такой; импорт 2026 проставил «MBezu»

const { ARTWORKS, SERIES } = await import('../src/common/data.ts');

// серия витрины → название раздела в Store (имена исторические, Sprint 8)
const PART_TITLE = {
  monochrome: 'Монохромная',
  streets: 'Улицы мира',
  silence: 'Тихая сила',
  tondi: 'Тондо',
  mini: 'Миниатюры',
  pets: 'Портреты на золоте',
};
const seriesOf = Object.fromEntries(ARTWORKS.map((a) => [a.id, a.series]));

await withSession(async ({ page }) => {
  await page.goto(`https://store.tilda.ru/store/?projectid=${PROJECTID}`, { waitUntil: 'networkidle', timeout: 90000 });
  await pace(4000, 6000);

  const submit = (body) => page.evaluate(async (b) => {
    const r = await fetch('/store/submit/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: b,
    });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return t.slice(0, 300); }
  }, body);

  // ── 1. текущие разделы ──
  const readParts = () => page.evaluate(() => {
    const el = document.querySelector('.js-store-storeparts-json');
    try { return JSON.parse(el.textContent || el.innerText || '[]'); } catch { return []; }
  });
  let parts = await readParts();
  const byTitle = new Map(parts.map((p) => [p.title, String(p.uid)]));
  console.log('разделы сейчас:', parts.map((p) => `${p.title} (${p.productscount})`).join(' · ') || 'нет');

  // ── 2. создать недостающие ──
  const needed = [...new Set(ARTWORKS.filter((a) => !a.hidden).map((a) => PART_TITLE[a.series]).filter(Boolean))];
  const toCreate = needed.filter((t) => !byTitle.has(t));
  console.log('нужно создать разделов:', toCreate.length, toCreate.join(', ') || '—');

  if (toCreate.length && APPLY) {
    let sort = Math.max(0, ...parts.map((p) => Number(p.sort) || 0));
    for (const title of toCreate) {
      sort += 100;
      const res = await submit(new URLSearchParams({
        comm: 'createstorepart', projectid: PROJECTID, title, sort: String(sort),
      }).toString());
      const uid = res && (res.uid || res.partuid || (res.part && res.part.uid));
      console.log(`  + «${title}» →`, uid || JSON.stringify(res).slice(0, 180));
      if (uid) byTitle.set(title, String(uid));
      await pace(1200, 2000);
    }
    await page.reload({ waitUntil: 'networkidle', timeout: 90000 });
    await pace(4000, 6000);
    parts = await readParts();
    for (const p of parts) byTitle.set(p.title, String(p.uid));
  }

  // ── 3. товары: какие нужно переложить ──
  const rows = await page.evaluate(() => [...document.querySelectorAll('[data-store-product-uid].js-product')].map((el) => ({
    uid: el.getAttribute('data-store-product-uid'),
    sku: ((el.innerText || '').match(/\b(?:MN|ST|TS|TD|CT|MI|PP|NC)-\d{2}\b/) || [])[0] || '',
    title: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40),
  })));
  console.log(`\nтоваров в панели: ${rows.length}`);

  const plan = [];
  for (const r of rows) {
    const series = seriesOf[r.sku];
    const want = series ? byTitle.get(PART_TITLE[series]) : undefined;
    if (!want) { if (r.sku) console.log(`  ? ${r.sku}: не знаю раздела`); continue; }
    const j = await getProduct(page, r.uid);
    const cur = String(j.partuids || '');
    const brandOk = String(j.brand || '') === BRAND;
    if (cur === want && brandOk) continue;
    plan.push({ ...r, want, cur, brand: j.brand });
    await new Promise((res) => setTimeout(res, 120));
  }

  console.log(`\nк изменению: ${plan.length}`);
  for (const p of plan) {
    const partName = [...byTitle.entries()].find(([, u]) => u === p.want)?.[0];
    console.log(`  ${p.sku || p.uid}: раздел «${p.cur || '—'}» → «${partName}»${p.brand !== BRAND ? `, бренд «${p.brand}» → «${BRAND}»` : ''}`);
  }
  if (!APPLY) { console.log('\nAPPLY=1 — чтобы применить.'); return; }

  let ok = 0;
  for (const p of plan) {
    try {
      await saveProduct(page, p.uid, (j) => { j.partuids = p.want; j.brand = BRAND; });
      ok++;
      if (ok % 10 === 0) console.log(`  … ${ok}/${plan.length}`);
    } catch (e) {
      console.log(`  ✗ ${p.sku || p.uid}: ${e.message.slice(0, 120)}`);
    }
    await new Promise((res) => setTimeout(res, 350));
  }
  console.log(`\n✓ обновлено: ${ok}/${plan.length}`);

  await page.reload({ waitUntil: 'networkidle', timeout: 90000 });
  await pace(4000, 6000);
  const after = await readParts();
  console.log('разделы после:', after.map((p) => `${p.title} (${p.productscount})`).join(' · '));
});
