// Sprint 8 targeted live verify: gold token, transparent webp cards, new prices, commission price-list.
import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 1800 } });
const norm = (s) => (s || '').replace(/[\s  ]/g, '');

async function grab(url) {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const imgs = [...document.querySelectorAll('img')];
    const cards = imgs.filter((i) => /\/assets\/cards\//.test(i.currentSrc || i.src));
    const cardsLoaded = cards.filter((i) => i.complete && i.naturalWidth > 0);
    return {
      accent,
      cardCount: cards.length,
      cardsLoaded: cardsLoaded.length,
      sampleCard: cards[0] ? (cards[0].currentSrc || cards[0].src) : null,
      text: document.body.innerText || '',
    };
  });
  await page.close();
  return r;
}

const home = await grab('https://mbezu.ru/home');
const nh = norm(home.text);
console.log('== HOME ==');
console.log('  --accent =', JSON.stringify(home.accent), home.accent.toLowerCase() === '#a08a4e' ? 'OK gold' : 'XX expected #a08a4e');
console.log('  cards loaded =', home.cardsLoaded + '/' + home.cardCount, '| sample:', home.sampleCard);
console.log('  new prices present:', ['100000', '130000', '65000', '45000'].filter((p) => nh.includes(p + '₽') || nh.includes(p)).join(',') || 'none');
console.log('  OLD prices gone:', ['210000', '380000', '140000'].filter((p) => nh.includes(p)).length === 0 ? 'OK (none found)' : 'XX still: ' + ['210000', '380000', '140000'].filter((p) => nh.includes(p)).join(','));

const com = await grab('https://mbezu.ru/commission');
const nc = norm(com.text);
console.log('== COMMISSION ==');
console.log('  --accent =', JSON.stringify(com.accent), com.accent.toLowerCase() === '#a08a4e' ? 'OK gold' : 'XX');
const wants = ['Прайсназаказ', 'Малыйформат', 'Среднийформат', 'Большойформат', 'зависитотсложности'];
console.log('  price-list markers:', wants.map((w) => (nc.includes(w) ? '✓' : '✗') + w.slice(0, 10)).join(' '));
console.log('  "от6000" present:', nc.includes('6000₽') || nc.includes('от6000') ? 'OK' : '(check)');
await browser.close();
