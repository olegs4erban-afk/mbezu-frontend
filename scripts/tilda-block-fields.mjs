// ─────────────────────────────────────────────────────────────
// tilda-block-fields.mjs — правка полей блока в редакторе Tilda.
//
// Как устроен путь (нашёл скриншотами, Sprint 15):
//   навести мышь на блок → в панели блока кнопка «Настройки»
//   (ИМЕННО .tp-record-ui__button — одноимённая кнопка в шапке редактора
//   открывает настройки СТРАНИЦЫ, на этом уже обжёгся)
//   → слева выезжает панель с раскрывающимися разделами:
//     ШАПКА БЛОКА · КАРТОЧКИ · КНОПКИ · ТИПОГРАФИКА · POP-UP ·
//     СЕКЦИЯ «СМОТРИТЕ ТАКЖЕ» · СТИЛЬ ГАЛЕРЕИ · ОТМЕТКИ SALE/NEW ·
//     АНИМАЦИЯ · ФИЛЬТРЫ & РАЗДЕЛЫ
//   → внутри раздела лежат текстовые поля с английскими подписями
//   → «Сохранить и закрыть».
//
//   node scripts/tilda-block-fields.mjs               — показать разделы и поля
//   node scripts/tilda-block-fields.mjs --apply       — применить замены REPLACE
// ─────────────────────────────────────────────────────────────
import { withSession, PROJECTID, pace, publishPage } from './tilda-session.mjs';

const APPLY = process.argv.includes('--apply');
const PAGE = process.env.EDIT_PAGE || '142948046';
const REC = process.env.EDIT_REC || '2291453131';
const SECTIONS = (process.env.EDIT_SECTIONS || 'ШАПКА БЛОКА,КАРТОЧКИ,КНОПКИ,ТИПОГРАФИКА,POP-UP,СЕКЦИЯ «СМОТРИТЕ ТАКЖЕ»,ФИЛЬТРЫ & РАЗДЕЛЫ').split(',');

// Что на что меняем (точное совпадение значения поля).
const REPLACE = {
  'BUY NOW': 'Купить',
  'Buy now': 'Купить',
  'More products': 'Все работы',
  'Load more': 'Показать ещё',
  'Your Name': 'Имя',
  'Your Email': 'Email',
  'Your Phone': 'Телефон',
  'Checkout': 'Оформить заказ',
  'Total': 'Итого',
  'Cart': 'Корзина',
};

const openBlockSettings = async (page) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(`https://tilda.ru/page/?pageid=${PAGE}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(11000);

  const box = await page.evaluate((rec) => {
    const el = document.querySelector(`#rec${rec}, #record${rec}`);
    if (!el) return null;
    el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -120);
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 60) };
  }, REC);
  if (!box) throw new Error(`блок rec${REC} не найден на странице ${PAGE}`);
  await page.mouse.move(box.x, box.y);
  await page.waitForTimeout(2000);

  const btn = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 10 && r.height > 10; };
    const el = [...document.querySelectorAll('.tp-record-ui__button')].filter(vis)
      .find((e) => (e.innerText || '').trim() === 'Настройки');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  if (!btn) throw new Error('кнопка «Настройки» в панели блока не найдена');
  await page.mouse.click(btn.x, btn.y);
  await page.waitForTimeout(5000);
};

await withSession(async ({ page }) => {
  await openBlockSettings(page);

  const found = [];
  for (const secRaw of SECTIONS) {
    const sec = secRaw.trim();
    const opened = await page.evaluate((label) => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 10 && r.height > 10; };
      const el = [...document.querySelectorAll('div,button,a,span')].filter(vis)
        .find((e) => (e.innerText || '').trim().toUpperCase() === label.toUpperCase() && e.getBoundingClientRect().left < 340);
      if (!el) return false;
      el.click();
      return true;
    }, sec);
    if (!opened) { console.log(`  раздел «${sec}» не найден`); continue; }
    await page.waitForTimeout(2500);

    const fields = await page.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left < 900; };
      return [...document.querySelectorAll('input[type=text],textarea')].filter(vis)
        .map((f) => ({ name: f.name || f.id || '', val: String(f.value || ''), ph: String(f.placeholder || '') }));
    });
    // Английские подписи лежат НЕ в значениях: поля пустые, а Tilda рисует
    // дефолт из placeholder. Поэтому ловим и по значению, и по placeholder
    // пустого поля — русификация здесь означает «заполнить пустое поле».
    const hits = fields.filter((f) => REPLACE[f.val.trim()] || (!f.val.trim() && REPLACE[f.ph.trim()]));
    console.log(`\n▸ ${sec}: полей ${fields.length}, под замену ${hits.length}`);
    fields.slice(0, 14).forEach((f) => console.log(`     ${(f.name || '—').padEnd(22)} знач=«${f.val.slice(0, 26)}» деф=«${f.ph.slice(0, 26)}»`));

    if (APPLY && hits.length) {
      for (const h of hits) {
        const to = REPLACE[h.val.trim()] || REPLACE[h.ph.trim()];
        await page.evaluate(({ name, to }) => {
          const el = [...document.querySelectorAll('input[type=text],textarea')]
            .find((f) => (f.name || f.id) === name);
          if (!el) return;
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, to);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, { name: h.name, to });
        console.log(`     ✎ ${h.name}: «${h.val || h.ph}» → «${to}»`);
        found.push({ sec, name: h.name, from: h.val, to });
        await pace(400, 800);
      }
    }
    // закрыть раздел, чтобы поля следующего не смешивались
    await page.evaluate((label) => {
      const el = [...document.querySelectorAll('div,button,a,span')]
        .find((e) => (e.innerText || '').trim().toUpperCase() === label.toUpperCase() && e.getBoundingClientRect().left < 340);
      el && el.click();
    }, sec);
    await page.waitForTimeout(1200);
  }

  if (!APPLY) { console.log('\n  прогон без записи. Применить: --apply'); return; }
  if (!found.length) { console.log('\n  нечего менять.'); return; }

  await pace();
  const saved = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 10 && r.height > 10; };
    const b = [...document.querySelectorAll('button,a,div')].filter(vis)
      .find((e) => /^(Сохранить и закрыть|Cохранить и закрыть)$/.test((e.innerText || '').trim()));
    if (!b) return false;
    b.click();
    return true;
  });
  console.log('\n  «Сохранить и закрыть»:', saved);
  await page.waitForTimeout(7000);

  const pub = await publishPage(page, PAGE).catch((e) => String(e).slice(0, 50));
  console.log('  publish:', pub);
  console.log('  заменено полей:', found.length);
});
