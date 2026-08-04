// ─────────────────────────────────────────────────────────────
// gen-card-sizes.mjs — уменьшенные копии карточек работ.
//
// Зачем (аудит Sprint 15, направление 2/8): /catalog тянет 22 файла на 1996 КБ,
// потому что карточка одна на все экраны — 1200 px и на десктопе, и на телефоне,
// где она рисуется в ~360 px. srcset построить было не из чего: TILDA_IMAGES
// отдавал один и тот же URL для thumb/large/full.
//
// sharp в проекте нет, ставить ради ресайза не хочется — режем через canvas
// в Chromium, который уже есть для Playwright. Прозрачность webp сохраняется.
//
//   node scripts/gen-card-sizes.mjs
//
// Кладёт public/assets/cards/<slug>@480.webp и @960.webp; исходник не трогает.
// ─────────────────────────────────────────────────────────────
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const DIR = 'public/assets/cards';
const SIZES = [480, 960];
const QUALITY = 0.86;

if (!existsSync(DIR)) { console.log(`  нет папки ${DIR} — нечего резать`); process.exit(0); }
mkdirSync(DIR, { recursive: true });

const originals = readdirSync(DIR).filter((f) => /^[a-z]{2}-\d{2}\.webp$/.test(f));
console.log(`исходных карточек: ${originals.length}`);
if (!originals.length) process.exit(0);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('about:blank');

let made = 0, skipped = 0;
for (const file of originals) {
  const slug = file.replace(/\.webp$/, '');
  for (const w of SIZES) {
    const out = `${DIR}/${slug}@${w}.webp`;
    if (existsSync(out)) { skipped++; continue; }
    const dataUrl = await page.evaluate(async ({ src, w, q }) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
      if (img.naturalWidth <= w) return null;             // мельче цели — копия не нужна
      const c = document.createElement('canvas');
      c.width = w;
      c.height = Math.round((img.naturalHeight / img.naturalWidth) * w);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', q);
    }, { src: `https://cdn.mbezu.ru/assets/cards/${file}`, w, q: QUALITY });

    if (!dataUrl) { console.log(`  ${slug}@${w}: исходник уже мельче — пропуск`); skipped++; continue; }
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    writeFileSync(out, buf);
    console.log(`  ✓ ${slug}@${w}.webp — ${Math.round(buf.length / 1024)} КБ`);
    made++;
  }
}
await browser.close();
console.log(`\nсоздано: ${made}, пропущено: ${skipped}`);
