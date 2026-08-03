// АВАРИЙНЫЙ ОТКАТ head-кода сайта из backup/tilda-head-before.html.
// Причина: после удаления react/react-dom UMD витрина перестала монтироваться —
// главная отдавала пустую страницу. Сначала возвращаем рабочее состояние,
// разбираемся потом.
import { readFileSync } from 'node:fs';
import { withSession, PROJECTID, publishPage, pace } from './tilda-session.mjs';

const SRC = readFileSync('backup/tilda-head-before.html', 'utf8');
console.log(`восстанавливаем head из снапшота: ${SRC.length} симв.`);

const openEditor = async (page) => {
  await page.goto(`https://tilda.ru/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((e) => (e.innerText || '').trim() === 'Вставка кода');
    b && b.click();
  });
  await page.waitForTimeout(4000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button,a')].filter((e) => /редактировать код/i.test(e.innerText || ''))[0];
    b && b.click();
  });
  await page.waitForTimeout(5000);
  return page.evaluate(() => (document.querySelector('textarea[name="headcode"]') || {}).value || '');
};

await withSession(async ({ page }) => {
  const now = await openEditor(page);
  console.log('сейчас в админке:', now.length, 'симв.');

  await page.evaluate((v) => {
    const host = document.querySelector('.ace_editor');
    if (window.ace && host) { try { window.ace.edit(host).setValue(v, -1); } catch { /* ниже textarea */ } }
    const ta = document.querySelector('textarea[name="headcode"]');
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, v);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, SRC);

  await pace();
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].filter((e) => e.offsetParent !== null)
      .find((e) => /^(Сохранить|Cохранить)$/.test((e.innerText || '').trim()));
    if (!b) return false;
    b.click();
    return true;
  });
  console.log('«Сохранить» нажата:', clicked);
  await page.waitForTimeout(7000);

  const after = await openEditor(page);
  console.log('после сверки:', after.length, 'симв. | unpkg вернулся:', after.includes('unpkg.com'));

  // Перепубликация страниц, которые должны быть опубликованы.
  const PAGES = ['142947296', '142948046', '142948406', '142949736', '142950726', '142949956', '143102566'];
  for (const id of PAGES) {
    await pace();
    const r = await publishPage(page, id).catch((e) => String(e).slice(0, 40));
    console.log(`   publish ${id}: ${r}`);
  }
});
