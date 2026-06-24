// ─────────────────────────────────────────────────────────────
// adapter.tsx — Tilda image adapter. PaintingPlate renders a real <img>
// when a photo exists, otherwise a palette-gradient placeholder.
// (Moved out of atoms per prod-T123 architecture: atoms без PaintingPlate.)
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { imageOf } from './data';
import type { ImgSize } from './tilda-images';

interface PaintingPlateProps {
  art: any;
  fit?: string;
  ratio?: string;
  size?: ImgSize;
  showMeta?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  priority?: boolean; // LCP image → eager + high fetchpriority
  sizes?: string;     // responsive sizes hint
  objectFit?: 'cover' | 'contain'; // Sprint 9: catalog cards use 'contain' (whole work visible on cream)
  plain?: boolean;    // Sprint 9: drop boxShadow/box — transparent webp floats on cream
  className?: string; // Sprint 9: e.g. 'art-card-img' for hover-zoom
}

export function PaintingPlate({ art, fit, ratio, size = 'large', showMeta = true, style, onClick, priority = false, sizes, objectFit = 'cover', plain = false, className }: PaintingPlateProps) {
  if (!art) return null;
  const isRound = art.shape === 'round';
  const src = imageOf ? imageOf(art, size) : null;
  const [c1, c2] = art.palette || ['#d9cfba', '#5a4a36'];

  const baseStyle: React.CSSProperties = {
    aspectRatio: isRound ? '1 / 1' : (ratio || (fit === 'bare' ? undefined : `${art.w} / ${art.h}`)),
    width: '100%',
    borderRadius: isRound ? '50%' : 'var(--r-md)',
    boxShadow: plain ? 'none' : 'var(--shadow-md)',
    cursor: onClick ? 'pointer' : 'default',
    overflow: 'hidden',
    position: 'relative',
    ...style,
  };

  // Если есть реальное фото — рендерим <img>
  if (src) {
    // srcSet must follow the SAME resolver as `src` (imageOf), else a stale
    // art.image (works-jpg) srcSet would win over a CDN card override.
    // Transparent webp cards are one file for every size → emit no srcSet
    // (browser falls back to `src`); only multi-size sources get a srcSet.
    const t = imageOf(art, 'thumb'), l = imageOf(art, 'large'), f = imageOf(art, 'full');
    const srcSet = (t && l && f && new Set([t, l, f]).size > 1)
      ? `${t} 320w, ${l} 768w, ${f} 1600w`
      : undefined;
    return (
      <div className={className} style={baseStyle} onClick={onClick}>
        <img src={src} srcSet={srcSet}
             sizes={sizes || '(max-width: 600px) 92vw, (max-width: 900px) 46vw, 30vw'}
             alt={art.title}
             loading={priority ? 'eager' : 'lazy'}
             fetchPriority={priority ? 'high' : undefined}
             decoding="async"
             style={{
               width: '100%', height: '100%',
               objectFit, display: 'block',
             }} />
        {showMeta && art.id && (
          <div style={{
            position: 'absolute',
            bottom: 14, left: 14, right: 14,
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'rgba(255,255,255,.85)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            textShadow: '0 1px 4px rgba(0,0,0,.5)',
          }}>
            <span>[{art.id}]</span>
            <span>{art.w}×{art.h} см</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback — placeholder градиент
  const bg = `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
  return (
    <div className={'ph-art' + (className ? ' ' + className : '')} style={{ ...baseStyle, background: bg }} onClick={onClick}>
      {showMeta && art.id && (
        <div className="ph-meta">
          <span>[{art.id}]</span>
          <span>{art.w}×{art.h} см</span>
        </div>
      )}
    </div>
  );
}
