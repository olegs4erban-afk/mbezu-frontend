import React from 'react';
import { PaintingPlate } from '../common/adapter';
import { Breadcrumbs, Eyebrow, PageTitle } from '../common/atoms';
import { artworkById, formatPrice, seriesById } from '../common/data';

// ─────────────────────────────────────────────────────────────
// page-cart.jsx — корзина и чекаут.
// Шаги: Корзина → Доставка → Оплата → Готово.
// ─────────────────────────────────────────────────────────────

function CartPage({ go, cart, removeFromCart }) {
  const [step, setStep] = React.useState('cart');
  const [delivery, setDelivery] = React.useState('cdek');
  const [payment, setPayment] = React.useState('card');
  const [agreed, setAgreed] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '', phone: '', email: '', city: '', address: '',
  });
  const [orderNo, setOrderNo] = React.useState('');

  const items = cart.map((id) => artworkById(id)).filter(Boolean);
  const subtotal = items.reduce((s, a) => s + a.price, 0);
  const deliveryPrice = delivery === 'cdek' ? 4500 : (delivery === 'art' ? 9000 : 0);
  const total = subtotal + deliveryPrice;
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePay = () => {
    const no = 'MB-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    setOrderNo(no);
    setStep('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stepIndex = ['cart', 'delivery', 'payment', 'done'].indexOf(step);
  const stepsLabels = ['Корзина', 'Доставка', 'Оплата', 'Готово'];

  return (
    <div className="fade-in resp-pad" style={{ padding: '36px 40px 80px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <Breadcrumbs items={[
          { label: 'MBezu', onClick: () => go('home') },
          { label: 'Корзина' },
        ]} />

        {/* Step indicator */}
        <div style={{
          marginTop: 36, marginBottom: 56,
          display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap',
        }}>
          {stepsLabels.map((lbl, i) => (
            <React.Fragment key={i}>
              <div className="mono" style={{
                padding: '10px 18px', borderRadius: 'var(--r-pill)',
                background: i <= stepIndex ? 'var(--accent)' : 'var(--bg-card)',
                color: i <= stepIndex ? 'var(--bg)' : 'var(--ink-3)',
                fontSize: 10.5, letterSpacing: '.18em', textTransform: 'uppercase',
                fontWeight: 600, transition: 'all .3s',
                border: '1px solid ' + (i <= stepIndex ? 'var(--accent)' : 'var(--rule-soft)'),
              }}>
                {String(i + 1).padStart(2, '0')} · {lbl}
              </div>
              {i < stepsLabels.length - 1 && (
                <div style={{ width: 24, height: 1, background: i < stepIndex ? 'var(--accent)' : 'var(--rule-soft)' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ═══ STEP 1 · CART ═══ */}
        {step === 'cart' && (
          <>
            <PageTitle
              kicker={`${items.length} ${items.length === 1 ? 'работа' : 'работы'} в корзине`}
              title={<>Ваша<br/><span className="italic" style={{ color: 'var(--accent)' }}>корзина.</span></>}
            />

            {items.length === 0 ? (
              <div style={{
                marginTop: 60, padding: '80px 40px',
                background: 'var(--bg-soft)', borderRadius: 'var(--r-xl)',
                textAlign: 'center', border: '1px solid var(--rule-soft)',
              }}>
                <div className="display" style={{ fontSize: 32, margin: 0, color: 'var(--ink)', letterSpacing: '-.02em' }}>
                  Пока пусто
                </div>
                <p style={{ fontSize: 15, color: 'var(--ink-2)', maxWidth: 380, margin: '16px auto 24px' }}>
                  Добавьте работы из каталога или закажите индивидуально под ваше место.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-solid" onClick={() => go('catalog')}>В каталог</button>
                  <button className="btn btn-ghost" onClick={() => go('commission')}>На заказ</button>
                </div>
              </div>
            ) : (
              <div className="resp-stack" style={{
                marginTop: 48, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 60,
              }}>
                {/* Items list */}
                <div>
                  {items.map((art, i) => {
                    const series = seriesById(art.series);
                    return (
                      <article key={art.id} className="resp-list-row" style={{
                        display: 'grid', gridTemplateColumns: '120px 1fr auto auto',
                        gap: 24, padding: '28px 0', alignItems: 'center',
                        borderTop: i === 0 ? '1px solid var(--rule-soft)' : 'none',
                        borderBottom: '1px solid var(--rule-soft)',
                      }}>
                        <div style={{ cursor: 'pointer' }} onClick={() => go('painting', { id: art.id })}>
                          <PaintingPlate art={art} fit="bare" style={{
                            aspectRatio: '1', borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-sm)',
                          }} showMeta={false} />
                        </div>
                        <div>
                          <div className="cat-no" style={{ color: series?.color }}>{art.id} · {series?.title}</div>
                          <h3 className="display" style={{
                            margin: '8px 0 4px', fontSize: 22, fontWeight: 500, letterSpacing: '-.01em',
                            cursor: 'pointer',
                          }} onClick={() => go('painting', { id: art.id })}>
                            {art.title}
                          </h3>
                          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                            {art.w}×{art.h} см · {art.year} · {art.medium}
                          </div>
                        </div>
                        <div className="display resp-list-hide" style={{
                          fontSize: 22, fontWeight: 500, letterSpacing: '-.015em',
                        }}>
                          {formatPrice(art.price)}
                        </div>
                        <button onClick={() => removeFromCart(art.id)}
                                style={{
                                  background: 'transparent', border: '1px solid var(--rule)',
                                  borderRadius: 'var(--r-pill)', padding: '8px 16px',
                                  fontFamily: 'var(--mono)', fontSize: 10.5,
                                  letterSpacing: '.16em', textTransform: 'uppercase',
                                  color: 'var(--ink-2)', cursor: 'pointer',
                                  transition: 'all .2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.color = 'var(--ink-2)'; }}>
                          Убрать
                        </button>
                      </article>
                    );
                  })}

                  <button className="btn btn-ghost" style={{ marginTop: 32 }} onClick={() => go('catalog')}>
                    ← Продолжить покупки
                  </button>
                </div>

                {/* Summary sidebar */}
                <aside style={{ position: 'sticky', top: 100, alignSelf: 'start' }} className="resp-static">
                  <div className="card" style={{
                    padding: 32, background: 'var(--bg-card)',
                    borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)',
                  }}>
                    <Eyebrow accent>К оплате</Eyebrow>
                    <h3 className="display" style={{
                      margin: '14px 0 24px', fontSize: 22, fontWeight: 500, letterSpacing: '-.01em',
                    }}>Сумма заказа</h3>

                    <dl style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px 16px', margin: 0 }}>
                      <dt className="cat-no">Подытог</dt>
                      <dd style={{ margin: 0, fontSize: 14, textAlign: 'right' }}>{formatPrice(subtotal)}</dd>
                      <dt className="cat-no">Доставка</dt>
                      <dd style={{ margin: 0, fontSize: 14, textAlign: 'right' }}>рассчитаем на следующем шаге</dd>
                    </dl>

                    <div className="rule-soft" style={{ margin: '24px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="cat-no">К оплате</span>
                      <span className="display" style={{ fontSize: 36, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.025em' }}>
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    <button className="btn btn-solid" style={{ width: '100%', justifyContent: 'center', marginTop: 28 }}
                            onClick={() => { setStep('delivery'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      Оформить заказ →
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}

        {/* ═══ STEP 2 · DELIVERY ═══ */}
        {step === 'delivery' && (
          <>
            <PageTitle
              kicker="Шаг 02"
              title={<>Куда <span className="italic" style={{ color: 'var(--accent)' }}>отправляем?</span></>}
            />

            <div className="resp-stack" style={{
              marginTop: 48, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 60,
            }}>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="resp-stack-2">
                  <input className="field" placeholder="Имя" value={form.name} onChange={(e) => upd('name', e.target.value)} required />
                  <input className="field" placeholder="Телефон" value={form.phone} onChange={(e) => upd('phone', e.target.value)} required />
                  <input className="field" placeholder="Email" value={form.email} onChange={(e) => upd('email', e.target.value)} required />
                  <input className="field" placeholder="Город" value={form.city} onChange={(e) => upd('city', e.target.value)} required />
                </div>
                <input className="field" placeholder="Адрес доставки или пункт выдачи" value={form.address} onChange={(e) => upd('address', e.target.value)} style={{ marginTop: 14 }} required />

                <h3 className="display" style={{ margin: '40px 0 18px', fontSize: 22, fontWeight: 500, letterSpacing: '-.01em' }}>Способ доставки</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { id: 'cdek', label: 'СДЭК · 5–7 дней', price: 4500, note: 'Доставка до пункта выдачи или курьером' },
                    { id: 'art',  label: 'Арт-логистика · 7–10 дней', price: 9000, note: 'Бережная перевозка с страховкой' },
                    { id: 'self', label: 'Самовывоз · Москва · по записи', price: 0, note: 'Из студии, бесплатно' },
                  ].map((d) => (
                    <button key={d.id} type="button" onClick={() => setDelivery(d.id)}
                            style={{
                              padding: '20px 24px',
                              background: delivery === d.id ? 'var(--ink)' : 'var(--bg-card)',
                              color: delivery === d.id ? 'var(--bg)' : 'var(--ink)',
                              border: '1px solid ' + (delivery === d.id ? 'var(--ink)' : 'var(--rule-soft)'),
                              borderRadius: 'var(--r-md)', cursor: 'pointer',
                              textAlign: 'left', transition: 'all .2s',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20,
                              boxShadow: delivery === d.id ? 'var(--shadow-md)' : 'none',
                            }}>
                      <div>
                        <div className="display" style={{ fontSize: 17, fontWeight: 500 }}>{d.label}</div>
                        <div style={{ fontSize: 12.5, opacity: .7, marginTop: 4 }}>{d.note}</div>
                      </div>
                      <div className="display" style={{ fontSize: 18, fontWeight: 500 }}>
                        {d.price > 0 ? formatPrice(d.price) : 'бесплатно'}
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 14, marginTop: 40, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost" onClick={() => { setStep('cart'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>← Назад</button>
                  <button className="btn btn-solid" onClick={() => { setStep('payment'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Далее · оплата →</button>
                </div>
              </div>

              <aside style={{ position: 'sticky', top: 100, alignSelf: 'start' }} className="resp-static">
                <div className="card" style={{ padding: 32, background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)' }}>
                  <Eyebrow accent>Заказ</Eyebrow>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map((a) => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 12 }}>
                        <span style={{ color: 'var(--ink-2)' }}>{a.title}</span>
                        <span>{formatPrice(a.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rule-soft" style={{ margin: '20px 0' }} />
                  <dl style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px 16px', margin: 0 }}>
                    <dt className="cat-no">Подытог</dt>
                    <dd style={{ margin: 0, fontSize: 14, textAlign: 'right' }}>{formatPrice(subtotal)}</dd>
                    <dt className="cat-no">Доставка</dt>
                    <dd style={{ margin: 0, fontSize: 14, textAlign: 'right' }}>{deliveryPrice > 0 ? formatPrice(deliveryPrice) : 'бесплатно'}</dd>
                  </dl>
                  <div className="rule-soft" style={{ margin: '20px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="cat-no">К оплате</span>
                    <span className="display" style={{ fontSize: 36, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.025em' }}>
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        {/* ═══ STEP 3 · PAYMENT ═══ */}
        {step === 'payment' && (
          <>
            <PageTitle
              kicker="Шаг 03"
              title={<>Способ <span className="italic" style={{ color: 'var(--accent)' }}>оплаты.</span></>}
            />

            <div className="resp-stack" style={{
              marginTop: 48, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 60,
            }}>
              <div>
                <div className="resp-stack-3" style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                }}>
                  {[
                    { id: 'card', label: 'Картой', note: 'Visa · Mastercard · МИР · ЮKassa' },
                    { id: 'sbp',  label: 'СБП',    note: 'Система быстрых платежей' },
                    { id: 'bill', label: 'Счёт',   note: 'Для юр. лиц, безналичный расчёт' },
                  ].map((p) => (
                    <button key={p.id} type="button" onClick={() => setPayment(p.id)}
                            style={{
                              padding: '24px 20px',
                              background: payment === p.id ? 'var(--ink)' : 'var(--bg-card)',
                              color: payment === p.id ? 'var(--bg)' : 'var(--ink)',
                              border: '1px solid ' + (payment === p.id ? 'var(--ink)' : 'var(--rule-soft)'),
                              borderRadius: 'var(--r-md)', cursor: 'pointer',
                              textAlign: 'left', transition: 'all .2s',
                              boxShadow: payment === p.id ? 'var(--shadow-md)' : 'none',
                            }}>
                      <div className="display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.01em' }}>{p.label}</div>
                      <div style={{ fontSize: 12.5, opacity: .7, marginTop: 8 }}>{p.note}</div>
                    </button>
                  ))}
                </div>

                <label style={{
                  marginTop: 40, display: 'flex', gap: 14, alignItems: 'flex-start',
                  cursor: 'pointer', padding: '20px 24px',
                  background: 'var(--bg-soft)', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--rule-soft)',
                }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                         style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                    Согласен с&nbsp;
                    <a href="#" onClick={(e) => { e.preventDefault(); go('legal', { section: 'offer' }); }}
                       className="uh" style={{ color: 'var(--accent)' }}>офертой</a>,&nbsp;
                    <a href="#" onClick={(e) => { e.preventDefault(); go('legal', { section: 'privacy' }); }}
                       className="uh" style={{ color: 'var(--accent)' }}>политикой обработки данных</a>&nbsp;
                    и&nbsp;
                    <a href="#" onClick={(e) => { e.preventDefault(); go('legal', { section: 'returns' }); }}
                       className="uh" style={{ color: 'var(--accent)' }}>условиями возврата</a>.
                  </span>
                </label>

                <div style={{ display: 'flex', gap: 14, marginTop: 40, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost" onClick={() => { setStep('delivery'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>← Назад</button>
                  <button className="btn btn-solid" disabled={!agreed}
                          style={{ opacity: agreed ? 1 : .5, cursor: agreed ? 'pointer' : 'not-allowed' }}
                          onClick={handlePay}>
                    Оплатить · {formatPrice(total)}
                  </button>
                </div>
              </div>

              <aside style={{ position: 'sticky', top: 100, alignSelf: 'start' }} className="resp-static">
                <div className="card" style={{ padding: 32, background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)' }}>
                  <Eyebrow accent>Итого</Eyebrow>
                  <div className="display" style={{ fontSize: 56, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.03em', lineHeight: 1, marginTop: 14 }}>
                    {formatPrice(total)}
                  </div>
                  <div className="cat-no" style={{ marginTop: 14, lineHeight: 1.7 }}>
                    {items.length} {items.length === 1 ? 'работа' : 'работы'} · доставка {deliveryPrice > 0 ? formatPrice(deliveryPrice) : 'бесплатно'}<br/>
                    После оплаты — подтверждение на&nbsp;email и&nbsp;трекинг
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        {/* ═══ STEP 4 · DONE ═══ */}
        {step === 'done' && (
          <section style={{
            marginTop: 60, padding: '80px 60px',
            background: 'var(--bg-soft)', borderRadius: 'var(--r-xl)',
            border: '1px solid var(--rule-soft)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: 'var(--r-pill)',
              background: 'var(--accent)', color: 'var(--bg)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, fontWeight: 500, marginBottom: 40,
              boxShadow: 'var(--shadow-md)',
            }}>✓</div>

            <Eyebrow accent>Оплачено</Eyebrow>
            <h1 className="display resp-h1" style={{
              margin: '24px 0 16px', fontSize: 'clamp(40px, 5.5vw, 80px)',
              fontWeight: 500, lineHeight: 0.98, letterSpacing: '-.03em',
            }}>
              Картина<br/><span className="italic" style={{ color: 'var(--accent)' }}>едет к вам.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
              Подтверждение и&nbsp;квитанция отправлены на&nbsp;{form.email || 'вашу почту'}. Художница свяжется с&nbsp;вами в&nbsp;течение дня.
            </p>

            <div style={{
              marginTop: 40, display: 'inline-flex',
              padding: '20px 32px', background: 'var(--bg-card)',
              borderRadius: 'var(--r-pill)', boxShadow: 'var(--shadow-sm)',
              gap: 18, alignItems: 'center',
            }}>
              <span className="cat-no">№ заказа</span>
              <span className="display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.01em' }}>{orderNo}</span>
            </div>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 44, flexWrap: 'wrap' }}>
              <button className="btn btn-solid" onClick={() => go('tracking')}>Отследить заказ</button>
              <button className="btn btn-ghost" onClick={() => go('home')}>На главную</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export { CartPage };
export default CartPage;
