import React from 'react';
import { ArtCard, Breadcrumbs, LinkStrip } from '../common/atoms';
import { SERIES, SUBJECTS, formatPrice, visibleArtworks } from '../common/data';
import { INTERIOR_GUIDE_URL, SERIES_INTERIORS, freshCount, plural, pluralOf, seriesCount } from '../common/seo';
import { routeToPath } from '../common/routes';

// ─────────────────────────────────────────────────────────────
// catalog.tsx — каталог, версия 2 (вариант B, 23.10.2026).
//
// Что изменилось против Sprint 16:
//   · серии — настоящие ссылки на свои адреса (/catalog/<slug> или ?series=),
//     а не кнопки-фильтры: у каждой серии своя посадочная, робот видит переходы;
//   · полоса фильтров больше не липкая — на телефоне она занимала треть экрана
//     над сеткой; фильтры по сюжету и сортировка — одной строкой над сеткой;
//   · свободные работы всегда первыми, проданные и примеры услуги — в конце;
//   · на телефоне две колонки карточек вместо одной;
//   · первые 24 работы, дальше «Показать ещё». В пререндер (HTML для робота
//     и для открытия без JS) попадают все работы — ссылки на товары не теряются.
// ─────────────────────────────────────────────────────────────

const PAGE = 24;
const isFree = (a: any) => a.status === 'available' && !a.commission;

/** Короткая запись цены для сводки: 5 000 и 130 000 → «5–130 тыс. ₽» */
function priceSpan(min: number, max: number): string {
  if (!min) return '—';
  if (min === max) return formatPrice(min);
  if (min >= 1000 && max >= 1000) return `${Math.round(min / 1000)}–${Math.round(max / 1000)} тыс. ₽`;
  return `${formatPrice(min)} — ${formatPrice(max)}`;
}

