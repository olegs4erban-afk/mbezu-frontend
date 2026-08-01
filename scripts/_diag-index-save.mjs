// Что шлёт Tilda при смене «Главная страница» — перехват POST + поиск верной кнопки.
import { withSession, PROJECTID } from './tilda-session.mjs';

await withSession(async ({ page }) => {
  const posts = [];
  page.on('request', (r) => {
    if (r.method() !== 'POST') return;
    const d = r.postData() || '';
    posts.push({ url: r.url().replace(/^https?:\/\/[^/]+/, ''), comm: (d.match(/(?:^|&)comm=([^&]*)/) || [])[1] || '', есть_indexpageid: /indexpageid=/.test(d), bytes: d.length });
  });

  await page.goto(`https://tilda.ru/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,div,li,button')].filter((e) => e.offsetParent !== null)
      .find((e) => /^главная страница$/i.test((e.innerText || '').trim()));
    el && el.click();
  });
  await page.waitForTimeout(4000);

  const btns = await page.evaluate(() => [...document.querySelectorAll('button,a,div,input[type=button],input[type=submit]')]
    .filter((e) => e.offsetParent !== null && /охранит|Save/i.test(e.innerText || e.value || ''))
    .map((e) => ({ t: (e.innerText || e.value || '').trim().slice(0, 30), cls: String(e.className).slice(0, 50), onclick: String(e.getAttribute('onclick') || '').slice(0, 60) })));
  console.log('кнопки сохранения на экране:', JSON.stringify(btns, null, 1));

  posts.length = 0;
  const r = await page.evaluate(() => {
    const s = document.querySelector('select[name="indexpageid"]');
    s.value = '142947296';
    s.dispatchEvent(new Event('change', { bubbles: true }));
    const btn = document.querySelector('.js-ps-popup-submit');
    return { выбрано: s.value, есть_js_ps_popup_submit: !!btn };
  });
  console.log('после выбора:', JSON.stringify(r));
  await page.waitForTimeout(3000);
  console.log('POST после change:', JSON.stringify(posts));

  posts.length = 0;
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button,a,div,input[type=button],input[type=submit]')]
      .filter((e) => e.offsetParent !== null)
      .find((e) => /охранит/.test(e.innerText || e.value || '') && (e.innerText || e.value || '').trim().length < 30);
    if (!btn) return 'кнопка не найдена';
    btn.click();
    return `нажата «${(btn.innerText || btn.value).trim()}» cls=${String(btn.className).slice(0, 40)}`;
  });
  console.log('сохранение:', clicked);
  await page.waitForTimeout(6000);
  console.log('POST после сохранения:', JSON.stringify(posts, null, 1));

  // факт
  await page.goto(`https://tilda.ru/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,div,li,button')].filter((e) => e.offsetParent !== null)
      .find((e) => /^главная страница$/i.test((e.innerText || '').trim()));
    el && el.click();
  });
  await page.waitForTimeout(4000);
  console.log('indexpageid после перезагрузки:', await page.evaluate(() => document.querySelector('select[name="indexpageid"]')?.value));
});
