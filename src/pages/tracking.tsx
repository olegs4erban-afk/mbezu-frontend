import React from 'react';
import { PaintingPlate } from '../common/adapter';
import { Breadcrumbs, Eyebrow, PageTitle } from '../common/atoms';
import { ABOUT, artworkById, formatPrice } from '../common/data';

// ─────────────────────────────────────────────────────────────
// page-tracking.jsx — статус заказа.
// Поле ввода № → карточка заказа + 7-этапная timeline.
// ─────────────────────────────────────────────────────────────

function TrackingPage({ go }) {
  const [no, setNo] = React.useState('MB-2026-0042');
  const [shown, setShown] = React.useState(true);
  const demo = artworkById('ST-05'); // Ангкор-Ват как пример

  const stages = [
    { id: 'received',  label: 'Заявка получена',     date: '18 янв · 14:20', status: 'done',    note: 'Бриф зафиксирован, эскизы готовятся' },
    { id: 'paid',      label: 'Предоплата 50%',      date: '20 янв · 09:11', status: 'done',    note: 'Подтверждено ЮKassa, чек в почте' },
    { id: 'sketch',    label: 'Эскиз согласован',    date: '25 янв · 18:30', status: 'done',    note: 'Из трёх вариантов выбран № 02' },
    { id: 'painting',  label: 'Письмо в студии',     date: 'идёт сейчас',    status: 'current', note: 'Масло, лён 100×80 см. Подложка готова' },
    { id: 'finished',  label: 'Финал и фотосессия',  date: '~ 14 фев',       status: 'planned', note: 'Сушка слоёв, лак, профессиональная съёмка' },
    { id: 'shipping',  label: 'В пути',              date: '~ 18 фев',       status: 'planned', note: 'Арт-логистика с страховкой' },
    { id: 'delivered', label: 'Доставлено',          date: '~ 22 фев',       status: 'planned', note: 'Финальная остаток 50%' },
  ];

  return (
    <div className="fade-in resp-pad" style={{ padding: '36px 40px 80px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <Breadcrumbs items={[
          { label: 'MBezu', onClick: () => go('home') },
          { label: 'Статус заказа' },
        ]} />

        <div style={{ marginTop: 36 }}>
          <PageTitle
            kicker="Где моя картина"
            title={<>Статус<br/><span className="italic" style={{ color: 'var(--accent)' }}>заказа.</span></>}
            lead="Введите номер заказа из письма-подтверждения. Покажем все этапы — от брифа до доставки."
          />
        </div>

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); setShown(true); }}
              style={{
                marginTop: 40, maxWidth: 560,
                display: 'flex', gap: 8, alignItems: 'center',
                background: 'var(--bg-card)', borderRadius: 'var(--r-pill)',
                padding: 6, border: '1px solid var(--rule-soft)',
                boxShadow: 'var(--shadow-sm)',
              }}>
          <input value={no} onChange={(e) => setNo(e.target.value)}
                 placeholder="MB-2026-0042" required
                 style={{
                   border: 0, background: 'transparent', flex: 1,
                   padding: '16px 22px', fontSize: 16, outline: 'none',
                   fontFamily: 'var(--mono)', letterSpacing: '.08em',
                   color: 'var(--ink)',
                 }} />
          <button type="submit" className="btn btn-solid" style={{ flexShrink: 0 }}>
            Найти →
          </button>
        </form>

        {shown && demo && (
          <div className="resp-stack" style={{
            marginTop: 56, display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 60, alignItems: 'start',
          }}>
            {/* LEFT — order card */}
            <aside style={{ position: 'sticky', top: 100, alignSelf: 'start' }} className="resp-static">
              <div className="card" style={{
                padding: 32, background: 'var(--bg-card)',
                borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)',
              }}>
                <div style={{ marginBottom: 20 }}>
                  <PaintingPlate art={demo} fit="bare" style={{
                    aspectRatio: `${demo.w}/${demo.h}`,
                    borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-md)',
                  }} showMeta={false} />
                </div>
                <Eyebrow accent>№ заказа</Eyebrow>
                <div className="display" style={{
                  fontSize: 28, fontWeight: 500, margin: '10px 0 24px',
                  letterSpacing: '-.015em',
                }}>{no.toUpperCase()}</div>

                <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', margin: 0 }}>
                  <dt className="cat-no">Работа</dt>
                  <dd style={{ margin: 0, fontSize: 13, textAlign: 'right' }}>{demo.title}</dd>

                  <dt className="cat-no">Размер</dt>
                  <dd style={{ margin: 0, fontSize: 13, textAlign: 'right' }}>{demo.w}×{demo.h} см</dd>

                  <dt className="cat-no">Получатель</dt>
                  <dd style={{ margin: 0, fontSize: 13, textAlign: 'right' }}>••• Иван••</dd>

                  <dt className="cat-no">Город</dt>
                  <dd style={{ margin: 0, fontSize: 13, textAlign: 'right' }}>Санкт-Петербург</dd>

                  <dt className="cat-no">Сумма</dt>
                  <dd style={{ margin: 0, fontSize: 13, textAlign: 'right' }}>{formatPrice(demo.price)}</dd>

                  <dt className="cat-no">Оплачено</dt>
                  <dd style={{ margin: 0, fontSize: 13, textAlign: 'right', color: 'var(--accent)', fontWeight: 500 }}>50% · {formatPrice(demo.price / 2)}</dd>
                </dl>

                <div className="rule-soft" style={{ margin: '24px 0' }} />

                <div className="cat-no" style={{ lineHeight: 1.6 }}>
                  Связь с художницей —<br/>
                  <a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener" className="uh"
                     style={{ color: 'var(--accent)', textDecoration: 'none' }}>Telegram · @{ABOUT.contacts.telegram}</a>
                </div>
              </div>
            </aside>

            {/* RIGHT — timeline */}
            <div>
              <Eyebrow accent>Этапы · 7 из 7</Eyebrow>
              <h2 className="display" style={{
                margin: '16px 0 40px', fontSize: 'clamp(32px, 4vw, 52px)',
                fontWeight: 500, lineHeight: 1, letterSpacing: '-.025em',
              }}>
                Где сейчас работа.
              </h2>

              <ol style={{
                listStyle: 'none', margin: 0, padding: 0,
                display: 'flex', flexDirection: 'column',
              }}>
                {stages.map((s, i) => {
                  const isLast = i === stages.length - 1;
                  const dotColor =
                    s.status === 'done'    ? 'var(--ink)' :
                    s.status === 'current' ? 'var(--accent)' : 'var(--bg-card)';
                  const dotBorder =
                    s.status === 'done'    ? 'var(--ink)' :
                    s.status === 'current' ? 'var(--accent)' : 'var(--rule)';
                  return (
                    <li key={s.id} style={{
                      display: 'grid', gridTemplateColumns: '40px 1fr auto',
                      gap: 24, padding: '0 0 36px',
                      position: 'relative',
                    }}>
                      {/* Vertical line */}
                      {!isLast && (
                        <span style={{
                          position: 'absolute', left: 18, top: 36, bottom: 0, width: 1,
                          background: s.status === 'done' ? 'var(--ink)' : 'var(--rule-soft)',
                        }} />
                      )}
                      {/* Dot */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--r-pill)',
                        background: dotColor, border: '2px solid ' + dotBorder,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: s.status === 'planned' ? 'var(--ink-3)' : 'var(--bg)',
                        flexShrink: 0, zIndex: 1, position: 'relative',
                        fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                        boxShadow: s.status === 'current' ? 'var(--shadow-md)' : 'none',
                      }}>
                        {s.status === 'done' ? '✓' : String(i + 1).padStart(2, '0')}
                      </div>
                      {/* Text */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                          <h3 className="display" style={{
                            margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-.01em',
                            color: s.status === 'planned' ? 'var(--ink-3)' : 'var(--ink)',
                          }}>{s.label}</h3>
                          {s.status === 'current' && (
                            <span style={{
                              padding: '5px 12px', background: 'var(--accent)', color: 'var(--bg)',
                              borderRadius: 'var(--r-pill)', fontFamily: 'var(--mono)',
                              fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase',
                              fontWeight: 600,
                            }}>СЕЙЧАС</span>
                          )}
                        </div>
                        <p style={{
                          margin: '8px 0 0', fontSize: 14, lineHeight: 1.55,
                          color: s.status === 'planned' ? 'var(--ink-3)' : 'var(--ink-2)',
                        }}>{s.note}</p>
                      </div>
                      {/* Date */}
                      <div className="cat-no" style={{
                        whiteSpace: 'nowrap', textAlign: 'right', paddingTop: 8,
                        color: s.status === 'current' ? 'var(--accent)' : 'var(--ink-3)',
                        fontWeight: s.status === 'current' ? 600 : 500,
                      }}>{s.date}</div>
                    </li>
                  );
                })}
              </ol>

              {/* Studio update card */}
              <div className="card" style={{
                marginTop: 16, padding: 32,
                background: 'var(--bg-soft)', borderRadius: 'var(--r-lg)',
                border: '1px solid var(--rule-soft)',
                display: 'grid', gridTemplateColumns: '180px 1fr', gap: 28, alignItems: 'center',
              }}>
                <div className="ph-art" style={{
                  aspectRatio: '4 / 5',
                  background: `linear-gradient(135deg, ${(demo.palette || ['#a89888'])[0]}, ${(demo.palette || ['#5e4d3d','#5e4d3d'])[1]})`,
                  borderRadius: 'var(--r-md)',
                  boxShadow: 'var(--shadow-md)',
                }} />
                <div>
                  <Eyebrow accent>Фото из студии · сегодня</Eyebrow>
                  <p className="italic display" style={{
                    margin: '14px 0 16px', fontSize: 22, lineHeight: 1.35,
                    fontStyle: 'italic', color: 'var(--ink)',
                    fontWeight: 400, letterSpacing: '-.005em',
                  }}>
                    «Сегодня прошлась по теням архитектуры. Завтра — небо.»
                  </p>
                  <div className="cat-no" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>MBezu · студия, Москва</span>
                    <span>11 мая · 18:42</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help */}
        <section className="resp-pad" style={{
          marginTop: 100, padding: '60px 40px',
          textAlign: 'center', background: 'var(--bg-soft)',
          borderRadius: 'var(--r-xl)', border: '1px solid var(--rule-soft)',
        }}>
          <Eyebrow accent>Не нашли заказ?</Eyebrow>
          <h2 className="display" style={{
            margin: '20px 0 24px', fontSize: 'clamp(28px, 3.4vw, 44px)',
            fontWeight: 500, lineHeight: 1.05, letterSpacing: '-.02em',
          }}>
            Напишите — <span className="italic" style={{ color: 'var(--accent)' }}>найдём</span> в&nbsp;течение часа.
          </h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn btn-solid" href={`mailto:${ABOUT.contacts.email}`}>{ABOUT.contacts.email}</a>
            <a className="btn btn-ghost" href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener">Telegram</a>
          </div>
        </section>
      </div>
    </div>
  );
}

export { TrackingPage };
export default TrackingPage;
