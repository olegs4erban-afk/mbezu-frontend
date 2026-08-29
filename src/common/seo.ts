// ─────────────────────────────────────────────────────────────
// seo.ts — per-page <title>/meta + JSON-LD генераторы.
// Полный набор схем (Organization, Product, BreadcrumbList) — Phase 4.
// ─────────────────────────────────────────────────────────────
import { ABOUT, ARTWORKS, artworkById, seriesById, featuredArtworks, formatPrice, imageOf, visibleArtworks } from './data';
import { storeProductPath } from './store-urls';
import { seriesSlug as seriesSlugOf } from './flags';

// ── Sprint 14: счётчики работ (видимых) — чтобы «21 работа» не расходилась с фактом ──
export const workCount = () => visibleArtworks().length;
export const seriesCount = (id: string) => visibleArtworks().filter((a: any) => a.series === id).length;
export const plural = (n: number) => {
  const d10 = n % 10, d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return 'работа';
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return 'работы';
  return 'работ';
};

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
        title: 'Картины маслом для интерьера — Mila Bezú | Москва',
        description: 'Авторская живопись маслом в единственном экземпляре. Картины для интерьера дома, квартиры и дачи. Работа на заказ от 2 недель. Доставка по России.',
        canonical: SITE_ORIGIN + '/',
        ogImage: abs(heroImg || ''),
        // Organization и Person уже отдаются site-wide из head-кода — здесь они
        // давали дубли (робот видел по два объекта каждого типа).
        jsonLd: [],
      };
    case 'about':
      return {
        title: 'Mila Bezú — художник, живопись маслом | Москва',
        description: ABOUT.short[0],
        canonical: SITE_ORIGIN + '/about',
        ogImage: abs(heroImg || ''),
        jsonLd: [breadcrumbLd([{ name: 'MBezu', url: '/' }, { name: 'Художник', url: '/about' }])],
      };
    case 'catalog': {
      const series = params.series ? seriesById(params.series) : null;
      return {
        title: series
          ? `${series.title} — картины маслом, ${seriesCount(series.id)} ${plural(seriesCount(series.id))} | MBezu`
          : `Купить картину маслом для интерьера — ${workCount()} ${plural(workCount())} | MBezu`,
        description: series
          ? `${series.description} Оригиналы маслом на холсте с сертификатом подлинности. Доставка по РФ.`
          : 'Картины маслом на холсте от художника Mila Bezú. Оригиналы в единственном экземпляре с сертификатом подлинности. Доставка по РФ, оплата онлайн.',
        canonical: SITE_ORIGIN + '/catalog' + (params.series ? `?series=${params.series}` : ''),
        // Sprint 15: ItemList с Product+Offer по всем работам. Страницы товаров
        // нативные и своей разметки не имеют — цена и наличие уезжают роботу отсюда.
        jsonLd: series
          ? [breadcrumbLd([{ name: 'MBezu', url: '/' }, { name: 'Каталог', url: '/catalog' }, { name: series.title, url: '/catalog' + (params.series ? '/' + seriesSlugOf(params.series) : '') }]), catalogItemListLd(params.series)]
          : [breadcrumbLd([{ name: 'MBezu', url: '/' }, { name: 'Каталог', url: '/catalog' }]), catalogItemListLd()],
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
        title: `${art.title} — картина маслом ${art.w}×${art.h} см | купить`,
        description: `${art.title} — авторская картина маслом на холсте, ${art.w}×${art.h} см, ${art.year}. Единственный экземпляр, сертификат подлинности. ${formatPrice(art.price)}, доставка по РФ.`,
        canonical: `${SITE_ORIGIN}/painting/${art.id.toLowerCase()}`,
        ogImage: abs(imageOf(art, 'full') || ''),
        ogType: 'product',
        jsonLd: [
          pld,
          visualArtworkLd(art.id),
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
        title: 'Картина на заказ маслом — от 2 недель | MBezu Москва',
        description: 'Напишем картину маслом на заказ под ваш интерьер: размер, палитра, сюжет. Эскизы до начала работы. Срок от 2 недель, доставка по России.',
        canonical: SITE_ORIGIN + '/commission',
        jsonLd: [
          breadcrumbLd([{ name: 'MBezu', url: '/' }, { name: 'На заказ', url: '/commission' }]),
          faqLd(),
        ],
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

/**
 * VisualArtwork (Sprint 14 Ф7) — специальный тип для произведений искусства.
 * Даёт поисковику точную сущность (не просто товар): техника, основа, размеры, автор.
 */
export function visualArtworkLd(id: string) {
  const art = artworkById(id);
  if (!art) return null;
  const img = imageOf(art, 'full');
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: art.title,
    description: art.description,
    image: img ? (img.startsWith('http') ? img : SITE_ORIGIN + img) : undefined,
    url: `${SITE_ORIGIN}/painting/${art.id.toLowerCase()}`,
    artform: 'Живопись',
    artMedium: 'Масло',
    artworkSurface: art.medium?.includes('картоне') ? 'Холст на картоне' : 'Холст',
    width: { '@type': 'QuantitativeValue', value: art.w, unitCode: 'CMT' },
    height: { '@type': 'QuantitativeValue', value: art.h, unitCode: 'CMT' },
    dateCreated: String(art.year),
    creator: { '@type': 'Person', name: ABOUT.name, alternateName: ABOUT.alias },
    isFamilyFriendly: true,
  };
}

/**
 * Вопросы для /commission. ВАЖНО: этот же список рендерится на странице —
 * FAQPage-разметка без видимого текста нарушает правила Яндекса и Google.
 */
export const COMMISSION_FAQ: Array<[string, string]> = [
  ['Сколько времени занимает картина на заказ?',
   'Работа пишется от 2 недель — срок зависит от размера и сложности сюжета. Точную дату согласуем после утверждения эскиза.'],
  ['Как происходит оплата?',
   'Предоплата 50% после согласования эскиза, остаток — когда готовая работа согласована по фото. Оплата картой онлайн через ЮKassa.'],
  ['Можно ли заказать картину по своему фото?',
   'Да. Пришлите референсы или своё фото — художник предложит композицию и палитру под ваш интерьер.'],
  ['Как доставляется работа?',
   'Доставка по России — СДЭК, курьером или в пункт выдачи. Работа едет в фирменной упаковке с сертификатом подлинности.'],
  ['Что входит в стоимость?',
   'Холст на галерейном подрамнике, защитное покрытие лаком, сертификат подлинности, фирменная упаковка, рукописная открытка и крепёж — работа готова к подвесу.'],
];

/** FAQPage для /commission (Sprint 14 Ф7) — расширенный сниппет по частым вопросам. */
export function faqLd() {
  const qa = COMMISSION_FAQ;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
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
      // Sprint 15: раньше вело на /painting/<id> — React-заглушку, которая
      // ничего не продаёт. Offer обязан указывать на страницу, где реально
      // покупают: нативный товар Store. Фолбэк оставлен на случай неотображённой работы.
      url: SITE_ORIGIN + (storeProductPath(art.id) || `/painting/${art.id.toLowerCase()}`),
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'MBezu' },
    },
  };
}

/**
 * ItemList из всех работ каталога с Product + Offer (Sprint 15).
 *
 * Зачем: страницы товаров — нативные тильдовские, своей разметки у них нет и
 * добавить её туда нечем (контейнера витрины на них нет). Каталог же наш и
 * попадает в HTML до JS — значит цену и наличие робот увидит именно отсюда.
 * Каждый элемент ссылается на реальную страницу покупки.
 */
export function catalogItemListLd(seriesId?: string) {
  // На посадочной серии список фильтруется: уникальная разметка на каждой
  // странице вместо пяти копий полного списка по сайту.
  const works = seriesId ? visibleArtworks().filter((a: any) => a.series === seriesId) : visibleArtworks();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Каталог картин маслом MBezu',
    numberOfItems: works.length,
    itemListElement: works.map((art: any, i: number) => {
      const p = productLd(art.id);
      return { '@type': 'ListItem', position: i + 1, item: p };
    }).filter((x: any) => x.item),
  };
}
