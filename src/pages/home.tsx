import React from 'react';
import { PaintingPlate } from '../common/adapter';
import { ArButton, ArViewer, QrBlock, useArSupport } from '../ar/ar';
import { ArtCard, Eyebrow } from '../common/atoms';
import { Marquee } from '../common/chrome';
import { ABOUT, ARTWORKS, SERIES, availableCount, featuredArtworks, formatPrice, seriesById, visibleArtworks } from '../common/data';

// ─────────────────────────────────────────────────────────────
// page-home.jsx — главная M.Bez.
// Hero крупный (Editorial Dark) + Series + Manifest + InStock +
// StudioBanner (примерка) + Packaging + Stats + Process + CTA + Newsletter.
// ─────────────────────────────────────────────────────────────

function heroArt() { return featuredArtworks()[0] || ARTWORKS[0]; }

// ── HERO Editorial: крупная типографика 200px / lineheight 0.86 ──
function HeroEditorial({ go }) {
  const hero = heroArt();
  return (
    <section className="resp-pad" style={{
      padding: '80px 40px 120px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Atmospheric terracotta glow */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(160, 138, 78, 0.10), transparent 60%)',
        animation: 'glow 10s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ maxWidth: 'var(--max)', margin: '0 auto', position: 'relative' }}>
        {/* Sprint 10 (A): верхние плашки (Saison…/œuvre du jour…) убраны */}
        {/* Big hero — text left, painting right */}
        <div className="resp-stack" style={{
          display: 'grid', gridTemplateColumns: '1.05fr .95fr',
          gap: 80, alignItems: 'center',
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 className="display reveal r2 resp-display-md" style={{
              margin: 0,
              fontSize: 'clamp(64px, 11vw, 200px)',
              lineHeight: 0.86,
              fontWeight: 500,
              letterSpacing: '-.04em',
            }}>
              Картины,<br/>
              <span className="italic" style={{
                color: 'var(--accent)', fontStyle: 'italic',
                position: 'relative', display: 'inline-block',
              }}>живущие</span><br/>
              в&nbsp;интерьерах
            </h1>
            <p className="reveal r3" style={{
              margin: '40px 0 0', maxWidth: 460,
              fontSize: 18, lineHeight: 1.55,
              color: 'var(--ink-2)', fontWeight: 300,
            }}>{ABOUT.tagline}</p>
            <div className="reveal r4" style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
              <button className="btn btn-solid" onClick={() => go('catalog')}>Смотреть каталог →</button>
              <button className="btn btn-ghost" onClick={() => go('commission')}>Заказать картину</button>
            </div>

            {/* meta-stripe */}
            <div className="reveal r5" style={{
              display: 'flex', gap: 48, marginTop: 56, paddingTop: 32,
              borderTop: '1px solid var(--rule-soft)', flexWrap: 'wrap',
            }}>
              {[
                [String(availableCount()), 'в наличии'],
                ['от 2', 'недель на заказ'],
                ['15+', 'лет практики'],
                ['РФ', 'доставка'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="display" style={{
                    fontSize: 40, fontWeight: 500, lineHeight: 1,
                    letterSpacing: '-.03em', color: 'var(--accent)',
                  }}>{n}</div>
                  <div className="eyebrow" style={{ marginTop: 8 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Painting on the right */}
          <div className="reveal r3" style={{ position: 'relative' }}>
            <div className="display" style={{
              position: 'absolute', right: -10, top: -80,
              fontSize: 'clamp(140px, 18vw, 280px)',
              color: 'var(--accent)', opacity: .08,
              fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1,
              pointerEvents: 'none', zIndex: 0, fontStyle: 'italic',
            }}>M.B</div>
            <figure style={{ margin: 0, position: 'relative', zIndex: 1, cursor: 'pointer' }}
                    className="drift" onClick={() => go('painting', { id: hero.id })}>
              <PaintingPlate art={hero} fit="bare" priority sizes="(max-width: 900px) 92vw, 46vw" style={{
                aspectRatio: '4 / 5', borderRadius: 'var(--r-md)',
                boxShadow: 'var(--shadow-lg)',
              }} showMeta={false} />
            </figure>
            <figcaption style={{
              position: 'absolute', left: -28, bottom: -36,
              background: 'var(--bg-card)',
              padding: '20px 28px',
              display: 'flex', flexDirection: 'column', gap: 6,
              borderRadius: 'var(--r-pill)',
              border: '1px solid var(--rule-soft)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 2,
            }}>
              <span className="cat-no">[{hero.id}] · {hero.year} · {hero.w}×{hero.h} см</span>
              <span className="display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.01em' }}>
                {hero.title}
              </span>
            </figcaption>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── HERO Center ───────────────────────────────────────────────
function HeroCenter({ go }) {
  const fts = featuredArtworks();
  return (
    <section className="resp-pad" style={{ padding: '120px 40px 80px', textAlign: 'center' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="reveal r1"><Eyebrow accent>15+ лет — Москва</Eyebrow></div>
        <h1 className="display reveal r2 resp-display-md" style={{
          margin: '32px 0 0',
          fontSize: 'clamp(52px, 10vw, 168px)',
          lineHeight: 0.92,
          fontWeight: 500,
          letterSpacing: '-.035em',
        }}>
          Тихая <span className="italic" style={{ color: 'var(--accent)' }}>живопись</span>
          <br/>для светлых комнат.
        </h1>
        <p className="reveal r3" style={{
          margin: '36px auto 0', maxWidth: 540,
          fontSize: 18, lineHeight: 1.55,
          color: 'var(--ink-2)', fontWeight: 300,
        }}>
          Авторские интерьерные работы маслом. В наличии и&nbsp;на&nbsp;заказ — для дома, бюро и&nbsp;архитектурных проектов.
        </p>
        <div className="reveal r4" style={{ display: 'flex', gap: 14, marginTop: 44, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-solid" onClick={() => go('catalog')}>Каталог · {visibleArtworks().length}</button>
          <button className="btn btn-ghost" onClick={() => go('commission')}>На заказ</button>
        </div>
      </div>
      <div className="resp-stack-3 reveal r5" style={{
        marginTop: 100, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36,
        maxWidth: 'var(--max)', marginInline: 'auto',
      }}>
        {fts.map((a) => (
          <div key={a.id} className="lift" style={{ cursor: 'pointer' }}
               onClick={() => go('painting', { id: a.id })}>
            <PaintingPlate art={a} fit="bare" style={{ aspectRatio: '4 / 5' }} showMeta={false} />
            <div className="cat-no" style={{ marginTop: 14, textAlign: 'left' }}>
              {a.title} · {a.w}×{a.h} см
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── HERO Split ────────────────────────────────────────────────
function HeroSplit({ go }) {
  const hero = featuredArtworks().find((a) => a.series === 'silence') || heroArt();
  const series = seriesById(hero.series);
  return (
    <section className="resp-stack" style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      minHeight: 'calc(100vh - 130px)',
      borderBottom: '1px solid var(--rule-soft)',
    }}>
      <div className="resp-pad" style={{
        padding: '80px 60px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', gap: 40,
        borderRight: '1px solid var(--rule-soft)',
      }}>
        {/* Sprint 11 (Ф4.2): мета MMXXVI убрана */}
        <div>
          <h1 className="display reveal r2 resp-display-md" style={{
            margin: 0, fontSize: 'clamp(56px, 8vw, 132px)',
            lineHeight: 0.92, fontWeight: 500, letterSpacing: '-.035em',
          }}>
            {series.title.split(' ')[0]},<br/>
            <span className="italic" style={{ color: 'var(--accent)' }}>
              {series.subtitle.toLowerCase()}.
            </span>
          </h1>
          <p className="reveal r3" style={{
            margin: '32px 0 0', maxWidth: 460,
            fontSize: 17, lineHeight: 1.55, color: 'var(--ink-2)', fontWeight: 300,
          }}>{series.description}</p>
        </div>
        <div className="reveal r4" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-solid" onClick={() => go('catalog', { series: series.id })}>
            Серия «{series.title}»
          </button>
          <button className="btn btn-ghost" onClick={() => go('commission')}>На заказ</button>
        </div>
      </div>
      <div className="reveal r2" style={{ position: 'relative', background: 'var(--bg-soft)' }}>
        <PaintingPlate art={hero} fit="bare" style={{
          height: '100%', aspectRatio: 'auto', borderRadius: 0, boxShadow: 'none',
        }} showMeta={false} />
      </div>
    </section>
  );
}

// ── Series Triptych — 3 серии большими карточками ────────────
function SeriesTriptych({ go }) {
  return (
    <section className="resp-pad" style={{ padding: '120px 40px 80px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div className="resp-stack" style={{
          display: 'grid', gridTemplateColumns: '1fr 2fr',
          gap: 80, marginBottom: 60, alignItems: 'end',
        }}>
          <div>
            {/* Sprint 11 (Ф2.4): надзаголовок «НАБЛЮДЕНИЯ · 04» убран */}
            <h2 className="display resp-h1" style={{
              margin: '20px 0 0', fontSize: 'clamp(44px, 5.5vw, 80px)',
              lineHeight: 0.95, fontWeight: 500, letterSpacing: '-.03em',
            }}>
              <span className="italic" style={{ color: 'var(--accent)' }}>Наблюдения</span>
            </h2>
          </div>
          <p style={{
            margin: 0, maxWidth: 460, color: 'var(--ink-2)',
            fontSize: 16, lineHeight: 1.6, fontWeight: 300,
          }}>
            Работы группируются в серии. Каждая — про один свет, одни эмоции, одну атмосферу
          </p>
        </div>

        <div className="resp-stack-3" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36,
        }}>
          {SERIES.map((s) => {
            const cover = ARTWORKS.find((a) => a.series === s.id && a.featured)
                       || ARTWORKS.find((a) => a.series === s.id);
            return (
              <a key={s.id} href="#" onClick={(e) => { e.preventDefault(); go('catalog', { series: s.id }); }}
                 className="lift" style={{
                   textDecoration: 'none', color: 'inherit',
                   display: 'flex', flexDirection: 'column', gap: 18,
                 }}>
                <div style={{ position: 'relative' }}>
                  {/* Sprint 10 (F): оверлей-плашка с названием серии убрана */}
                  <PaintingPlate art={cover} fit="bare" style={{
                    aspectRatio: '3 / 4', borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-md)',
                  }} showMeta={false} />
                </div>
                <div>
                  <div className="cat-no">{s.years} · {s.count} работ</div>
                  <h3 className="display" style={{
                    margin: '10px 0 4px', fontSize: 28, fontWeight: 500,
                    letterSpacing: '-.015em', lineHeight: 1.1,
                  }}>{s.title}</h3>
                  <p className="italic" style={{
                    margin: 0, fontSize: 15, color: 'var(--accent)', fontStyle: 'italic',
                  }}>{s.subtitle}</p>
                  <p style={{
                    margin: '14px 0 0', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6,
                  }}>{s.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Manifest на тёмном (deep ink) ────────────────────────────
function ManifestBand() {
  return (
    <section className="resp-pad" style={{
      padding: '140px 40px',
      background: 'var(--bg-deep)',
      color: 'var(--bg-cream)',
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
      marginTop: 40,
    }}>
      <div style={{
        position: 'absolute', top: -120, right: -120,
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(160, 138, 78, 0.40), transparent 70%)',
        animation: 'glow 8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        {/* Sprint 10 (H): мета «МАНИФЕСТ · MMXXVI» убрана */}
        <h2 className="display resp-h1" style={{
          margin: 0, fontSize: 'clamp(36px, 5.2vw, 84px)',
          lineHeight: 1.1, fontWeight: 500, letterSpacing: '-.025em',
          maxWidth: 1100, color: 'var(--bg-cream)',
        }}>
          Картина — это <span className="italic" style={{ color: 'var(--accent-2)' }}>тихий житель</span> пространства. Она появляется однажды, и&nbsp;остаётся надолго: меняет свет, задаёт тон, удерживает внимание.
        </h2>

        {/* Sprint 10 (H): меты «МИЛА БЭЗУ · ПСЕВДОНИМ» и «СТУДИЯ · MOSCOU» убраны; подпись-лого осталась (K: MBezu) */}
        <div style={{
          marginTop: 80, display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', flexWrap: 'wrap', gap: 32,
        }}>
          <div className="italic" style={{
            fontSize: 44, color: 'var(--accent-2)', fontWeight: 500,
            lineHeight: 1, letterSpacing: '-.02em', fontStyle: 'italic',
          }}>MBezu</div>
        </div>
      </div>
    </section>
  );
}

// ── InStock — featured + recent ───────────────────────────────
function InStock({ go }) {
  const fts = featuredArtworks();
  const rest = visibleArtworks()
    .filter((a) => a.status === 'available' && !a.featured)
    .sort((a, b) => b.year - a.year);
  const items = [...fts, ...rest].slice(0, 6);

  return (
    <section className="resp-pad" style={{ padding: '120px 40px 80px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <Eyebrow accent>В наличии</Eyebrow>
            <h2 className="display resp-h2" style={{
              margin: '20px 0 0', fontSize: 'clamp(40px, 5vw, 72px)',
              lineHeight: 0.95, fontWeight: 500, letterSpacing: '-.03em',
            }}>Избранные работы</h2>
          </div>
          <button className="btn btn-ghost" onClick={() => go('catalog')}>Весь каталог →</button>
        </div>

        <div className="resp-stack-3" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px 36px',
        }}>
          {items.map((a, i) => (
            <ArtCard key={a.id} art={a} onOpen={(id) => go('painting', { id })}
                     index={i + 1} total={ARTWORKS.length} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── StudioBanner — AR-ПРИМЕРКА НА СТЕНЕ (iPhone + Android) ───
// Два режима: AR (real wall via camera) + Room preview (desktop visualization)
function StudioBanner({ go }) {
  // Sprint 10 (J): режим «В типовой комнате» удалён — остался только AR
  const { platform, ready } = useArSupport();
  const featured = heroArt();

  return (
    <section id="ar-block" className="resp-pad" style={{
      padding: '120px 40px',
      background: 'var(--bg-soft)',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div className="resp-stack" style={{
          display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80, alignItems: 'center',
        }}>
          {/* LEFT — text + CTA */}
          <div>
            <Eyebrow accent>Камера телефона · AR</Eyebrow>
            <h2 className="display resp-h1" style={{
              margin: '24px 0 0', fontSize: 'clamp(44px, 5.5vw, 88px)',
              lineHeight: 0.95, fontWeight: 500, letterSpacing: '-.03em',
            }}>
              Примерка картин<br/>в <span className="italic" style={{ color: 'var(--accent)' }}>реальном&nbsp;времени</span>
            </h2>
            <p style={{
              marginTop: 32, maxWidth: 480, color: 'var(--ink-2)',
              fontSize: 16, lineHeight: 1.65, fontWeight: 300,
            }}>
              Откройте сайт на&nbsp;iPhone или Android, нажмите AR — камера наведётся на&nbsp;стену, картина появится в&nbsp;реальном масштабе. Без приложений, прямо из&nbsp;браузера.
            </p>

            {/* Platform indicators */}
            <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
              <span className={'ar-os-pill' + (ready && platform === 'ios' ? ' is-on' : '')}>iPhone · AR Quick Look</span>
              <span className={'ar-os-pill' + (ready && platform === 'android' ? ' is-on' : '')}>Android · Scene Viewer</span>
              <span className={'ar-os-pill' + (ready && platform === 'desktop' ? ' is-on' : '')}>Desktop · 3D + QR</span>
            </div>

            {/* CTA */}
            <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <ArButton art={featured} />
              <button className="btn btn-ghost" onClick={() => go('catalog')}>
                Выбрать другую работу
              </button>
            </div>

            {/* Sprint 10 (J): тумблер «В типовой комнате» убран — остался индикатор AR-режима */}
            <div style={{
              marginTop: 40, paddingTop: 28,
              borderTop: '1px solid var(--rule-soft)',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <span className="cat-no">Превью режим:</span>
              <span className="chip is-active">AR · реальная стена</span>
            </div>
          </div>

          {/* RIGHT — AR visualization */}
          <div>
            {(
              // ── AR mode ──
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 20,
              }}>
                <div style={{
                  position: 'relative', aspectRatio: '4/3',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--r-lg)', overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--rule-soft)',
                }}>
                  <ArViewer art={featured} />
                  {/* Top-left tag */}
                  <div style={{
                    position: 'absolute', top: 16, left: 16,
                    background: 'rgba(245, 239, 226, 0.92)',
                    padding: '8px 14px', borderRadius: 'var(--r-pill)',
                    fontFamily: 'var(--mono)', fontSize: 9.5,
                    letterSpacing: '.18em', textTransform: 'uppercase',
                    color: 'var(--ink-2)', backdropFilter: 'blur(8px)',
                    fontWeight: 600,
                  }}>3D · поверните → AR</div>
                  {/* Bottom-right caption */}
                  <div style={{
                    position: 'absolute', bottom: 16, right: 16,
                    background: 'rgba(245, 239, 226, 0.92)',
                    padding: '10px 16px', borderRadius: 'var(--r-pill)',
                    fontSize: 11, color: 'var(--ink-2)',
                    fontFamily: 'var(--mono)', letterSpacing: '.14em',
                    textTransform: 'uppercase', backdropFilter: 'blur(8px)',
                  }}>{featured.title} · {featured.w}×{featured.h} см</div>
                </div>

                {/* Desktop fallback — QR code */}
                {ready && platform === 'desktop' && <QrBlock art={featured} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Packaging — open box + thank-you card ─────────────────────
function Packaging() {
  return (
    <section className="resp-pad" style={{ padding: '120px 40px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div className="resp-stack" style={{
          display: 'grid', gridTemplateColumns: '1fr 1.2fr',
          gap: 80, alignItems: 'center',
        }}>
          {/* Visual — оригинальный сертификат подлинности (Sprint 10: зелёные коробки убраны) */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src="https://cdn.mbezu.ru/assets/certificate.webp"
              alt="Сертификат подлинности MBezu Fine Art"
              loading="lazy" decoding="async"
              className="drift"
              style={{
                width: '100%', maxWidth: 420,
                aspectRatio: '437 / 612', objectFit: 'contain',
                borderRadius: 'var(--r-sm)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--rule-soft)',
              }}
            />
          </div>

          <div>
            <Eyebrow accent>Упаковка</Eyebrow>
            <h2 className="display resp-h1" style={{
              margin: '24px 0 0', fontSize: 'clamp(40px, 5.2vw, 80px)',
              lineHeight: 0.98, fontWeight: 500, letterSpacing: '-.03em',
            }}>
              Картина приезжает<br/>как <span className="italic" style={{ color: 'var(--accent)' }}>подарок</span>
            </h2>
            <p style={{
              marginTop: 32, maxWidth: 480, fontSize: 16, lineHeight: 1.7,
              color: 'var(--ink-2)', fontWeight: 300,
            }}>
              Работа приходит как подарок: фирменная зелёная коробка с&nbsp;золотым тиснением, бархатный мешочек, открытка из&nbsp;страны вдохновения и&nbsp;сертификат подлинности.
            </p>
            <ul style={{
              marginTop: 32, padding: 0, listStyle: 'none',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {[
                'Зелёная коробка с золотым тиснением',
                'Бархатный мешочек MBezu',
                'Открытка из страны вдохновения с личным посланием',
                'Сертификат подлинности с номером работы',
              ].map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 'var(--r-pill)',
                    background: 'var(--accent)', color: 'var(--bg)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, flexShrink: 0,
                    fontFamily: 'var(--mono)',
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 15, color: 'var(--ink)' }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats row ────────────────────────────────────────────────
function StatsRow() {
  const items = [
    { n: '15+', l: 'лет практики' },
    { n: String(availableCount()), l: 'работ в наличии' },
    { n: String(SERIES.length), l: 'серии в развитии' },
    { n: 'от 2', l: 'недель на заказ' },
  ];
  return (
    <section className="resp-pad" style={{
      padding: '0 40px',
    }}>
      <div className="resp-stack-4 card-soft" style={{
        maxWidth: 'var(--max)', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '12px 0',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--rule-soft)',
      }}>
        {items.map((it, i) => (
          <div key={i} style={{
            padding: '36px 36px',
            borderRight: i < 3 ? '1px solid var(--rule-soft)' : 'none',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div className="display" style={{
              fontSize: 'clamp(52px, 6vw, 96px)', fontWeight: 500, lineHeight: 0.92,
              letterSpacing: '-.04em', color: 'var(--accent)',
            }}>{it.n}</div>
            <div className="eyebrow">{it.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Process — 5 шагов от брифа до подрамника ────────────────
function ProcessRow() {
  const steps = [
    { n: '01', label: 'Брифинг',  t: 'Размер, палитра, настроение, помещение' },
    { n: '02', label: 'Эскизы',   t: 'Два-три варианта на согласование' },
    { n: '03', label: 'Холст',    t: 'Лён на сосновом подрамнике, грунт' },
    { n: '04', label: 'Письмо',   t: 'Масло, от 2 недель в зависимости от размера' },
    { n: '05', label: 'Доставка', t: 'Курьер, страховка, фирменная упаковка' },
  ];
  return (
    <section className="resp-pad" style={{ padding: '120px 40px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div className="resp-stack" style={{
          display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80,
          marginBottom: 60, alignItems: 'end',
        }}>
          <div>
            <Eyebrow accent>Процесс</Eyebrow>
            <h2 className="display resp-h2" style={{
              margin: '20px 0 0', fontSize: 'clamp(40px, 5vw, 72px)',
              lineHeight: 0.95, fontWeight: 500, letterSpacing: '-.03em',
            }}>
              От брифа<br/>до <span className="italic" style={{ color: 'var(--accent)' }}>подрамника</span>
            </h2>
          </div>
          <p style={{
            margin: 0, fontSize: 17, lineHeight: 1.55,
            color: 'var(--ink-2)', fontWeight: 300, maxWidth: 540,
          }}>
            Работа на&nbsp;заказ — это разговор. Мы&nbsp;согласуем настроение и&nbsp;палитру, делаем эскизы и&nbsp;подбираем размер под конкретное место и&nbsp;задачу
          </p>
        </div>
        <div className="resp-stack-5 card-soft" style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          borderRadius: 'var(--r-xl)', overflow: 'hidden',
          border: '1px solid var(--rule-soft)',
        }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              padding: '40px 28px 32px',
              borderRight: i < 4 ? '1px solid var(--rule-soft)' : 'none',
            }}>
              <div className="mono" style={{
                fontSize: 11, letterSpacing: '.18em', color: 'var(--accent)', fontWeight: 600,
              }}>{s.n}</div>
              <h3 className="display" style={{
                margin: '16px 0 10px', fontSize: 24, fontWeight: 500, letterSpacing: '-.01em',
              }}>{s.label}</h3>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{s.t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── LeadForm — открытая форма заявки (Sprint 11, item 17) ────
// Endpoint пока не выбран (решение Олега: TG-бот / Tilda-вебхук / email-сервис).
// До подключения: заявка сохраняется локально (localStorage) + даём прямой Telegram.
const LEAD_ENDPOINT = ''; // ← сюда URL (TG-прокси / вебхук), когда Олег выберет канал

function LeadForm({ go }) {
  const [lead, setLead] = React.useState({ name: '', contact: '', about: '', consent: false });
  const [state, setState] = React.useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [touched, setTouched] = React.useState(false);

  const nameOk = lead.name.trim().length >= 2;
  const contactOk = lead.contact.trim().length >= 5;
  const valid = nameOk && contactOk && lead.consent;

  const upd = (k: string, v: unknown) => setLead((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setTouched(true);
    if (!valid || state === 'sending') return;
    setState('sending');
    const payload = { ...lead, page: 'home-cta', ts: new Date().toISOString() };
    try {
      if (LEAD_ENDPOINT) {
        const r = await fetch(LEAD_ENDPOINT, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error('http ' + r.status);
      } else {
        // endpoint ещё не подключён — локальный бэкап, чтобы заявка не потерялась
        const box = JSON.parse(localStorage.getItem('mbezu-leads') || '[]');
        box.push(payload);
        localStorage.setItem('mbezu-leads', JSON.stringify(box));
      }
      setState('ok');
    } catch {
      setState('err');
    }
  };

  const fieldStyle: React.CSSProperties = {
    background: 'rgba(245,239,226,0.94)', border: '1px solid rgba(245,239,226,0.4)',
  };

  if (state === 'ok') {
    return (
      <div style={{
        padding: '28px 28px', background: 'rgba(245,239,226,0.14)',
        border: '1px solid rgba(245,239,226,0.35)', borderRadius: 'var(--r-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            width: 34, height: 34, borderRadius: 'var(--r-pill)', flexShrink: 0,
            background: 'var(--bg-cream)', color: 'var(--accent)',
            display: 'inline-grid', placeItems: 'center', fontSize: 16, fontWeight: 700,
          }}>✓</span>
          <span className="display" style={{ fontSize: 20, fontWeight: 500 }}>
            Заявка отправлена — художница свяжется лично
          </span>
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.6, opacity: .85 }}>
          Хотите быстрее — напишите напрямую:{' '}
          <a href="https://t.me/mbezu_art" target="_blank" rel="noopener"
             style={{ color: 'var(--bg-cream)', fontWeight: 600 }}>Telegram @mbezu_art</a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input className="field" style={fieldStyle} placeholder="Имя *"
             value={lead.name} onChange={(e) => upd('name', e.target.value)} />
      {touched && !nameOk && <span style={{ fontSize: 12, opacity: .85 }}>Укажите имя</span>}
      <input className="field" style={fieldStyle} placeholder="Телефон / Telegram / email *"
             value={lead.contact} onChange={(e) => upd('contact', e.target.value)} />
      {touched && !contactOk && <span style={{ fontSize: 12, opacity: .85 }}>Укажите контакт — телефон, Telegram или email</span>}
      <textarea className="field" style={{ ...fieldStyle, minHeight: 84 }} rows={3}
                placeholder="О работе: размер, настроение, место (необязательно)"
                value={lead.about} onChange={(e) => upd('about', e.target.value)} />

      <label style={{
        display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
        fontSize: 12.5, lineHeight: 1.55, opacity: .92,
      }}>
        <input type="checkbox" checked={lead.consent}
               onChange={(e) => upd('consent', e.target.checked)}
               style={{ marginTop: 3, accentColor: 'var(--bg-cream)', width: 16, height: 16, flexShrink: 0 }} />
        <span>
          Согласен(на) на обработку персональных данных (152-ФЗ) —{' '}
          <a href="/legal?section=privacy"
             onClick={(e) => { e.preventDefault(); go('legal', { section: 'privacy' }); }}
             style={{ color: 'var(--bg-cream)', fontWeight: 600 }}>Политика ПД</a>
        </span>
      </label>
      {touched && !lead.consent && (
        <span style={{ fontSize: 12, opacity: .85 }}>Для отправки нужно согласие на обработку ПД</span>
      )}

      {state === 'err' && (
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Не удалось отправить. Напишите напрямую:{' '}
          <a href="https://t.me/mbezu_art" target="_blank" rel="noopener"
             style={{ color: 'var(--bg-cream)' }}>@mbezu_art</a>
        </span>
      )}

      <button className="btn" disabled={state === 'sending'}
              style={{
                borderColor: 'var(--bg-cream)', color: 'var(--bg-cream)', background: 'transparent',
                alignSelf: 'flex-start', opacity: state === 'sending' ? .6 : 1,
              }}
              onClick={submit}>
        {state === 'sending' ? 'Отправляем…' : 'Оставить заявку →'}
      </button>
    </div>
  );
}

// ── CommissionCTA — золотой terracotta-блок ─────────────────
function CommissionCTA({ go }) {
  return (
    <section className="resp-pad" style={{
      padding: '0 40px', marginTop: 60,
    }}>
      <div className="resp-pad resp-pad-y" style={{
        maxWidth: 'var(--max)', margin: '0 auto',
        padding: '140px 60px', background: 'var(--accent)',
        color: 'var(--bg-cream)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,.18) 50%, transparent 70%)',
          backgroundSize: '300% 100%',
          animation: 'shimmer 12s linear infinite',
          pointerEvents: 'none',
        }} />
        <div className="display" style={{
          position: 'absolute', right: -30, top: -50,
          fontSize: 'clamp(180px, 22vw, 360px)',
          color: 'rgba(245,239,226,.10)',
          fontWeight: 500, letterSpacing: '-.04em', lineHeight: 1,
          pointerEvents: 'none', fontStyle: 'italic',
        }}>M.B</div>

        <div className="resp-stack" style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 60,
          alignItems: 'end', position: 'relative',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <span style={{ width: 32, height: 1, background: 'var(--bg-cream)' }} />
              <span className="mono" style={{
                fontSize: 11, letterSpacing: '.32em', fontWeight: 600,
              }}>НА ЗАКАЗ</span>
            </div>
            <h2 className="display resp-h1" style={{
              margin: 0, fontSize: 'clamp(44px, 6.5vw, 108px)',
              lineHeight: 0.95, fontWeight: 500, letterSpacing: '-.035em',
            }}>
              Картина для вашего<br/><span style={{ fontStyle: 'italic' }}>пространства</span>
            </h2>
          </div>
          <div style={{ paddingBottom: 12 }}>
            <p style={{
              margin: '0 0 24px', fontSize: 17, lineHeight: 1.6,
              opacity: .82, fontWeight: 300,
            }}>
              Расскажите о&nbsp;комнате, размере и&nbsp;настроении. Художница ответит лично с&nbsp;эскизами и&nbsp;сроком.
            </p>
            {/* Sprint 11 (item 17): открытая форма заявки вместо кнопки */}
            <LeadForm go={go} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Newsletter ───────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  return (
    <section className="resp-pad" style={{ padding: '100px 40px', marginTop: 80 }}>
      <div className="card-soft resp-stack resp-pad resp-pad-y" style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 60, alignItems: 'center',
        padding: '64px 60px', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--rule-soft)',
        minWidth: 0,
      }}>
        <div>
          <Eyebrow accent>Письма из студии</Eyebrow>
          <h2 className="display resp-h2" style={{
            margin: '20px 0 0', fontSize: 'clamp(36px, 4.4vw, 60px)',
            lineHeight: 1.02, fontWeight: 500, letterSpacing: '-.03em',
          }}>
            Раз в&nbsp;месяц — <span className="italic" style={{ color: 'var(--accent)' }}>новые работы</span> и&nbsp;закрытые продажи
          </h2>
        </div>
        {sent ? (
          <div style={{
            padding: '20px 28px', background: 'var(--bg)',
            borderRadius: 'var(--r-pill)', display: 'inline-flex',
            alignItems: 'center', gap: 14, justifySelf: 'start',
            border: '1px solid var(--rule-soft)',
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 'var(--r-pill)',
              background: 'var(--accent)', color: 'var(--bg)',
              display: 'inline-grid', placeItems: 'center',
              fontSize: 14, fontWeight: 600,
            }}>✓</span>
            <span style={{ fontSize: 14 }}>Письмо отправлено на&nbsp;{email}</span>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}
                className="nl-form"
                style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  background: 'var(--bg)', borderRadius: 'var(--r-pill)',
                  padding: 6, border: '1px solid var(--rule-soft)',
                  minWidth: 0, maxWidth: '100%',
                }}>
            <input type="email" placeholder="ваша почта" required
                   value={email} onChange={(e) => setEmail(e.target.value)}
                   style={{
                     border: 0, background: 'transparent', flex: 1,
                     minWidth: 0, width: '100%',
                     padding: '14px 22px', fontSize: 14, outline: 'none',
                     font: 'inherit', fontFamily: 'var(--sans)', color: 'var(--ink)',
                   }} />
            <button type="submit" className="btn btn-solid" style={{ flexShrink: 0 }}>Подписаться</button>
          </form>
        )}
      </div>
    </section>
  );
}

// ── HomePage композиция ───────────────────────────────────────
function HomePage({ go, hero }) {
  return (
    <div className="fade-in">
      {hero === 'editorial' && <HeroEditorial go={go} />}
      {hero === 'center' && <HeroCenter go={go} />}
      {hero === 'split' && <HeroSplit go={go} />}
      {(!hero || !['editorial','center','split'].includes(hero)) && <HeroEditorial go={go} />}

      <Marquee items={[
        'Улицы мира', 'Монохромная', 'Тихая сила',
        '— серии одного автора —',
      ]} big />

      <SeriesTriptych go={go} />
      <ManifestBand />
      <InStock go={go} />
      <StudioBanner go={go} />
      <Packaging />
      <StatsRow />
      <ProcessRow />
      <CommissionCTA go={go} />
      <Newsletter />
    </div>
  );
}

export { HomePage };
export default HomePage;
