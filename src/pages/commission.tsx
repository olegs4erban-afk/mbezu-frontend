import React from 'react';
import { PaintingPlate } from '../common/adapter';
import { Breadcrumbs, Eyebrow } from '../common/atoms';
import { ABOUT, SERIES, artworkById, dimsLabel, formatPrice } from '../common/data';
import { hasStorePage } from '../common/store-urls';
import { COMMISSION_FAQ, INTERIOR_GUIDE_URL } from '../common/seo';
import { submitLead, leadRef, HONEYPOT_FIELD } from '../lib/tildaLead';

// ─────────────────────────────────────────────────────────────
// commission.tsx — картина на заказ (редизайн 2026, HANDOFF §8).
// Пошаговый бриф: Размер → Палитра → Бюджет → Сроки → Контакт,
// справа — липкое резюме на тёмном. Ниже: прайс, процесс, примеры, FAQ.
// ─────────────────────────────────────────────────────────────

/** UTM первого захода — уезжают вместе с заявкой. */
function utmFromStorage(): Record<string, string> {
  try {
    const u = JSON.parse(localStorage.getItem('mbezu-utm') || '{}');
    return {
      utm_source: u.utm_source || '', utm_medium: u.utm_medium || '',
      utm_campaign: u.utm_campaign || '', utm_content: u.utm_content || '',
    };
  } catch { return {}; }
}

const STEPS = ['Размер', 'Палитра', 'Бюджет', 'Сроки', 'Контакт'];

const SIZES = [
  { id: 'xs',     label: 'До 40 см',       hint: 'камерный формат, полка или узкая стена' },
  { id: 'sm',     label: '50–70 см',       hint: 'над комодом, в спальне, в коридоре' },
  { id: 'md',     label: '80–120 см',      hint: 'над диваном — самый частый формат' },
  { id: 'lg',     label: 'От 130 см',      hint: 'акцент в гостиной, высокий потолок' },
  { id: 'tondo',  label: 'Круглое тондо',  hint: 'без углов, мягко работает в спальне' },
  { id: 'help',   label: 'Подобрать вместе', hint: 'пришлите фото стены — предложим размер' },
];

// Палитры собраны из palette серий data.ts — те же цвета, что в работах
const PALETTES = [
  { id: 'sepia',  label: 'Сепия и графит', c: ['#d8c8a8', '#8a7458', '#3a3835'] },
  { id: 'stone',  label: 'Тёплый камень',  c: ['#ede5d6', '#c9ad86', '#8d5a44'] },
  { id: 'water',  label: 'Зелёная вода',   c: ['#bcc5a8', '#7d9a86', '#1d3324'] },
  { id: 'north',  label: 'Северный свет',  c: ['#dde3e6', '#a9bcc4', '#5e7480'] },
  { id: 'bw',     label: 'Чёрно-белое',    c: ['#f2efe9', '#8e8e8e', '#221f1c'] },
  { id: 'artist', label: 'Доверю художнику', c: ['#ede5d6', '#bfa45e', '#6f5c2b'] },
];

const TERMS = [
  { id: 'fast',  label: 'От 2 недель',      hint: 'небольшой формат, простой сюжет' },
  { id: 'month', label: 'Около месяца',     hint: 'средний и большой холст' },
  { id: 'date',  label: 'К конкретной дате', hint: 'подарок, событие — напишите дату' },
  { id: 'slow',  label: 'Не спешу',          hint: 'важнее результат, чем срок' },
];

const COMMISSION = {
  intro: 'Базовая ставка «от» за размер холста для прямого заказа из РФ. Итог зависит от сложности сюжета, детализации и техники.',
  groups: [
    { title: 'Малый формат',   items: [['20 × 30 см', 6000], ['30 × 40 см', 8000], ['40 × 40 см', 9500]] },
    { title: 'Средний формат', items: [['40 × 50 см', 11000], ['40 × 60 см', 12000], ['50 × 60 см', 15000], ['50 × 70 см', 17000]] },
    { title: 'Большой формат', items: [['60 × 80 см', 22000], ['60 × 90 см', 24000], ['70 × 90 см', 27000], ['80 × 100 см', 33000], ['90 × 120 см', 42000]] },
  ] as Array<{ title: string; items: Array<[string, number]> }>,
  custom:   'Нестандартный размер или сторона больше 100 см — рассчитываются индивидуально.',
  included: ['Холст на галерейном подрамнике', 'Защитное покрытие лаком', 'Сертификат подлинности', 'Фирменная упаковка', 'Рукописная открытка', 'Крепёж — готова к подвесу'],
  extra:    ['Доставка: СДЭК / Почта / курьер', 'Оформление в багет', 'Срочное исполнение'],
  terms:    'Предоплата 50%, остаток — после согласования готовой работы по фото. Эскиз утверждается до начала. Срок от 2 недель.',
};

