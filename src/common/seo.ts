// ─────────────────────────────────────────────────────────────
// seo.ts — per-page <title>/meta + JSON-LD генераторы.
// Полный набор схем (Organization, Product, BreadcrumbList) — Phase 4.
// ─────────────────────────────────────────────────────────────
import { ABOUT, ARTWORKS, artworkById, seriesById, featuredArtworks, formatPrice, imageOf, visibleArtworks } from './data';
import { storeProductPath } from './store-urls';
import { seriesSlug as seriesSlugOf, seriesHasPage } from './flags';

/**
 * Боевой адрес работы на mbezu.ru.
 *
 * /painting/<id> существует ТОЛЬКО на cdn.mbezu.ru (prerender). На домене таких
 * страниц Tilda нет — проверено 20.09.2026: /painting/mn-01 отдаёт 403,
 * /painting/ct-01 — 404. Поэтому canonical, og:url и Offer.url обязаны вести
 * либо на нативную страницу товара Store, либо (пока её нет) на страницу серии,
 * где работа видна. Иначе робот получает 35+ адресов, ведущих в ошибку.
 */
const workUrl = (art: any) => SITE_ORIGIN + (storeProductPath(art?.id) || seriesPath(art?.series));

/** URL серии для canonical/крошек: свой /catalog/<slug> только если страница Tilda существует. */
const seriesPath = (id?: string) => (id ? (seriesHasPage(id) ? '/catalog/' + seriesSlugOf(id) : '/catalog?series=' + id) : '/catalog');

// ── Sprint 14: счётчики работ (видимых) — чтобы число в тексте не расходилось с фактом ──
export const workCount = () => visibleArtworks().length;
export const seriesCount = (id: string) => visibleArtworks().filter((a: any) => a.series === id).length;

// ── Sprint 16: «в каталоге» ≠ «свободно сейчас» ──────────────
// workCount() считает все видимые работы (56), но три портрета питомцев —
// status:'sold' + commission:true: это примеры услуги, а не товар на полке.
// Подписывать 56 словами «в наличии» стало неправдой на три работы.
/** Работы, которые реально можно купить прямо сейчас. */
export const inStockWorks = () =>
  visibleArtworks().filter((a: any) => a.status === 'available' && !a.commission);
export const inStockCount = () => inStockWorks().length;

/** Минимальная и максимальная цена свободных работ — для «от N ₽». */
export const priceRange = () => {
  const p = inStockWorks().map((a: any) => a.price);
  return { from: Math.min(...p), to: Math.max(...p) };
};

// ── Пополнение каталога ──────────────────────────────────────
// Признак новизны — поле added в data.ts ('2026-09'), а НЕ отсутствие страницы
// в Store: последнее станет false у всех 35 работ сразу после CSV-импорта,
// и лента «Новое в мастерской» молча опустеет.
/** Работы пополнения, свежие сначала. */
export const freshWorks = (limit?: number) => {
  const r = visibleArtworks()
    .filter((a: any) => !!a.added)
    .sort((a: any, b: any) => (b.added || '').localeCompare(a.added || '') || b.year - a.year);
  return limit ? r.slice(0, limit) : r;
};
export const freshCount = () => freshWorks().length;

/**
 * Витринный порядок для ленты «Новое»: по кругу через серии, внутри серии —
 * сперва флагманы. Иначе сортировка по году даёт подряд три проданных портрета
 * и двенадцать миниатюр — лента перестаёт показывать, что пополнение разное.
 */
