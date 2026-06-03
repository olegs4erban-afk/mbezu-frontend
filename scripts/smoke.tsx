// SSR smoke test — renders every page to static markup under Node to catch
// render-time crashes (bad imports, undefined refs). Does NOT import app.tsx
// (which pulls styles.css + createRoot) — renders page + chrome directly.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TopBar, Footer } from '../src/common/chrome';
import { ARTWORKS } from '../src/common/data';

import HomePage from '../src/pages/home';
import AboutPage from '../src/pages/about';
import CatalogPage from '../src/pages/catalog';
import PaintingPage from '../src/pages/painting';
import CommissionPage from '../src/pages/commission';
import CartPage from '../src/pages/cart';
import TrackingPage from '../src/pages/tracking';
import LegalPage from '../src/pages/legal';

const go = () => {};
const noop = () => {};

const cases: Array<[string, React.ReactElement]> = [
  ['home', <HomePage go={go} hero="editorial" />],
  ['about', <AboutPage go={go} />],
  ['catalog', <CatalogPage go={go} density="regular" initialSeries={undefined} />],
  ['painting', <PaintingPage go={go} id={ARTWORKS[0].id} addToCart={noop} />],
  ['painting:round', <PaintingPage go={go} id="TD-01" addToCart={noop} />],
  ['commission', <CommissionPage go={go} refId={undefined} />],
  ['cart:empty', <CartPage go={go} cart={[]} removeFromCart={noop} />],
  ['cart:items', <CartPage go={go} cart={['MN-01', 'ST-05']} removeFromCart={noop} />],
  ['tracking', <TrackingPage go={go} />],
  ['legal', <LegalPage go={go} section={undefined} />],
  ['legal:offer', <LegalPage go={go} section="offer" />],
];

let failed = 0;
for (const [name, el] of cases) {
  try {
    const html = renderToStaticMarkup(
      <>
        <TopBar route={name} go={go} cartCount={0} />
        <main>{el}</main>
        <Footer go={go} />
      </>,
    );
    if (!html || html.length < 200) throw new Error(`suspiciously short markup (${html.length} chars)`);
    console.log(`  ✓ ${name.padEnd(16)} ${html.length} chars`);
  } catch (e: any) {
    failed++;
    console.error(`  ✗ ${name.padEnd(16)} ${e?.message || e}`);
    if (e?.stack) console.error(String(e.stack).split('\n').slice(1, 4).join('\n'));
  }
}
console.log(failed ? `SMOKE FAILED: ${failed} page(s) threw` : 'SMOKE OK: all pages render');
process.exit(failed ? 1 : 0);
