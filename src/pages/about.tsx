import React from 'react';
import { Breadcrumbs, Eyebrow } from '../common/atoms';
import { ABOUT, ARTWORKS, SERIES } from '../common/data';
import { TILDA_IMAGES } from '../common/tilda-images';
import { ReviewsSection } from '../common/reviews-section';
import { routeToPath } from '../common/routes';

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
            { label: 'MBezu', href: '/' },
            { label: 'Художник' },
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
                Mila{' '}<br/><span className="italic" style={{ color: 'var(--accent)' }}>Bezú.</span>
              </h1>
              <div className="cat-no" style={{ marginTop: 28, lineHeight: 1.8 }}>
                {ABOUT.full}{' '}<br/>
                {ABOUT.city}{' '}<br/>
                {ABOUT.studio}
              </div>
            </div>
            <div>
              <img
                src="https://cdn.mbezu.ru/assets/about-author.webp"
                alt="Mila Bezú, художник"
                loading="eager" fetchPriority="high" decoding="async"
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

      {/* 02.09 P2: /about как страница эксперта — опыт, процесс, мастерская, сертификат (только факты из ABOUT) */}
      <section className="resp-pad" style={{ padding: '40px 40px 60px' }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
          <Eyebrow accent>Опыт и подход</Eyebrow>
          <div className="resp-stack-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
            {[
              ['15+ лет', 'практики масляной живописи', 'Холст, масло, галерейный подрамник — работа пишется слоями и живёт десятилетиями.'],
              ['Дизайн интерьера', 'образование и метод', 'Картина рассматривается как часть комнаты: свет, стена, мебель и расстояние до зрителя учитываются до первого мазка.'],
              ['Путешествия', 'источник серий', 'Греция, Португалия, Франция, Камбоджа, Вьетнам — каждая серия рождается из личной поездки и её света.'],
            ].map(([n, l, t]) => (
              <div key={n} style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 24 }}>
                <div className="display" style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-.02em', color: 'var(--accent)', lineHeight: 1 }}>{n}</div>
                <div className="eyebrow" style={{ marginTop: 10 }}>{l}</div>
                <p style={{ margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{t}</p>
              </div>
            ))}
          </div>

          <div className="resp-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 26 }}>
              <Eyebrow accent>Как проходит заказ</Eyebrow>
              <ol style={{ margin: '14px 0 0', padding: '0 0 0 20px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', display: 'grid', gap: 8 }}>
                <li><b style={{ color: 'var(--ink)', fontWeight: 500 }}>Бриф.</b> Комната, стена, свет, размер и настроение — по фото и паре вопросов.</li>
                <li><b style={{ color: 'var(--ink)', fontWeight: 500 }}>Эскизы.</b> Два-три варианта композиции и колорита до начала работы.</li>
                <li><b style={{ color: 'var(--ink)', fontWeight: 500 }}>Живопись.</b> От двух недель: масло сохнет слоями, торопить нельзя.</li>
                <li><b style={{ color: 'var(--ink)', fontWeight: 500 }}>Передача.</b> Сертификат, подпись, открытка, крепёж — доставка по России.</li>
              </ol>
              <a href={routeToPath('commission')} className="btn btn-ghost" style={{ marginTop: 18, textDecoration: 'none', display: 'inline-flex' }}>Заказать картину</a>
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: 26 }}>
              <Eyebrow accent>Мастерская в Москве</Eyebrow>
              <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                Показ работ — по записи: можно посмотреть живопись при дневном свете, оценить фактуру и размер, обсудить заказ. Напишите в Telegram или позвоните — договоримся о времени.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                <a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener" className="btn btn-solid" style={{ textDecoration: 'none' }}>Написать в Telegram</a>
                <a href={`tel:${ABOUT.contacts.phone.split(' ').join('')}`} className="btn btn-ghost" style={{ textDecoration: 'none' }}>{ABOUT.contacts.phone}</a>
              </div>
              <div className="eyebrow accent" style={{ marginTop: 26 }}>Сертификат подлинности</div>
              <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                К каждой работе — фирменный сертификат: название, техника (холст, масло), точный размер, год, подпись автора. Плюс подпись на обороте холста и рукописная открытка из мастерской. <a href="/tpost/kejc52adg1-sertifikat-podlinnosti-kartini-chto-eto" style={{ color: 'var(--accent)' }}>Что фиксирует сертификат и зачем он нужен</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Studio strip ── */}
      <section className="resp-pad" style={{ padding: '40px 40px 80px' }}>
        <div className="resp-stack-3" style={{
          maxWidth: 'var(--max)', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28,
        }}>
          {[['frag-1', 'Фрагмент · «Волна. Сепия» — фактура мазка'], ['frag-2', 'Фрагмент · «Тропические листья» — капли и свет'], ['frag-3', 'Фрагмент · «Обидуш» — камень и синяя кромка']].map(([f, t]) => (
              <figure key={f} style={{ margin: 0 }}>
                <img src={`https://cdn.mbezu.ru/assets/about-${f}.webp`} srcSet={`https://cdn.mbezu.ru/assets/about-${f}@720.webp 720w, https://cdn.mbezu.ru/assets/about-${f}.webp 1200w`} sizes="(max-width: 900px) 92vw, 30vw"
                     alt={t} loading="lazy" style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)', display: 'block' }} />
                <figcaption className="cat-no" style={{ marginTop: 12 }}>{t}</figcaption>
              </figure>
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
                Три направления{' '}<br/><span className="italic" style={{ color: 'var(--ink-2)', fontStyle: 'italic' }}>одного автора.</span>
              </h2>
            </div>
            <button className="btn btn-ghost" onClick={() => go('catalog')}>Все работы →</button>
          </div>

          <div className="resp-stack-3" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36,
          }}>
            {SERIES.map((s) => (
              <a key={s.id} href={routeToPath('catalog', { series: s.id })}
                 className="lift" style={{
                   textDecoration: 'none', color: 'inherit',
                   cursor: 'pointer', display: 'block',
                 }}>
                {/* 02.09 (Олег, п.10): в карточках серий были градиенты — теперь флагман серии */}
                <div className="ph-art" style={{
                  width: '100%', aspectRatio: '4 / 3',
                  background: `linear-gradient(135deg, ${s.palette[0]}, ${s.palette[1]})`,
                  borderRadius: 'var(--r-md)',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {(() => { const art = ARTWORKS.find((x) => x.series === s.id && x.featured && !x.hidden && TILDA_IMAGES[x.id]) || ARTWORKS.find((x) => x.series === s.id && !x.hidden && TILDA_IMAGES[x.id]); return art ? (
                    <img src={TILDA_IMAGES[art.id].large} alt={`${art.title} — серия ${s.title}`} loading="lazy"
                         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 18 }} />
                  ) : null; })()}
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
              <li><a href={`mailto:${ABOUT.contacts.email}`} className="uh uh-tap" style={{ textDecoration: 'none', color: 'inherit' }}>{ABOUT.contacts.email}</a></li>
              <li><a href={`tel:${ABOUT.contacts.phone.replace(/\s/g, '')}`} className="uh uh-tap" style={{ textDecoration: 'none', color: 'inherit' }}>{ABOUT.contacts.phone}</a></li>
              <li><a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener" className="uh uh-tap" style={{ textDecoration: 'none', color: 'inherit' }}>Telegram · @{ABOUT.contacts.telegram}</a></li>
              <li><a href={`https://instagram.com/${ABOUT.contacts.instagram}`} target="_blank" rel="noopener" className="uh uh-tap" style={{ textDecoration: 'none', color: 'inherit' }}>Instagram · @{ABOUT.contacts.instagram}</a></li>
              <li><a href={`https://vk.com/${ABOUT.contacts.vk}`} target="_blank" rel="noopener" className="uh uh-tap" style={{ textDecoration: 'none', color: 'inherit' }}>VK · @{ABOUT.contacts.vk}</a></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Sprint 15: отзывы (реальные; пока пусто — приглашение оставить первый) */}
      <ReviewsSection compact />

      {/* ── CTA ── */}
      <section className="resp-pad" style={{
        padding: '120px 40px', textAlign: 'center',
        borderTop: '1px solid var(--rule-soft)',
      }}>
        <h2 className="display resp-h1" style={{
          margin: 0, fontSize: 'clamp(48px, 6vw, 88px)',
          fontWeight: 500, lineHeight: 0.95, letterSpacing: '-.03em',
        }}>
          Заказать картину{' '}<br/><span className="italic" style={{ color: 'var(--accent)' }}>специально для вашей стены.</span>
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
