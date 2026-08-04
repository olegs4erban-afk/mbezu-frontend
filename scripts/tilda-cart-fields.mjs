// ─────────────────────────────────────────────────────────────
// tilda-cart-fields.mjs — русификация подписей формы заказа (блок 706).
//
// Путь (найден скриншотами, Sprint 15):
//   страница «Header» 143102566 → блок rec2293310791 → панель блока «Контент»
//   → раздел «ПОЛЯ ДЛЯ ВВОДА» → список полей (#1, #2, …); у каждого поля
//   заголовок лежит в input[name="li_title"].
//   ВАЖНО: корзин две. На /cart (142949956 / rec2291483331) подписи уже русские,
//   но пользователь видит НЕ её, а site-wide корзину из шапки — там «Your Name».
//
//   node scripts/tilda-cart-fields.mjs          — показать поля
//   node scripts/tilda-cart-fields.mjs --apply  — перевести и сохранить
// ─────────────────────────────────────────────────────────────
import { withSession, PROJECTID, pace, publishPage } from './tilda-session.mjs';

const APPLY = process.argv.includes('--apply');
const PAGE = '143102566';
const REC = '2293310791';

const RU = {
  'Your Name': 'Имя',
  'Your Email': 'Email',
  'Your Phone': 'Телефон',
  'Your Comment': 'Комментарий',
  'Comment': 'Комментарий',
  'Name': 'Имя',
  'Email': 'Email',
  'Phone': 'Телефон',
  'Address': 'Адрес доставки',
  'City': 'Город',
};

