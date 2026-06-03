import React from 'react';
import { PaintingPlate } from './adapter';
import { formatPrice, seriesById } from './data';
import type { ImgSize } from './tilda-images';

// ─────────────────────────────────────────────────────────────
// atoms.jsx — общие компоненты сайта M.Bez.
// Maison-палитра, Inter Tight, увеличенные радиусы и мягкие тени.
// ─────────────────────────────────────────────────────────────

// ── Eyebrow (mono-надбровь над заголовками) ───────────────────
function Eyebrow({ children, accent, style }: { children?: React.ReactNode; accent?: boolean; style?: React.CSSProperties }) {
  return (
    <span className={'eyebrow' + (accent ? ' accent' : '')} style={style}>
      {children}
    </span>
  );
}

// ── Cat. No — каталожный индекс (mono) ────────────────────────
function CatNo({ n, total }: { n: number | string; total?: number | string }) {
  const pad = String(n).padStart(3, '0');
  return (
    <span className="cat-no">
      cat. № {pad}{total ? ` / ${String(total).padStart(3, '0')}` : ''}
    </span>
  );
}

// ── Breadcrumbs ───────────────────────────────────────────────
function Breadcrumbs({ items }: { items: Array<{ label: React.ReactNode; onClick?: () => void }> }) {
  return (
    <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 12 }} className="mono">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'var(--ink-3)' }}>/</span>}
          {it.onClick ? (
            <a href="#" onClick={(e) => { e.preventDefault(); it.onClick(); }}
               style={{
                 color: i === items.length - 1 ? 'var(--ink)' : 'var(--ink-3)',
                 textDecoration: 'none',
                 letterSpacing: '.14em', textTransform: 'uppercase',
                 fontWeight: i === items.length - 1 ? 500 : 400,
               }}
               className="uh">
              {it.label}
            </a>
          ) : (
            <span style={{
              color: i === items.length - 1 ? 'var(--ink)' : 'var(--ink-3)',
              letterSpacing: '.14em', textTransform: 'uppercase',
              fontWeight: i === items.length - 1 ? 500 : 400,
            }}>{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ── PageTitle — кикер + крупный H1 + лид ──────────────────────
function PageTitle({ kicker, title, lead, align }: { kicker?: React.ReactNode; title?: React.ReactNode; lead?: React.ReactNode; align?: React.CSSProperties['textAlign'] }) {
  return (
    <header style={{ textAlign: align || 'left' }}>
      {kicker && <div style={{ marginBottom: 20 }}><Eyebrow accent>{kicker}</Eyebrow></div>}
      <h1 className="display resp-h1" style={{
        margin: 0,
        fontSize: 'clamp(44px, 7vw, 96px)',
        lineHeight: 0.95,
        fontWeight: 500,
        letterSpacing: '-.03em',
      }}>{title}</h1>
      {lead && (
        <p style={{
          margin: '28px 0 0', maxWidth: 640,
          fontSize: 17, lineHeight: 1.55,
          color: 'var(--ink-2)', fontWeight: 300,
        }}>{lead}</p>
      )}
    </header>
  );
}

// ── StatusTag — индикатор available / reserved / sold ─────────
function StatusTag({ status }: { status?: string }) {
  const map = {
    available: { label: 'в наличии', c1: 'var(--accent)', c2: 'var(--bg)' },
    reserved:  { label: 'забронировано', c1: 'var(--ink-3)', c2: 'var(--bg)' },
    sold:      { label: 'продано', c1: 'var(--ink)', c2: 'var(--bg)' },
  };
  const s = map[status] || map.available;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 14px',
      background: s.c1, color: s.c2,
      borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--mono)', fontSize: 10,
      letterSpacing: '.18em', textTransform: 'uppercase',
      fontWeight: 500,
    }}>{s.label}</span>
  );
}

