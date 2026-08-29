// ─────────────────────────────────────────────────────────────
// tilda-store-product-fix.mjs — правка карточки товара Store.
// Управляется картой FIX ниже: описание, галерея (JSON!), лишние editions.
//
// Механика (разведано скриншотами и DOM, Sprint 15):
//   store.tilda.ru → клик по названию товара → попап карточки:
//   • описание: Quill (.ql-editor) + textarea[name=descr] — пишем в ОБА;
//   • галерея: textarea[name=gallery] с JSON [{img:...}] — правится строкой,
//     файлы загружать не нужно;
//   • варианты: строки .js-prod-edition, лишние сносит button.tstore_variants__delete
//     (оставляем ПЕРВУЮ строку);
//   • сохранение: точная кнопка «Сохранить и закрыть».
//
//   node scripts/tilda-store-product-fix.mjs <название товара> — показать план
//   node scripts/tilda-store-product-fix.mjs <название> --apply — применить
// ─────────────────────────────────────────────────────────────
import { withSession, PROJECTID, pace } from './tilda-session.mjs';
import { FIX } from './store-fix-map.mjs';

const APPLY = process.argv.includes('--apply');
const NAME = process.argv.slice(2).filter((a) => a !== '--apply').join(' ');
if (!NAME || !FIX[NAME]) {
  console.log('товары в карте:', Object.keys(FIX).join(' | '));
  process.exit(1);
}
const fix = FIX[NAME];

await withSession(async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.goto(`https://store.tilda.ru/store/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  // открыть карточку: прокрутка к строке + до 3 попыток клика
  let opened = false;
  for (let att = 0; att < 3 && !opened; att++) {
    const t = await page.evaluate((name) => {
      const el = [...document.querySelectorAll('td, a, div')].find((e) => (e.innerText || '').trim() === name);
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, NAME);
    if (!t) throw new Error(`товар «${NAME}» не найден в списке`);
    await page.waitForTimeout(800);
    await page.mouse.click(t.x, t.y);
    opened = await page.waitForFunction(
      () => !!(document.querySelector('textarea[name="gallery"], textarea.js-gallery-json')
            && document.querySelector('input[name="title"]')),
      { timeout: 12000 },
    ).then(() => true).catch(() => false);
    if (!opened) console.log(`  попытка ${att + 1}: попап не открылся, пробую ещё`);
  }
  if (!opened) throw new Error('карточка не открылась за 3 попытки');
  await page.waitForTimeout(2500);

  const GAL_SEL = 'textarea[name="gallery"], textarea.js-gallery-json';
  const before = await page.evaluate((gs) => ({
    descr: (document.querySelector('textarea[name="descr"]') || {}).value || '',
    gallery: (document.querySelector(gs) || {}).value || '',
    editions: document.querySelectorAll('.js-prod-edition').length,
  }), GAL_SEL);
  console.log(`▸ ${NAME}`);
  console.log(`  описание (${before.descr.length}): «${before.descr.slice(0, 80)}…»`);
  console.log(`  галерея: ${(JSON.parse(before.gallery || '[]')).length} файл(ов)`);
  console.log(`  вариантов: ${before.editions}`);
  console.log('\n  план:');
  if (fix.descr) console.log(`   descr → «${fix.descr.slice(0, 70)}…» (${fix.descr.length})`);
  if (fix.galleryImg) console.log(`   галерея → 1 файл: …${fix.galleryImg.slice(-50)}`);
  if (fix.keepOneEdition && before.editions > 1) console.log(`   editions: ${before.editions} → 1`);
  if (!APPLY) { console.log('\n  прогон без записи. Применить: --apply'); return; }

  // 2. Галерея — одним файлом.
  if (fix.galleryImg) {
    await page.evaluate((img) => {
      const ta = document.querySelector('textarea[name="gallery"], textarea.js-gallery-json');
      if (!ta) throw new Error('нет textarea gallery');
      ta.value = JSON.stringify([{ img: img }]);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }, fix.galleryImg);
    await pace(400, 800);
  }

  // 1. Описание — в Quill и в textarea.
  if (fix.descr) {
    await page.evaluate((text) => {
      const ta = document.querySelector('textarea[name="descr"]');
      const q = ta && ta.closest('div').parentElement.querySelector('.ql-editor')
        || document.querySelector('.ql-editor');
      if (q) {
        q.innerHTML = '<p>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</p>';
        q.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (ta) {
        ta.value = text;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, fix.descr);
    await pace(400, 800);
  }

  // 3. Лишние варианты — сносим со второй строки, по одному, с перечитыванием.
  if (fix.keepOneEdition) {
    page.on('dialog', (d) => d.accept().catch(() => {}));
    for (let i = 0; i < 8; i++) {
      const n = await page.evaluate(() => {
        const rows = document.querySelectorAll('.js-prod-edition');
        if (rows.length <= 1) return rows.length;
        const btn = rows[1].querySelector('button.tstore_variants__delete');
        btn && btn.click();
        return rows.length;
      });
      if (n <= 1) break;
      await pace(700, 1200);
    }
    const left = await page.evaluate(() => document.querySelectorAll('.js-prod-edition').length);
    console.log(`  вариантов осталось: ${left}`);
  }

  // 3б. Бренд.
  if (fix.brand) {
    await page.evaluate((v) => {
      const el = document.querySelector('input[name="brand"]');
      if (!el) return;
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, fix.brand);
    await pace(300, 600);
  }

  // 4. Сохранить — НАСТОЯЩЕЙ мышью по DIV.tstore__editbox__save-btn-wrap:
  // el.click() по надписи бьёт в другой слой и не сохраняет (проверено сетью:
  // saveproduct уходит только при мышином клике по этому враппу).
  await pace();
  let savedResp = null;
  page.on('response', async (r) => {
    if (r.request().method() !== 'POST' || !r.url().includes('/store/submit')) return;
    if ((r.request().postData() || '').includes('saveproduct')) {
      try { savedResp = (await r.text()).slice(0, 400); } catch { savedResp = 'нечитаемо'; }
    }
  });
  const btn = await page.evaluate(() => {
    const el = document.querySelector('.tstore__editbox__save-btn-wrap');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 14) };
  });
  if (!btn) throw new Error('кнопка «Сохранить» (.tstore__editbox__save-btn-wrap) не найдена');
  await page.mouse.click(btn.x, btn.y);
  await page.waitForTimeout(7000);
  if (!savedResp) throw new Error('saveproduct НЕ ушёл в сеть — изменения не сохранены');
  const dm = savedResp.match(/"descr":"([^"]{0,60})/); const bm = savedResp.match(/"brand":"([^"]{0,30})/);
  console.log('  saveproduct: ушёл; сервер вернул descr=«' + (dm ? dm[1] : '?') + '…» brand=' + (bm ? bm[1] : '—'));
});
