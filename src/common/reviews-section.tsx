// ─────────────────────────────────────────────────────────────
// reviews-section.tsx (Sprint 15) — система отзывов: звёзды, секция,
// форма сбора. Данные — в reviews.ts (только реальные покупатели).
//
// Отзыв уезжает приёмником A (152-ФЗ: ПД → Входящие Tilda, не Telegram):
// message = текст отзыва, notes = «Оценка: N/5», source = 'review'.
// JSON-LD Review/AggregateRating рендерится ТОЛЬКО при непустом REVIEWS.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { REVIEWS, averageRating, reviewsFor } from './reviews';
import { submitLead, leadRef, HONEYPOT_FIELD } from '../lib/tildaLead';

// ── звёзды ───────────────────────────────────────────────────
export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span aria-label={`Оценка ${rating} из 5`} style={{ display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
             fill={i <= Math.round(rating) ? 'var(--accent)' : 'none'}
             stroke="var(--accent)" strokeWidth="1.4">
          <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
        </svg>
      ))}
    </span>
  );
}

function StarsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = React.useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label="Ваша оценка" style={{ display: 'inline-flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i}
                aria-label={`${i} из 5`}
                onClick={() => onChange(i)}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
                style={{ background: 'none', border: 'none', padding: 7, cursor: 'pointer', lineHeight: 0 }}>
          <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden="true"
               fill={i <= shown ? 'var(--accent)' : 'none'} stroke="var(--accent)" strokeWidth="1.4">
            <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── карточка отзыва ──────────────────────────────────────────
function ReviewCard({ name, city, rating, text, date, source, sourceUrl }: {
  name: string; city?: string; rating: number; text: string; date: string; source?: string; sourceUrl?: string;
}) {
  const d = new Date(date);
  const when = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  return (
    <figure style={{ margin: 0, background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 26 }}>
      <Stars rating={rating} />
      <blockquote style={{ margin: '14px 0 18px', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>
        {text}
      </blockquote>
      <figcaption style={{ fontSize: 13.5, color: 'var(--ink)' }}>
        <strong style={{ fontWeight: 500 }}>{name}</strong>
        {city ? <span style={{ color: 'var(--ink-2)' }}> · {city}</span> : null}
        {when ? <span style={{ color: 'var(--ink-2)' }}> · {when}</span> : null}
        {source ? <span style={{ color: 'var(--ink-2)' }}> · {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener nofollow" style={{ color: 'var(--accent)' }}>отзыв на {source}</a> : `источник: ${source}`}</span> : null}
      </figcaption>
    </figure>
  );
}

// ── форма «оставить отзыв» ───────────────────────────────────
function ReviewForm() {
  const [form, setForm] = React.useState({ name: '', city: '', text: '' });
  const [rating, setRating] = React.useState(0);
  const [consent, setConsent] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [trap, setTrap] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'sending' | 'err' | 'err-fields'>('idle');
  const [sentRef, setSentRef] = React.useState('');

  const field = (k: 'name' | 'city' | 'text') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '13px 16px', fontSize: 16,
    border: '1px solid var(--rule-soft)', borderRadius: 'var(--r-md)',
    background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'inherit',
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!consent || state === 'sending') return;
    if (form.name.trim().length < 2 || form.text.trim().length < 10 || !rating) {
      setState('err-fields');
      return;
    }
    setState('sending');
    const res = await submitLead({
      lead_ref: leadRef(),
      [HONEYPOT_FIELD]: trap,
      name: form.name.trim(),
      city: form.city.trim(),
      message: form.text.trim(),
      notes: `Оценка: ${rating}/5`,
      source: 'review',
      page: typeof location !== 'undefined' ? location.pathname : '',
    });
    if (res.ok) { setSentRef(res.ref); setState('idle'); } else setState('err');
  };

  if (sentRef) {
    return (
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 26, maxWidth: 560 }}>
        <div className="eyebrow accent" style={{ marginBottom: 10 }}>Спасибо!</div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          Отзыв №{sentRef} получен. Мы проверим его вручную и опубликуем здесь —
          так на сайте остаются только настоящие отзывы.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handle} style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: 8 }}>
          Ваша оценка
        </div>
        <StarsInput value={rating} onChange={setRating} />
      </div>
      <input style={inputStyle} placeholder="Имя" autoComplete="name"
             value={form.name} onChange={field('name')} />
      <input style={inputStyle} placeholder="Город (не обязательно)" autoComplete="address-level2"
             value={form.city} onChange={field('city')} />
      <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
                placeholder="Какая работа у вас и как она живёт в интерьере?"
                value={form.text} onChange={field('text')} />
      {/* honeypot: люди поле не видят, боты заполняют всё */}
      <input type="text" name={HONEYPOT_FIELD} value={trap} onChange={(e) => setTrap(e.target.value)}
             tabIndex={-1} autoComplete="off" aria-hidden="true"
             style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)', cursor: 'pointer' }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
               style={{ marginTop: 2, width: 18, height: 18, flexShrink: 0, accentColor: 'var(--accent)' }} />
        <span>
          Согласен(на) на обработку персональных данных и публикацию отзыва —{' '}
          <a href="/legal?section=privacy" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>политика конфиденциальности</a>
        </span>
      </label>
      {touched && !consent && (
        <div style={{ fontSize: 13, color: '#a33' }}>Нужно согласие на обработку данных.</div>
      )}
      {state === 'err-fields' && (
        <div style={{ fontSize: 13, color: '#a33' }}>Поставьте оценку, укажите имя и напишите пару предложений (от 10 символов).</div>
      )}
      {state === 'err' && (
        <div style={{ fontSize: 13, color: '#a33' }}>
          Не получилось отправить. Напишите нам напрямую — контакты внизу страницы.
        </div>
      )}
      <button type="submit" className="btn btn-solid" disabled={state === 'sending'}
              style={{ alignSelf: 'flex-start', opacity: state === 'sending' ? .6 : 1 }}>
        {state === 'sending' ? 'Отправляем…' : 'Отправить отзыв'}
      </button>
    </form>
  );
}

