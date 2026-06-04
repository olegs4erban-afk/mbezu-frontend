import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await (await b.newContext({viewport:{width:1366,height:1200}})).newPage();
await p.goto('https://mbezu.ru/catalog', { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
await p.waitForTimeout(6000); // Tilda Store products load async
const info = await p.evaluate(()=>{
  const cards = document.querySelectorAll('.t-store__card, .js-store-prod-all, [data-product-uid], .t951__card, .t-store__grid-cont > div');
  const prices = document.querySelectorAll('.t-store__card__price, .js-store-prod-price, [class*="price"]');
  const body = document.body.innerText||'';
  return {
    cardCount: cards.length, priceEls: prices.length,
    rub: (body.match(/₽/g)||[]).length, rubWord: (body.match(/руб/gi)||[]).length,
    hasStoreJs: !!document.querySelector('script[src*="store"], .t-store'),
    sample: body.slice(0, 400).replace(/\n+/g,' | '),
  };
});
console.log(JSON.stringify(info,null,1));
await b.close();
