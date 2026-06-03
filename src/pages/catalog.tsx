import React from 'react';
import { ArtCard, ArtRow, Breadcrumbs, Eyebrow } from '../common/atoms';
import { ARTWORKS, SERIES, SUBJECTS } from '../common/data';

// ─────────────────────────────────────────────────────────────
// page-catalog.jsx — каталог в стилистике Swiss-сетки.
// 12-колонок · mono-индексы · фильтры + сортировка + grid/list.
// ─────────────────────────────────────────────────────────────

function CatalogPage({ go, density, initialSeries }) {
  const [series, setSeries] = React.useState(initialSeries || 'all');
  const [subject, setSubject] = React.useState('all');
  const [sort, setSort] = React.useState('default');
  const [view, setView] = React.useState('grid');

  const items = React.useMemo(() => {
    let r = ARTWORKS.slice();
    if (series !== 'all') r = r.filter((a) => a.series === series);
    if (subject !== 'all') r = r.filter((a) => a.subject === subject);
    if (sort === 'price-asc') r.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') r.sort((a, b) => b.price - a.price);
    if (sort === 'size-desc') r.sort((a, b) => (b.w * b.h) - (a.w * a.h));
    if (sort === 'year-desc') r.sort((a, b) => b.year - a.year);
    return r;
  }, [series, subject, sort]);

  const gridCols = density === 'compact' ? 4 : (density === 'comfy' ? 2 : 3);

  return (
    <div className="fade-in resp-pad" style={{ padding: '40px 40px 80px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <Breadcrumbs items={[
          { label: 'M.BEZ', onClick: () => go('home') },
          { label: 'Каталог' },
        ]} />

        {/* Hero strip: H1 + counter */}
        <div style={{
          marginTop: 36, paddingBottom: 28,
          borderBottom: '1px solid var(--ink)',
          display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 24, alignItems: 'end',
        }} className="reveal r1 resp-stack-12">
          <div style={{ gridColumn: '1 / 9' }}>
            <Eyebrow accent>§ 01 · index · 2026</Eyebrow>
            <h1 className="display resp-display-md" style={{
              margin: '20px 0 0',
              fontSize: 'clamp(56px, 9vw, 144px)',
              lineHeight: 0.92, fontWeight: 500, letterSpacing: '-.04em',
            }}>
              Каталог,<br/><span className="italic" style={{ color: 'var(--accent)', fontStyle: 'italic' }}>в наличии.</span>
            </h1>
          </div>
          <div style={{ gridColumn: '9 / 13', textAlign: 'right' }}>
            <div className="cat-no" style={{ fontSize: 12 }}>всего · {ARTWORKS.length} работ</div>
            <div className="display" style={{
              fontSize: 56, fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1, color: 'var(--accent)',
              marginTop: 12,
            }}>{String(items.length).padStart(2, '0')}/{String(ARTWORKS.length).padStart(2, '0')}</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="reveal r2" style={{
          marginTop: 40,
          display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24,
          paddingBottom: 28, borderBottom: '1px solid var(--rule-soft)',
        }}>
          {/* Subject chips */}
          <div style={{ gridColumn: '1 / 9' }} className="resp-scroll-x" >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUBJECTS.map((s) => (
                <button key={s.id}
                        className={'chip' + (subject === s.id ? ' is-active' : '')}
                        onClick={() => setSubject(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {/* Series select + sort */}
          <div style={{
            gridColumn: '9 / 13', display: 'flex', gap: 10, justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }} className="resp-flex-col">
            <select value={series} onChange={(e) => setSeries(e.target.value)} className="field" aria-label="Фильтр по серии"
                    style={{ width: 'auto', padding: '12px 18px', fontSize: 13 }}>
              <option value="all">Все серии</option>
              {SERIES.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="field" aria-label="Сортировка"
                    style={{ width: 'auto', padding: '12px 18px', fontSize: 13 }}>
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
                        border: 0, padding: '12px 18px', fontFamily: 'var(--mono)',
                        fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}>Сетка</button>
              <button onClick={() => setView('list')}
                      style={{
                        background: view === 'list' ? 'var(--ink)' : 'transparent',
                        color: view === 'list' ? 'var(--bg)' : 'var(--ink)',
                        border: 0, padding: '12px 18px', fontFamily: 'var(--mono)',
                        fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}>Список</button>
            </div>
          </div>
        </div>

        <h2 className="sr-only">Работы в каталоге</h2>
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
          <div className="reveal r3"
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
