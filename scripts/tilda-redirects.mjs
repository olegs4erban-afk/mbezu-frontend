// ─────────────────────────────────────────────────────────────
// tilda-redirects.mjs (Sprint 15, Ф3.4) — 301 на уровне сайта.
//   /projects/redirect-https-www/ — HTTP→HTTPS и WWW→без WWW
//   /projects/redirects/          — постраничные 301 (url_from → url_to)
// APPLY=0 — только показать текущее состояние.
// ─────────────────────────────────────────────────────────────
import { withSession, pace, PROJECTID } from './tilda-session.mjs';

const APPLY = process.env.APPLY !== '0';
// постраничные редиректы: [откуда, куда]. Без домена.
const PAGE_REDIRECTS = (process.env.REDIRECTS || '/tracking>/').split(',')
  .map((p) => p.split('>').map((s) => s.trim())).filter((p) => p.length === 2 && p[0]);

await withSession(async ({ page }) => {
  // ── 1. HTTP→HTTPS, WWW→без WWW ──
  await page.goto(`https://tilda.ru/projects/redirect-https-www/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const state = await page.evaluate(() => ({
    радио: [...document.querySelectorAll('input[type=radio],input[type=checkbox]')].map((r) => ({
      name: r.name, val: r.value, checked: r.checked,
      подпись: (r.closest('label')?.innerText || r.parentElement?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 70),
    })),
    select: [...document.querySelectorAll('select')].map((s) => ({
      name: s.name, val: s.value,
      опции: [...s.options].map((o) => `${o.value}=${o.text.replace(/\s+/g, ' ').trim().slice(0, 40)}`),
    })),
    текст: (document.body.innerText || '').replace(/\s+/g, ' ').slice(200, 800),
  }));
  console.log('  ДО — переключатели:');
  for (const r of state.радио) console.log(`   ${r.checked ? '[x]' : '[ ]'} ${r.name}=${r.val} · ${r.подпись}`);
  for (const s of state.select) console.log(`   select ${s.name}=${s.val} · ${s.опции.join(' | ')}`);
  if (!state.радио.length && !state.select.length) console.log('   (переключателей не найдено) текст:', state.текст.slice(0, 300));

  if (APPLY) {
    // Выбираем радио по ТОЧНОМУ value — надёжнее, чем по тексту подписи:
    //   redirect_httptohttps — «Редирект с HTTP на HTTPS»
    //   redirect_wwwtodom    — «Редирект с WWW на основной домен» (нам нужно без www)
    const res = await page.evaluate(() => {
      const out = [];
      for (const v of ['redirect_httptohttps', 'redirect_wwwtodom']) {
        const el = document.querySelector(`input[type=radio][value="${v}"]`);
        if (!el) { out.push(`НЕТ радио ${v}`); continue; }
        if (el.checked) { out.push(`${v}: уже выбран`); continue; }
        el.click();
        out.push(`${v}: выбран=${el.checked}`);
      }
      // ⚠️ Кнопка подписана «Cохранить» с ЛАТИНСКОЙ C — поиск по кириллическому «сохран»
      // её не находит. Ищем по обработчику redic_save_protocols() — он однозначен.
      const btn = [...document.querySelectorAll('[onclick]')]
        .find((e) => /redic_save_protocols/.test(e.getAttribute('onclick') || ''));
      if (btn) { btn.click(); out.push('нажато: Cохранить (redic_save_protocols)'); }
      else if (typeof window.redic_save_protocols === 'function') { window.redic_save_protocols(); out.push('вызвано redic_save_protocols()'); }
      else out.push('кнопка сохранения не найдена');
      return out;
    });
    console.log('  действия:', JSON.stringify(res));
    await page.waitForTimeout(6000);
  }

  // ── 2. постраничные 301 ──
  await page.goto(`https://tilda.ru/projects/redirects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const existing = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' '));
  for (const [from, to] of PAGE_REDIRECTS) {
    if (existing.includes(from + ' ')) { console.log(`  301 ${from} → уже есть, пропуск`); continue; }
    if (!APPLY) { console.log(`  301 ${from} → ${to} (APPLY=0, не добавляю)`); continue; }
    const r = await page.evaluate(({ from, to }) => {
      const f = document.querySelector('input[name="url_from"]');
      const t = document.querySelector('input[name="url_to"]');
      if (!f || !t) return 'поля не найдены';
      for (const [el, v] of [[f, from], [t, to]]) {
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const btn = [...document.querySelectorAll('button,a,div,input[type=submit],input[type=button]')]
        .filter((e) => e.offsetParent !== null)
        .find((e) => /^добавить$/i.test((e.innerText || e.value || '').trim()));
      if (!btn) return 'кнопка «Добавить» не найдена';
      btn.click();
      return 'добавлено';
    }, { from, to });
    console.log(`  301 ${from} → ${to}: ${r}`);
    await pace(2500, 3500);
  }

  // «Добавить» только рисует строку в списке; персистит отдельная кнопка «Cохранить»
  // (снова с ЛАТИНСКОЙ C) → обработчик redic_save(). Без неё правки теряются.
  if (APPLY) {
    const saved = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('[onclick]')].find((e) => /redic_save\s*\(/.test(e.getAttribute('onclick') || ''));
      if (btn) { btn.click(); return 'нажато: Cохранить (redic_save)'; }
      if (typeof window.redic_save === 'function') { window.redic_save(); return 'вызвано redic_save()'; }
      return 'кнопка сохранения не найдена';
    });
    console.log('  сохранение списка:', saved);
    await page.waitForTimeout(6000);
  }

  // факт: перечитываем страницу и смотрим строки списка
  await page.goto(`https://tilda.ru/projects/redirects/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const rows = await page.evaluate(() => {
    const froms = [...document.querySelectorAll('input[name="url_from"]')].map((i) => i.value).filter(Boolean);
    const tos = [...document.querySelectorAll('input[name="url_to"]')].map((i) => i.value).filter(Boolean);
    return froms.map((f, i) => `${f} → ${tos[i] ?? '?'}`);
  });
  console.log('  список 301 после сохранения:', JSON.stringify(rows));
});
