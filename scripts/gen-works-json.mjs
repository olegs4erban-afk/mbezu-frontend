// 02.09 (P1 «страница товара как часть витрины»): public/works.json — компактный список работ
// для head-скрипта на нативных страницах товара Tilda: крошки (серия) и «Ещё из серии».
// Источник — data.ts / store-urls.ts / tilda-images.ts. Запускается в build после prerender.
import { writeFileSync } from 'node:fs';
const { ARTWORKS, SERIES } = await import('../src/common/data.ts');
const { STORE_PRODUCT_PATH } = await import('../src/common/store-urls.ts');
const { TILDA_IMAGES } = await import('../src/common/tilda-images.ts');
const out = ARTWORKS.filter((a) => !a.hidden && STORE_PRODUCT_PATH[a.id]).map((a) => {
  const s = SERIES.find((x) => x.id === a.series) || {};
  return { id: a.id, title: a.title, series: a.series, seriesTitle: s.title || '', seriesSlug: s.slug || '', subject: a.subject, w: a.w, h: a.h, price: a.price, url: STORE_PRODUCT_PATH[a.id], img: (TILDA_IMAGES[a.id] || {}).thumb || '' };
});
writeFileSync('public/works.json', JSON.stringify(out));
console.log('works.json:', out.length, 'работ');
