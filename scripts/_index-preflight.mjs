// READ-ONLY предполётная проверка перед сменой индексной страницы (Ф3.3).
// 1) совпадает ли контейнер 142947296 с актуальной главной (out/containers/home.html)
// 2) где в настройках задаётся главная страница
import { readFileSync } from 'node:fs';
import { withSession, PROJECTID } from './tilda-session.mjs';

const target = readFileSync('out/containers/home.html', 'utf-8');

const readContainer = (page, recordId) => page.evaluate(async (rid) => {
  try { if (typeof window.edrec__editRecordContent === 'function') window.edrec__editRecordContent(rid); } catch { /* */ }
  for (let i = 0; i < 80; i++) {
    const t = document.querySelector('textarea[name="code"]');
    if (t && t.value && t.value.length > 30) return t.value;
    await new Promise((r) => setTimeout(r, 250));
  }
  return document.querySelector('textarea[name="code"]')?.value ?? null;
}, String(recordId));

await withSession(async ({ page }) => {
  for (const [pid, rid, label] of [[142947296, 2337252301, '/home (кандидат в индексные)'], [140814006, 2257585841, 'текущая индексная']]) {
    await page.goto(`https://tilda.ru/page/?pageid=${pid}&projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4500);
    const c = await readContainer(page, rid);
    console.log(`  ${String(pid).padEnd(10)} ${label.padEnd(28)} блок=${c ? Math.round(c.length / 1024) + 'KB' : 'НЕТ'} · совпадает с out/containers/home.html: ${c ? (c.trim() === target.trim()) : '—'}`);
  }

  await page.goto(`https://tilda.ru/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('a,div,li,button')].filter((e) => e.offsetParent !== null)
      .find((e) => /^главная страница$/i.test((e.innerText || '').trim()));
    el && el.click();
  });
  await page.waitForTimeout(4500);
  const d = await page.evaluate(() => ({
    поля: [...document.querySelectorAll('select[name], input[name]')].filter((f) => f.offsetParent !== null)
      .map((f) => ({ name: f.name, type: f.type || f.tagName, val: String(f.value || '').slice(0, 40),
        опции: f.tagName === 'SELECT' ? [...f.options].map((o) => `${o.value}=${o.text.trim().slice(0, 40)}`).slice(0, 12) : undefined })),
    текст: (document.body.innerText || '').replace(/\s+/g, ' ').slice(400, 900),
    кнопки: [...document.querySelectorAll('[onclick]')].filter((e) => e.offsetParent !== null)
      .map((e) => ({ t: (e.innerText || '').trim().slice(0, 20), onclick: String(e.getAttribute('onclick')).slice(0, 50) })).slice(0, 8),
  }));
  console.log('\n  «Главная страница» — поля:');
  for (const f of d.поля) console.log('   ', JSON.stringify(f));
  console.log('  кнопки:', JSON.stringify(d.кнопки));
  console.log('  текст:', d.текст.slice(0, 350));
});