export const freshHighlights = (limit = 12) => {
  const bySeries = new Map<string, any[]>();
  for (const a of freshWorks() as any[]) {
    if (!bySeries.has(a.series)) bySeries.set(a.series, []);
    bySeries.get(a.series)!.push(a);
  }
  for (const list of bySeries.values()) {
    list.sort((x, y) => Number(!!y.featured) - Number(!!x.featured)
      || Number(x.status === 'sold') - Number(y.status === 'sold')
      || y.price - x.price);
  }
  const lanes = [...bySeries.values()];
  const out: any[] = [];
  for (let i = 0; out.length < limit; i++) {
    let moved = false;
    for (const lane of lanes) {
      if (lane[i]) { out.push(lane[i]); moved = true; if (out.length >= limit) break; }
    }
    if (!moved) break;
  }
  return out;
};
/** Последнее пополнение: '2026-09' → 'сентябрь 2026'. */
export const freshStamp = () => {
  const m = (freshWorks(1)[0] as any)?.added;
  if (!m) return '';
  const [y, mm] = String(m).split('-');
  const names = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  return `${names[Number(mm) - 1] || ''} ${y}`.trim();
};
/** Русское склонение по числу: pluralOf(6, ['направление','направления','направлений']). */
export const pluralOf = (n: number, forms: [string, string, string]) => {
  const d10 = n % 10, d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return forms[0];
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return forms[1];
  return forms[2];
};

export const plural = (n: number) => {
  const d10 = n % 10, d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return 'работа';
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return 'работы';
  return 'работ';
};

export const SITE_ORIGIN = 'https://mbezu.ru';

