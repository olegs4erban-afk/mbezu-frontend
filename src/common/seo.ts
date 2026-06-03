// ─────────────────────────────────────────────────────────────
// seo.ts — per-page <title>/meta + JSON-LD генераторы.
// Полный набор схем (Organization, Product, BreadcrumbList) — Phase 4.
// ─────────────────────────────────────────────────────────────
import { ABOUT, artworkById, seriesById, formatPrice, imageOf } from './data';

export const SITE_ORIGIN = 'https://mbezu.ru';

export interface PageSeo {
  title: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

/** Set <title> + meta tags on the live document (client) — idempotent by name/property. */
export function applySeo(seo: PageSeo): void {
  if (typeof document === 'undefined') return;
  if (seo.title) document.title = seo.title;
  setMeta('name', 'description', seo.description);
  setMeta('property', 'og:title', seo.ogTitle || seo.title);
  setMeta('property', 'og:description', seo.ogDescription || seo.description);
  setMeta('property', 'og:type', seo.ogType || 'website');
  setMeta('property', 'og:url', seo.canonical);
  setMeta('property', 'og:image', seo.ogImage);
  setMeta('property', 'og:locale', 'ru_RU');
  setMeta('property', 'og:site_name', 'M.Bez');
  if (seo.noindex) setMeta('name', 'robots', 'noindex,nofollow');
  setCanonical(seo.canonical);
}

function setMeta(attr: 'name' | 'property', key: string, value?: string): void {
  if (!value) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href?: string): void {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Inject (or replace) a <script type="application/ld+json"> block by id. */
export function injectJsonLd(id: string, data: unknown): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.id = id;
  s.textContent = JSON.stringify(data);
  (document.head || document.documentElement).appendChild(s);
}

// ── JSON-LD generators ───────────────────────────────────────
export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'M.Bez · Mila Bezú',
    legalName: `${ABOUT.legal.type} ${ABOUT.legal.full_name}`,
    url: SITE_ORIGIN,
    email: ABOUT.contacts.email,
    telephone: '+' + ABOUT.contacts.phone.replace(/\D/g, ''),
    taxID: ABOUT.legal.inn,
    address: { '@type': 'PostalAddress', addressLocality: 'Москва', addressCountry: 'RU' },
    sameAs: [
      `https://instagram.com/${ABOUT.contacts.instagram}`,
      `https://t.me/${ABOUT.contacts.telegram}`,
      `https://vk.com/${ABOUT.contacts.vk}`,
    ],
  };
}

export function personLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: ABOUT.name,
    alternateName: ABOUT.alias,
    jobTitle: 'Художник-живописец',
    url: SITE_ORIGIN,
    email: ABOUT.contacts.email,
    address: { '@type': 'PostalAddress', addressLocality: ABOUT.city, addressCountry: 'RU' },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : SITE_ORIGIN + it.url,
    })),
  };
}

export function productLd(id: string) {
  const art = artworkById(id);
  if (!art) return null;
  const series = seriesById(art.series);
  const img = imageOf(art, 'full');
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: art.title,
    sku: art.id,
    description: art.description,
    image: img ? [SITE_ORIGIN + img] : undefined,
    category: series?.title,
    brand: { '@type': 'Brand', name: 'Mila Bezú' },
    width: { '@type': 'QuantitativeValue', value: art.w, unitCode: 'CMT' },
    height: { '@type': 'QuantitativeValue', value: art.h, unitCode: 'CMT' },
    offers: {
      '@type': 'Offer',
      price: art.price,
      priceCurrency: 'RUB',
      availability: art.status === 'available'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      url: `${SITE_ORIGIN}/painting/${art.id.toLowerCase()}`,
      itemCondition: 'https://schema.org/NewCondition',
    },
    _priceLabel: formatPrice(art.price),
  };
}
