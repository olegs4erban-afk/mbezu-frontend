// ─────────────────────────────────────────────────────────────
// tilda-session.mjs (Sprint 15, Ф1.1) — одна живая сессия вместо логина на каждый прогон.
//
// Причина капчи в Sprint 14: каждый скрипт логинился заново. Лечится сохранением
// сессии — но НЕ через storageState:
//   • storageState кладёт в файл в т.ч. PHPSESSID — сессионную cookie, которую
//     сервер убивает при закрытии браузера. При следующем запуске мы предъявляем
//     мёртвый PHPSESSID, и Tilda отправляет на /login/ (проверено: редирект-цепочка
//     /projects/ → detectdomain → /login/, редактор отвечает «Авторизуйтесь»).
//   • launchPersistentContext хранит ПОЛНЫЙ профиль браузера в папке, как у живого
//     пользователя: cookie, localStorage, IndexedDB. Сессия переживает перезапуск.
//
// Проверка «залогинены ли» идёт по РЕАЛЬНОЙ рабочей поверхности — редактору страницы,
// а не по /projects/ (тот уходит в бесконечный редирект через detectdomain даже
// у авторизованного пользователя и даёт ложный «протух»).
//
// Вход руками (раз в несколько недель):  npm run tilda:login
// ─────────────────────────────────────────────────────────────
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const PROFILE = process.env.TILDA_PROFILE || '.secrets/tilda-profile';
export const PROJECTID = process.env.TILDA_PROJECT || '13712449';
/** Страница-пробник: открываем её редактор только для проверки доступа (ничего не меняем). */
const PROBE_PAGEID = process.env.TILDA_PROBE || '142950726'; // legal

/** Пауза между действиями в админке: гонка запросов = новая капча. 1,5–3 с. */
export const pace = (min = 1500, max = 3000) =>
  new Promise((r) => setTimeout(r, Math.round(min + Math.random() * (max - min))));

const editorUrl = (pageid) => `https://tilda.ru/page/?pageid=${pageid}&projectid=${PROJECTID}`;

/** Пускает ли Tilda в редактор — единственный надёжный признак живой сессии. */
export async function checkAccess(page) {
  await page.goto(editorUrl(PROBE_PAGEID), { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(4000);
  return page.evaluate(() => {
    const t = document.body?.innerText || '';
    if (/Авторизуйтесь|Эл\. почта\s+Пароль/i.test(t)) return false;
    if (/\/login\//.test(location.href)) return false;
    return !!document.querySelector('[data-record-type], #allrecords, .js-page-settings, #formpageedit')
      || /Настройки страницы/i.test(t);
  });
}

/**
 * Открывает браузер с сохранённым профилем.
 * headless по умолчанию; TILDA_HEADED=1 — окно (нужно для ручного входа).
 * Автологин намеренно НЕ делается: именно он вызывал reCAPTCHA, а блокировка
 * аккаунта с боевым магазином недопустима.
 */
export async function openSession({ headed = !!process.env.TILDA_HEADED } = {}) {
  fs.mkdirSync(PROFILE, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: !headed,
    viewport: { width: 1500, height: 1000 },
    locale: 'ru-RU',
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());

  if (!(await checkAccess(page))) {
    if (!headed) {
      console.error(
        `\n  СЕССИЯ НЕ АКТИВНА (профиль ${PROFILE}).\n` +
        '  Войди один раз руками:  npm run tilda:login\n' +
        '  (автологин намеренно не делается — он и вызывал reCAPTCHA)\n',
      );
      await ctx.close();
      process.exit(2);
    }
    await manualLogin(page);
  }
  // единый интерфейс: browser.close() закрывает персистентный контекст
  return { browser: { close: () => ctx.close() }, ctx, page };
}

/** Ручной вход в открытом окне: ждём, пока откроется доступ к редактору. */
async function manualLogin(page) {
  await page.goto('https://tilda.ru/login/', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  console.log('\n  Открылось окно Tilda. Войди в аккаунт (логин, пароль, капча если попросят).');
  console.log('  Если есть галочка «запомнить меня» — поставь.');
  console.log('  Скрипт сам поймёт, что доступ появился, и закроет окно.\n');
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(3000);
    const url = page.url();
    if (/\/login\//.test(url)) continue;         // ещё на форме входа
    if (await checkAccess(page)) {
      console.log(`  ✓ Доступ к редактору подтверждён. Профиль сохранён: ${PROFILE}`);
      console.log('  Дальше прогоны идут без логина и без капчи. Папка в .gitignore.\n');
      return true;
    }
  }
  throw new Error('login-timeout: за 10 минут доступ не появился');
}

/** Обёртка: открыть сессию, выполнить работу, гарантированно закрыть браузер. */
export async function withSession(fn, opts) {
  const s = await openSession(opts);
  try {
    return await fn(s);
  } finally {
    await s.browser.close();
  }
}

/** Публикация страницы (общий шаг для всех скриптов). */
export async function publishPage(page, pageid) {
  return page.evaluate(async ({ pageid, PROJECTID }) => {
    const r = await fetch('/page/publish/', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ pageid, projectid: PROJECTID }).toString(),
    });
    return r.status;
  }, { pageid: String(pageid), PROJECTID });
}

// ── CLI: npm run tilda:login / npm run tilda:check ───────────
const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const mode = process.argv[2] || 'check';
  const { browser } = await openSession({ headed: mode === 'login' || !!process.env.TILDA_HEADED });
  console.log(mode === 'login' ? '  ✓ Сессия активна.\n' : '  ✓ Сессия активна — деплой может работать.\n');
  await browser.close();
}
