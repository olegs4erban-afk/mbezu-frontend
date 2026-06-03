import { describe, it, expect } from 'vitest';
import { routeToPath } from '../common/app';
import { imageOf, formatPrice, ARTWORKS, artworkById, seriesById } from '../common/data';
import { seoFor, organizationLd, personLd, productLd, breadcrumbLd } from '../common/seo';

describe('routeToPath — resolves each slug', () => {
  it('home → /', () => expect(routeToPath('home')).toBe('/'));
  it('about → /about.html', () => expect(routeToPath('about')).toBe('/about.html'));
  it('simple routes → /<name>.html', () => {
    for (const r of ['commission', 'cart', 'tracking'] as const) {
      expect(routeToPath(r)).toBe(`/${r}.html`);
    }
  });
  it('catalog with series → query', () => {
    expect(routeToPath('catalog', { series: 'monochrome' })).toBe('/catalog.html?series=monochrome');
    expect(routeToPath('catalog')).toBe('/catalog.html');
  });
  it('painting with id → query', () => {
    expect(routeToPath('painting', { id: 'MN-01' })).toBe('/painting.html?id=MN-01');
  });
  it('legal with section → query', () => {
    expect(routeToPath('legal', { section: 'offer' })).toBe('/legal.html?section=offer');
  });
});

describe('data helpers', () => {
  it('formatPrice → RUB string', () => {
    const s = formatPrice(210000);
    expect(s).toMatch(/210/);
    expect(s).toMatch(/₽|RUB/);
  });
  it('imageOf returns /assets/works path for a work with a photo', () => {
    expect(imageOf(artworkById('MN-01'), 'full')).toContain('/assets/works/mn-01');
    expect(imageOf(artworkById('MN-01'), 'thumb')).toContain('@sm');
  });
  it('imageOf null for work without photo (MN-03)', () => {
    expect(imageOf(artworkById('MN-03'), 'full')).toBeNull();
  });
  it('seriesById resolves', () => {
    expect(seriesById('monochrome')?.title).toBeTruthy();
  });
});

describe('SEO JSON-LD — valid shape', () => {
  it('organizationLd', () => {
    const o = organizationLd();
    expect(o['@context']).toBe('https://schema.org');
    expect(o['@type']).toBe('Organization');
    expect(o.url).toMatch(/^https:\/\//);
    expect(o.taxID).toBeTruthy();
  });
  it('personLd', () => {
    expect(personLd()['@type']).toBe('Person');
  });
  it('productLd for a real work', () => {
    const p: any = productLd('MN-01');
    expect(p['@type']).toBe('Product');
    expect(p.sku).toBe('MN-01');
    expect(p.offers.priceCurrency).toBe('RUB');
    expect(p.offers.price).toBeGreaterThan(0);
    expect(p.offers['@type']).toBe('Offer');
  });
  it('breadcrumbLd has sequential positions', () => {
    const b: any = breadcrumbLd([{ name: 'a', url: '/' }, { name: 'b', url: '/b' }]);
    expect(b['@type']).toBe('BreadcrumbList');
    expect(b.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
  });
  it('seoFor(painting) → title + canonical + jsonLd', () => {
    const s = seoFor('painting', { id: 'MN-01' });
    expect(s.title).toContain('Mila Bezú');
    expect(s.canonical).toBe('https://mbezu.ru/painting/mn-01');
    expect(s.jsonLd.length).toBeGreaterThanOrEqual(1);
  });
  it('seoFor(cart) is noindex', () => {
    expect(seoFor('cart').noindex).toBe(true);
  });
});

describe('data integrity', () => {
  it('every artwork has required fields', () => {
    for (const a of ARTWORKS as any[]) {
      expect(a.id, `id for ${a.title}`).toBeTruthy();
      expect(a.title, `title for ${a.id}`).toBeTruthy();
      expect(a.series, `series for ${a.id}`).toBeTruthy();
      expect(typeof a.price, `price for ${a.id}`).toBe('number');
      expect(a.price, `price>0 for ${a.id}`).toBeGreaterThan(0);
      expect(typeof a.w, `w for ${a.id}`).toBe('number');
      expect(typeof a.h, `h for ${a.id}`).toBe('number');
      expect(a.status, `status for ${a.id}`).toBeTruthy();
      expect(seriesById(a.series), `series exists for ${a.id}`).toBeTruthy();
    }
  });
  it('artwork ids are unique', () => {
    const ids = (ARTWORKS as any[]).map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('"ready" works (with photo) resolve a full image path', () => {
    const ready = (ARTWORKS as any[]).filter((a) => a.image);
    expect(ready.length).toBeGreaterThan(15);
    for (const a of ready) expect(imageOf(a, 'full')).toContain('/assets/works/');
  });
});