/** Обрезать описание по границе слова — meta description длиннее ~160 символов режет выдача. */
const clamp = (s: string, n: number) =>
  (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,\s]+$/, '') + '…');

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
      ABOUT.contacts.telegramUrl,
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
        jsonLd: [homeFaqLd()], // Sprint 15: FAQPage — видимый FAQ главной (HOME_FAQ)
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
        // Sprint 16: склейка описания серии с общим хвостом давала 207–243 символа —
        // выдача резала как раз хвост про сертификат и доставку. Держим ~150–160.
        description: series
          ? clamp(`${series.title}: ${series.subtitle.toLowerCase()}. ${seriesCount(series.id)} ${plural(seriesCount(series.id))} маслом на холсте, сертификат подлинности, доставка по РФ.`, 160)
          : 'Картины маслом на холсте от художника Mila Bezú. Оригиналы в единственном экземпляре с сертификатом подлинности. Доставка по РФ, оплата онлайн.',
        // Sprint 15: у посадочной серии canonical — её собственный /catalog/<slug>,
        // иначе все четыре склеиваются с каталогом и не ранжируются.
        canonical: SITE_ORIGIN + seriesPath(params.series),
        // Sprint 15: ItemList с Product+Offer по всем работам. Страницы товаров
        // нативные и своей разметки не имеют — цена и наличие уезжают роботу отсюда.
        jsonLd: series
          ? [breadcrumbLd([{ name: 'MBezu', url: '/' }, { name: 'Каталог', url: '/catalog' }, { name: series.title, url: seriesPath(params.series) }]), catalogItemListLd(params.series)]
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
        canonical: workUrl(art),
        ogImage: abs(imageOf(art, 'full') || ''),
        ogType: 'product',
        jsonLd: [
          pld,
          visualArtworkLd(art.id),
          breadcrumbLd([
            { name: 'MBezu', url: '/' },
            { name: 'Каталог', url: '/catalog' },
            { name: series?.title || '', url: seriesPath(art.series) },
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
    url: workUrl(art),
    brand: { '@type': 'Brand', name: 'Mila Bezú' },
    width: { '@type': 'QuantitativeValue', value: art.w, unitCode: 'CMT' },
    height: { '@type': 'QuantitativeValue', value: art.h, unitCode: 'CMT' },
    offers: {
      '@type': 'Offer',
      price: art.price,
      priceCurrency: 'RUB',
      // Портреты питомцев: холст у владельца, но направление открыто для заказа —
      // MadeToOrder честнее SoldOut и не спорит с видимым «На заказ» на карточке.
      availability: art.commission
        ? 'https://schema.org/MadeToOrder'
        : art.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      // Sprint 15: раньше вело на /painting/<id> — React-заглушку, которая
      // ничего не продаёт. Offer обязан указывать на страницу, где реально
      // покупают: нативный товар Store. Фолбэк оставлен на случай неотображённой работы.
      // Sprint 15: раньше вело на /painting/<id> — страницу, которой на домене нет.
      // Offer указывает на адрес, где реально покупают.
      url: workUrl(art),
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

// ─────────────────────────────────────────────────────────────
// Sprint 15 (план роста, шаг 6): интерьерный интент на посадочных серий.
// Кластер «картина в гостиную/спальню/кабинет купить» — ближайший к покупке;
// до этого 0 вхождений на сайте. Рендерится секцией на /catalog/<slug>
// (виден роботу в prerender). Ссылка «как выбрать» — статья журнала.
// ─────────────────────────────────────────────────────────────
export interface InteriorRoom { room: string; text: string }

export const SERIES_INTERIORS: Record<string, InteriorRoom[]> = {
  monochrome: [
    { room: 'Картина в кабинет', text: 'Монохром держит рабочую комнату в фокусе: свет и форма без цвета не отвлекают, но дают глазу точку отдыха. Сепия и графит дружат с деревом, кожей и тёмными стеллажами.' },
    { room: 'Картина в спальню', text: 'Волны и камни в сепии — медленные сюжеты для комнаты сна. Монохромная картина в спальню работает как приглушённый свет: её замечаешь, когда успокаиваешься.' },
    { room: 'Картина в гостиную', text: 'В минималистичной гостиной с серым или бежевым диваном монохромный холст становится главным акцентом, не споря с текстилем. Для стены за диваном берите крупный формат — от метра.' },
  ],
  streets: [
    { room: 'Картина в гостиную', text: 'Городские пейзажи — самый «гостевой» сюжет: солнце, юг и узнаваемые улицы запускают разговоры. Картина в гостиную из этой серии добавляет комнате воздуха и отпускного света.' },
    { room: 'Картина на кухню', text: 'Лаванда, букинисты, рисовые поля — сюжеты еды, рынка и путешествий естественны на кухне и в столовой. Малый и средний формат 30–50 см встаёт в простенок между шкафами.' },
    { room: 'Картина в прихожую', text: 'Прихожая — место короткого взгляда: яркая улица встречает и провожает. Вертикальные городские сюжеты хороши в узких простенках у двери и зеркала.' },
  ],
  silence: [
    { room: 'Картина в спальню', text: 'Вода, лес и ботаника — сюжеты, на которых взгляд замедляется. Картина в спальню из «Тихой силы» поддерживает комнату сна, не добавляя визуального шума.' },
    { room: 'Картина в гостиную', text: 'Кувшинки и зеркало леса уравновешивают гостиную с активной мебелью: природный сюжет снижает температуру интерьера. Хорошо живут рядом с льном, ротангом и живыми растениями.' },
    { room: 'Картина в ванную и SPA-зону', text: 'Влажные сюжеты — дождь, листья, вода — уместны там, где отдыхают: ванная с окном, домашняя SPA-зона, зона у бассейна. Масло на холсте в сухой зоне комнаты чувствует себя нормально.' },
  ],
  tondi: [
    { room: 'Картина в прихожую', text: 'Круглое тондо снимает жёсткость узкого коридора: круг рядом с зеркалом и дверными проёмами читается мягче прямоугольника. Диаметр 30–40 см — рабочий размер прихожей.' },
    { room: 'Картина в детскую', text: 'Круглый формат по природе дружелюбный: гибискус и дюны в тондо подходят детской без «детских» картинок — работа растёт вместе с ребёнком.' },
    { room: 'Картина в гостиную', text: 'В гостиной тондо работает акцентом там, где стены уже заняты полками и прямыми углами, — или собирается в группу из двух-трёх кругов над комодом.' },
  ],
  mini: [
    { room: 'Картина на кухню', text: 'Лимоны, майолика и ставни — кухонные сюжеты по происхождению. Миниатюра встаёт на рейлинг, подоконник или узкую полку между шкафами, где полноразмерный холст не помещается.' },
    { room: 'Картина в подарок', text: 'Оригинал маслом за цену подарка: единственный экземпляр, авторская подпись, сертификат и мини-мольберт в комплекте. Формат 7–15 см уезжает в ручной клади и не требует упаковки в короб.' },
    { room: 'Галерейная развеска', text: 'Три-пять миниатюр собираются в сетку на узком простенке, в прихожей или над рабочим столом. Единая цена и единая тема серии делают группу цельной без подбора.' },
  ],
  pets: [
    { room: 'Картина в гостиную', text: 'Золотой фон держит портрет питомца на уровне парадного портрета, а не «фотографии собаки». Формат 40×60 рассчитан на просмотр с двух-трёх метров — стена за диваном или над консолью.' },
    { room: 'Картина в кабинет', text: 'Поталь даёт тёплый рефлекс на тёмном дереве и коже: портрет на золоте собирает кабинет вокруг себя и хорошо живёт рядом со стеллажами.' },
    { room: 'Картина в подарок', text: 'Портрет питомца — подарок, который невозможно повторить. Пишется по вашим фотографиям, срок 3–5 недель, к работе прилагаются подпись и сертификат подлинности.' },
  ],
};

/** Статья журнала «Как выбрать картину для гостиной» — хаб интерьерного кластера. */
export const INTERIOR_GUIDE_URL = '/tpost/1h0ft7s671-kak-vibrat-kartinu-dlya-gostinoi-razmer';

// ─────────────────────────────────────────────────────────────
// Sprint 15: FAQ главной — честный контент под коммерческие интенты
// («заказать картину», «картина в подарок», «картина в интерьер», «купить картину маслом»).
// Видимый текст + FAQPage-разметка (правила Яндекса/Google: разметка только видимого).
// ─────────────────────────────────────────────────────────────
export const HOME_FAQ: Array<[string, string]> = [
  ['Как купить картину маслом на сайте?',
   'Выберите работу в каталоге, нажмите «Купить» и оформите заказ: оплата онлайн через ЮKassa, доставка по России СДЭК или курьером. Каждая картина — оригинал в единственном экземпляре, с подписью автора на обороте и сертификатом подлинности.'],
  ['Можно ли заказать картину под мой интерьер?',
   'Да. Картина на заказ пишется под вашу комнату: обсуждаем размер стены, свет и настроение, вы получаете эскизы до начала работы. Срок — от двух недель. Заявка на странице «На заказ» — ответ в течение дня.'],
  ['Какую картину выбрать в подарок?',
   'Оригинал живописи — подарок, который не повторится. Для гостиной подойдут городские пейзажи и вода, для спальни — спокойная ботаника и монохром, для кабинета — сепия и графит. Миниатюры 7–15 см от 5 000 ₽ ставят на полку и дарят как есть — с мини-мольбертом в комплекте, крупные холсты вешают над диваном. Отдельное направление — портрет питомца маслом и поталью на заказ. Отдельная подборка — на странице «Картина в подарок».'],
  ['Как подобрать размер картины для гостиной или спальни?',
   'Ориентир — две трети ширины мебели, над которой висит картина: над диваном 220 см уместен холст 100–150 см по ширине, для полки и простенка — 7–40 см. Центр работы — на уровне глаз, около 150 см от пола. Подробный разбор с примерами — в журнале.'],
  ['Что входит в стоимость и что я получу?',
   'Картина на подрамнике, авторская подпись, фирменный сертификат подлинности, рукописная открытка из мастерской и крепёж — работа готова к подвесу сразу после распаковки. Упаковка защитная, доставка по России.'],
  ['Можно ли посмотреть картину до покупки?',
   'Мастерская в Москве — по записи. По запросу вышлю дополнительные фото и видео работы при дневном свете, а также примерку в вашем интерьере по фотографии стены.'],
];

export function homeFaqLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}
