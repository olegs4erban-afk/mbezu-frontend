import React from 'react';
import { PaintingPlate } from '../common/adapter';
import { ArButton, ArViewer, QrBlock } from '../ar/ar';
import { ArtCard, Breadcrumbs, Eyebrow, StatusTag } from '../common/atoms';
import { ARTWORKS, artworkById, formatPrice, imageOf, seriesById } from '../common/data';

// ─────────────────────────────────────────────────────────────
// page-painting.jsx — карточка работы.
// 12-сетка: photo (col 1–7) + sticky meta panel (col 8–12).
// ─────────────────────────────────────────────────────────────

function PaintingPage({ go, id, addToCart }) {
  const art = artworkById(id);
  const [tab, setTab] = React.useState('about');
  const [added, setAdded] = React.useState(false);
  if (!art) return null;
  const series = seriesById(art.series);
  const index = ARTWORKS.findIndex((a) => a.id === id) + 1;
  const related = ARTWORKS.filter((a) => a.series === art.series && a.id !== art.id && !a.hidden).slice(0, 4);

  return (
    <div className="fade-in resp-pad" style={{ padding: '36px 40px 80px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <Breadcrumbs items={[
          { label: 'MBezu', onClick: () => go('home') },
          { label: 'Каталог', onClick: () => go('catalog') },
          { label: series?.title || '', onClick: () => go('catalog', { series: art.series }) },
          { label: art.title },
        ]} />

        {/* Main grid: photo + sticky meta */}
        <div className="reveal r1 resp-stack" style={{
          marginTop: 40,
          display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 60,
        }}>
          {/* Photo column */}
          <div style={{ gridColumn: '1 / 8' }} className="resp-static">
            {art.shape === 'round' ? (
              <div style={{
                aspectRatio: '1 / 1',
                background: 'var(--bg-soft)',
                borderRadius: 'var(--r-lg)',
                display: 'grid', placeItems: 'center', padding: '5%',
                boxShadow: 'var(--shadow-md)',
              }}>
                <PaintingPlate art={art} size="full" fit="bare"
                               style={{ borderRadius: '50%', boxShadow: 'var(--shadow-lg)' }} showMeta={false} />
              </div>
            ) : (
              <PaintingPlate art={art} size="full" priority sizes="(max-width: 900px) 92vw, 56vw" fit="bare" style={{
                aspectRatio: `${art.w} / ${art.h}`,
                borderRadius: 'var(--r-md)',
                boxShadow: 'var(--shadow-lg)',
              }} showMeta={false} />
            )}

            {/* Mini thumbnails — пока используется одно фото, в дальнейшем заменим на отдельные ракурсы */}
            <div style={{
              marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
            }}>
              {['Фронт', 'Деталь', 'Фрагмент', 'Подпись'].map((lbl, i) => {
                const src = imageOf(art, 'thumb');
                const positions = ['50% 50%', '30% 30%', '70% 60%', '85% 90%'];
                return (
                  <div key={i} style={{
                    aspectRatio: '1', cursor: 'pointer',
                    border: i === 0 ? '2px solid var(--accent)' : '1px solid var(--rule-soft)',
                    opacity: i === 0 ? 1 : .65, transition: 'opacity .2s',
                    background: src ? `url(${src}) center/cover` : `linear-gradient(135deg, ${(art.palette || ['#d9cfba'])[0]}, ${(art.palette || ['#5a4a36','#5a4a36'])[1]})`,
                    backgroundPosition: src ? positions[i] : 'center',
                    backgroundSize: src ? '180%' : 'cover',
                    borderRadius: art.shape === 'round' ? '50%' : 'var(--r-sm)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', bottom: 4, left: 6, right: 6,
                      fontFamily: 'var(--mono)', fontSize: 8.5,
                      color: 'rgba(255,255,255,.92)',
                      letterSpacing: '.16em', textTransform: 'uppercase',
                      textShadow: '0 1px 3px rgba(0,0,0,.6)',
                      textAlign: 'center',
                    }}>{lbl}</div>
                  </div>
                );
              })}
            </div>

            <div className="cat-no" style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between' }}>
              <span>{art.image ? 'студийная съёмка' : 'фото · placeholder'}</span>
              <span>{art.id} · {index} / {ARTWORKS.length}</span>
            </div>
          </div>

          {/* Sticky meta panel */}
          <aside style={{ gridColumn: '8 / 13', position: 'sticky', top: 100, alignSelf: 'start' }}
                 className="resp-static">
            <Eyebrow accent>
              <span style={{ color: series?.color }}>● </span>
              {series?.title} · {art.year}
            </Eyebrow>
            <h1 className="display" style={{
              margin: '20px 0 8px', fontSize: 'clamp(40px, 4.5vw, 64px)',
              lineHeight: 1, fontWeight: 500, letterSpacing: '-.03em',
            }}>{art.title}</h1>
            {art.subtitle && (
              <p className="italic" style={{
                margin: 0, fontSize: 20, color: 'var(--ink-2)', fontStyle: 'italic',
              }}>{art.subtitle}</p>
            )}

            {/* Meta table */}
            <dl style={{
              margin: '36px 0 32px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px',
            }}>
              {[
                ['Техника', art.medium],
                ['Стиль', art.style],
                ['Размер', `${art.w} × ${art.h} см`],
                ['Год', String(art.year)],
                ['Оформление', art.framing],
                ['Каталог', `№ ${String(index).padStart(3, '0')} / ${String(ARTWORKS.length).padStart(3, '0')}`],
                ['Подпись', 'Авторская, лиц. сторона'],
                ['Сертификат', 'Прилагается'],
              ].map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt className="cat-no">{k}</dt>
                  <dd style={{ margin: 0, fontSize: 13.5, textAlign: 'right', color: 'var(--ink)' }}>{v}</dd>
                </React.Fragment>
              ))}
            </dl>

            <div className="rule-soft" style={{ margin: '24px 0' }} />

            {/* Price + status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
              <span className="display" style={{
                fontSize: 44, fontWeight: 500, letterSpacing: '-.025em', color: 'var(--ink)',
              }}>{formatPrice(art.price)}</span>
              <StatusTag status={art.status} />
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <button className="btn btn-solid" style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => { addToCart(art.id); setAdded(true); setTimeout(() => setAdded(false), 2000); }}>
                {added ? '✓ В корзине' : 'В корзину'}
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="btn btn-ghost" style={{ justifyContent: 'center' }}
                        onClick={() => go('commission', { ref: art.id })}>
                  Похожую на заказ
                </button>
                <ArButton art={art} label="AR · на стену" small />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ marginTop: 40 }}>
              <div style={{
                display: 'flex', gap: 0, borderBottom: '1px solid var(--rule-soft)',
              }}>
                {[['about', 'Описание'], ['history', 'История'], ['delivery', 'Доставка']].map(([k, l]) => (
                  <button key={k} onClick={() => setTab(k)} style={{
                    background: 'transparent', border: 0, padding: '14px 18px 12px 0',
                    marginRight: 24, fontFamily: 'var(--mono)', fontSize: 11,
                    letterSpacing: '.14em', textTransform: 'uppercase',
                    color: tab === k ? 'var(--ink)' : 'var(--ink-3)',
                    borderBottom: tab === k ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all .2s',
                    fontWeight: 500,
                  }}>{l}</button>
                ))}
              </div>
              <div style={{ paddingTop: 24, fontSize: 14, lineHeight: 1.7, color: 'var(--ink-2)' }}>
                {tab === 'about' && (
                  <p style={{ margin: 0 }}>{art.description}</p>
                )}
                {tab === 'history' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ margin: 0 }}>
                      Работа из серии «{series?.title}», {series?.years}. Написана в студии Mila Bezú в Москве.
                    </p>
                    <p style={{ margin: 0 }}>
                      Каждая работа в серии — самостоятельный сюжет, объединённый общим художественным языком.
                    </p>
                  </div>
                )}
                {tab === 'delivery' && (
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <li>• СДЭК · 5–7 дней · от 4 500 ₽</li>
                    <li>• Арт-логистика · 7–10 дней · от 9 000 ₽</li>
                    <li>• Самовывоз · Москва · по записи · бесплатно</li>
                    <li style={{ paddingTop: 8, color: 'var(--ink-3)' }}>
                      Каждая работа упаковывается в фирменную коробку с дополнительной защитой от&nbsp;влаги и&nbsp;деформации.
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* AR + Room preview band */}
        <section id="ar-block" style={{
          marginTop: 100, padding: '60px',
          background: 'var(--bg-soft)', borderRadius: 'var(--r-xl)',
          border: '1px solid var(--rule-soft)',
        }} className="resp-pad">
          <div className="resp-stack" style={{
            display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 60, alignItems: 'center',
          }}>
            <div>
              <Eyebrow accent>AR · реальная стена</Eyebrow>
              <h2 className="display" style={{
                margin: '20px 0 16px', fontSize: 'clamp(32px, 3.6vw, 48px)',
                lineHeight: 1.05, fontWeight: 500, letterSpacing: '-.025em',
              }}>
                «{art.title}»<br/>на вашей <span className="italic" style={{ color: 'var(--accent)' }}>стене</span>.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 380, marginBottom: 28 }}>
                Откройте страницу на&nbsp;iPhone или Android — нажмите кнопку, наведите камеру на&nbsp;стену. Картина появится в&nbsp;размере {art.w}×{art.h}&nbsp;см.
              </p>
              <ArButton art={art} />
              <div className="cat-no" style={{ marginTop: 20, lineHeight: 1.7 }}>
                iPhone · iOS 12+ Safari<br/>
                Android · Chrome + Google ARCore
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                aspectRatio: '4/3', background: 'var(--bg-card)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden', position: 'relative',
                boxShadow: 'var(--shadow-md)', border: '1px solid var(--rule-soft)',
              }}>
                <ArViewer art={art} />
                <div style={{
                  position: 'absolute', top: 16, left: 16,
                  background: 'rgba(245, 239, 226, 0.92)',
                  padding: '8px 14px', borderRadius: 'var(--r-pill)',
                  fontFamily: 'var(--mono)', fontSize: 9.5,
                  letterSpacing: '.18em', textTransform: 'uppercase',
                  color: 'var(--ink-2)', backdropFilter: 'blur(8px)',
                  fontWeight: 600,
                }}>3D · поверните → AR</div>
              </div>
              <QrBlock art={art} />
            </div>
          </div>
        </section>

        {/* Related works */}
        {related.length > 0 && (
          <section style={{ marginTop: 100 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              marginBottom: 40, flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <Eyebrow accent>Из той же серии</Eyebrow>
                <h2 className="display" style={{
                  margin: '20px 0 0', fontSize: 'clamp(28px, 3.4vw, 48px)',
                  lineHeight: 1.05, fontWeight: 500, letterSpacing: '-.025em',
                }}>«{series?.title}»</h2>
              </div>
              <button className="btn btn-ghost" onClick={() => go('catalog', { series: art.series })}>
                Вся серия →
              </button>
            </div>
            <div className="resp-stack-4" style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px 28px',
            }}>
              {related.map((a) => (
                <ArtCard key={a.id} art={a} onOpen={(id) => go('painting', { id })} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export { PaintingPage };
export default PaintingPage;
