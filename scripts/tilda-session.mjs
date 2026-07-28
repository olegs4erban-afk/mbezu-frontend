// ─────────────────────────────────────────────────────────────
// tilda-session.mjs (Sprint 15, Ф1.1) — одна сохранённая сессия вместо логина на каждый прогон.
//
// Причина: в Sprint 14 каждый скрипт логинился заново, и после серии входов Tilda
// включала reCAPTCHA — спринт вставал дважды. Playwright умеет сохранять cookie
// (storageState): вход руками один раз, дальше недели прогонов без капчи.
//
// Использование в скриптах:
//     import { withSession, pace } from './tilda-session.mjs';
//     await withSession(async ({ page }) => { … });   // сам закроет браузер
//
// Вход руками (раз в несколько недель, когда скрипт скажет «сессия протухла»):
//     TILDA_HEADED=1 npm run tilda:login
//
// ⚠️ .secrets/ в .gitignore. Файл сессии = доступ к аккаунту с боевым магазином.
// ─────────────────────────────────────────────────────────────
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const STATE = process.env.TILDA_STATE || '.secrets/tilda-session.json';
export const PROJECTID = process.env.TILDA_PROJECT || '13712449';
const HOME = 'https://tilda.ru/projects/';

/** Пауза между действиями в админке: гонка запросов = новая капча. 1.5–3 с. */
export const pace = (min = 1500, max = 3000) =>
  new Promise((r) => setTimeout(r, Math.round(min + Math.random() * (max - min))));

/** Залогинены ли мы: на /login/ Tilda редиректит неавторизованных. */
async function loggedIn(page) {
  const url = page.url();
  if (/\/login/.test(url)) return false;
  // «Мои сайты» / список проектов виден только авторизованному
  return await page.evaluate(() => !document.querySelector('input[name="password"]')).catch(() => false);
}

/**
 * Открывает браузер с сохранённой сессией.
 * headless по умолчанию; TILDA_HEADED=1 — окно (нужно для ручного входа).
 * Если сессии нет/протухла и мы headless — понятная ошибка + exit 2, БЕЗ автологина
 * (автологин и есть причина капчи; риск блокировки боевого аккаунта).
 */
export async function openSession({ headed = !!process.env.TILDA_HEADED } = {}) {
  const browser = await chromium.launch({ headless: !headed });
  const hasState = fs.existsSync(STATE);
  const ctx = hasState
    ? await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1000 } })
    : await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);

  if (!(await loggedIn(page))) {
    if (!headed) {
      console.error(
        `\n  СЕССИЯ ${hasState ? 'ПРОТУХЛА' : 'НЕ НАЙДЕНА'} (${STATE}).\n` +
        '  Войди один раз руками:  TILDA_HEADED=1 npm run tilda:login\n' +
        '  (автологин намеренно НЕ делается — именно он вызывал reCAPTCHA)\n',
      );
      await browser.close();
      process.exit(2);
    }
    await manualLogin(page, ctx);
  }
  return { browser, ctx, page };
}

/** Ручной вход в открытом окне: ждём, пока пользователь войдёт (в т.ч. пройдёт капчу). */
async function manualLogin(page, ctx) {
  console.log('\n  Открылось окно Tilda. Войди в аккаунт (логин, пароль, капча если попросят).');
  console.log('  Как только увидишь список сайтов — скрипт сам сохранит сессию.\n');
  const deadline = Date.now() + 10 * 60 * 1000; // 10 минут
  while (Date.now() < deadline) {
    await page.waitForTimeout(2000);
    if (await loggedIn(page)) {
      fs.mkdirSync(path.dirname(STATE), { recursive: true });
      await ctx.storageState({ path: STATE });
      console.log(`  ✓ Сессия сохранена: ${STATE}`);
      console.log('  Дальше прогоны идут без капчи. Файл в .gitignore — не коммитится.\n');
      return true;
    }
  }
  throw new Error('login-timeout: за 10 минут вход не завершён');
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

// ── CLI: npm run tilda:login / tilda:check ───────────────────
const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const mode = process.argv[2] || (process.env.TILDA_HEADED ? 'login' : 'check');
  if (mode === 'login') {
    const { browser, ctx, page } = await openSession({ headed: true });
    if (await loggedIn(page)) {
      fs.mkdirSync(path.dirname(STATE), { recursive: true });
      await ctx.storageState({ path: STATE });
      console.log(`  ✓ Сессия актуальна и сохранена: ${STATE}`);
    }
    await browser.close();
  } else {
    // проверка живости без окна — используется деплоем перед началом работы
    const { browser, page } = await openSession({ headed: false });
    console.log(`  ✓ Сессия жива (${page.url()})`);
    await browser.close();
  }
}