await withSession(async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(`https://tilda.ru/page/?pageid=${PAGE}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(11000);

  const box = await page.evaluate((rec) => {
    const el = document.querySelector(`#rec${rec}, #record${rec}`);
    if (!el) return null;
    el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -120);
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 60) };
  }, REC);
  if (!box) throw new Error('блок корзины не найден');
  await page.mouse.move(box.x, box.y);
  await page.waitForTimeout(2000);

  const click = async (finder, label) => {
    const p = await page.evaluate(finder);
    if (!p) throw new Error(`не найдено: ${label}`);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(4500);
  };

  await click(() => {
    const el = [...document.querySelectorAll('.tp-record-ui__button')].find((e) => (e.innerText || '').trim() === 'Контент');
    if (!el) return null; const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, 'панель «Контент»');

  await click(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 40 && r.height > 20; };
    const el = [...document.querySelectorAll('div,button,a,span')].filter(vis)
      .find((e) => (e.innerText || '').trim().toUpperCase() === 'ПОЛЯ ДЛЯ ВВОДА');
    if (!el) return null; const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, 'раздел «ПОЛЯ ДЛЯ ВВОДА»');

  // Строки полей: «#1 ИМЯ Your Name», «#2 …»
  const rows = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 40 && r.height > 16; };
    return [...document.querySelectorAll('div,li,button')].filter(vis)
      .map((e) => ({ t: (e.innerText || '').replace(/\s+/g, ' ').trim(), y: Math.round(e.getBoundingClientRect().top), x: Math.round(e.getBoundingClientRect().left + 60) }))
      .filter((e) => /^#\d+\s/.test(e.t) && e.t.length < 60)
      .filter((e, i, a) => a.findIndex((z) => z.t === e.t) === i);
  });
  console.log('поля формы заказа:');
  rows.forEach((r) => console.log(`   ${r.t}`));
  if (!rows.length) { console.log('  строк полей не видно'); return; }

  // Аккордеон: поле №1 раскрыто сразу, остальные открываем шевроном справа.
  const uniq = rows.filter((r) => /^#\d+ [А-ЯЁA-Z]/.test(r.t) && !/Дублировать/.test(r.t));
  const changes = [];
  const readTitle = () => page.evaluate(() => {
    const el = [...document.querySelectorAll('input[name="li_title"]')].find((f) => f.offsetParent !== null);
    return el ? el.value : null;
  });
  const setTitle = (v) => page.evaluate((val) => {
    const el = [...document.querySelectorAll('input[name="li_title"]')].find((f) => f.offsetParent !== null);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, v);

  for (let i = 0; i < uniq.length; i++) {
    const num = uniq[i].t.match(/^#(\d+)/)[1];
    if (i > 0) {
      // раскрыть нужное поле кликом по его строке (шеврон справа)
      const opened = await page.evaluate((n) => {
        const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 40 && r.height > 16; };
        // Берём САМУЮ УЗКУЮ строку с этим номером: широкие совпадения — это
        // контейнеры вместе с тулбаром, клик по ним ничего не раскрывает.
        const rows = [...document.querySelectorAll('div,li')].filter(vis)
          .filter((e) => new RegExp(`^#${n} `).test((e.innerText || '').replace(/\s+/g, ' ').trim()))
          .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height);
        const row = rows[0];
        if (!row) return null;
        // Строки лежат ниже видимой области панели — без прокрутки клик уходит
        // мимо окна (ловил y≈1500 при высоте 1000) и ничего не раскрывает.
        row.scrollIntoView({ block: 'center' });
        const rr = row.getBoundingClientRect();
        // Шеврон — последний маленький кликабельный элемент справа в строке.
        const icons = [...row.querySelectorAll('svg,i,span,button,div')]
          .map((e) => ({ e, r: e.getBoundingClientRect() }))
          .filter((o) => o.r.width > 6 && o.r.width < 34 && o.r.height > 6 && o.r.height < 34 && o.r.right > rr.right - 60);
        if (icons.length) {
          const t = icons[icons.length - 1].r;
          return { x: Math.round(t.left + t.width / 2), y: Math.round(t.top + t.height / 2), via: 'шеврон' };
        }
        return { x: Math.round(rr.right - 20), y: Math.round(rr.top + rr.height / 2), via: 'край строки' };
      }, num);
      if (opened) console.log(`   #${num}: раскрываю через ${opened.via} @${opened.x},${opened.y}`);
      if (!opened) { console.log(`   #${num}: строка не найдена`); continue; }
      await page.mouse.click(opened.x, opened.y);
      await page.waitForTimeout(3000);
    }
    const cur = await readTitle();
    if (cur == null) { console.log(`   #${num}: заголовок не открылся`); continue; }
    const to = RU[cur.trim()];
    console.log(`   #${num}: «${cur}»${to ? ` → «${to}»` : ' (перевод не нужен)'}`);
    if (APPLY && to && to !== cur) { await setTitle(to); changes.push({ from: cur, to }); await pace(400, 900); }
  }

  for (const row of []) {
    // Строки — аккордеон: одно поле уже раскрыто, и клик по нему сворачивает.
    // Поэтому кликаем и, если заголовка не видно, кликаем ещё раз.
    const readTitle = () => page.evaluate(() => {
      const el = [...document.querySelectorAll('input[name="li_title"]')].find((f) => f.offsetParent !== null);
      return el ? el.value : null;
    });
    let cur = null;
    for (let attempt = 0; attempt < 2 && cur == null; attempt++) {
      await page.mouse.click(row.x, row.y + 12);
      await page.waitForTimeout(2500);
      cur = await readTitle();
    }
    if (cur == null) { console.log(`   ${row.t}: поле заголовка не открылось`); continue; }
    const to = RU[cur.trim()];
    console.log(`   ${row.t}: «${cur}»${to ? ` → «${to}»` : ' (перевод не нужен)'}`);
    if (APPLY && to && to !== cur) {
      await page.evaluate((v) => {
        const el = [...document.querySelectorAll('input[name="li_title"]')].find((f) => f.offsetParent !== null);
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, to);
      changes.push({ from: cur, to });
      await pace(400, 900);
    }
    // свернуть обратно
    await page.mouse.click(row.x, row.y + 12);
    await page.waitForTimeout(1200);
  }

  if (!APPLY) { console.log('\n  прогон без записи. Применить: --apply'); return; }
  if (!changes.length) { console.log('\n  нечего менять.'); return; }

  await pace();
  const saved = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 10 && r.height > 10; };
    const b = [...document.querySelectorAll('button,a,div')].filter(vis)
      .find((e) => /^(Сохранить и закрыть|Cохранить и закрыть)$/.test((e.innerText || '').trim()));
    if (!b) return false; b.click(); return true;
  });
  console.log('\n  «Сохранить и закрыть»:', saved);
  await page.waitForTimeout(7000);
  console.log('  publish header:', await publishPage(page, PAGE).catch((e) => String(e).slice(0, 40)));
  console.log('  переведено:', changes.map((c) => `${c.from}→${c.to}`).join(', '));
});
