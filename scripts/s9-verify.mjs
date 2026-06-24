import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://cdn.mbezu.ru';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 1400 } });
const out = {};
// CATALOG
{
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0,90)); });
  await p.goto(BASE + '/catalog', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
  await p.waitForTimeout(2500);
  out.catalog = await p.evaluate(() => {
    const root = document.getElementById('root');
    const cards = [...document.querySelectorAll('article')];
    const imgWraps = [...document.querySelectorAll('.art-card-img')];
    // squareness of first few card image wrappers
    const ratios = imgWraps.slice(0,6).map(e => { const r = e.getBoundingClientRect(); return +(r.width/r.height).toFixed(2); });
    const nav = (document.querySelector('header')?.innerText || document.body.innerText.slice(0,400)).replace(/\s+/g,' ');
    const txt = document.body.innerText;
    return {
      rootKids: root ? root.children.length : 0,
      cardCount: cards.length,
      artCardImgs: imgWraps.length,
      squareRatios: ratios,
      hasShtorm: /Шторм/.test(txt),
      hasCatalogCrumb: /M\.BEZ\s*\/\s*Каталог/i.test(txt.replace(/\s+/g,' ')) || /Каталог/.test(txt),
      navHasArtist: /Художниц/i.test(nav), navHasCatalog: /Каталог/i.test(nav), navHasCart: /Корзин/i.test(nav),
      total21: /всего · 21 работ/.test(txt.replace(/\s+/g,' ')),
    };
  });
  out.catalog.consoleErrors = errs;
  await p.close();
}
// ABOUT
{
  const p = await ctx.newPage();
  await p.goto(BASE + '/about', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
  await p.waitForTimeout(2000);
  out.about = await p.evaluate(() => {
    const img = [...document.querySelectorAll('img')].find(i => /about-author/.test(i.src));
    return { hasAuthorImg: !!img, authorLoaded: img ? img.naturalWidth > 0 : false, src: img ? img.src : null, placeholderGone: !/будет добавлен/.test(document.body.innerText) };
  });
  await p.close();
}
console.log(JSON.stringify(out, null, 1));
await b.close();