function CatalogPage({ initialSeries, initialOnlyNew = false }: { go?: unknown; initialSeries?: string; initialOnlyNew?: boolean }) {
  const series = initialSeries && SERIES.some((s) => s.id === initialSeries) ? initialSeries : 'all';
  const activeSeries = series !== 'all' ? SERIES.find((s) => s.id === series) || null : null;

  const [subject, setSubject] = React.useState('all');
  // пополнение — отдельный срез; признак новизны — поле added в data.ts
  const [onlyNew, setOnlyNewRaw] = React.useState(!!initialOnlyNew);
  const setOnlyNew = (v: boolean) => {
    setOnlyNewRaw(v);
    try {
      const u = new URL(window.location.href);
      if (v) u.searchParams.set('new', '1'); else u.searchParams.delete('new');
      window.history.replaceState(null, '', u.pathname + u.search);
    } catch { /* фильтр работает и без URL */ }
  };
  const [sort, setSort] = React.useState('default');
  // Пререндер и первый (гидратируемый) кадр показывают все работы — разметка
  // совпадает с HTML, а ссылки на товары видит робот. После монтирования
  // эффект ниже оставляет первые PAGE работ и кнопку «Показать ещё».
  const [limit, setLimit] = React.useState(Infinity);

  const pool = React.useMemo(
    () => (activeSeries ? visibleArtworks().filter((a: any) => a.series === activeSeries.id) : visibleArtworks()),
    [activeSeries],
  );

  const items = React.useMemo(() => {
    let r = pool.slice();
    if (subject !== 'all') r = r.filter((a: any) => a.subject === subject);
    if (onlyNew) r = r.filter((a: any) => !!a.added);
    const byChoice: Record<string, (a: any, b: any) => number> = {
      default: (a, b) => String(b.added || '').localeCompare(String(a.added || '')) || b.year - a.year || b.price - a.price,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      'size-desc': (a, b) => (b.w * b.h) - (a.w * a.h),
    };
    const cmp = byChoice[sort] || byChoice.default;
    // свободные — всегда первыми, внутри — выбранный порядок
    return r.sort((a, b) => Number(isFree(b)) - Number(isFree(a)) || cmp(a, b));
  }, [pool, subject, sort, onlyNew]);

  // при монтировании и при смене фильтра — снова первая страница
  React.useEffect(() => { setLimit(PAGE); }, [subject, sort, onlyNew]);

  const subjects = SUBJECTS.filter((s) => s.id === 'all' || pool.some((a: any) => a.subject === s.id));
  const free = pool.filter(isFree);
  const prices = free.map((a: any) => a.price).filter(Boolean);
  const sides = free.flatMap((a: any) => [a.w, a.h]).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const minSide = sides.length ? Math.min(...sides) : 0;
  const maxSide = sides.length ? Math.max(...sides) : 0;
  const allCount = visibleArtworks().length;

  const lead = activeSeries
    ? `${activeSeries.subtitle}. ${pool.length} ${plural(pool.length)} маслом на холсте, каждая — в единственном экземпляре, с подписью автора и сертификатом подлинности.`
    : `${free.length} ${pluralOf(free.length, ['оригинал', 'оригинала', 'оригиналов'])} с сертификатом подлинности — от миниатюр за ${formatPrice(minPrice)} до холстов ${maxSide} см. Каждая работа существует в одном экземпляре.`;

  const shown = items.slice(0, limit);
  const rest = items.length - shown.length;

  const subjectLabel = SUBJECTS.find((s) => s.id === subject)?.label;
  const filtered = subject !== 'all' || onlyNew;

  return (
    <div className="v2-page">
      <div className="v2-in">
        <Breadcrumbs items={activeSeries
          ? [
              { label: 'Главная', href: routeToPath('home') },
              { label: 'Каталог', href: routeToPath('catalog') },
              { label: activeSeries.title },
            ]
          : [
              { label: 'Главная', href: routeToPath('home') },
              { label: 'Каталог' },
            ]} />

        <div className="v2-cat-head">
          <div>
            <h1 className="v2-h1">{activeSeries ? activeSeries.h1 : 'Купить картину маслом в наличии'}</h1>
            <p className="v2-lead">{lead}</p>
          </div>
          <dl className="v2-cat-stats">
            <div><dt>{activeSeries ? 'Свободно' : 'В наличии'}</dt><dd>{free.length}</dd></div>
            <div><dt>Цены</dt><dd>{priceSpan(minPrice, maxPrice)}</dd></div>
            <div><dt>Размеры</dt><dd>{minSide && maxSide ? `${minSide}–${maxSide} см` : '—'}</dd></div>
          </dl>
        </div>

        {/* Серии — ссылки на свои адреса */}
        <nav className="v2-series" aria-label="Серии">
          <a href={routeToPath('catalog')} className="v2-series-pill" aria-current={series === 'all' ? 'page' : undefined}>
            Все работы <span>{allCount}</span>
          </a>
          {SERIES.map((s) => (
            <a key={s.id} href={routeToPath('catalog', { series: s.id })}
               className="v2-series-pill" aria-current={series === s.id ? 'page' : undefined}>
              <i aria-hidden="true" style={{ background: s.color }} />
              {s.title} <span>{seriesCount(s.id)}</span>
            </a>
          ))}
        </nav>

        {/* Фильтры — одной строкой над сеткой, без липкости */}
        <div className="v2-filters">
          <div className="v2-filter-group" role="group" aria-label="Сюжет">
            {subjects.map((s) => (
              <button key={s.id} type="button" aria-pressed={subject === s.id}
                      className={'chip' + (subject === s.id ? ' is-active' : '')}
                      onClick={() => setSubject(s.id)}>{s.id === 'all' ? 'Все сюжеты' : s.label}</button>
            ))}
            {freshCount() > 0 && !activeSeries && (
              <button type="button" aria-pressed={onlyNew}
                      className={'chip' + (onlyNew ? ' is-active' : '')}
                      onClick={() => setOnlyNew(!onlyNew)}>Новые — {freshCount()}</button>
            )}
          </div>
          <label className="v2-sort">
            <span>Сортировка</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="field">
              <option value="default">Сначала новые</option>
              <option value="price-asc">Сначала дешевле</option>
              <option value="price-desc">Сначала дороже</option>
              <option value="size-desc">Сначала крупные</option>
            </select>
          </label>
        </div>

        <p className="v2-count" aria-live="polite">
          {filtered
            ? <>Показано {items.length} {plural(items.length)}{subject !== 'all' && subjectLabel ? ` — ${subjectLabel.toLowerCase()}` : ''}{onlyNew ? ', только новые' : ''}{' · '}
                <button type="button" className="v2-linkbtn" onClick={() => { setSubject('all'); setOnlyNew(false); }}>сбросить фильтры</button></>
            : <>{items.length} {plural(items.length)}{free.length !== items.length ? `, из них свободно ${free.length}` : ''}</>}
        </p>

        <h2 className="sr-only">{activeSeries ? `Работы серии «${activeSeries.title}»` : 'Работы в каталоге'}</h2>

        {items.length === 0 ? (
          <div className="v2-empty">
            <p className="v2-h3">Ничего не нашли</p>
            <p>Попробуйте другой сюжет или посмотрите все работы.</p>
            <button type="button" className="btn btn-ghost" onClick={() => { setSubject('all'); setOnlyNew(false); }}>
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="mb-grid v2-cat-grid">
            {shown.map((art: any, i: number) => (
              <ArtCard key={art.id} art={art} index={i + 1} total={items.length} priority={i < 2} />
            ))}
            {rest <= 0 && (
              <a href={routeToPath('commission')} className="v2-order-tile">
                <span className="v2-order-kicker">Не нашли подходящую?</span>
                <span className="v2-order-title">Напишем картину под ваш размер и&nbsp;палитру</span>
                <span className="v2-order-text">2–3 эскиза до предоплаты. Пришлите фото стены — подскажем формат.</span>
                <span className="v2-order-cta">Заполнить бриф</span>
              </a>
            )}
          </div>
        )}

        {rest > 0 && (
          <div className="v2-more">
            <button type="button" className="btn btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
              Показать ещё {Math.min(rest, PAGE)} {plural(Math.min(rest, PAGE))}
            </button>
            <span>Показано {shown.length} из {items.length}</span>
          </div>
        )}

        {/* SEO-текст серии — в <details>, а не стеной */}
        {activeSeries && (
          <details open className="v2-about-series">
            <summary>О серии «{activeSeries.title}»</summary>
            <p>{activeSeries.seoText}</p>
          </details>
        )}

        {activeSeries && SERIES_INTERIORS[activeSeries.id] && (
          <section className="v2-rooms" aria-labelledby="rooms-h2">
            <h2 id="rooms-h2" className="v2-h2 v2-h2-sm">Куда впишется «{activeSeries.title}»</h2>
            <div className="mb-grid-wide">
              {SERIES_INTERIORS[activeSeries.id].map((r) => (
                <div key={r.room} className="v2-room" data-rev>
                  <h3 className="v2-h3">{r.room}</h3>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>
            <p className="v2-note">
              Сомневаетесь в размере и цвете — разбор с примерами в журнале:{' '}
              <a href={INTERIOR_GUIDE_URL}>как выбрать картину для гостиной</a>.
            </p>
          </section>
        )}

        <section className="v2-cat-links" aria-label="Подборки">
          <LinkStrip label="Подобрать" links={[['/kartina-v-gostinuyu', 'Картина в гостиную'], ['/kartina-v-spalnyu', 'В спальню'], ['/kartina-v-kabinet', 'В кабинет'], ['/podarok', 'В подарок']]} />
          <LinkStrip label="По сюжету" links={[['/catalog/more', 'Морской пейзаж'], ['/catalog/botanika', 'Цветы и растения'], ['/catalog/gory', 'Горы']]} />
          <LinkStrip label="Журнал" links={[[INTERIOR_GUIDE_URL, 'Как выбрать картину для гостиной'], ['/journal', 'Все статьи']]} />
        </section>

        <div className="v2-cta-band">
          <h2 className="v2-h2 v2-h2-sm">Не нашли подходящую — напишем под ваше место</h2>
          <p>Размер, палитра и сюжет — ваши. Мила предложит 2–3 эскиза, предоплата — только после утверждения.</p>
          <a href={routeToPath('commission')} className="btn btn-solid">Заказать картину</a>
        </div>
      </div>
    </div>
  );
}

export { CatalogPage };
export default CatalogPage;
