import React from 'react';
import { PaintingPlate } from '../common/adapter';
import { Breadcrumbs, Eyebrow, PageTitle } from '../common/atoms';
import { ABOUT, artworkById, formatPrice } from '../common/data';
import { COMMISSION_FAQ, INTERIOR_GUIDE_URL } from '../common/seo';
import { submitLead, leadRef, HONEYPOT_FIELD } from '../lib/tildaLead';
import { ColorPicker } from '../common/color-picker';

/** UTM первого захода — уезжают вместе с заявкой (дубль helper'а с главной). */
function utmFromStorage(): Record<string, string> {
  try {
    const u = JSON.parse(localStorage.getItem('mbezu-utm') || '{}');
    return {
      utm_source: u.utm_source || '', utm_medium: u.utm_medium || '',
      utm_campaign: u.utm_campaign || '', utm_content: u.utm_content || '',
    };
  } catch { return {}; }
}

// ─────────────────────────────────────────────────────────────
// page-commission.jsx — бриф на заказ.
// 6 шагов: размер → стиль → палитра → бюджет → сроки → контакты.
// ─────────────────────────────────────────────────────────────

function CommissionPage({ go, refId }) {
  const ref = refId ? artworkById(refId) : null;

  const sizes = [
    { id: 'small',  label: 'Этюд',    dim: 'до 30×40 см',    from: 8000 },
    { id: 'medium', label: 'Средний', dim: '40×50 — 50×70',  from: 17000 },
    { id: 'large',  label: 'Большой', dim: '60×80 — 80×100', from: 33000 },
    { id: 'xl',     label: 'Крупный', dim: 'от 90×120 см',   from: 42000 },
    { id: 'custom', label: 'Другое',  dim: 'свой размер',    from: 0 },
  ];
  const styles = [
    { id: 'urban',     label: 'Городской пейзаж' },
    { id: 'landscape', label: 'Природный пейзаж' },
    { id: 'botanical', label: 'Ботаника' },
    { id: 'mono',      label: 'Монохром' },
    { id: 'custom',    label: 'Другое' },
  ];
  const palettes = [
    { id: 'bone',   label: 'Тёплая (bone)',    c1: '#ede5d6', c2: '#a08a4e' },
    { id: 'sepia',  label: 'Сепия',            c1: '#d8c8a8', c2: '#5e4d3d' },
    { id: 'warm',   label: 'Песочная',         c1: '#d4a48a', c2: '#8d5a44' },
    { id: 'cool',   label: 'Холодная',         c1: '#b3c0c4', c2: '#5e7480' },
    { id: 'green',  label: 'Растительная',     c1: '#bcc5a8', c2: '#6f7d54' },
  ];
  const weeks = [4, 6, 8, 10];

  // Sprint 15: произвольный цвет — ColorPicker (поле насыщенность/яркость + тон + HEX), см. common/color-picker.tsx

  // Прайс на заказ — базовая ставка «от» по размеру холста (Sprint 8 §2C).
  const COMMISSION = {
    intro: 'Базовая ставка «от» за размер холста для прямого заказа из РФ. Итог зависит от сложности сюжета, детализации и техники.',
    groups: [
      { title: 'Малый формат',   items: [['20 × 30 см', 6000], ['30 × 40 см', 8000], ['40 × 40 см', 9500]] },
      { title: 'Средний формат',  items: [['40 × 50 см', 11000], ['40 × 60 см', 12000], ['50 × 60 см', 15000], ['50 × 70 см', 17000]] },
      { title: 'Большой формат',  items: [['60 × 80 см', 22000], ['60 × 90 см', 24000], ['70 × 90 см', 27000], ['80 × 100 см', 33000], ['90 × 120 см', 42000]] },
    ],
    custom:   'Нестандартный размер или сторона больше 100 см — рассчитываются индивидуально.',
    included: ['Холст на галерейном подрамнике', 'Защитное покрытие лаком', 'Сертификат подлинности', 'Фирменная упаковка', 'Рукописная открытка', 'Крепёж — готова к подвесу'],
    extra:    ['Доставка: СДЭК / Почта / курьер', 'Оформление в багет', 'Срочное исполнение'],
    terms:    'Предоплата 50%, остаток — после согласования готовой работы по фото. Эскиз утверждается до начала. Срок 2–4 недели.',
  };

  const [form, setForm] = React.useState({
    size: 'medium',
    style: 'urban',
    palette: 'bone', // preset id ИЛИ '#rrggbb' (сетка/пикер «Другое»)
    budget: 30000,
    weeks: 8,
    name: '', email: '', city: '', notes: '', where: '',
    customW: '', customH: '',   // размер «Другое», см
    customStyle: '',            // стиль «Другое»
    file: null as File | null,
  });
  const [sent, setSent] = React.useState(false);
  const [showPicker, setShowPicker] = React.useState(false);
  // Sprint 15 (Ф0): бриф раньше только переключал экран — заявка никуда не шла.
  const [state, setState] = React.useState<'idle' | 'sending' | 'err' | 'err-fields'>('idle');
  const [leadNo, setLeadNo] = React.useState('');
  const [consent, setConsent] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [trap, setTrap] = React.useState(''); // honeypot: люди не видят, боты заполняют

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault();
    setTouched(true);
    // Sprint 15 (аудит 3.17): бриф принимал имя и контакт из 1 символа.
    if (!consent || state === 'sending') return;
    if (form.name.trim().length < 2 || form.email.trim().length < 5) {
      setState('err-fields');
      return;
    }
    setState('sending');
    // ref один на попытку: повтор после ошибки не должен плодить вторую карточку во Входящих
    const attemptRef = leadNo || leadRef();
    setLeadNo(attemptRef);
    const res = await submitLead({
      lead_ref: attemptRef,
      [HONEYPOT_FIELD]: trap,
      name: form.name.trim(),
      phone: form.email.trim(),                       // поле «Email или Telegram»
      email: /@/.test(form.email) ? form.email.trim() : '',
      city: form.city.trim(),
      notes: [form.notes.trim(), form.where ? `Куда повесим: ${form.where}` : ''].filter(Boolean).join(' · '),
      size: sizeSummary,
      style: styleSummary,
      palette: isHexPalette ? form.palette.toUpperCase() : (currentPalette?.label || ''),
      budget: form.budget,
      weeks: form.weeks,
      source: 'commission-brief',
      page: typeof location !== 'undefined' ? location.pathname : '/commission',
      ...utmFromStorage(),
    });
    if (res.ok) {
      setLeadNo(res.ref);
      setSent(true);
      setState('idle');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setState('err');
    }
  };

  const isHexPalette = form.palette.startsWith('#');
  const currentSize = sizes.find((s) => s.id === form.size);
  const currentPalette = isHexPalette
    ? { id: 'hex', label: `Палитра: ${form.palette.toUpperCase()}`, c1: form.palette, c2: form.palette }
    : palettes.find((p) => p.id === form.palette);
  const sizeSummary = form.size === 'custom'
    ? `Другое · ${form.customW || '?'}×${form.customH || '?'} см`
    : `${currentSize?.label} · ${currentSize?.dim}`;
  const styleSummary = form.style === 'custom'
    ? (form.customStyle.trim() || 'Другое')
    : styles.find((s) => s.id === form.style)?.label;

  return (
    <div className="fade-in resp-pad" style={{ padding: '36px 40px 80px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <Breadcrumbs items={[
          { label: 'MBezu', href: '/' },
          { label: 'На заказ' },
        ]} />

        <div style={{ marginTop: 36 }}>
          <PageTitle
            kicker="Москва · доставка по России"
            title={<>Картина на заказ{' '}<br/><span className="italic" style={{ color: 'var(--accent)' }}>маслом, под ваш интерьер</span></>}
            lead="Заказать картину художнику под комнату, размер и настроение: заполните бриф — Мила свяжется, предложит два-три эскиза и напишет работу от 2 недель. Мастерская в Москве, показ по записи. Договор после согласования эскиза, предоплата 50%."
          />
        </div>

        {/* Прайс на заказ — «от / зависит от сложности» */}
        <section style={{ marginTop: 56 }}>
          <Eyebrow accent>Прайс на заказ</Eyebrow>
          <h2 className="display resp-h2" style={{
            margin: '12px 0 0', fontSize: 'clamp(26px, 3vw, 40px)',
            fontWeight: 500, letterSpacing: '-.02em',
          }}>Стоимость по размерам</h2>
          <p style={{ marginTop: 14, maxWidth: 760, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.65 }}>
            {COMMISSION.intro}
          </p>
          <div className="resp-stack-3" style={{
            marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
          }}>
            {COMMISSION.groups.map((g) => (
              <div key={g.title} className="card" style={{
                padding: 28, background: 'var(--bg-card)',
                borderRadius: 'var(--r-lg)', border: '1px solid var(--rule-soft)',
              }}>
                <h3 className="display" style={{
                  margin: '0 0 18px', fontSize: 18, fontWeight: 500,
                  letterSpacing: '-.01em', color: 'var(--accent)',
                }}>{g.title}</h3>
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px 12px' }}>
                  {g.items.map(([size, from]) => (
                    <React.Fragment key={size}>
                      <dt style={{ fontSize: 14, color: 'var(--ink-2)' }}>{size}</dt>
                      <dd style={{ margin: 0, fontSize: 14, fontWeight: 500, textAlign: 'right' }}>
                        от {formatPrice(from as number)}
                      </dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <p className="cat-no" style={{ marginTop: 20, lineHeight: 1.6 }}>{COMMISSION.custom}</p>

          <h2 className="display resp-h2" style={{
            margin: '40px 0 0', fontSize: 'clamp(24px, 2.6vw, 34px)',
            fontWeight: 500, letterSpacing: '-.02em',
          }}>Что входит в стоимость</h2>
          <div className="resp-stack-2" style={{
            marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
          }}>
            <div>
              <Eyebrow accent>В стоимость входит</Eyebrow>
              <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                {COMMISSION.included.map((it) => (
                  <li key={it} style={{ fontSize: 14, color: 'var(--ink-2)', display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--accent)' }}>◆</span>{it}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Eyebrow accent>Оплачивается отдельно</Eyebrow>
              <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                {COMMISSION.extra.map((it) => (
                  <li key={it} style={{ fontSize: 14, color: 'var(--ink-2)', display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--accent-soft)' }}>◇</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p style={{
            marginTop: 28, padding: '16px 20px', background: 'var(--bg-soft)',
            borderRadius: 'var(--r-md)', border: '1px solid var(--rule-soft)',
            fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6,
          }}>{COMMISSION.terms}</p>
          {/* 04.09 перелинковка: заказ — 2–4 недели; если нужно к дате — готовые работы */}
          <p style={{ margin: '18px 0 0', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            Нужно к дате и ждать 2–4 недели некогда — посмотрите готовые работы: <a href="/podarok" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>картина в подарок</a> или <a href="/catalog" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>каталог в наличии</a>.
          </p>
        </section>

        {sent ? (
          <section style={{
            marginTop: 80, padding: 60,
            background: 'var(--bg-soft)',
            borderRadius: 'var(--r-xl)',
            border: '1px solid var(--rule-soft)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 'var(--r-pill)',
              background: 'var(--accent)', color: 'var(--bg)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 600, marginBottom: 32,
            }}>✓</div>
            <h2 className="display" style={{
              margin: '0 0 16px', fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1.1,
            }}>Бриф получен</h2>
            {leadNo && (
              <p className="cat-no" style={{ margin: '0 0 14px' }}>Номер заявки: <b>{leadNo}</b></p>
            )}
            <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
              Мила ответит лично в течение 24 часов. Если хотите ускорить — напишите
              в&nbsp;<a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener" className="uh"
                       style={{ color: 'var(--accent)', textDecoration: 'none' }}>Telegram</a>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => go('catalog')}>В каталог</button>
              <button className="btn" onClick={() => go('home')}>На главную</button>
            </div>
          </section>
        ) : (
          <>
          <h2 className="display resp-h2" id="brief" style={{
            margin: '56px 0 0', fontSize: 'clamp(26px, 3vw, 40px)',
            fontWeight: 500, letterSpacing: '-.02em', scrollMarginTop: 90,
          }}>Оставить заявку</h2>
          <form onSubmit={handle} noValidate className="resp-stack" style={{
            marginTop: 24,
            display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 60, alignItems: 'start',
          }}>
            {/* LEFT — form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
              {ref && (
                <div className="card" style={{
                  padding: 24, display: 'flex', alignItems: 'center', gap: 20,
                  borderRadius: 'var(--r-md)',
                }}>
                  <div style={{ width: 80 }}>
                    <PaintingPlate art={ref} fit="bare" style={{ aspectRatio: '1', borderRadius: 'var(--r-sm)', boxShadow: 'none' }} showMeta={false} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="cat-no">Похожую на</div>
                    <div className="display" style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{ref.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{ref.w}×{ref.h} см · {formatPrice(ref.price)}</div>
                  </div>
                </div>
              )}

              {/* 1. Размер */}
              <div>
                <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Eyebrow accent>01 · Размер</Eyebrow>
                  <span className="cat-no">
                    {form.size === 'custom' ? 'свой размер · расчёт индивидуально' : `${currentSize?.dim} · от ${formatPrice(currentSize?.from || 0)}`}
                  </span>
                </div>
                <div className="resp-stack-5" style={{
                  display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12,
                }}>
                  {sizes.map((s) => (
                    <button key={s.id} type="button" onClick={() => upd('size', s.id)} aria-pressed={form.size === s.id}
                            style={{
                              padding: '20px 18px', minHeight: 44,
                              background: form.size === s.id ? 'var(--ink)' : 'var(--bg-card)',
                              color: form.size === s.id ? 'var(--bg)' : 'var(--ink)',
                              border: '1px solid ' + (form.size === s.id ? 'var(--ink)' : 'var(--rule-soft)'),
                              borderRadius: 'var(--r-md)', cursor: 'pointer',
                              textAlign: 'left', transition: 'all .2s',
                              boxShadow: form.size === s.id ? 'var(--shadow-md)' : 'none',
                            }}>
                      <div className="cat-no" style={{ color: form.size === s.id ? 'rgba(245,239,226,.6)' : 'var(--ink-3)' }}>0{sizes.indexOf(s) + 1}</div>
                      <div className="display" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-.01em', marginTop: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 12, opacity: .75, marginTop: 6 }}>{s.dim}</div>
                    </button>
                  ))}
                </div>
                {form.size === 'custom' && (
                  <div className="fade-in" style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input className="field" type="number" min={10} max={300} placeholder="Ширина, см" aria-label="Ширина, см"
                             value={form.customW} onChange={(e) => upd('customW', e.target.value)}
                             style={{ width: 150 }} />
                      <span style={{ color: 'var(--ink-3)' }}>×</span>
                      <input className="field" type="number" min={10} max={300} placeholder="Высота, см" aria-label="Высота, см"
                             value={form.customH} onChange={(e) => upd('customH', e.target.value)}
                             style={{ width: 150 }} />
                    </div>
                    <div className="cat-no" style={{ marginTop: 10 }}>
                      Сторона больше 100 см — расчёт индивидуально
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Стиль */}
              <div>
                <Eyebrow accent style={{ marginBottom: 18, display: 'block' }}>02 · Стиль</Eyebrow>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {styles.map((s) => (
                    <button key={s.id} type="button" onClick={() => upd('style', s.id)} aria-pressed={form.style === s.id}
                            className={'chip' + (form.style === s.id ? ' is-active' : '')}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {form.style === 'custom' && (
                  <input className="field fade-in" placeholder="Опишите стиль — например, «абстракция в тёплых тонах»" aria-label="Опишите стиль"
                         value={form.customStyle} onChange={(e) => upd('customStyle', e.target.value)}
                         style={{ marginTop: 14 }} />
                )}
              </div>

              {/* 3. Палитра — пресеты + сетка произвольного цвета + «Другое» (Sprint 13 Ф4) */}
              <div>
                <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Eyebrow accent>03 · Палитра</Eyebrow>
                  {isHexPalette && <span className="cat-no">Палитра: {form.palette.toUpperCase()}</span>}
                </div>
                <div className="resp-stack-5" style={{
                  display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10,
                }}>
                  {palettes.map((p) => (
                    <button key={p.id} type="button" onClick={() => { upd('palette', p.id); setShowPicker(false); }} aria-pressed={form.palette === p.id}
                            style={{
                              padding: '14px 14px', minHeight: 44, background: 'var(--bg-card)',
                              border: '1px solid ' + (form.palette === p.id ? 'var(--accent)' : 'var(--rule-soft)'),
                              borderRadius: 'var(--r-md)', cursor: 'pointer',
                              transition: 'all .2s', textAlign: 'left',
                              boxShadow: form.palette === p.id ? 'var(--shadow-md)' : 'none',
                            }}>
                      <div style={{
                        height: 28, borderRadius: 'var(--r-sm)',
                        background: `linear-gradient(135deg, ${p.c1}, ${p.c2})`,
                        marginBottom: 10,
                      }} />
                      <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{p.label}</div>
                    </button>
                  ))}
                </div>

                {/* «Другое» → нативный color-picker */}
                <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" aria-expanded={showPicker}
                          className={'chip' + (showPicker ? ' is-active' : '')}
                          onClick={() => { setShowPicker(!showPicker); if (!isHexPalette) upd('palette', '#a08a4e'); }}>
                    Другое
                  </button>
                  {isHexPalette && (
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                      В заявку уйдёт строкой: <span className="mono">Палитра: {form.palette.toUpperCase()}</span>
                    </span>
                  )}
                </div>
                {showPicker && (
                  <div className="fade-in" style={{ marginTop: 14 }}>
                    <ColorPicker value={isHexPalette ? form.palette : '#a08a4e'}
                                 onChange={(hex) => upd('palette', hex)}
                                 onDone={() => setShowPicker(false)} />
                  </div>
                )}
              </div>

              {/* 4. Бюджет */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                  <Eyebrow accent>04 · Бюджет</Eyebrow>
                  <span className="display" style={{ fontSize: 24, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.015em' }}>
                    {formatPrice(form.budget)}
                  </span>
                </div>
                <input type="range" min={6000} max={120000} step={1000} aria-label="Бюджет" aria-valuetext={formatPrice(form.budget)}
                       value={form.budget} onChange={(e) => upd('budget', Number(e.target.value))}
                       style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <div className="cat-no" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span>6 000 ₽</span>
                  <span>от 120 000 ₽</span>
                </div>
              </div>

              {/* 5. Сроки */}
              <div>
                <Eyebrow accent style={{ marginBottom: 18, display: 'block' }}>05 · Сроки</Eyebrow>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {weeks.map((w) => (
                    <button key={w} type="button" onClick={() => upd('weeks', w)} aria-pressed={form.weeks === w}
                            className={'chip' + (form.weeks === w ? ' is-active' : '')}
                            style={{ minWidth: 80, justifyContent: 'center' }}>
                      {w} нед
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Контакты */}
              <div>
                <Eyebrow accent style={{ marginBottom: 18, display: 'block' }}>06 · Контакты</Eyebrow>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="resp-stack-2">
                  <input className="field" placeholder="Имя *" aria-label="Имя" autoComplete="name" value={form.name} onChange={(e) => upd('name', e.target.value)} />
                  <input className="field" placeholder="Email или Telegram (@username) *" aria-label="Email или Telegram" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => upd('email', e.target.value)} />
                  <input className="field" placeholder="Город" aria-label="Город" autoComplete="address-level2" value={form.city} onChange={(e) => upd('city', e.target.value)} />
                  {/* Sprint 15 (моб. аудит): «(опц.)» обрезался в узкой колонке 375px */}
                  <input className="field" placeholder="Куда повесим" aria-label="Куда повесим" value={form.where || ''} onChange={(e) => upd('where', e.target.value)} />
                </div>
                <textarea className="field" placeholder="Дополнительно — настроение, ассоциации, ссылки на референсы…" aria-label="Дополнительно" rows={4} style={{ marginTop: 14 }}
                          value={form.notes} onChange={(e) => upd('notes', e.target.value)} />

                <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true"
                       value={trap} onChange={(e) => setTrap(e.target.value)}
                       style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />

                {/* 152-ФЗ: без согласия отправка заблокирована */}
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, cursor: 'pointer', fontSize: 13, lineHeight: 1.55 }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                         style={{ marginTop: 3, width: 20, height: 20, accentColor: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink-2)' }}>
                    Согласен(на) на обработку персональных данных (152-ФЗ) —{' '}
                    <a href="/legal?section=privacy" onClick={(e) => { e.preventDefault(); go('legal', { section: 'privacy' }); }}
                       className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Политика ПД</a>
                  </span>
                </label>
                {touched && !consent && (
                  <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--accent-deep)' }}>
                    Для отправки нужно согласие на обработку ПД
                  </div>
                )}
                {state === 'err-fields' && (
                  <div style={{
                    marginTop: 14, padding: '14px 16px', borderRadius: 'var(--r-md)',
                    background: 'var(--bg-soft)', border: '1px solid var(--accent)', fontSize: 13.5, lineHeight: 1.6,
                  }}>
                    Укажите, пожалуйста, имя (от 2 символов) и контакт — телефон, Telegram или email.
                  </div>
                )}
                {state === 'err' && (
                  <div style={{
                    marginTop: 14, padding: '14px 16px', borderRadius: 'var(--r-md)',
                    background: 'var(--bg-soft)', border: '1px solid var(--accent)', fontSize: 13.5, lineHeight: 1.6,
                  }}>
                    <b>Не удалось отправить бриф.</b> Напишите напрямую:{' '}
                    <a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>Telegram</a>{' · '}
                    <a href={`mailto:${ABOUT.contacts.email}`} style={{ color: 'var(--accent)' }}>{ABOUT.contacts.email}</a>{' · '}
                    <a href={`tel:${ABOUT.contacts.phone.replace(/\s/g, '')}`} style={{ color: 'var(--accent)' }}>{ABOUT.contacts.phone}</a>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-solid" disabled={state === 'sending'}
                      style={{ alignSelf: 'flex-start', padding: '20px 40px', fontSize: 13, opacity: state === 'sending' ? .6 : 1 }}>
                {state === 'sending' ? 'Отправляем…' : 'Отправить бриф →'}
              </button>
            </div>

            {/* RIGHT — sticky summary */}
            <aside style={{ position: 'sticky', top: 100, alignSelf: 'start' }} className="resp-static">
              <div className="card" style={{
                padding: 32, background: 'var(--bg-card)',
                borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)',
              }}>
                <Eyebrow accent>Резюме брифа</Eyebrow>
                <h3 className="display" style={{
                  margin: '14px 0 24px', fontSize: 24, fontWeight: 500, letterSpacing: '-.015em',
                }}>Что мы делаем</h3>

                <div style={{
                  height: 80, borderRadius: 'var(--r-sm)',
                  background: `linear-gradient(135deg, ${currentPalette?.c1}, ${currentPalette?.c2})`,
                  marginBottom: 20,
                }} />

                <dl style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px 16px', margin: 0 }}>
                  {[
                    ['Размер',  sizeSummary],
                    ['Стиль',   styleSummary],
                    ['Палитра', currentPalette?.label],
                    ['Сроки',   `${form.weeks} недель`],
                  ].map(([k, v]) => (
                    <React.Fragment key={k}>
                      <dt className="cat-no">{k}</dt>
                      <dd style={{ margin: 0, fontSize: 13, textAlign: 'right' }}>{v}</dd>
                    </React.Fragment>
                  ))}
                </dl>

                <div className="rule-soft" style={{ margin: '20px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="cat-no">Бюджет</span>
                  <span className="display" style={{ fontSize: 28, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.02em' }}>
                    {formatPrice(form.budget)}
                  </span>
                </div>

                <div className="cat-no" style={{ marginTop: 24, lineHeight: 1.6 }}>
                  Предоплата 50% после согласования эскиза. Договор, акт приёма.
                </div>
              </div>
            </aside>
          </form>

          {/* Sprint 14 (Ф7): видимый FAQ — тот же список, что уходит в FAQPage JSON-LD */}
          <section style={{ marginTop: 80 }}>
            <Eyebrow accent>Вопросы и ответы</Eyebrow>
            <h2 className="display resp-h2" style={{
              margin: '12px 0 28px', fontSize: 'clamp(26px, 3vw, 40px)',
              fontWeight: 500, letterSpacing: '-.02em',
            }}>Частые вопросы</h2>
            <dl style={{ margin: 0, maxWidth: 860 }}>
              {COMMISSION_FAQ.map(([q, a]) => (
                <div key={q} style={{ padding: '20px 0', borderTop: '1px solid var(--rule-soft)' }}>
                  <dt className="display" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-.01em' }}>{q}</dt>
                  <dd style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>{a}</dd>
                </div>
              ))}
            </dl>
            <p style={{ margin: '24px 0 0', maxWidth: 860, fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-2)' }}>
              Ещё не решили, что и куда: разбор с примерами — <a href={INTERIOR_GUIDE_URL} className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>как выбрать картину для гостиной</a>; готовые подборки по комнатам — <a href="/kartina-v-gostinuyu" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>в гостиную</a>, <a href="/kartina-v-spalnyu" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>в спальню</a>, <a href="/kartina-v-kabinet" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>в кабинет</a>.
            </p>
          </section>
          </>
        )}
      </div>
    </div>
  );
}

export { CommissionPage };
export default CommissionPage;
