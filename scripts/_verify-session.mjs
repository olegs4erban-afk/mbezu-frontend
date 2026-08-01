// Разовая проверка: открывается ли редактор /home (142947296) в headless-режиме,
// то есть ровно так, как будет ходить deploy. Ничего не меняет и не публикует.
import { withSession, PROJECTID } from './tilda-session.mjs';

const PAGEID = process.env.PAGEID || '142947296';

await withSession(async ({ page }) => {
  const url = `https://tilda.ru/page/?pageid=${PAGEID}&projectid=${PROJECTID}`;
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const r = await page.evaluate(() => {
    const t = document.body?.innerText || '';
    return {
      url: location.href,
      httpTitle: document.title.slice(0, 60),
      редиректНаЛогин: /\/login\//.test(location.href),
      естьФормаЛогина: !!document.querySelector('input[name="password"]'),
      просятАвторизоваться: /Авторизуйтесь/i.test(t),
      // признаки редактора
      блоковНаСтранице: document.querySelectorAll('[data-record-type]').length,
      естьНастройкиСтраницы: /Настройки страницы/i.test(t),
      естьКнопкаОпубликовать: /Опубликовать/i.test(t),
      первыеСлова: t.replace(/\s+/g, ' ').slice(0, 80),
    };
  });

  console.log(`  HTTP: ${resp?.status()}`);
  console.log(JSON.stringify(r, null, 1));

  const ok = !r.редиректНаЛогин && !r.естьФормаЛогина && !r.просятАвторизоваться
    && (r.блоковНаСтранице > 0 || r.естьНастройкиСтраницы);
  console.log(`\n  ${ok ? '✓ РЕДАКТОР ОТКРЫЛСЯ (сессия рабочая, headless)' : '✗ РЕДАКТОР НЕ ОТКРЫЛСЯ'}\n`);
  await page.screenshot({ path: 'audit/s15-editor-check.png' }).catch(() => {});
  if (!ok) process.exit(1);
});