const PROCESS = [
  { n: '01', label: 'Брифинг',  t: 'Размер, палитра, настроение, помещение' },
  { n: '02', label: 'Эскизы',   t: 'Два-три варианта на согласование' },
  { n: '03', label: 'Холст',    t: 'Лён на сосновом подрамнике, грунт' },
  { n: '04', label: 'Письмо',   t: 'Масло, от 2 недель в зависимости от размера' },
  { n: '05', label: 'Доставка', t: 'Курьер, страховка, фирменная упаковка' },
];

function budgetHint(v: number): string {
  if (v < 25000) return 'этюд или малый формат';
  if (v < 60000) return 'средний формат, 50×70';
  if (v < 140000) return 'крупный холст над диваном';
  return 'большая работа или серия из нескольких холстов';
}

function Tile({ active, onClick, label, hint, children }: {
  active: boolean; onClick: () => void; label: string; hint?: string; children?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
            style={{
              textAlign: 'left', cursor: 'pointer', font: 'inherit',
              minHeight: 96, padding: '16px 18px',
              borderRadius: 'var(--r-md)',
              border: active ? '1px solid var(--accent)' : '1px solid rgba(42,37,32,.14)',
              background: active ? 'var(--accent)' : 'var(--bg)',
              color: active ? 'var(--bg)' : 'var(--ink)',
              transition: 'background-color .25s, color .25s, border-color .25s',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
      {children}
      <span style={{ fontSize: 16, fontWeight: 500 }}>{label}</span>
      {hint && <span style={{ fontSize: 13, lineHeight: 1.4, opacity: active ? .85 : .7 }}>{hint}</span>}
    </button>
  );
}

// Реальные заказы мастерской — по одному кадру на тип работы.
const COMMISSION_CASES = [
  {
    file: 'zakaz-hokkei', kind: 'Портрет по фотографии',
    alt: 'Картина на заказ: портрет хоккейного вратаря маслом, подарок на день рождения',
    note: 'Вратарь в моменте броска — написан по фотографиям с игры. Подарок на день рождения, 12 недель от брифа до вручения.',
  },
  {
    file: 'zakaz-pitomec', kind: 'Портрет питомца',
    alt: 'Портрет собаки маслом на золотом фоне в мастерской художника',
    note: 'Поденко на золотом фоне. Пишется по 5–10 фотографиям питомца, эскиз согласуется до начала работы.',
  },
  {
    file: 'zakaz-brend-1', kind: 'Предметная живопись для бренда',
    alt: 'Предметная живопись маслом: банка напитка на чёрном фоне — заказ для бренда',
    note: 'Продукт написан маслом вместо фотосъёмки: живописная фактура работает в оффлайн-точках и на баннерах.',
  },
  {
    file: 'zakaz-brend-2', kind: 'Предметная живопись для бренда',
    alt: 'Живописная модель молекулы на чёрном фоне — заказ для бренда',
    note: 'Молекула для того же проекта — серия из двух холстов в одной подаче.',
  },
];

function CommissionPage({ go, refId }) {
  const ref = refId ? artworkById(refId) : null;
  // работа доступна к покупке, но её страницы в Store пока нет
  const refAvailable = !!ref && ref.status === 'available' && !ref.commission && !hasStorePage(ref.id);

  const [step, setStep] = React.useState(0);
  const [maxStep, setMaxStep] = React.useState(0);
  const [size, setSize] = React.useState<string | null>(null);
  const [palette, setPalette] = React.useState<string | null>(null);
  const [budget, setBudget] = React.useState(65000);
  const [term, setTerm] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [consent, setConsent] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [trap, setTrap] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'sending' | 'err'>('idle');
  const [sent, setSent] = React.useState(false);
  const [leadNo, setLeadNo] = React.useState('');

  const goStep = (i: number) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, i));
    setStep(n);
    setMaxStep((m) => Math.max(m, n));
  };

  const sizeLabel = SIZES.find((s) => s.id === size)?.label || '';
  const paletteObj = PALETTES.find((p) => p.id === palette);
  const termLabel = TERMS.find((t) => t.id === term)?.label || '';

  const nameOk = name.trim().length >= 2;
  const contactOk = contact.trim().length >= 5;
  const canSend = nameOk && contactOk && consent && state !== 'sending';

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSend) return;
    setState('sending');
    const attemptRef = leadNo || leadRef();
    setLeadNo(attemptRef);
    const res = await submitLead({
      lead_ref: attemptRef,
      [HONEYPOT_FIELD]: trap,
      name: name.trim(),
      phone: contact.trim(),
      email: /@/.test(contact) ? contact.trim() : '',
      notes: [
        notes.trim(),
        photo ? `Приложено фото стены: ${photo.name}` : '',
        ref ? `Отправная работа: ${ref.title} (${ref.id})` : '',
      ].filter(Boolean).join(' · '),
      size: sizeLabel,
      style: '',
      palette: paletteObj?.label || '',
      budget,
      weeks: termLabel,
      source: 'commission-brief',
      page: typeof location !== 'undefined' ? location.pathname : '/commission',
      ...utmFromStorage(),
    });
    if (res.ok) { setLeadNo(res.ref); setSent(true); setState('idle'); } else { setState('err'); }
  };

  const summary: Array<[string, string]> = [
    ['Размер', sizeLabel],
    ['Палитра', paletteObj?.label || ''],
    ['Бюджет', `${formatPrice(budget)}`],
    ['Сроки', termLabel],
    ['Контакт', [name.trim(), contact.trim()].filter(Boolean).join(' · ')],
  ];

  return (
    <div className="fade-in mb-section" style={{ paddingTop: 'clamp(20px, 2.4vw, 36px)' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <Breadcrumbs items={[{ label: 'MBezu', href: '/' }, { label: 'На заказ' }]} />

        <header style={{ marginTop: 22, maxWidth: 820 }}>
          <Eyebrow accent>Москва · доставка по России</Eyebrow>
          <h1 className="display" style={{
            margin: '16px 0 0', fontSize: 'clamp(38px, 5.6vw, 84px)',
            lineHeight: .95, fontWeight: 500, letterSpacing: '-.038em',
          }}>
            Картина на заказ{' '}<span className="italic" style={{ color: 'var(--accent)', fontStyle: 'italic' }}>под ваш интерьер</span>
          </h1>
          <p style={{
            margin: '18px 0 0', fontSize: 'clamp(15.5px, 1.15vw, 18px)',
            lineHeight: 1.6, color: 'var(--ink-2)', fontWeight: 300,
          }}>
            Пять коротких шагов — и художник ответит лично: предложит два-три эскиза,
            назовёт срок и стоимость. Мастерская в Москве, показ по записи.
          </p>
        </header>

        {sent ? (
          <section style={{
            marginTop: 'clamp(32px,4vw,64px)', padding: 'clamp(28px,4vw,60px)',
            background: 'var(--bg-soft)', borderRadius: 'var(--r-xl)',
            border: '1px solid var(--rule-soft)', textAlign: 'center',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 'var(--r-pill)',
              background: 'var(--accent)', color: 'var(--bg)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 600, marginBottom: 28,
            }} aria-hidden="true">✓</div>
            <h2 className="display" style={{
              margin: '0 0 16px', fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1.1,
            }}>Бриф получен</h2>
            {leadNo && <p className="cat-no" style={{ margin: '0 0 14px' }}>Номер заявки: <b>{leadNo}</b></p>}
            <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
              Мила ответит лично в течение 24 часов. Хотите быстрее — напишите
              в&nbsp;<a href={ABOUT.contacts.telegramUrl} target="_blank" rel="noopener" className="uh"
                       style={{ color: 'var(--accent)', textDecoration: 'none' }}>Telegram</a>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => go('catalog')}>В каталог</button>
              <button className="btn" onClick={() => go('home')}>На главную</button>
            </div>
          </section>
        ) : (
          <form onSubmit={handle} noValidate id="brief"
                className="mb-cols" style={{ marginTop: 'clamp(28px,3.4vw,52px)', scrollMarginTop: 96 }}>
            {/* ЛЕВО — шаги */}
            <div style={{ flex: '2 1 480px' }}>
              {/* Прогресс */}
              <div style={{ height: 3, background: 'var(--rule-soft)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`,
                  background: 'var(--accent)', transition: 'width .5s cubic-bezier(.16,1,.3,1)',
                }} />
              </div>

              {/* Табы шагов — можно вернуться к любому пройденному */}
              <div role="tablist" aria-label="Шаги брифа"
                   style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {STEPS.map((s, i) => {
                  const reachable = i <= maxStep;
                  return (
                    <button key={s} type="button" role="tab" aria-selected={i === step}
                            disabled={!reachable} onClick={() => reachable && goStep(i)}
                            className={'chip' + (i === step ? ' is-active' : '')}
                            style={{ opacity: reachable ? 1 : .45, cursor: reachable ? 'pointer' : 'default' }}>
                      {String(i + 1).padStart(2, '0')} · {s}
                    </button>
                  );
                })}
              </div>

              {ref && (
                <div style={{
                  marginTop: 22, padding: 18, display: 'flex', alignItems: 'center', gap: 18,
                  background: 'var(--bg-card)', border: '1px solid var(--rule-soft)', borderRadius: 'var(--r-md)',
                }}>
                  <div style={{ width: 72, flexShrink: 0 }}>
                    <PaintingPlate art={ref} fit="bare" objectFit="contain" plain
                                   style={{ aspectRatio: '1', borderRadius: 'var(--r-sm)' }} showMeta={false} />
                  </div>
                  <div>
                    {/* Sprint 16: сюда же приходят карточки работ, которых ещё нет
                        в нативном Store. Для них это не «похожую», а «вот эту». */}
                    <div className="cat-no">{refAvailable ? 'Работа в наличии' : 'Похожую на'}</div>
                    <div className="display" style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{ref.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{dimsLabel(ref)} · {formatPrice(ref.price)}</div>
                    {refAvailable && (
                      <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                        Оригинал свободен. Отправьте заявку — ответим в&nbsp;тот&nbsp;же день и&nbsp;оформим покупку,
                        или напишите сразу в&nbsp;<a href={ABOUT.contacts.telegramUrl} target="_blank" rel="noopener"
                          style={{ color: 'var(--accent)' }}>Telegram</a>.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div key={step} className="mb-step" style={{ marginTop: 26 }}>
                {step === 0 && (
                  <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                    <legend className="display" style={{ fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 500, letterSpacing: '-.02em', padding: 0 }}>
                      Какого размера картина нужна?
                    </legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: 12, marginTop: 18 }}>
                      {SIZES.map((s) => (
                        <Tile key={s.id} active={size === s.id} label={s.label} hint={s.hint}
                              onClick={() => { setSize(s.id); goStep(1); }} />
                      ))}
                    </div>
                  </fieldset>
                )}

                {step === 1 && (
                  <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                    <legend className="display" style={{ fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 500, letterSpacing: '-.02em', padding: 0 }}>
                      Ближе какая палитра?
                    </legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: 12, marginTop: 18 }}>
                      {PALETTES.map((p) => (
                        <Tile key={p.id} active={palette === p.id} label={p.label}
                              onClick={() => { setPalette(p.id); goStep(2); }}>
                          <span aria-hidden="true" style={{ display: 'flex', gap: 6 }}>
                            {p.c.map((c) => (
                              <span key={c} style={{
                                width: 26, height: 26, borderRadius: 6, background: c,
                                border: '1px solid rgba(42,37,32,.12)',
                              }} />
                            ))}
                          </span>
                        </Tile>
                      ))}
                    </div>
                  </fieldset>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="display" style={{ margin: 0, fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 500, letterSpacing: '-.02em' }}>
                      На какой бюджет ориентируемся?
                    </h2>
                    <div className="display" style={{
                      margin: '20px 0 4px', fontSize: 'clamp(34px,4vw,54px)',
                      fontWeight: 500, letterSpacing: '-.03em', color: 'var(--accent)',
                    }}>{formatPrice(budget)}</div>
                    <div className="cat-no">{budgetHint(budget)}</div>
                    <input type="range" min={15000} max={400000} step={5000} value={budget}
                           aria-label="Бюджет заказа"
                           aria-valuetext={`${formatPrice(budget)} — ${budgetHint(budget)}`}
                           onChange={(e) => setBudget(Number(e.target.value))}
                           style={{ width: '100%', marginTop: 18, accentColor: 'var(--accent)' }} />
                    <div className="cat-no" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>15 000 ₽</span><span>400 000 ₽</span>
                    </div>
                    <button type="button" className="btn btn-solid" style={{ marginTop: 22 }}
                            onClick={() => goStep(3)}>Дальше →</button>
                  </div>
                )}

                {step === 3 && (
                  <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                    <legend className="display" style={{ fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 500, letterSpacing: '-.02em', padding: 0 }}>
                      Когда нужна работа?
                    </legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: 12, marginTop: 18 }}>
                      {TERMS.map((t) => (
                        <Tile key={t.id} active={term === t.id} label={t.label} hint={t.hint}
                              onClick={() => { setTerm(t.id); goStep(4); }} />
                      ))}
                    </div>
                  </fieldset>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="display" style={{ margin: 0, fontSize: 'clamp(24px,2.6vw,34px)', fontWeight: 500, letterSpacing: '-.02em' }}>
                      Куда прислать эскизы?
                    </h2>
                    <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true"
                           value={trap} onChange={(e) => setTrap(e.target.value)}
                           style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
                    <div style={{ display: 'grid', gap: 12, marginTop: 18, maxWidth: 560 }}>
                      <input className="field" placeholder="Имя *" aria-label="Имя" name="name" autoComplete="name"
                             aria-required="true" aria-invalid={touched && !nameOk ? true : undefined}
                             value={name} onChange={(e) => setName(e.target.value)} />
                      {touched && !nameOk && <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Укажите имя</span>}
                      <input className="field" placeholder="Телефон, Telegram или email *" name="contact" autoComplete="tel"
                             aria-label="Телефон, Telegram или email" aria-required="true"
                             aria-invalid={touched && !contactOk ? true : undefined}
                             value={contact} onChange={(e) => setContact(e.target.value)} />
                      {touched && !contactOk && <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Укажите контакт — по нему пришлём эскизы</span>}
                      <textarea className="field" rows={3} placeholder="Комментарий: сюжет, комната, что важно (необязательно)"
                                aria-label="Комментарий" value={notes} onChange={(e) => setNotes(e.target.value)} />
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 12, minHeight: 44,
                        fontSize: 14, color: 'var(--ink-2)', cursor: 'pointer',
                      }}>
                        <span className="btn btn-ghost" style={{ minHeight: 44 }}>Фото стены</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                               onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                        <span>{photo ? photo.name : 'необязательно — поможет с размером'}</span>
                      </label>
                      <label style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', cursor: 'pointer',
                      }}>
                        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                               style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0 }} />
                        <span>
                          Согласен(на) на обработку персональных данных (152-ФЗ) —{' '}
                          <a href="/legal?section=privacy"
                             style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Политика ПД</a>
                        </span>
                      </label>
                      {touched && !consent && <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Для отправки нужно согласие на обработку ПД</span>}
                      {state === 'err' && (
                        <div style={{
                          padding: '14px 18px', borderRadius: 'var(--r-md)',
                          background: 'var(--bg-soft)', border: '1px solid var(--accent)',
                          fontSize: 13.5, lineHeight: 1.6,
                        }}>
                          <b>Не удалось отправить бриф.</b> Напишите напрямую:{' '}
                          <a href={ABOUT.contacts.telegramUrl} target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>Telegram</a>{' · '}
                          <a href={`mailto:${ABOUT.contacts.email}`} style={{ color: 'var(--accent)' }}>{ABOUT.contacts.email}</a>{' · '}
                          <a href={`tel:${ABOUT.contacts.phone.replace(/\s/g, '')}`} style={{ color: 'var(--accent)' }}>{ABOUT.contacts.phone}</a>
                        </div>
                      )}
                      <button type="submit" className="btn btn-solid" disabled={state === 'sending'}
                              style={{ minHeight: 54, justifyContent: 'center', opacity: state === 'sending' ? .6 : 1 }}>
                        {state === 'sending' ? 'Отправляем…' : 'Отправить бриф →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {step > 0 && (
                <button type="button" className="btn-link" style={{ marginTop: 22 }}
                        onClick={() => goStep(step - 1)}>← Назад</button>
              )}
            </div>

            {/* ПРАВО — липкое резюме на тёмном */}
            <aside style={{ flex: '1 1 300px', minWidth: 0 }}>
              <div style={{
                position: 'sticky', top: 96,
                background: 'var(--bg-deep)', color: 'var(--bg-cream)',
                borderRadius: 'var(--r-lg)', padding: 'clamp(20px, 2vw, 30px)',
              }}>
                <div className="eyebrow" style={{ color: 'rgba(245,239,226,.7)' }}>Резюме брифа</div>
                <dl style={{ margin: '16px 0 0', display: 'grid', gap: 12 }}>
                  {summary.map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'baseline' }}>
                      <dt className="mono" style={{ fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,239,226,.7)' }}>{k}</dt>
                      <dd style={{ margin: 0, fontSize: 14, textAlign: 'right', color: v ? 'var(--bg-cream)' : 'rgba(245,239,226,.45)' }}>
                        {v || 'не выбрано'}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p style={{ margin: '20px 0 0', fontSize: 13.5, lineHeight: 1.6, color: 'rgba(245,239,226,.78)' }}>
                  Бриф ни к чему не обязывает: сначала эскизы и точная смета, оплата — только после согласования.
                </p>
                <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                  {['Предоплата 50% после эскиза', 'Сертификат подлинности', 'Доставка по РФ со страховкой'].map((g) => (
                    <li key={g} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'rgba(245,239,226,.86)' }}>
                      <span aria-hidden="true" style={{ color: 'var(--accent-2)' }}>◆</span>{g}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </form>
        )}

        {/* Кейс: портрет хоккеиста в подарок (Sprint 16).
            Видео и фото — семья заказчика, публикация с согласия родителей.
            webm/VP8 без звука: 9,6 с, 1,1 МБ, preload="none", poster —
            чтобы блок не бил по LCP и корректно деградировал без поддержки webm. */}
        <section style={{ marginTop: 'clamp(48px, 6vw, 90px)' }}>
          <Eyebrow accent>Как это было</Eyebrow>
          <h2 className="display" style={{ margin: '12px 0 0', fontSize: 'clamp(26px, 3.2vw, 44px)', fontWeight: 500, letterSpacing: '-.02em' }}>
            Портрет в подарок{' '}<span className="italic" style={{ color: 'var(--accent)' }}>на восьмилетие</span>
          </h2>
          <div className="resp-stack" style={{
            marginTop: 26, display: 'grid', gridTemplateColumns: '0.75fr 1.25fr',
            gap: 'clamp(20px, 3vw, 44px)', alignItems: 'start',
          }}>
            {/* вертикальное видео 9:16 — без ограничения по ширине оно уезжает на 900 px */}
            <video
              src="https://cdn.mbezu.ru/assets/commission/zakaz-hokkei-podarok.webm"
              poster="https://cdn.mbezu.ru/assets/commission/zakaz-hokkei-podarok.webp"
              muted loop playsInline controls preload="none"
              aria-label="Видео: мальчик распаковывает картину — портрет хоккейного вратаря, написанный на заказ"
              style={{
                width: '100%', maxWidth: 340, height: 'auto', display: 'block',
                justifySelf: 'center', aspectRatio: '9 / 16', objectFit: 'cover',
                borderRadius: 'var(--r-lg)', background: 'var(--bg-soft)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
            <div>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink-2)' }}>
                Родители прислали фотографии с&nbsp;игр: нужен был момент броска, а&nbsp;не&nbsp;постановочный портрет.
                Эскиз согласовали за&nbsp;неделю, дальше двенадцать недель работы — лёд, свет прожекторов
                и&nbsp;номер на&nbsp;свитере писались с&nbsp;натуры по&nbsp;снимкам.
              </p>
              <p style={{ margin: '14px 0 0', fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink-2)' }}>
                На&nbsp;обороте холста — посвящение от&nbsp;руки и&nbsp;авторская подпись. Это входит в&nbsp;каждую работу:
                картину дарят один раз, а&nbsp;надпись на&nbsp;подрамнике остаётся с&nbsp;ней навсегда.
              </p>
              <figure style={{ margin: '20px 0 0' }}>
                <img src="https://cdn.mbezu.ru/assets/commission/zakaz-hokkei-posvyaschenie.webp"
                     srcSet="https://cdn.mbezu.ru/assets/commission/zakaz-hokkei-posvyaschenie@480.webp 480w, https://cdn.mbezu.ru/assets/commission/zakaz-hokkei-posvyaschenie.webp 1100w"
                     sizes="(max-width: 900px) 92vw, 34vw"
                     alt="Оборот холста: посвящение от руки и подпись художника на подрамнике"
                     loading="lazy" decoding="async"
                     style={{ width: '100%', maxWidth: 380, height: 'auto', display: 'block', borderRadius: 'var(--r-md)' }} />
                <figcaption className="cat-no" style={{ marginTop: 10 }}>Посвящение и подпись на обороте</figcaption>
              </figure>
              <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[['Срок', '12 недель'], ['Основа', 'Портрет по фотографиям'], ['Формат', 'Холст на подрамнике']].map(([k, v]) => (
                  <span key={k} style={{
                    padding: '8px 14px', borderRadius: 'var(--r-pill)',
                    background: 'var(--bg-card)', border: '1px solid var(--rule-soft)',
                    fontSize: 13, color: 'var(--ink-2)',
                  }}><span className="cat-no" style={{ marginRight: 8 }}>{k}</span>{v}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Примеры выполненных заказов (Sprint 16) */}
        {/* До этого страница заказа описывала процесс словами и не показывала ни одной
            сделанной работы. Здесь — четыре реальных заказа разного типа. */}
        <section style={{ marginTop: 'clamp(48px, 6vw, 90px)' }}>
          <Eyebrow accent>Примеры заказов</Eyebrow>
          <h2 className="display" style={{ margin: '12px 0 0', fontSize: 'clamp(26px, 3.2vw, 44px)', fontWeight: 500, letterSpacing: '-.02em' }}>
            Что уже написано на заказ
          </h2>
          <p style={{ marginTop: 14, maxWidth: 760, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.65 }}>
            Не&nbsp;только пейзаж в&nbsp;интерьер: портрет по&nbsp;фотографии, портрет питомца
            и&nbsp;предметная живопись для бренда. Сюжет обсуждаем на&nbsp;брифе — материал и&nbsp;подход одни и&nbsp;те&nbsp;же.
          </p>
          <div className="mb-grid" style={{ marginTop: 28 }}>
            {COMMISSION_CASES.map((c) => (
              <figure key={c.file} data-rev style={{ margin: 0 }}>
                <img src={`https://cdn.mbezu.ru/assets/commission/${c.file}.webp`}
                     srcSet={`https://cdn.mbezu.ru/assets/commission/${c.file}@480.webp 480w, https://cdn.mbezu.ru/assets/commission/${c.file}.webp 1200w`}
                     sizes="(max-width: 600px) 92vw, (max-width: 900px) 46vw, 30vw"
                     alt={c.alt} loading="lazy" decoding="async"
                     style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--r-md)' }} />
                <figcaption style={{ marginTop: 10 }}>
                  <span className="cat-no" style={{ display: 'block', marginBottom: 4 }}>{c.kind}</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>{c.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Процесс 01–05 */}
        <section style={{ marginTop: 'clamp(48px, 6vw, 90px)' }}>
          <Eyebrow accent>Процесс</Eyebrow>
          <h2 className="display" style={{ margin: '12px 0 26px', fontSize: 'clamp(26px, 3.2vw, 44px)', fontWeight: 500, letterSpacing: '-.02em' }}>
            От брифа до подрамника
          </h2>
          <div className="mb-grid-wide">
            {PROCESS.map((s) => (
              <div key={s.n} data-rev style={{
                background: 'var(--bg-card)', border: '1px solid var(--rule-soft)',
                borderRadius: 'var(--r-lg)', padding: 24,
              }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--accent)', fontWeight: 600 }}>{s.n}</div>
                <h3 className="display" style={{ margin: '12px 0 8px', fontSize: 20, fontWeight: 500 }}>{s.label}</h3>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{s.t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Прайс */}
        <section style={{ marginTop: 'clamp(48px, 6vw, 90px)' }}>
          <Eyebrow accent>Прайс на заказ</Eyebrow>
          <h2 className="display" style={{ margin: '12px 0 0', fontSize: 'clamp(26px, 3.2vw, 44px)', fontWeight: 500, letterSpacing: '-.02em' }}>
            Стоимость по размерам
          </h2>
          <p style={{ marginTop: 14, maxWidth: 760, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.65 }}>{COMMISSION.intro}</p>
          <div className="mb-grid-wide" style={{ marginTop: 28 }}>
            {COMMISSION.groups.map((g) => (
              <div key={g.title} data-rev style={{
                padding: 26, background: 'var(--bg-card)',
                borderRadius: 'var(--r-lg)', border: '1px solid var(--rule-soft)',
              }}>
                <h3 className="display" style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 500, color: 'var(--accent)' }}>{g.title}</h3>
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px 12px' }}>
                  {g.items.map(([sz, from]) => (
                    <React.Fragment key={sz}>
                      <dt style={{ fontSize: 14, color: 'var(--ink-2)' }}>{sz}</dt>
                      <dd style={{ margin: 0, fontSize: 14, fontWeight: 500, textAlign: 'right' }}>от {formatPrice(from)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <p className="cat-no" style={{ marginTop: 18, lineHeight: 1.6 }}>{COMMISSION.custom}</p>

          <div className="mb-cols" style={{ marginTop: 32, gap: 'clamp(20px, 3vw, 48px)' }}>
            <div>
              <Eyebrow accent>В стоимость входит</Eyebrow>
              <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                {COMMISSION.included.map((it) => (
                  <li key={it} style={{ fontSize: 14, color: 'var(--ink-2)', display: 'flex', gap: 10 }}>
                    <span aria-hidden="true" style={{ color: 'var(--accent)' }}>◆</span>{it}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Eyebrow accent>Оплачивается отдельно</Eyebrow>
              <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                {COMMISSION.extra.map((it) => (
                  <li key={it} style={{ fontSize: 14, color: 'var(--ink-2)', display: 'flex', gap: 10 }}>
                    <span aria-hidden="true" style={{ color: 'var(--accent-soft)' }}>◇</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p style={{
            marginTop: 26, padding: '16px 20px', background: 'var(--bg-soft)',
            borderRadius: 'var(--r-md)', border: '1px solid var(--rule-soft)',
            fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6,
          }}>{COMMISSION.terms}</p>
          <p style={{ margin: '18px 0 0', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            Нужно к дате и ждать некогда — посмотрите готовые работы:{' '}
            <a href="/podarok" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>картина в подарок</a> или{' '}
            <a href="/catalog" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>каталог в наличии</a>.
          </p>
        </section>

        {/* Примеры серий как ориентир по сюжету */}
        <section style={{ marginTop: 'clamp(48px, 6vw, 90px)' }}>
          <Eyebrow accent>Ориентиры</Eyebrow>
          <h2 className="display" style={{ margin: '12px 0 26px', fontSize: 'clamp(26px, 3.2vw, 44px)', fontWeight: 500, letterSpacing: '-.02em' }}>
            Что пишем чаще всего
          </h2>
          <div className="mb-grid-wide">
            {SERIES.map((s) => (
              <a key={s.id} href={`/catalog?series=${encodeURIComponent(s.id)}`} data-rev
                 style={{
                   textDecoration: 'none', color: 'inherit',
                   background: 'var(--bg-card)', border: '1px solid var(--rule-soft)',
                   borderRadius: 'var(--r-lg)', padding: 24, display: 'block',
                 }}>
                <span className="cat-no" style={{ color: s.color }}>{s.years}</span>
                <h3 className="display" style={{ margin: '10px 0 6px', fontSize: 21, fontWeight: 500 }}>{s.title}</h3>
                <p className="italic" style={{ margin: 0, fontSize: 14.5, color: 'var(--accent)', fontStyle: 'italic' }}>{s.subtitle}</p>
              </a>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginTop: 'clamp(48px, 6vw, 90px)' }}>
          <Eyebrow accent>Вопросы и ответы</Eyebrow>
          <h2 className="display" style={{ margin: '12px 0 22px', fontSize: 'clamp(26px, 3.2vw, 44px)', fontWeight: 500, letterSpacing: '-.02em' }}>
            Частые вопросы
          </h2>
          <dl style={{ margin: 0, maxWidth: 860 }}>
            {COMMISSION_FAQ.map(([q, a]) => (
              <div key={q} style={{ padding: '20px 0', borderTop: '1px solid var(--rule-soft)' }}>
                <dt className="display" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-.01em' }}>{q}</dt>
                <dd style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>{a}</dd>
              </div>
            ))}
          </dl>
          <p style={{ margin: '24px 0 0', maxWidth: 860, fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-2)' }}>
            Ещё не решили, что и куда: разбор с примерами — <a href={INTERIOR_GUIDE_URL} className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>как выбрать картину для гостиной</a>;
            подборки по комнатам — <a href="/kartina-v-gostinuyu" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>в гостиную</a>,{' '}
            <a href="/kartina-v-spalnyu" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>в спальню</a>,{' '}
            <a href="/kartina-v-kabinet" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>в кабинет</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

export { CommissionPage };
export default CommissionPage;
