import React from 'react';
import { ArtCard, Breadcrumbs, Eyebrow, LinkStrip } from '../common/atoms';
import { SERIES, SUBJECTS, formatPrice, visibleArtworks } from '../common/data';
import { INTERIOR_GUIDE_URL, SERIES_INTERIORS, freshCount, freshStamp, plural, seriesCount } from '../common/seo';
import { routeToPath } from '../common/routes';

// ─────────────────────────────────────────────────────────────
// catalog.tsx — каталог (редизайн 2026, HANDOFF §9).
// Крошки → H1 → лид + сводка · переключатель серий пилюлями ·
// липкая полоса фильтров под шапкой · сетка карточек-паспарту ·
// плитка «напишем под ваш размер» · «О серии» в <details>.
// ─────────────────────────────────────────────────────────────

/** Реальная высота шапки — липкие элементы друг под другом считаются от неё (§13.15). */
function useHeaderHeight(): number {
  const [h, setH] = React.useState(77);
  React.useEffect(() => {
    const upd = () => {
      const el = document.querySelector('header');
      if (el) setH(Math.round(el.getBoundingClientRect().height));
    };
    upd();
    window.addEventListener('resize', upd);
    const t = setTimeout(upd, 300); // шапка перестраивается после гидратации
    return () => { window.removeEventListener('resize', upd); clearTimeout(t); };
  }, []);
  return h;
}

