// ─────────────────────────────────────────────────────────────
// seo.ts — per-page <title>/meta + JSON-LD генераторы.
// Полный набор схем (Organization, Product, BreadcrumbList) — Phase 4.
// ─────────────────────────────────────────────────────────────
import { ABOUT, ARTWORKS, artworkById, seriesById, featuredArtworks, formatPrice, imageOf } from './data';

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
  setMeta('property', 'og:site_name', 'MBezu');
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
    name: 'MBezu · Mila Bezú',
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

// ── Central per-route SEO resolver (shared by entries + prerender) ──
export interface RouteSeo extends PageSeo { jsonLd: unknown[] }

export function seoFor(name: string, params: { id?: string; series?: string; section?: string } = {}): RouteSeo {
  const abs = (p: string) => (p && p.startsWith('/') ? SITE_ORIGIN + p : p);
  const heroImg = imageOf(featuredArtworks()[0] || ARTWORKS[0], 'full');

  switch (name) {
    case 'home':
      return {
        title: 'Mila Bezú — интерьерная живопись маслом · Москва',
        description: 'Картины маслом современного российского художника Mila Bezú. Серии «Улицы мира», «Монохромная», «Тихая сила» и «Тондо». Работы в наличии и на заказ. Доставка по РФ.',
        canonical: SITE_ORIGIN + '/',
        ogImage: abs(heroImg || ''),
        jsonLd: [organizationLd(), personLd()],
      };
    case 'about':
      return {
        title: 'О художнике — Mila Bezú · 15 лет масляной живописи',
        description: ABOUT.short[0],
        canonical: SITE_ORIGIN + '/about',
        ogImage: abs(heroImg || ''),
        jsonLd: [personLd(), breadcrumbLd([{ name: 'MBezu', url: '/' }, { name: 'Художник', url: '/about' }])],
      };
    case 'catalog': {
      const series = params.series ? seriesById(params.series) : null;
      return {
        title: series ? `${series.title} — каталог · Mila Bezú` : 'Каталог работ — Mila Bezú',
        description: series ? series.description : 'Каталог живописи маслом Mila Bezú: 22 работы в четырёх сериях. Пейзажи, море, ботаника, города. Купить картину или заказать.',
        canonical: SITE_ORIGIN + '/catalog' + (params.series ? `?series=${params.series}` : ''),
        jsonLd: [breadcrumbLd([{ name: 'MBezu', url: '/' }, { name: 'Каталог', url: '/catalog' }])],
      };
    }
    case 'painting': {
      const art = artworkById((params.id || '').toUpperCase());
      if (!art) {
        return { title: 'Работа — Mila Bezú', canonical: SITE_ORIGIN + '/painting', jsonLd: [] };
      }
      const series = seriesById(art.series);
      const pld = productLd(art.id);
      return {
        title: `${art.title}${art.subtitle ? ' · ' + art.subtitle : ''} — ${series?.title || ''} · Mila Bezú`,
        description: `${art.description} ${art.w}×${art.h} см, ${art.medium.toLowerCase()}. ${formatPrice(art.price)}.`,
        canonical: `${SITE_ORIGIN}/painting/${art.id.toLowerCase()}`,
        ogImage: abs(imageOf(art, 'full') || ''),
        ogType: 'product',
        jsonLd: [
          pld,
          breadcrumbLd([
            { name: 'MBezu', url: '/' },
            { name: 'Каталог', url: '/catalog' },
            { name: series?.title || '', url: `/catalog?series=${art.series}` },
            { name: art.title, url: `/painting/${art.id.toLowerCase()}` },
          ]),
        ].filter(Boolean),
      };
    }
    case 'commission':
      return {
        title: 'Картина на заказ — Mila Bezú',
        description: 'Закажите картину маслом под ваше пространство. Бриф из 6 шагов: размер, сюжет, палитра, сроки. Студия в Москве, доставка по РФ.',
        canonical: SITE_ORIGIN + '/commission',
        jsonLd: [breadcrumbLd([{ name: 'MBezu', url: '/' }, { name: 'На заказ', url: '/commission' }])],
      };
    case 'cart':
      return { title: 'Корзина — Mila Bezú', description: 'Корзина и оформление заказа.', canonical: SITE_ORIGIN + '/cart', noindex: true, jsonLd: [] };
    case 'tracking':
      return { title: 'Статус заказа — Mila Bezú', description: 'Отслеживание статуса вашего заказа.', canonical: SITE_ORIGIN + '/tracking', noindex: true, jsonLd: [] };
    case 'legal':
      return {
        title: 'Документы и реквизиты — Mila Bezú',
        description: `Оферта, политика обработки персональных данных, доставка, возврат и реквизиты. ${ABOUT.legal.name_short}, ИНН ${ABOUT.legal.inn}.`,
        canonical: SITE_ORIGIN + '/legal' + (params.section ? `?section=${params.section}` : ''),
        jsonLd: [breadcrumbLd([{ name: 'MBezu', url: '/' }, { name: 'Документы', url: '/legal' }])],
      };
    default:
      return { title: 'Mila Bezú', canonical: SITE_ORIGIN + '/', jsonLd: [] };
  }
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
    image: img ? [img.startsWith('http') ? img : SITE_ORIGIN + img] : undefined,
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
  };
}