// ── ArtCard — карточка работы для каталога/сетки ──────────────
function ArtCard({ art, onOpen, index, total, size = 'thumb' }: { art: any; onOpen?: (id: string) => void; index?: number; total?: number; size?: ImgSize }) {
  const series = seriesById(art.series);
  const isRound = art.shape === 'round';
  return (
    <article className="lift" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14 }}
             onClick={() => onOpen && onOpen(art.id)}>
      <div style={{ position: 'relative' }}>
        {isRound ? (
          // Для круглых работ — квадратный контейнер с центрированным кругом
          <div style={{
            aspectRatio: '3 / 4',
            background: 'var(--bg-soft)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8% 0',
          }}>
            <div style={{ width: '78%', aspectRatio: '1 / 1' }}>
              <PaintingPlate art={art} size={size} fit="bare" showMeta={false} />
            </div>
          </div>
        ) : (
          <PaintingPlate art={art} size={size} fit="bare"
                         style={{ aspectRatio: '3 / 4' }} showMeta={false} />
        )}
        {art.featured && (
          <span style={{
            position: 'absolute', top: 14, left: 14,
            background: 'var(--accent)', color: 'var(--bg)',
            padding: '6px 12px', borderRadius: 'var(--r-pill)',
            fontFamily: 'var(--mono)', fontSize: 9.5,
            letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 600,
          }}>Флагман</span>
        )}
        {isRound && (
          <span style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(245,239,226,.9)', color: 'var(--ink)',
            padding: '6px 12px', borderRadius: 'var(--r-pill)',
            fontFamily: 'var(--mono)', fontSize: 9.5,
            letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 600,
            backdropFilter: 'blur(8px)',
          }}>● Тондо</span>
        )}
      </div>
      <div style={{ paddingTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          {index != null && <CatNo n={index} total={total} />}
          <span className="cat-no" style={{ color: series?.color, opacity: .8 }}>
            {series?.title?.split(' ')[0] || ''}
          </span>
        </div>
        <h3 className="display" style={{ margin: '4px 0 6px', fontSize: 22, fontWeight: 500, letterSpacing: '-.01em' }}>
          {art.title}
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, fontSize: 13, color: 'var(--ink-2)' }}>
          <span>{isRound ? `⌀ ${art.w} см` : `${art.w}×${art.h} см`} · {art.year}</span>
          <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{formatPrice(art.price)}</span>
        </div>
      </div>
    </article>
  );
}

// ── ArtRow — строка для view=list в каталоге ──────────────────
function ArtRow({ art, onOpen, index, total }: { art: any; onOpen?: (id: string) => void; index?: number; total?: number }) {
  const series = seriesById(art.series);
  const isRound = art.shape === 'round';
  return (
    <article
      className="resp-list-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 60px 1fr 1fr auto',
        gap: 28, padding: '20px 0',
        borderTop: '1px solid var(--rule-soft)',
        alignItems: 'center', cursor: 'pointer',
      }}
      onClick={() => onOpen && onOpen(art.id)}>
      <div style={{ width: 80 }}>
        <PaintingPlate art={art} size="thumb" fit="bare"
                       style={{
                         aspectRatio: '1',
                         borderRadius: isRound ? '50%' : 'var(--r-sm)',
                       }} showMeta={false} />
      </div>
      <CatNo n={index} total={total} />
      <div>
        <h3 className="display" style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: '-.01em' }}>
          {art.title}
          {isRound && <span className="cat-no" style={{ marginLeft: 10, color: 'var(--accent)' }}>● ТОНДО</span>}
        </h3>
        <div className="cat-no" style={{ marginTop: 6, color: series?.color }}>{series?.title} · {art.year}</div>
      </div>
      <div className="resp-list-hide" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
        {isRound ? `⌀ ${art.w} см` : `${art.w}×${art.h} см`} · {art.medium}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span className="display" style={{ fontSize: 18, fontWeight: 500 }}>{formatPrice(art.price)}</span>
        <span style={{
          width: 32, height: 32, borderRadius: 'var(--r-pill)',
          border: '1px solid var(--rule)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>→</span>
      </div>
    </article>
  );
}

// Глобальная экспозиция компонентов

export { Eyebrow, CatNo, Breadcrumbs, PageTitle, StatusTag, ArtCard, ArtRow };
