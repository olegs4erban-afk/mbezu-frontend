// ─────────────────────────────────────────────────────────────
// tilda-site-seo.mjs (Sprint 15, Ф3.1/3.2/3.5) — настройки УРОВНЯ САЙТА.
//
// Почему это отдельно от tilda-push: canonical/sitemap/robots берут схему НЕ из полей
// страницы, а из галочки «Использовать схему HTTPS…» в Настройках сайта → SEO.
// Она снята — отсюда http:// во всех трёх местах сразу. Там же живёт название сайта
// (оно уходит в og:site_name, сейчас «M.Bez»).
//
// Сохраняем не самодельным POST, а РОДНОЙ кнопкой «Сохранить изменения»: форма
// настроек большая, ручной payload рискует затереть соседние поля.
// APPLY=0 — только показать текущее состояние.
// ─────────────────────────────────────────────────────────────
import { withSession, pace, PROJECTID } from './tilda-session.mjs';

const APPLY = process.env.APPLY !== '0';
const SITE_NAME = 'MBezu';

const openTab = async (page, rx) => {
  await page.evaluate((src) => {
    const re = new RegExp(src, 'i');
    const el = [...document.querySelectorAll('a,div,li,button')]
      .filter((e) => e.offsetParent !== null)
      .find((e) => re.test((e.innerText || '').trim()) && (e.innerText || '').trim().length < 45);
    el && el.click();
  }, rx);
  await page.waitForTimeout(3500);
};

const readState = (page) => page.evaluate(() => {
  const cb = (n) => document.querySelector(`input[type=checkbox][name="${n}"]`);
  const nameInput = [...document.querySelectorAll('input[type=text][name], input:not([type])[name]')]
    .find((i) => /title|sitename|name/i.test(i.name) && i.offsetParent !== null);
  return {
    https: cb('https')?.checked ?? null,
    www: cb('wwwsubdomain')?.checked ?? null,
    nosearch: cb('nosearch')?.checked ?? null,
    имяПоля: nameInput?.name || null,
    названиеСайта: nameInput?.value || null,
  };
});

await withSession(async ({ page }) => {
  await page.goto(`https://tilda.ru/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  await openTab(page, '^SEO$');
  const before = await readState(page);
  console.log('  ДО:', JSON.stringify(before));

  if (!APPLY) { console.log('  APPLY=0 — только чтение'); return; }

  if (before.https !== true) {
    const clicked = await page.evaluate(() => {
      const c = document.querySelector('input[type=checkbox][name="https"]');
      if (!c || c.checked) return false;
      c.click(); // клик, а не .checked = true — Tilda вешает обработчики
      return c.checked;
    });
    console.log(`  галочка HTTPS выставлена: ${clicked}`);
    await pace();
    const saved = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button,a,div,input[type=button],input[type=submit]')]
        .filter((e) => e.offsetParent !== null)
        .find((e) => /^сохранить изменения$/i.test((e.innerText || e.value || '').trim()));
      if (!btn) return 'кнопка не найдена';
      btn.click();
      return 'нажата';
    });
    console.log(`  «Сохранить изменения»: ${saved}`);
    await page.waitForTimeout(7000);
  } else {
    console.log('  HTTPS уже включён');
  }

  // перечитываем после перезагрузки — факт, а не отсутствие ошибки
  await page.goto(`https://tilda.ru/projects/settings/?projectid=${PROJECTID}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await openTab(page, '^SEO$');
  const after = await readState(page);
  console.log('  ПОСЛЕ:', JSON.stringify(after));
  if (after.https !== true) { console.error('\n  ✗ Галочка HTTPS не сохранилась\n'); process.exit(1); }
  console.log('\n  ✓ HTTPS включён в настройках сайта (canonical/sitemap/robots должны стать https)\n');
});
