import React from 'react';
import { PaintingPlate } from '../common/adapter';
import { Breadcrumbs, Eyebrow, PageTitle } from '../common/atoms';
import { ABOUT, artworkById, formatPrice } from '../common/data';

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

  // Sprint 13 (Ф4): сетка произвольных цветов — 8 оттенков × 6 светлот (HSL → hex)
  const hslHex = (h: number, s: number, l: number) => {
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  const SWATCH_HUES = [0, 45, 90, 135, 180, 225, 270, 315];
  const SWATCH_LIGHT = [85, 70, 55, 40, 28, 16];
  const swatches: string[] = [];
  for (const l of SWATCH_LIGHT) for (const h of SWATCH_HUES) swatches.push(hslHex(h, 42, l));

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

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handle = (e) => { e.preventDefault(); setSent(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };

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
          { label: 'MBezu', onClick: () => go('home') },
          { label: 'На заказ' },
        ]} />

        <div style={{ marginTop: 36 }}>
          <PageTitle
            kicker="Картина под ваше место"
            title={<>Заказать<br/><span className="italic" style={{ color: 'var(--accent)' }}>индивидуально</span></>}
            lead="Заполните бриф — Мила свяжется и предложит два-три эскиза. Договор заключаем после согласования эскиза, предоплата 50%."
          />
        </div>

        {/* Прайс на заказ — «от / зависит от сложности» */}
        <section style={{ marginTop: 56 }}>
          <Eyebrow accent>Прайс на заказ</Eyebrow>
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

          <div className="resp-stack-2" style={{
            marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
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
          <form onSubmit={handle} className="resp-stack" style={{
            marginTop: 56,
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
                    <button key={s.id} type="button" onClick={() => upd('size', s.id)}
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
                      <input className="field" type="number" min={10} max={300} placeholder="Ширина, см"
                             value={form.customW} onChange={(e) => upd('customW', e.target.value)}
                             style={{ width: 150 }} />
                      <span style={{ color: 'var(--ink-3)' }}>×</span>
                      <input className="field" type="number" min={10} max={300} placeholder="Высота, см"
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
                    <button key={s.id} type="button" onClick={() => upd('style', s.id)}
                            className={'chip' + (form.style === s.id ? ' is-active' : '')}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {form.style === 'custom' && (
                  <input className="field fade-in" placeholder="Опишите стиль — например, «абстракция в тёплых тонах»"
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
                    <button key={p.id} type="button" onClick={() => { upd('palette', p.id); setShowPicker(false); }}
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

                {/* сетка 48 образцов (8 оттенков × 6 светлот) */}
                <div className="swatch-grid" style={{
                  marginTop: 14, display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)', gap: 8,
                }}>
                  {swatches.map((hex) => (
                    <button key={hex} type="button" aria-label={`Цвет ${hex}`}
                            onClick={() => { upd('palette', hex); setShowPicker(false); }}
                            style={{
                              aspectRatio: '1', minHeight: 44, width: '100%',
                              background: hex, cursor: 'pointer',
                              borderRadius: 'var(--r-sm)',
                              border: form.palette === hex ? '3px solid var(--accent)' : '1px solid var(--rule-soft)',
                              boxShadow: form.palette === hex ? 'var(--shadow-md)' : 'none',
                              transition: 'border-color .15s',
                              padding: 0,
                            }} />
                  ))}
                </div>

                {/* «Другое» → нативный color-picker */}
                <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button"
                          className={'chip' + (showPicker ? ' is-active' : '')}
                          onClick={() => { setShowPicker(!showPicker); if (!isHexPalette) upd('palette', '#a08a4e'); }}>
                    Другое
                  </button>
                  {showPicker && (
                    <input type="color" aria-label="Произвольный цвет"
                           value={isHexPalette ? form.palette : '#a08a4e'}
                           onChange={(e) => upd('palette', e.target.value)}
                           style={{ width: 64, height: 44, border: '1px solid var(--rule-soft)', borderRadius: 'var(--r-sm)', background: 'var(--bg-card)', cursor: 'pointer', padding: 2 }} />
                  )}
                  {isHexPalette && (
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                      В заявку уйдёт строкой: <span className="mono">Палитра: {form.palette.toUpperCase()}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Бюджет */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                  <Eyebrow accent>04 · Бюджет</Eyebrow>
                  <span className="display" style={{ fontSize: 24, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.015em' }}>
                    {formatPrice(form.budget)}
                  </span>
                </div>
                <input type="range" min={6000} max={120000} step={1000}
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
                    <button key={w} type="button" onClick={() => upd('weeks', w)}
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
                  <input className="field" placeholder="Имя" required value={form.name} onChange={(e) => upd('name', e.target.value)} />
                  <input className="field" placeholder="Email или Telegram" required value={form.email} onChange={(e) => upd('email', e.target.value)} />
                  <input className="field" placeholder="Город" value={form.city} onChange={(e) => upd('city', e.target.value)} />
                  <input className="field" placeholder="Куда повесим (опц.)" value={form.where || ''} onChange={(e) => upd('where', e.target.value)} />
                </div>
                <textarea className="field" placeholder="Дополнительно — настроение, ассоциации, ссылки на референсы…" rows={4} style={{ marginTop: 14 }}
                          value={form.notes} onChange={(e) => upd('notes', e.target.value)} />
              </div>

              <button type="submit" className="btn btn-solid" style={{ alignSelf: 'flex-start', padding: '20px 40px', fontSize: 13 }}>
                Отправить бриф →
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
        )}
      </div>
    </div>
  );
}

export { CommissionPage };
export default CommissionPage;
