// ─────────────────────────────────────────────────────────────
// color-picker.tsx (Sprint 15) — выбор цвета «как в редакторах»:
// поле насыщенность/яркость + полоса тона + HEX + быстрые образцы.
// Без библиотек, pointer-события (мышь и палец), контролируемый value (#rrggbb).
// ─────────────────────────────────────────────────────────────
import React from 'react';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function hexToHsv(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [40, 0.5, 0.6];
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}

export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}

/** Быстрые образцы — палитра бренда + нейтрали + чистые тона (как «цвета по умолчанию» в редакторах). */
export const QUICK_SWATCHES = [
  '#ede5d6', '#d8c8a8', '#a08a4e', '#6f5c2b', '#5e4d3d', '#2a2520',
  '#d4a48a', '#8d5a44', '#b3c0c4', '#5e7480', '#bcc5a8', '#6f7d54',
  '#ffffff', '#9a9a9a', '#000000', '#c0392b', '#e67e22', '#f1c40f',
  '#27ae60', '#16a085', '#2980b9', '#8e44ad', '#d35400', '#1d3324',
];

interface Props { value: string; onChange: (hex: string) => void; onDone?: () => void }

export function ColorPicker({ value, onChange, onDone }: Props) {
  const [h, s, v] = hexToHsv(value);
  const [hue, setHue] = React.useState(h);         // тон живёт отдельно: при s=0 из hex его не восстановить
  const [hexText, setHexText] = React.useState(value.toUpperCase());
  React.useEffect(() => { setHexText(value.toUpperCase()); }, [value]);

  const emit = (nh: number, ns: number, nv: number) => onChange(hsvToHex(nh, ns, nv));

  // общий обработчик перетаскивания по прямоугольнику
  const drag = (el: HTMLElement, e: React.PointerEvent, fn: (x: number, y: number) => void) => {
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const at = (ev: { clientX: number; clientY: number }) => fn(clamp((ev.clientX - r.left) / r.width, 0, 1), clamp((ev.clientY - r.top) / r.height, 0, 1));
    at(e);
    const move = (ev: PointerEvent) => at(ev);
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };

  const pureHue = hsvToHex(hue, 1, 1);
  const knob: React.CSSProperties = {
    position: 'absolute', width: 18, height: 18, borderRadius: '50%', border: '2px solid #fff',
    boxShadow: '0 0 0 1px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.25)', transform: 'translate(-50%,-50%)', pointerEvents: 'none',
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--rule-soft)', borderRadius: 'var(--r-lg)', padding: 14, maxWidth: 420 }}>
      {/* поле насыщенность (X) × яркость (Y) */}
      <div role="slider" aria-label="Насыщенность и яркость" aria-valuetext={value}
           onPointerDown={(e) => drag(e.currentTarget, e, (x, y) => emit(hue, x, 1 - y))}
           style={{
             position: 'relative', height: 200, borderRadius: 'var(--r-md)', cursor: 'crosshair', touchAction: 'none',
             background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ${pureHue})`,
           }}>
        <div style={{ ...knob, left: `${s * 100}%`, top: `${(1 - v) * 100}%`, background: value }} />
      </div>
      {/* полоса тона */}
      <div role="slider" aria-label="Тон" aria-valuenow={Math.round(hue)} aria-valuemin={0} aria-valuemax={360}
           onPointerDown={(e) => drag(e.currentTarget, e, (x) => { const nh = x * 360; setHue(nh); emit(nh, s, v); })}
           style={{
             position: 'relative', height: 18, marginTop: 14, borderRadius: 999, cursor: 'pointer', touchAction: 'none',
             background: 'linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)',
           }}>
        <div style={{ ...knob, left: `${(hue / 360) * 100}%`, top: '50%', background: pureHue }} />
      </div>
      {/* превью + HEX + готово */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
        <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: value, border: '1px solid var(--rule-soft)', flexShrink: 0 }} />
        <input className="field mono" aria-label="Цвет в HEX" value={hexText} spellCheck={false}
               onChange={(e) => {
                 const t = e.target.value.toUpperCase(); setHexText(t);
                 if (/^#[0-9A-F]{6}$/.test(t)) { const [nh] = hexToHsv(t); setHue(nh); onChange(t.toLowerCase()); }
               }}
               style={{ width: 120, padding: '10px 12px', fontSize: 16 }} />
        {onDone && <button type="button" className="btn btn-solid" onClick={onDone} style={{ marginLeft: 'auto' }}>Готово</button>}
      </div>
      {/* быстрые образцы */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6, marginTop: 14 }}>
        {QUICK_SWATCHES.map((hex) => (
          <button key={hex} type="button" aria-label={`Цвет ${hex}`}
                  onClick={() => { const [nh] = hexToHsv(hex); setHue(nh); onChange(hex); }}
                  style={{
                    aspectRatio: '1', width: '100%', padding: 0, background: hex, cursor: 'pointer', borderRadius: '50%',
                    border: value.toLowerCase() === hex ? '3px solid var(--accent)' : '1px solid rgba(42,37,32,.18)',
                  }} />
        ))}
      </div>
    </div>
  );
}

export default ColorPicker;