// ── отзывы конкретной работы (страница товара) ───────────────
// Рендерится только когда у работы есть реальные отзывы: пустого
// «Отзывов пока нет» на карточке товара не показываем.
export function ProductReviews({ productId }: { productId: string }) {
  const list = reviewsFor(productId);
  if (!list.length) return null;
  const avg = averageRating(list);
  return (
    <section style={{ marginTop: 64 }}>
      <div className="eyebrow accent" style={{ marginBottom: 14 }}>Отзывы об этой работе</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Stars rating={avg} size={16} />
        <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{avg} из 5 · {list.length} отз.</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
        {list.map((r) => <ReviewCard key={r.id} {...r} />)}
      </div>
    </section>
  );
}

// ── секция целиком ───────────────────────────────────────────
export function ReviewsSection({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = React.useState(REVIEWS.length === 0);
  const avg = averageRating();

  return (
    <section className="resp-pad" style={{ padding: compact ? '80px 40px' : '120px 40px 100px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div className="eyebrow accent" style={{ marginBottom: 16 }}>Отзывы</div>
        <h2 className="display" style={{ margin: '0 0 18px', fontSize: 'clamp(28px,3.4vw,44px)', fontWeight: 500, letterSpacing: '-.02em' }}>
          Что говорят покупатели
        </h2>

        {REVIEWS.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
              <Stars rating={avg} size={18} />
              <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{avg} из 5 · {REVIEWS.length} отз.</span>
            </div>
            <div className="resp-stack-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 40 }}>
              {(compact ? REVIEWS.slice(0, 3) : REVIEWS).map((r) => <ReviewCard key={r.id} {...r} />)}
            </div>
            {/* Разметка честная: появляется только вместе с реальными отзывами */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Mila Bezú',
              url: 'https://mbezu.ru',
              aggregateRating: { '@type': 'AggregateRating', ratingValue: avg, reviewCount: REVIEWS.length, bestRating: 5 },
            }) }} />
          </>
        ) : (
          <p style={{ margin: '0 0 26px', maxWidth: 620, fontSize: 16, lineHeight: 1.65, color: 'var(--ink-2)' }}>
            Раздел только открылся: здесь публикуются проверенные отзывы покупателей —
            без накруток и заготовок. Если у вас уже живёт наша картина,
            расскажите, как она смотрится в интерьере: ваш отзыв станет первым.
          </p>
        )}

        {!open && (
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
            Оставить отзыв
          </button>
        )}
        {open && <ReviewForm />}
      </div>
    </section>
  );
}

export default ReviewsSection;