function CatalogPage({ go, initialSeries, initialOnlyNew = false }) {
  const [series, setSeriesRaw] = React.useState(initialSeries || 'all');
  const [subject, setSubject] = React.useState('all');
  // Sprint 15: фильтр серии живёт в ?series= — выбор переживает «назад» и шарится ссылкой.
  const setSeries = (id: string) => {
    setSeriesRaw(id);
    // Сюжет, которого в новой серии нет, оставлял пустую сетку: его пилюля
    // при этом исчезала из панели, и было непонятно, что вообще отфильтровано.
    setSubject((cur) => (cur === 'all' || id === 'all'
      || visibleArtworks().some((a) => a.series === id && a.subject === cur) ? cur : 'all'));
    try {
      const u = new URL(window.location.href);
      if (id === 'all') u.searchParams.delete('series'); else u.searchParams.set('series', id);
      window.history.replaceState(null, '', u.pathname + u.search);
    } catch { /* SSR/старые браузеры — фильтр работает и без URL */ }
  };
  // Sprint 16: пополнение — отдельный срез каталога. Признак новизны — поле added
  // в data.ts, а не отсутствие страницы в Store: последнее обнулится после импорта.
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
  const headerH = useHeaderHeight();

  const items = React.useMemo(() => {
    let r = visibleArtworks();
    if (series !== 'all') r = r.filter((a) => a.series === series);
    if (subject !== 'all') r = r.filter((a) => a.subject === subject);
    if (onlyNew) r = r.filter((a) => !!a.added);
    // Sprint 16: у сортировки по умолчанию не было ветки — список шёл в порядке
    // data.ts, то есть каталог открывался самыми старыми работами.
    if (sort === 'default') {
      r.sort((a, b) => String(b.added || '').localeCompare(String(a.added || ''))
        || b.year - a.year
        || b.price - a.price);
    }
    if (sort === 'price-asc') r.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') r.sort((a, b) => b.price - a.price);
    if (sort === 'size-desc') r.sort((a, b) => (b.w * b.h) - (a.w * a.h));
    if (sort === 'year-desc') r.sort((a, b) => b.year - a.year);
    return r;
  }, [series, subject, sort, onlyNew]);

  const total = visibleArtworks().length;
  const activeSeries = series !== 'all' ? SERIES.find((s) => s.id === series) : null;

  // Сводка: сколько работ, в каком диапазоне цен и размеров
  const pool = React.useMemo(
    () => (activeSeries ? visibleArtworks().filter((a) => a.series === activeSeries.id) : visibleArtworks()),
    [activeSeries],
  );
  const freeInPool = pool.filter((a) => a.status === 'available' && !a.commission).length;
  const prices = pool.map((a) => a.price).filter(Boolean);
  const sides = pool.flatMap((a) => [a.w, a.h]).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const minSide = sides.length ? Math.min(...sides) : 0;
  const maxSide = sides.length ? Math.max(...sides) : 0;

  const lead = activeSeries
    ? `${activeSeries.subtitle}. ${pool.length} ${plural(pool.length)} маслом на холсте, каждая — в единственном экземпляре.`
    : 'Оригиналы маслом на холсте в единственном экземпляре: пейзаж, море, ботаника, город. Отправляем по РФ с сертификатом подлинности.';

  return (
    <div className="fade-in mb-section" style={{ paddingTop: 'clamp(20px, 2.4vw, 36px)' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <Breadcrumbs items={activeSeries
          ? [
              { label: 'MBezu', href: routeToPath('home') },
              { label: 'Каталог', href: routeToPath('catalog') },
              { label: activeSeries.title },
            ]
          : [
              { label: 'MBezu', href: routeToPath('home') },
              { label: 'Каталог' },
            ]} />

        {/* Заголовок + лид · справа карточка сводки */}
        <div className="mb-cols" style={{ marginTop: 22, alignItems: 'flex-end', gap: 'clamp(22px, 3vw, 48px)' }}>
          <div style={{ flex: '2 1 460px' }}>
            <Eyebrow accent>{activeSeries ? `Серия · ${activeSeries.years}` : 'Каталог · оригиналы маслом'}</Eyebrow>
            <h1 className="display" style={{
              margin: '16px 0 0',
              fontSize: 'clamp(38px, 5.6vw, 84px)',
              lineHeight: .95, fontWeight: 500, letterSpacing: '-.038em',
            }}>
              {activeSeries
                ? activeSeries.h1
                : <>Купить картину маслом <span className="italic" style={{ color: 'var(--accent)', fontStyle: 'italic' }}>— в наличии</span></>}
            </h1>
            <p style={{
              margin: '18px 0 0', maxWidth: 620,
              fontSize: 'clamp(15.5px, 1.15vw, 18px)', lineHeight: 1.6,
              color: 'var(--ink-2)', fontWeight: 300,
            }}>{lead}</p>
          </div>

          <aside style={{
            flex: '1 1 260px', minWidth: 0,
            background: 'var(--bg-card)', border: '1px solid var(--rule-soft)',
            borderRadius: 'var(--r-lg)', padding: 'clamp(18px, 1.8vw, 26px)',
          }}>
            <div className="eyebrow">Сводка</div>
            <dl style={{ margin: '14px 0 0', display: 'grid', gap: 10 }}>
              {[
                ['Работ', `${pool.length} ${plural(pool.length)}`],
                // Sprint 16: свободных меньше, чем в каталоге — портреты питомцев
                // показаны как примеры услуги (status sold + commission).
                ...(freeInPool !== pool.length ? [['Свободно', `${freeInPool} ${plural(freeInPool)}`]] : []),
                ['Цена', minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} — ${formatPrice(maxPrice)}`],
                ['Размеры', `${minSide}–${maxSide} см по стороне`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'baseline' }}>
                  <dt className="cat-no" style={{ margin: 0 }}>{k}</dt>
                  <dd style={{ margin: 0, fontSize: 15, fontWeight: 500, textAlign: 'right' }}>{v}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        {/* Переключатель серий — пилюли с точкой серии и счётчиком */}
        <nav aria-label="Серии" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
          <button type="button" className={'chip' + (series === 'all' ? ' is-active' : '')}
                  aria-pressed={series === 'all'} onClick={() => setSeries('all')}>
            Все работы <span style={{ opacity: .7 }}>{total}</span>
          </button>
          {SERIES.map((s) => (
            <button key={s.id} type="button"
                    className={'chip' + (series === s.id ? ' is-active' : '')}
                    aria-pressed={series === s.id}
                    onClick={() => setSeries(s.id)}>
              <span aria-hidden="true" style={{
                width: 8, height: 8, borderRadius: '50%', background: s.color,
                display: 'inline-block', flexShrink: 0,
              }} />
              {s.title} <span style={{ opacity: .7 }}>{seriesCount(s.id)}</span>
            </button>
          ))}
        </nav>

        {/* Липкая полоса фильтров — top от реальной высоты шапки (§13.15) */}
        <div style={{
          position: 'sticky', top: headerH, zIndex: 40,
          margin: '18px 0 0',
          padding: '12px 0',
          background: 'rgba(237, 229, 214, .94)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--rule-soft)',
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: '1 1 320px', minWidth: 0 }}>
            {SUBJECTS
              .filter((s) => s.id === 'all' || series === 'all' || visibleArtworks().some((a) => a.series === series && a.subject === s.id))
              .map((s) => (
                <button key={s.id} type="button" aria-pressed={subject === s.id}
                        aria-label={`Сюжет: ${s.label}`}
                        className={'chip' + (subject === s.id ? ' is-active' : '')}
                        onClick={() => setSubject(s.id)}>{s.label}</button>
              ))}
          </div>
          {freshCount() > 0 && (
            <button type="button" aria-pressed={onlyNew}
                    aria-label={`Только пополнение: ${freshCount()} ${plural(freshCount())}`}
                    className={'chip' + (onlyNew ? ' is-active' : '')}
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setOnlyNew(!onlyNew)}>Новое · {freshCount()}</button>
          )}
          <span className="cat-no" style={{ whiteSpace: 'nowrap' }}>
            {items.length} {plural(items.length)}
          </span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="field"
                  aria-label="Сортировка работ"
                  style={{ width: 'auto', minHeight: 44, padding: '10px 16px', flex: '0 1 auto' }}>
            <option value="default">Сначала новые</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
            <option value="size-desc">По размеру</option>
          </select>
        </div>

        <h2 className="sr-only">{activeSeries ? `Работы серии «${activeSeries.title}»` : 'Работы в каталоге'}</h2>

        {items.length === 0 ? (
          <div style={{ padding: 'clamp(60px, 10vw, 120px) 20px', textAlign: 'center', color: 'var(--ink-3)' }}>
            <div className="display" style={{ fontSize: 'clamp(26px,3.4vw,36px)', color: 'var(--ink)', marginBottom: 16, letterSpacing: '-.02em' }}>
              Ничего не нашли
            </div>
            <div style={{ fontSize: 15 }}>Попробуйте сбросить фильтры или поменять серию</div>
            <button className="btn btn-ghost" style={{ marginTop: 24 }}
                    onClick={() => { setSeries('all'); setSubject('all'); }}>
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="mb-grid" style={{ marginTop: 28 }}>
            {items.map((art, i) => (
              <ArtCard key={art.id} art={art} index={i + 1} total={items.length} priority={i < 3} />
            ))}
            {/* Последняя ячейка — работа под размер покупателя (§9) */}
            <a href={routeToPath('commission')} className="mb-card mb-shimmer"
               style={{
                 textDecoration: 'none', background: 'var(--accent)', borderColor: 'var(--accent)',
                 color: 'var(--bg-cream)', padding: 'clamp(22px, 2.4vw, 32px)', justifyContent: 'center',
               }}>
              <span className="display" style={{ fontSize: 'clamp(21px,1.8vw,26px)', fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1.15 }}>
                Нет подходящего?<br />Напишем картину под ваш размер
              </span>
              <span className="mono" style={{ marginTop: 16, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase' }}>
                Заполнить бриф →
              </span>
            </a>
          </div>
        )}

        {/* SEO-текст серии — в <details>, а не стеной (§9) */}
        {activeSeries && (
          <details open style={{
            marginTop: 56, maxWidth: 900,
            borderTop: '1px solid var(--rule-soft)', paddingTop: 20,
          }}>
            <summary className="eyebrow" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>
              О серии
            </summary>
            <p style={{ margin: '12px 0 0', fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)', fontWeight: 300 }}>
              {activeSeries.seoText}
            </p>
          </details>
        )}

        {activeSeries && SERIES_INTERIORS[activeSeries.id] && (
          <section style={{ marginTop: 'clamp(48px, 6vw, 90px)' }}>
            <Eyebrow accent>В интерьере</Eyebrow>
            <h2 className="display" style={{ margin: '14px 0 26px', fontSize: 'clamp(26px,3.2vw,44px)', fontWeight: 500, letterSpacing: '-.02em' }}>
              Куда впишется «{activeSeries.title}»
            </h2>
            <div className="mb-grid-wide">
              {SERIES_INTERIORS[activeSeries.id].map((r) => (
                <div key={r.room} style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 26 }} data-rev>
                  <h3 className="display" style={{ margin: '0 0 10px', fontSize: 19, fontWeight: 500 }}>{r.room}</h3>
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink-2)' }}>{r.text}</p>
                </div>
              ))}
            </div>
            <p style={{ margin: '22px 0 0', fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.7 }}>
              Сомневаетесь в размере и цвете — разбор с примерами в журнале:{' '}
              <a href={INTERIOR_GUIDE_URL} className="uh-tap" style={{ color: 'var(--accent)' }}>как выбрать картину для гостиной</a>.
            </p>
          </section>
        )}

        <section style={{ marginTop: 'clamp(40px, 5vw, 72px)', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <LinkStrip label="Подобрать" links={[['/kartina-v-gostinuyu', 'картина в гостиную'], ['/kartina-v-spalnyu', 'в спальню'], ['/kartina-v-kabinet', 'в кабинет'], ['/podarok', 'в подарок']]} />
          <LinkStrip label="По сюжету" links={[['/catalog/more', 'морской пейзаж'], ['/catalog/botanika', 'цветы и растения'], ['/catalog/gory', 'горы']]} />
          <LinkStrip label="Журнал" links={[[INTERIOR_GUIDE_URL, 'как выбрать картину для гостиной'], ['/journal', 'все статьи']]} />
        </section>

        <div style={{
          marginTop: 'clamp(56px, 7vw, 100px)', padding: 'clamp(32px, 4vw, 60px) clamp(20px, 3vw, 40px)',
          background: 'var(--bg-soft)', borderRadius: 'var(--r-xl)',
          textAlign: 'center', border: '1px solid var(--rule-soft)',
        }}>
          <Eyebrow accent>Не нашли подходящее?</Eyebrow>
          <h2 className="display" style={{
            margin: '20px 0 24px', fontSize: 'clamp(28px, 4vw, 52px)',
            lineHeight: 1.05, fontWeight: 500, letterSpacing: '-.025em',
          }}>
            Картина под <span className="italic" style={{ color: 'var(--accent)' }}>ваше место</span>
          </h2>
          <a href={routeToPath('commission')} className="btn btn-solid" style={{ textDecoration: 'none' }}>
            Заказать индивидуально
          </a>
        </div>
      </div>
    </div>
  );
}

export { CatalogPage };
export default CatalogPage;
