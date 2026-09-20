import React from 'react';
import { PaintingPlate } from './adapter';
import { formatPrice, imageOf, seriesById, isCurved, dimsLabel, askAboutHref } from './data';
import { hasStorePage } from './store-urls';
import { averageRating, reviewsFor } from './reviews';
import { Stars } from './reviews-section';
import { cardSrcSet, type ImgSize } from './tilda-images';
import { routeToPath } from './routes';

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
// Sprint 15 (аудит): у крошки может быть настоящий href — тогда обработчик не нужен.
function Breadcrumbs({ items }: { items: Array<{ label: React.ReactNode; href?: string; onClick?: () => void }> }) {
  return (
    <nav aria-label="Хлебные крошки" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 12 }} className="mono">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'var(--ink-3)' }}>/</span>}
          {it.href || it.onClick ? (
            <a href={it.href || '#'}
               onClick={it.href ? undefined : (e) => { e.preventDefault(); it.onClick!(); }}
               style={{
                 color: i === items.length - 1 ? 'var(--ink)' : 'var(--ink-3)',
                 textDecoration: 'none',
                 letterSpacing: '.14em', textTransform: 'uppercase',
                 fontWeight: i === items.length - 1 ? 500 : 400,
               }}
               className="uh uh-tap">
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

/** alt для карточки: не только название — техника и размер тоже ищутся в картинках. */
function altFor(art: any): string {
  const kind = art.shape === 'round' ? 'круглая картина маслом'
    : art.shape === 'oval' ? 'овальная картина маслом'
    : 'картина маслом';
  return `${art.title}${art.subtitle ? '. ' + art.subtitle : ''} — ${kind}, ${dimsLabel(art)}`;
}

/** Подпись кнопки карточки — одна функция на видимый текст и на aria-label. */
function buyLabel(art: any, inStore: boolean): string {
  if (art.commission) return 'На заказ';
  if (art.status === 'sold') return 'Продано';
  return inStore ? 'Купить' : 'Спросить';
}

// ── ArtCard — карточка работы: паспарту (HANDOFF §6) ──────────
// Прозрачные webp разной пропорции в квадрате object-fit:contain давали
// случайное поле пустоты вокруг каждой работы — сетка выглядела дырявой.
// Паспарту делает эту пустоту осознанным полем.
// §13.5: кнопка не может лежать внутри <a> — контейнер <article>,
// внутри отдельная ссылка на изображение и отдельное действие в подвале.
function ArtCard({ art, index, total, size = 'thumb', priority = false }: { art: any; onOpen?: (id: string) => void; index?: number; total?: number; size?: ImgSize; priority?: boolean }) {
  const series = seriesById(art.series);
  // Работы, которых ещё нет в нативном Store, не ведут на /painting/<id>:
  // такой страницы на mbezu.ru нет (404). Их карточка открывает Telegram.
  const inStore = hasStorePage(art.id);
  const href = inStore ? routeToPath('painting', { id: art.id }) : askAboutHref(art);

  const src = imageOf(art, size);
  // §13.13: srcSet тем же резолвером, что и src. Дескрипторы — реальная ширина
  // файлов (card-widths.ts), а не зашитые 480/960/1200: см. cardSrcSet().
  const srcSet = cardSrcSet(art.id);
  const dims = dimsLabel(art);

  return (
    <article className="mb-card" data-rev>
      <a className="mb-card-link" href={href}>
        <div className="mb-mat">
          {src ? (
            <img src={src} srcSet={srcSet}
                 sizes="(max-width: 600px) 92vw, (max-width: 900px) 46vw, 30vw"
                 alt={altFor(art)}
                 loading={priority ? 'eager' : 'lazy'}
                 {...(priority ? { fetchpriority: 'high' } : {})}
                 decoding="async" />
          ) : (
            <PaintingPlate art={art} size={size} fit="bare" objectFit="contain" plain showMeta={false} />
          )}
          {/* «Новое» — по полю added (пополнение), а не по отсутствию страницы
              в Store: последнее обнулится после импорта. */}
          {art.commission ? <span className="mb-badge">На заказ</span>
            : art.status === 'sold' ? <span className="mb-badge">Продано</span>
            : art.featured ? <span className="mb-badge">Флагман</span>
            : art.added ? <span className="mb-badge">Новое</span> : null}
          <span className="mb-size">{dims}</span>
        </div>
        <div className="mb-card-body">
          <div className="cat-no" style={{ color: series?.color }}>
            {series?.title || ''}{art.year ? ` · ${art.year}` : ''}
          </div>
          <h3 className="mb-card-title">{art.title}</h3>
          {reviewsFor(art.id).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Stars rating={averageRating(reviewsFor(art.id))} size={13} />
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{reviewsFor(art.id).length}</span>
            </div>
          )}
        </div>
      </a>
      <div className="mb-card-foot">
        <span className="mb-card-price">{formatPrice(art.price)}</span>
        {/* WCAG 2.5.3: доступное имя обязано НАЧИНАТЬСЯ с видимого текста,
            иначе голосовое управление «нажми Спросить» не находит кнопку. */}
        <a className="mb-buy" href={href} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
           aria-label={`${buyLabel(art, inStore)} «${art.title}»`}>
          {buyLabel(art, inStore)}
        </a>
      </div>
      {index != null && total != null && <span className="sr-only">Работа {index} из {total}</span>}
    </article>
  );
}

// ── ArtRow — строка для view=list в каталоге ──────────────────
function ArtRow({ art, onOpen, index, total }: { art: any; onOpen?: (id: string) => void; index?: number; total?: number }) {
  const series = seriesById(art.series);
  return (
    <a
      className="resp-list-row"
      href={hasStorePage(art.id) ? routeToPath('painting', { id: art.id }) : askAboutHref(art)}
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 60px 1fr 1fr auto',
        gap: 28, padding: '20px 0',
        borderTop: '1px solid var(--rule-soft)',
        alignItems: 'center', cursor: 'pointer',
        textDecoration: 'none', color: 'inherit',
      }}>
      <div style={{ width: 80 }}>
        <PaintingPlate art={art} size="thumb" fit="bare"
                       style={{
                         aspectRatio: '1',
                         borderRadius: isCurved(art) ? '50%' : 'var(--r-sm)',
                       }} showMeta={false} />
      </div>
      <CatNo n={index} total={total} />
      <div>
        <h3 className="display" style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: '-.01em' }}>
          {art.title}
          {isCurved(art) && <span className="cat-no" style={{ marginLeft: 10, color: 'var(--accent)' }}>● ТОНДО</span>}
        </h3>
        <div className="cat-no" style={{ marginTop: 6, color: series?.color }}>{series?.title} · {art.year}</div>
      </div>
      <div className="resp-list-hide" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
        {dimsLabel(art)} · {art.medium}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span className="display" style={{ fontSize: 18, fontWeight: 500 }}>{formatPrice(art.price)}</span>
        <span style={{
          width: 32, height: 32, borderRadius: 'var(--r-pill)',
          border: '1px solid var(--rule)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }} aria-hidden="true">→</span>
      </div>
    </a>
  );
}

// Глобальная экспозиция компонентов


// ── LinkStrip — подборки ссылками (04.09 перелинковка) ────────
// Пункт Олега 20.09: блок был мелкой строкой текста — ссылки стали
// крупными пилюлями с обводкой, тач-цель 44px.
function LinkStrip({ label, links, style }: { label: React.ReactNode; links: Array<[string, string]>; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', ...style }}>
      <span className="eyebrow" style={{ flex: '0 0 auto' }}>{label}</span>
      {links.map(([href, text]) => (
        <a key={href} href={href} className="mb-pill">{text}</a>
      ))}
    </div>
  );
}

export { Eyebrow, CatNo, Breadcrumbs, PageTitle, StatusTag, ArtCard, ArtRow, LinkStrip };
