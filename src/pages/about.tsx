import React from 'react';
import { Breadcrumbs, Eyebrow } from '../common/atoms';
import { ABOUT, SERIES } from '../common/data';

// ─────────────────────────────────────────────────────────────
// page-about.jsx — страница «Художница».
// ─────────────────────────────────────────────────────────────

function AboutPage({ go }) {
  return (
    <div className="fade-in">
      {/* ── Hero ── */}
      <section className="resp-pad" style={{ padding: '60px 40px 80px' }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
          <Breadcrumbs items={[
            { label: 'MBezu', onClick: () => go('home') },
            { label: 'Художница' },
          ]} />
          <div className="resp-stack" style={{
            marginTop: 40,
            display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'end',
          }}>
            <div>
              <Eyebrow accent>Художник · Москва</Eyebrow>
              <h1 className="display resp-display-md" style={{
                margin: '24px 0 0',
                fontSize: 'clamp(72px, 10vw, 168px)',
                lineHeight: 0.92, fontWeight: 500, letterSpacing: '-.04em',
              }}>
                Mila<br/><span className="italic" style={{ color: 'var(--accent)' }}>Bezú.</span>
              </h1>
              <div className="cat-no" style={{ marginTop: 28, lineHeight: 1.8 }}>
                {ABOUT.full}<br/>
                {ABOUT.city}<br/>
                {ABOUT.studio}
              </div>
            </div>
            <div>
              <img
                src="https://cdn.mbezu.ru/assets/about-author.jpg"
                alt="Mila Bezú, художник"
                loading="lazy" decoding="async"
                style={{
                  width: '100%', aspectRatio: '4 / 5', objectFit: 'cover',
                  borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', display: 'block',
                }}
              />
              <div className="cat-no" style={{ marginTop: 14, textAlign: 'right' }}>
                Mila Bezú · Москва
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bio ── */}
      <section className="resp-pad" style={{
        padding: '80px 40px',
        borderTop: '1px solid var(--rule-soft)',
      }}>
        <div className="resp-stack" style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '200px 1fr', gap: 80,
        }}>
          <div><Eyebrow accent>О работе</Eyebrow></div>
          <div className="display" style={{
            fontSize: 22, lineHeight: 1.6, color: 'var(--ink)',
            fontWeight: 400, letterSpacing: '-.005em',
            display: 'flex', flexDirection: 'column', gap: 28,
          }}>
            {ABOUT.bio.map((p, i) => <p key={i} style={{ margin: 0 }}>{p}</p>)}
          </div>
        </div>
      </section>

      {/* ── Studio strip ── */}
      <section className="resp-pad" style={{ padding: '40px 40px 80px' }}>
        <div className="resp-stack-3" style={{
          maxWidth: 'var(--max)', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28,
        }}>
          {[
            ['#bcb6a8', 'студия — окно, естественный свет'],
            ['#a89a82', 'мастерская — палитра, кисти'],
            ['#8c7c66', 'мольберт — работа в процессе'],
          ].map(([c, t], i) => (
            <div key={i}>
              <div style={{
                aspectRatio: '4 / 5', background: c,
                borderRadius: 'var(--r-md)',
                boxShadow: 'var(--shadow-md)',
              }} />
              <div className="cat-no" style={{ marginTop: 12 }}>
                [фото — {t}]
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Серии ── */}
      <section className="resp-pad" style={{
        padding: '100px 40px', background: 'var(--bg-soft)',
        marginTop: 40, borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
      }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 48,
          }}>
            <div>
              <Eyebrow accent>Серии</Eyebrow>
              <h2 className="display resp-h2" style={{
                margin: '20px 0 0', fontSize: 'clamp(40px, 4.8vw, 64px)',
                fontWeight: 500, lineHeight: 0.95, letterSpacing: '-.025em',
              }}>
                Три направления<br/><span className="italic" style={{ color: 'var(--ink-2)', fontStyle: 'italic' }}>одного автора.</span>
              </h2>
            </div>
            <button className="btn btn-ghost" onClick={() => go('catalog')}>Все работы →</button>
          </div>

          <div className="resp-stack-3" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36,
          }}>
            {SERIES.map((s) => (
              <a key={s.id} href="#" onClick={(e) => { e.preventDefault(); go('catalog', { series: s.id }); }}
                 className="lift" style={{
                   textDecoration: 'none', color: 'inherit',
                   cursor: 'pointer', display: 'block',
                 }}>
                <div className="ph-art" style={{
                  width: '100%', aspectRatio: '4 / 3',
                  background: `linear-gradient(135deg, ${s.palette[0]}, ${s.palette[1]})`,
                  borderRadius: 'var(--r-md)',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <span style={{
                    position: 'absolute', top: 16, left: 16,
                    background: s.color, color: 'var(--bg-cream)',
                    padding: '7px 14px', borderRadius: 'var(--r-pill)',
                    fontFamily: 'var(--mono)', fontSize: 10,
                    letterSpacing: '.18em', fontWeight: 600,
                  }}>{s.title.toUpperCase().split(' ')[0]}</span>
                </div>
                <div style={{ paddingTop: 20 }}>
                  <div className="cat-no">{s.years} · {s.count} работ</div>
                  <h3 className="display" style={{ margin: '10px 0 6px', fontSize: 28, fontWeight: 500, letterSpacing: '-.015em' }}>{s.title}</h3>
                  <div className="italic" style={{ fontSize: 15, color: 'var(--accent)', fontStyle: 'italic' }}>{s.subtitle}</div>
                  <p style={{ margin: '14px 0 0', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                    {s.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ритуал получения ── */}
      <section className="resp-pad" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Eyebrow accent>С каждой работой</Eyebrow>
          <h2 className="display resp-h2" style={{
            margin: '20px 0 56px', fontSize: 'clamp(36px, 4.4vw, 60px)',
            fontWeight: 500, lineHeight: 1, letterSpacing: '-.025em',
          }}>
            Не просто картина — <span className="italic" style={{ color: 'var(--accent)' }}>ритуал получения.</span>
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {ABOUT.ritual.map((r, i) => (
              <li key={i} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 1fr',
                gap: 28, padding: '28px 0',
                borderTop: '1px solid var(--rule-soft)',
                borderBottom: i === ABOUT.ritual.length - 1 ? '1px solid var(--rule-soft)' : undefined,
                alignItems: 'baseline',
              }}>
                <span style={{ color: 'var(--accent)', fontSize: 16 }}>{r.icon}</span>
                <span className="display" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-.01em' }}>{r.label}</span>
                <span className="cat-no" style={{ textAlign: 'right' }}>{r.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Студия + контакты ── */}
      <section className="resp-pad" style={{ padding: '80px 40px', borderTop: '1px solid var(--rule-soft)' }}>
        <div className="resp-stack" style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start',
        }}>
          <div>
            <Eyebrow accent>Студия</Eyebrow>
            <p className="display" style={{
              margin: '20px 0 0', fontSize: 24, lineHeight: 1.5,
              color: 'var(--ink)', fontWeight: 400, letterSpacing: '-.005em',
            }}>{ABOUT.studio_note}</p>
          </div>
          <div>
            <Eyebrow accent>Связь</Eyebrow>
            <ul style={{ listStyle: 'none', margin: '20px 0 0', padding: 0, fontSize: 16, color: 'var(--ink-2)', lineHeight: 2 }}>
              <li><a href={`mailto:${ABOUT.contacts.email}`} className="uh" style={{ textDecoration: 'none', color: 'inherit' }}>{ABOUT.contacts.email}</a></li>
              <li><a href={`tel:${ABOUT.contacts.phone.replace(/\s/g, '')}`} className="uh" style={{ textDecoration: 'none', color: 'inherit' }}>{ABOUT.contacts.phone}</a></li>
              <li><a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener" className="uh" style={{ textDecoration: 'none', color: 'inherit' }}>Telegram · @{ABOUT.contacts.telegram}</a></li>
              <li><a href={`https://instagram.com/${ABOUT.contacts.instagram}`} target="_blank" rel="noopener" className="uh" style={{ textDecoration: 'none', color: 'inherit' }}>Instagram · @{ABOUT.contacts.instagram}</a></li>
              <li><a href={`https://vk.com/${ABOUT.contacts.vk}`} target="_blank" rel="noopener" className="uh" style={{ textDecoration: 'none', color: 'inherit' }}>VK · @{ABOUT.contacts.vk}</a></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="resp-pad" style={{
        padding: '120px 40px', textAlign: 'center',
        borderTop: '1px solid var(--rule-soft)',
      }}>
        <h2 className="display resp-h1" style={{
          margin: 0, fontSize: 'clamp(48px, 6vw, 88px)',
          fontWeight: 500, lineHeight: 0.95, letterSpacing: '-.03em',
        }}>
          Заказать картину<br/><span className="italic" style={{ color: 'var(--accent)' }}>специально для вашей стены.</span>
        </h2>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 44, flexWrap: 'wrap' }}>
          <button className="btn btn-solid" onClick={() => go('commission')}>На заказ</button>
          <button className="btn btn-ghost" onClick={() => go('catalog')}>В каталог</button>
        </div>
      </section>
    </div>
  );
}

export { AboutPage };
export default AboutPage;
