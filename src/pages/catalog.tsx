import React from 'react';
import { ArtCard, ArtRow, Breadcrumbs, Eyebrow } from '../common/atoms';
import { ARTWORKS, SERIES, SUBJECTS, visibleArtworks } from '../common/data';
import { INTERIOR_GUIDE_URL, SERIES_INTERIORS, plural } from '../common/seo';
import { routeToPath } from '../common/routes';

// ─────────────────────────────────────────────────────────────
// page-catalog.jsx — каталог в стилистике Swiss-сетки.
// 12-колонок · mono-индексы · фильтры + сортировка + grid/list.
// ─────────────────────────────────────────────────────────────

function CatalogPage({ go, density, initialSeries }) {
  const [series, setSeriesRaw] = React.useState(initialSeries || 'all');
  // Sprint 15 (аудит, мелочь 11): фильтр серии живёт в ?series= — выбор
  // переживает возврат «назад» и им можно поделиться ссылкой.
  const setSeries = (id) => {
    setSeriesRaw(id);
    try {
      const u = new URL(window.location.href);
      if (id === 'all') u.searchParams.delete('series'); else u.searchParams.set('series', id);
      window.history.replaceState(null, '', u.pathname + u.search);
    } catch { /* SSR/старые браузеры — фильтр работает и без URL */ }
  };
  const [subject, setSubject] = React.useState('all');
  const [sort, setSort] = React.useState('default');
  const [view, setView] = React.useState('grid');

  const items = React.useMemo(() => {
    let r = visibleArtworks();
    if (series !== 'all') r = r.filter((a) => a.series === series);
    if (subject !== 'all') r = r.filter((a) => a.subject === subject);
    if (sort === 'price-asc') r.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') r.sort((a, b) => b.price - a.price);
    if (sort === 'size-desc') r.sort((a, b) => (b.w * b.h) - (a.w * a.h));
    if (sort === 'year-desc') r.sort((a, b) => b.year - a.year);
    return r;
  }, [series, subject, sort]);

  const gridCols = density === 'compact' ? 4 : (density === 'comfy' ? 2 : 3);
  const total = visibleArtworks().length;
  // Sprint 14 (Ф6): серия из URL /catalog/<slug> → лендинг серии (H1 + текст + крошки)
  const activeSeries = series !== 'all' ? SERIES.find((s) => s.id === series) : null;

  return (
    <div className="fade-in resp-pad" style={{ padding: '40px 40px 80px' }}>
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

        {/* Hero strip: H1 + counter. Sprint 15 (моб. аудит): cat-hero сжимает отступы —
            первая работа была на 2.3 экрана ниже верха */}
        <div style={{
          marginTop: 36, paddingBottom: 28,
          borderBottom: '1px solid var(--ink)',
          display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 24, alignItems: 'end',
        }} className="reveal r1 resp-stack-12 cat-hero">
          <div style={{ gridColumn: '1 / 9' }}>
            <Eyebrow accent>{activeSeries ? `Серия · ${activeSeries.years}` : '§ 01 · index · 2026'}</Eyebrow>
            <h1 className="display resp-display-md" style={{
              margin: '20px 0 0',
              fontSize: activeSeries ? 'clamp(40px, 6vw, 88px)' : 'clamp(56px, 9vw, 144px)',
              lineHeight: 0.95, fontWeight: 500, letterSpacing: '-.04em',
            }}>
              {activeSeries
                ? activeSeries.h1
                : <>Купить картину{' '}<br/>маслом <span className="italic" style={{ color: 'var(--accent)', fontStyle: 'italic' }}>— в наличии</span></>}
            </h1>
          </div>
          {/* Sprint 15 (моб. аудит): декоративный счётчик скрыт на мобиле (съедал пол-экрана),
              «21 работ» → правильное склонение */}
          <div style={{ gridColumn: '9 / 13', textAlign: 'right' }} className="hide-mobile">
            <div className="cat-no" style={{ fontSize: 12 }}>всего · {total} {plural(total)}</div>
            <div className="display" style={{
              fontSize: 56, fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1, color: 'var(--accent)',
              marginTop: 12,
            }}>{String(items.length).padStart(2, '0')}/{String(total).padStart(2, '0')}</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="reveal r2 resp-stack-12 cat-filter" style={{
          marginTop: 40,
          display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24,
          paddingBottom: 28, borderBottom: '1px solid var(--rule-soft)',
        }}>
          {/* Subject chips. Sprint 15 (моб. аудит): resp-scroll-x на flex-контейнере —
              на мобиле чипы в одну прокручиваемую строку вместо 4 рядов */}
          <div style={{ gridColumn: '1 / 9' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} className="resp-scroll-x">
              {SUBJECTS.filter((s) => s.id === 'all' || series === 'all' || visibleArtworks().some((a) => a.series === series && a.subject === s.id)).map((s) => (
                <button key={s.id}
                        className={'chip' + (subject === s.id ? ' is-active' : '')}
                        onClick={() => setSubject(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {/* Series select + sort */}
          {/* Sprint 15 (моб. аудит): catalog-controls — селекты парой в ряд вместо трёх этажей */}
          <div style={{
            gridColumn: '9 / 13', display: 'flex', gap: 10, justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }} className="catalog-controls">
            <select value={series} onChange={(e) => setSeries(e.target.value)} className="field" aria-label="Фильтр по серии"
                    style={{ width: 'auto', padding: '12px 18px', fontSize: 16 }}>
              <option value="all">Все серии</option>
              {SERIES.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="field" aria-label="Сортировка"
                    style={{ width: 'auto', padding: '12px 18px', fontSize: 16 }}>
              <option value="default">Сначала новые</option>
              <option value="price-asc">Цена ↑</option>
              <option value="price-desc">Цена ↓</option>
              <option value="size-desc">По размеру</option>
              <option value="year-desc">По году</option>
            </select>
            <div style={{ display: 'flex', borderRadius: 'var(--r-pill)', overflow: 'hidden', border: '1px solid var(--rule)' }}>
              <button onClick={() => setView('grid')}
                      style={{
                        background: view === 'grid' ? 'var(--ink)' : 'transparent',
                        color: view === 'grid' ? 'var(--bg)' : 'var(--ink)',
                        border: 0, padding: '14px 18px', minHeight: 44, fontFamily: 'var(--mono)',
                        fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}>Сетка</button>
              <button onClick={() => setView('list')}
                      style={{
                        background: view === 'list' ? 'var(--ink)' : 'transparent',
                        color: view === 'list' ? 'var(--bg)' : 'var(--ink)',
                        border: 0, padding: '14px 18px', minHeight: 44, fontFamily: 'var(--mono)',
                        fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}>Список</button>
            </div>
          </div>
        </div>

        <h2 className="sr-only">{activeSeries ? `Работы серии «${activeSeries.title}»` : 'Работы в каталоге'}</h2>
        {/* Results */}
        {items.length === 0 ? (
          <div style={{
            padding: '120px 40px', textAlign: 'center',
            color: 'var(--ink-3)',
          }}>
            <div className="display" style={{ fontSize: 36, color: 'var(--ink)', marginBottom: 16, letterSpacing: '-.02em' }}>
              Ничего не нашли
            </div>
            <div style={{ fontSize: 15 }}>Попробуйте сбросить фильтры или поменять серию</div>
            <button className="btn btn-ghost" style={{ marginTop: 24 }}
                    onClick={() => { setSeries('all'); setSubject('all'); }}>
              Сбросить фильтры
            </button>
          </div>
        ) : view === 'grid' ? (
          <div className="reveal r3 cat-grid"
               style={{
                 marginTop: 48,
                 display: 'grid',
                 gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                 gap: '56px 36px',
               }}
               data-cols={gridCols}>
            <style>{`
              @media (max-width: 900px) { [data-cols] { grid-template-columns: repeat(2, 1fr) !important; } }
              @media (max-width: 600px) { [data-cols] { grid-template-columns: 1fr !important; } }
            `}</style>
            {items.map((art, i) => (
              <ArtCard key={art.id} art={art} index={i + 1} total={items.length}
                       priority={i < 3}
                       onOpen={(id) => go('painting', { id })} />
            ))}
          </div>
        ) : (
          <div className="reveal r3" style={{ marginTop: 32 }}>
            {items.map((art, i) => (
              <ArtRow key={art.id} art={art} index={i + 1} total={items.length}
                      onOpen={(id) => go('painting', { id })} />
            ))}
          </div>
        )}

        {/* Sprint 14 (Ф6) + аудит r2: SEO-текст серии под сеткой — первая работа в первом экране */}
        {activeSeries && (
          <section style={{ marginTop: 72, maxWidth: 900 }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)', fontWeight: 300 }}>
              {activeSeries.seoText}
            </p>
          </section>
        )}

        {/* Sprint 15 (план роста, шаг 6): интерьерный интент на посадочных серий */}
        {activeSeries && SERIES_INTERIORS[activeSeries.id] && (
          <section style={{ marginTop: 90 }}>
            <Eyebrow accent>В интерьере</Eyebrow>
            <h2 className="display" style={{ margin: '14px 0 26px', fontSize: 'clamp(28px,3.4vw,44px)', fontWeight: 500, letterSpacing: '-.02em' }}>
              Куда впишется «{activeSeries.title}»
            </h2>
            <div className="resp-stack-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {SERIES_INTERIORS[activeSeries.id].map((r) => (
                <div key={r.room} style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 26 }}>
                  <h3 className="display" style={{ margin: '0 0 10px', fontSize: 19, fontWeight: 500 }}>{r.room}</h3>
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink-2)' }}>{r.text}</p>
                </div>
              ))}
            </div>
            <p style={{ margin: '22px 0 0', fontSize: 14.5, color: 'var(--ink-2)' }}>
              Сомневаетесь в размере и цвете — разбор с примерами в журнале:{' '}
              <a href={INTERIOR_GUIDE_URL} className="uh-tap" style={{ color: 'var(--accent)' }}>как выбрать картину для гостиной</a>.
              Ищете подарок — <a href="/podarok" className="uh-tap" style={{ color: 'var(--accent)' }}>картина в подарок</a>.
              Подборки по комнатам: <a href="/kartina-v-gostinuyu" className="uh-tap" style={{ color: 'var(--accent)' }}>в гостиную</a>, <a href="/kartina-v-spalnyu" className="uh-tap" style={{ color: 'var(--accent)' }}>в спальню</a>, <a href="/kartina-v-kabinet" className="uh-tap" style={{ color: 'var(--accent)' }}>в кабинет</a>.
            </p>
          </section>
        )}

        {/* CTA at the end */}
        <div style={{
          marginTop: 100, padding: '60px 40px',
          background: 'var(--bg-soft)', borderRadius: 'var(--r-xl)',
          textAlign: 'center', border: '1px solid var(--rule-soft)',
        }}>
          <Eyebrow accent>Не нашли подходящее?</Eyebrow>
          <h2 className="display" style={{
            margin: '20px 0 24px', fontSize: 'clamp(32px, 4vw, 52px)',
            lineHeight: 1.05, fontWeight: 500, letterSpacing: '-.025em',
          }}>
            Картина под <span className="italic" style={{ color: 'var(--accent)' }}>ваше место.</span>
          </h2>
          <button className="btn btn-solid" onClick={() => go('commission')}>
            Заказать индивидуально
          </button>
        </div>
      </div>
    </div>
  );
}

export { CatalogPage };
export default CatalogPage;
