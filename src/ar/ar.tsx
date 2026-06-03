// ─────────────────────────────────────────────────────────────
// ar.tsx — AR на базе <model-viewer> (отдельный lazy-чанк).
// Сейчас .glb/.usdz нет (ready:false) → рендерим placeholder.
// Тяжёлый @google/model-viewer импортируется ДИНАМИЧЕСКИ только когда ассеты готовы.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { Eyebrow } from '../common/atoms';

// ── Detect platform ──────────────────────────────────────────
export function detectPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

export function useArSupport() {
  const [state, setState] = React.useState<{ platform: string; ready: boolean }>({ platform: 'unknown', ready: false });
  React.useEffect(() => { setState({ platform: detectPlatform(), ready: true }); }, []);
  return state;
}

// ── Build asset paths (placeholder для финальных файлов) ─────
export function arAssets(art: any) {
  if (!art) return null;
  const base = `/assets/ar/${art.id.toLowerCase()}`;
  return {
    glb: `${base}.glb`,
    usdz: `${base}.usdz`,
    ready: false, // → true когда файлы реально лежат рядом
    title: art.title,
    artist: 'Mila Bezú',
    w: art.w,
    h: art.h,
  };
}

// ── QR-код через бесплатный сервис (для desktop fallback) ───
export function qrUrl(url: string, size = 280): string {
  const u = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${u}&margin=0&color=2a2520&bgcolor=f5efe2`;
}

// ── ArViewer — обёртка над <model-viewer> ───────────────────
export function ArViewer({ art, style, autoRotate = true, controls = true }: any) {
  const assets = arAssets(art);

  // model-viewer — тяжёлая зависимость. Грузим её динамически (lazy) только когда
  // у работы реально есть 3D-ассеты. Сейчас ready:false → не загружается вовсе.
  React.useEffect(() => {
    if (assets && assets.ready) {
      import('@google/model-viewer').catch(() => { /* offline / blocked — placeholder остаётся */ });
    }
  }, [assets && assets.ready]);

  if (!assets) return null;

  // Fallback пока нет реальных .glb/.usdz — показываем placeholder
  if (!assets.ready) {
    return (
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        background: `linear-gradient(135deg, ${(art.palette || ['#d9cfba'])[0]}, ${(art.palette || ['#5a4a36', '#5a4a36'])[1]})`,
        borderRadius: 'var(--r-md)', overflow: 'hidden',
        display: 'grid', placeItems: 'center',
        ...style,
      }}>
        <div style={{ textAlign: 'center', color: 'rgba(245,239,226,.88)', padding: 32 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.32em', marginBottom: 14, opacity: .7 }}>
            3D · AR-MODEL
          </div>
          <div className="display" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-.02em' }}>{art.title}</div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.18em', marginTop: 14, opacity: .7 }}>
            {art.w} × {art.h} см · placeholder
          </div>
          <div className="mono" style={{
            marginTop: 24, fontSize: 9.5, letterSpacing: '.16em',
            padding: '6px 14px', background: 'rgba(0,0,0,.25)',
            borderRadius: 'var(--r-pill)', display: 'inline-block',
          }}>
            ▶ AR-готовность: ждём .glb/.usdz
          </div>
        </div>
      </div>
    );
  }

  // Когда файлы готовы — рендерим настоящий model-viewer
  return React.createElement('model-viewer', {
    src: assets.glb,
    'ios-src': assets.usdz,
    alt: `${assets.title} — масло, ${art.w}×${art.h} см`,
    ar: true,
    'ar-modes': 'webxr scene-viewer quick-look',
    'ar-scale': 'fixed',
    'camera-controls': controls,
    'auto-rotate': autoRotate,
    'shadow-intensity': 0.8,
    'environment-image': 'neutral',
    poster: '',
    style: { width: '100%', height: '100%', ...style },
  });
}

// ── ArButton — кнопка-CTA «Попробовать на стене» ────────────
export function ArButton({ art, label, small }: any) {
  const { platform, ready } = useArSupport();
  const assets = arAssets(art);
  if (!ready || !assets) return null;

  const text = label || (platform === 'ios' ? 'Открыть на iPhone' :
    platform === 'android' ? 'Открыть на Android' :
      'Примерить на стене');

  if (platform === 'ios' && assets.ready) {
    return (
      <a className="ar-btn" rel="ar" href={assets.usdz}>
        <span className="ar-icon">▣</span>
        <span>{text}</span>
      </a>
    );
  }
  if (platform === 'android' && assets.ready) {
    const intent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(window.location.origin + assets.glb)}&mode=ar_preferred&title=${encodeURIComponent(assets.title)}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
    return (
      <a className="ar-btn" href={intent}>
        <span className="ar-icon">▣</span>
        <span>{text}</span>
      </a>
    );
  }

  return (
    <button
      className="ar-btn"
      onClick={() => {
        const el = document.getElementById('ar-block');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }}
      style={small ? { padding: '14px 22px', fontSize: 11 } : undefined}
    >
      <span className="ar-icon" style={small ? { width: 28, height: 28, fontSize: 12 } : undefined}>▣</span>
      <span>{text}</span>
    </button>
  );
}

// ── QrBlock — QR + инструкция «Отсканируйте телефоном» ──────
export function QrBlock({ art }: any) {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?ar=${art.id}`
    : '';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 28,
      padding: 28,
      background: 'var(--bg-card)',
      borderRadius: 'var(--r-lg)',
      border: '1px solid var(--rule-soft)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 128, height: 128, flexShrink: 0,
        background: 'var(--bg-card)', borderRadius: 'var(--r-md)',
        padding: 8, border: '1px solid var(--rule-soft)',
      }}>
        <img src={qrUrl(url, 256)} alt="QR-код для открытия в AR"
             style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      <div>
        <Eyebrow accent>На десктопе</Eyebrow>
        <div className="display" style={{
          fontSize: 18, fontWeight: 500, lineHeight: 1.3, marginTop: 10, letterSpacing: '-.005em',
        }}>
          Отсканируйте<br/>
          камерой телефона
        </div>
        <div className="cat-no" style={{ marginTop: 10 }}>
          Камера айфона или Android · откроет AR
        </div>
      </div>
    </div>
  );
}
