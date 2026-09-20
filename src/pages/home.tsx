import React from 'react';
import { PaintingPlate } from '../common/adapter';
import { ArtCard, Eyebrow, LinkStrip } from '../common/atoms';
import { Marquee } from '../common/chrome';
import { ABOUT, ARTWORKS, SERIES, artworkById, askAboutHref, dimsLabel, featuredArtworks, formatPrice, imageOf, seriesById, visibleArtworks } from '../common/data';
import { hasStorePage } from '../common/store-urls';
import { INTERIOR_SHOTS, interiorSrc } from '../common/interiors';
import { submitLead, leadRef, HONEYPOT_FIELD } from '../lib/tildaLead';
import { ReviewsSection } from '../common/reviews-section';
import { FaqSection } from '../common/faq-section';
import { HOME_FAQ, freshCount, freshHighlights, freshStamp, inStockCount, plural, pluralOf, priceRange, seriesCount } from '../common/seo';
import { routeToPath } from '../common/routes';

// ─────────────────────────────────────────────────────────────
// home.tsx — главная MBezu (редизайн 2026, HANDOFF §7).
// Порядок под конверсию: hero с формой → плитка-разводка → витрина →
// серии → процесс → упаковка → манифест → цифры → CTA → FAQ → отзывы.
// Блок AR-примерки убран: без .glb/.usdz он всё равно не рендерился,
// а его импорт тянул на главную отдельный чанк.
// ─────────────────────────────────────────────────────────────

function heroArt() { return featuredArtworks()[0] || ARTWORKS[0]; }

// ── HERO — заказ-first (HANDOFF §7.1) ────────────────────────
// Форма в первом экране: раньше заявка жила на 6-м экране, а первый
// предлагал только «смотреть каталог».
function HeroLead() {
  const [f, setF] = React.useState({ name: '', contact: '', trap: '' });
  const [state, setState] = React.useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [touched, setTouched] = React.useState(false);
  const [ref, setRef] = React.useState('');

  const nameOk = f.name.trim().length >= 2;
  const contactOk = f.contact.trim().length >= 5;
  const valid = nameOk && contactOk;

  const submit = async () => {
    setTouched(true);
    if (!valid || state === 'sending') return;
    setState('sending');
    const contact = f.contact.trim();
    const attemptRef = ref || leadRef();
    setRef(attemptRef);
    const res = await submitLead({
      lead_ref: attemptRef,
      name: f.name.trim(),
      phone: contact,
      email: /@/.test(contact) ? contact : '',
      message: '',
      source: 'home-hero',
      page: typeof location !== 'undefined' ? location.pathname : '/',
      [HONEYPOT_FIELD]: f.trap,
      ...utmFromStorage(),
    });
    if (res.ok) { setRef(res.ref); setState('ok'); } else { setState('err'); }
  };

  if (state === 'ok') {
    return (
      <div style={{
        marginTop: 26, padding: '22px 24px', borderRadius: 'var(--r-lg)',
        background: 'var(--bg-card)', border: '1px solid var(--rule-soft)',
      }}>
        <div className="display" style={{ fontSize: 20, fontWeight: 500 }}>
          Заявка отправлена — художник свяжется лично
        </div>
        {ref && <p className="mono" style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--ink-2)' }}>Номер заявки: <b>{ref}</b></p>}
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--ink-2)' }}>
          Хотите быстрее — <a href={ABOUT.contacts.telegramUrl} target="_blank" rel="noopener" style={{ color: 'var(--accent)', fontWeight: 600 }}>Telegram</a>
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}
          aria-label="Заявка на картину" style={{ marginTop: 28, maxWidth: 520 }}>
      <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true"
             value={f.trap} onChange={(e) => setF((v) => ({ ...v, trap: e.target.value }))}
             style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <input className="field" style={{ flex: '1 1 170px', minWidth: 0 }} placeholder="Имя" aria-label="Имя"
               name="name" autoComplete="name" aria-required="true"
               aria-invalid={touched && !nameOk ? true : undefined}
               value={f.name} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} />
        <input className="field" style={{ flex: '1 1 210px', minWidth: 0 }} placeholder="Телефон или Telegram"
               aria-label="Телефон или Telegram" name="contact" autoComplete="tel" aria-required="true"
               aria-invalid={touched && !contactOk ? true : undefined}
               value={f.contact} onChange={(e) => setF((v) => ({ ...v, contact: e.target.value }))} />
      </div>
      {touched && !valid && (
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-2)' }}>
          {!nameOk ? 'Укажите имя' : 'Укажите телефон или Telegram'}
        </div>
      )}
      {state === 'err' && (
        <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          <b>Не удалось отправить.</b> Напишите напрямую:{' '}
          <a href={ABOUT.contacts.telegramUrl} target="_blank" rel="noopener" style={{ color: 'var(--accent)', fontWeight: 600 }}>Telegram</a>{' · '}
          <a href={`tel:${ABOUT.contacts.phone.replace(/\s/g, '')}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{ABOUT.contacts.phone}</a>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 14 }}>
        <button className="btn btn-solid" type="submit" disabled={state === 'sending'}
                style={{ minHeight: 52, opacity: state === 'sending' ? .6 : 1 }}>
          {state === 'sending' ? 'Отправляем…' : 'Заказать картину'}
        </button>
        <a href={routeToPath('catalog')} className="uh" style={{ color: 'var(--ink)', fontSize: 15, textDecoration: 'none' }}>
          {inStockCount()} {plural(inStockCount())} в наличии · от {formatPrice(priceRange().from)} →
        </a>
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-3)', maxWidth: 460 }}>
        Нажимая «Заказать картину», вы соглашаетесь на обработку персональных данных (152-ФЗ) —{' '}
        <a href={routeToPath('legal', { section: 'privacy' })}
           style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Политика ПД</a>
      </p>
    </form>
  );
}

function HeroCommission() {
  const hero = heroArt();
  // Sprint 16: hero строил /painting/<id> напрямую. На mbezu.ru такой страницы нет —
  // ссылка обязана проходить ту же развилку, что и карточка каталога.
  const heroHref = hasStorePage(hero.id)
    ? routeToPath('painting', { id: hero.id })
    : askAboutHref(hero);
  // LCP-картинка: тот же резолвер для src и srcSet (§13.13), иначе телефон
  // тянет полноразмерный файл ради 375-пиксельной колонки.
  const src = imageOf(hero, 'full');
  const heroT = imageOf(hero, 'thumb'), heroL = imageOf(hero, 'large');
  const heroSrcSet = (heroT && heroL && src && new Set([heroT, heroL, src]).size > 1)
    ? `${heroT} 480w, ${heroL} 960w, ${src} 1200w` : undefined;
  const trust: Array<[string, string, number | null]> = [
    [String(inStockCount()), 'в наличии', inStockCount()],
    ['от 2', 'недель на заказ', null],
    ['15+', 'лет практики', null],
    ['РФ', 'доставка', null],
  ];
  return (
    <section className="mb-section home-hero" style={{ paddingTop: 'clamp(28px, 3.5vw, 56px)' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div className="mb-cols" style={{ alignItems: 'center' }}>
          <div style={{ flex: '1 1 460px' }}>
            <span className="chip" style={{ cursor: 'default', borderColor: 'var(--rule)' }}>
              Картина на заказ · от 2 недель
            </span>
            <h1 className="display" style={{
              margin: '18px 0 0',
              fontSize: 'clamp(40px, 6.4vw, 94px)',
              lineHeight: .93, fontWeight: 500, letterSpacing: '-.038em',
            }}>
              Купить картину{' '}
              <span className="italic" style={{ color: 'var(--accent)', fontStyle: 'italic' }}>маслом</span>{' '}
              для&nbsp;интерьера
            </h1>
            <p style={{
              margin: '20px 0 0', maxWidth: 520,
              fontSize: 'clamp(15.5px, 1.15vw, 18px)', lineHeight: 1.6,
              color: 'var(--ink-2)', fontWeight: 300,
            }}>
              {/* tagline без точки на конце — иначе две фразы слипались в одно предложение */}
              {ABOUT.tagline}. Оригиналы на&nbsp;холсте: выберите работу в&nbsp;наличии
              или закажите картину под свой размер и&nbsp;палитру.
            </p>

            <HeroLead />

            {/* Полоса доверия — видна и на мобиле (раньше hide-mobile) */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: 18, marginTop: 34, paddingTop: 24, borderTop: '1px solid var(--rule-soft)',
            }}>
              {trust.map(([n, l, count]) => (
                <div key={l}>
                  <div className="display" style={{
                    fontSize: 'clamp(26px, 2.6vw, 38px)', fontWeight: 500, lineHeight: 1,
                    letterSpacing: '-.03em', color: 'var(--accent)',
                  }} {...(count ? { 'data-count': String(count) } : {})}>{n}</div>
                  <div className="eyebrow" style={{ marginTop: 6 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Работа-флагман в паспарту; подпись — внутри карточки (§13.8) */}
          <div style={{ flex: '1 1 380px' }}>
            <article className="mb-card">
              {/* без aria-label: имя ссылки должно содержать её видимый текст
                  (Lighthouse label-content-name-mismatch) */}
              <a className="mb-card-link" href={heroHref}>
                <div className="mb-mat mb-mat-wide">
                  {src
                    ? <img src={src} srcSet={heroSrcSet} alt={hero.title}
                           {...{ fetchpriority: 'high' }} loading="eager" decoding="async"
                           sizes="(max-width: 900px) 92vw, 46vw" />
                    : <PaintingPlate art={hero} fit="bare" objectFit="contain" plain showMeta={false} />}
                  <span className="mb-badge">Флагман</span>
                  <span className="mb-size">{hero.w}×{hero.h} см</span>
                </div>
                <div className="mb-card-body">
                  <div className="cat-no">Работа месяца · в наличии</div>
                  <h2 className="mb-card-title" style={{ fontSize: 'clamp(20px,1.6vw,24px)' }}>{hero.title}</h2>
                </div>
              </a>
              <div className="mb-card-foot">
                <span className="mb-card-price">{formatPrice(hero.price)}</span>
                <a className="mb-buy" href={heroHref}
                   style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Смотреть</a>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Плитка-разводка (HANDOFF §7.2, §5: приоритет — заказ) ─────
function PathTiles() {
  const tiles = [
    { href: routeToPath('commission'), t: 'Картина на заказ', s: 'Бриф за 2 минуты · от 2 недель', accent: true },
    { href: routeToPath('catalog'), t: `${inStockCount()} ${plural(inStockCount())}`, s: `Оригиналы в наличии, от ${formatPrice(priceRange().from)}` },
    { href: '/podarok', t: 'В подарок', s: `Миниатюры от ${formatPrice(priceRange().from)} · сертификат и упаковка` },
    { href: '/kartina-v-gostinuyu', t: 'Подобрать в комнату', s: 'Гостиная, спальня, кабинет' },
  ];
  return (
    <section className="mb-section" style={{ paddingTop: 0 }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div className="mb-grid-wide">
          {tiles.map((t) => (
            <a key={t.t} href={t.href} data-rev
               className={'mb-card' + (t.accent ? ' mb-shimmer' : '')}
               style={{
                 textDecoration: 'none',
                 padding: 'clamp(22px, 2.4vw, 34px)',
                 minHeight: 150, justifyContent: 'space-between',
                 background: t.accent ? 'var(--accent)' : 'var(--bg-card)',
                 color: t.accent ? 'var(--bg-cream)' : 'var(--ink)',
                 borderColor: t.accent ? 'var(--accent)' : 'rgba(42,37,32,.09)',
               }}>
              <span className="display" style={{ fontSize: 'clamp(22px,2vw,30px)', fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1.1 }}>{t.t}</span>
              <span style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5, opacity: t.accent ? .88 : .78 }}>{t.s}</span>
              <span className="mono" style={{ marginTop: 16, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase' }}>Открыть →</span>
            </a>
          ))}
        </div>
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

        <div className="mb-grid-wide">
          {SERIES.map((s) => {
            // Sprint 15 (аудит, мелочь 3): hero-работа дублировалась обложкой своей
            // серии — на главной одна картина стояла дважды. Обложка ≠ hero.
            const heroId = heroArt().id;
            const cover = ARTWORKS.find((a) => a.series === s.id && a.featured && a.id !== heroId)
                       || ARTWORKS.find((a) => a.series === s.id && a.id !== heroId && !a.hidden)
                       || ARTWORKS.find((a) => a.series === s.id);
            return (
              <a key={s.id} href={routeToPath('catalog', { series: s.id })}
                 className="lift" style={{
                   textDecoration: 'none', color: 'inherit',
                   display: 'flex', flexDirection: 'column', gap: 18,
                 }}>
                <div style={{ position: 'relative' }}>
                  {/* Sprint 10 (F): оверлей-плашка с названием серии убрана */}
                  <PaintingPlate art={cover} fit="bare" objectFit="contain" plain style={{
                    aspectRatio: '3 / 4', borderRadius: 'var(--r-md)',
                    boxShadow: 'var(--shadow-md)',
                  }} showMeta={false} />
                </div>
                <div>
                  <div className="cat-no">{s.years} · {seriesCount(s.id)} {plural(seriesCount(s.id))}</div>
                  <h3 className="display" style={{
                    margin: '10px 0 4px', fontSize: 28, fontWeight: 500,
                    letterSpacing: '-.015em', lineHeight: 1.1,
                  }}>{s.title}</h3>
                  <p className="italic" style={{
                    margin: 0, fontSize: 15, color: 'var(--accent)', fontStyle: 'italic',
                  }}>{s.subtitle}</p>
                  {/* §1.4: тизер — только подзаголовок и счётчик. Полное описание
                      живёт на посадочной серии; хак .split(/(?<=.)s/) резал текст по букве «s». */}
                </div>
              </a>
            );
          })}
        </div>
        {/* 04.09 перелинковка: в теле главной не было ссылок на посадочные и подборки (только подвал) */}
        <div style={{ marginTop: 44, paddingTop: 22, borderTop: '1px solid var(--rule-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <LinkStrip label="Подобрать" links={[['/kartina-v-gostinuyu', 'в гостиную'], ['/kartina-v-spalnyu', 'в спальню'], ['/kartina-v-kabinet', 'в кабинет'], ['/podarok', 'в подарок']]} />
          <LinkStrip label="По сюжету" links={[['/catalog/more', 'море и волны'], ['/catalog/botanika', 'цветы и растения'], ['/catalog/gory', 'горы']]} />
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

// ── Новое в мастерской ───────────────────────────────────────
// Sprint 16: до этого ни одна из 35 новых работ на главную не попадала —
// InStock брал [...featuredArtworks(), ...rest].slice(0, 6), а флагманов стало 10,
// и срез не доходил до «свежего» хвоста вообще.
// Состав ленты — freshHighlights(): по кругу через серии, чтобы было видно,
// что пополнение разное, а не двенадцать миниатюр подряд.
const LANE_SIZE = 8;

function FreshLane() {
  const items = freshHighlights(LANE_SIZE);
  if (!items.length) return null;
  const total = freshCount();
  const mini = seriesById('mini');
  const pets = seriesById('pets');
  const miniPrice = Math.min(...ARTWORKS.filter((a) => a.series === 'mini').map((a) => a.price));

  return (
    <section className="resp-pad" style={{ padding: '110px 40px 80px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 44, flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <Eyebrow accent>Новое в мастерской</Eyebrow>
            <h2 className="display resp-h2" style={{
              margin: '20px 0 0', fontSize: 'clamp(36px, 4.6vw, 68px)',
              lineHeight: 0.96, fontWeight: 500, letterSpacing: '-.03em',
            }}>
              {total} {plural(total)}{' '}<br/>и <span className="italic" style={{ color: 'var(--accent)' }}>две новые серии</span>
            </h2>
            <p style={{ margin: '18px 0 0', maxWidth: 520, fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)', fontWeight: 300 }}>
              Пополнение каталога, {freshStamp()}: монохром и тондо, португальские улицы,
              первые миниатюры и портреты на сусальном золоте.
            </p>
          </div>
          <a className="btn btn-ghost" href={`${routeToPath('catalog')}?new=1`} style={{ textDecoration: 'none' }}>Все {total} {plural(total)} →</a>
        </div>

        <div className="mb-grid">
          {items.map((a, i) => (
            <ArtCard key={a.id} art={a} index={i + 1} total={items.length} />
          ))}
        </div>

        {/* Две новые серии — это новые поводы купить, а не просто новые картинки:
            миниатюры дают вход по цене подарка, портреты питомцев — услугу. */}
        <div className="resp-stack" style={{ marginTop: 34, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            {
              href: routeToPath('catalog', { series: 'mini' }),
              tag: 'Новая серия',
              title: mini?.title || 'Миниатюры',
              note: `${seriesCount('mini')} ${plural(seriesCount('mini'))} 7–15 см · масло на холсте · мини-мольберт в комплекте`,
              cta: `от ${formatPrice(miniPrice)}`,
            },
            {
              href: routeToPath('catalog', { series: 'pets' }),
              tag: 'Новое направление',
              title: pets?.title || 'Портреты на золоте',
              note: 'Портрет питомца маслом и поталью по вашим фотографиям · 3–5 недель',
              cta: 'На заказ',
            },
          ].map((t) => (
            <a key={t.title} href={t.href} data-rev className="mb-card" style={{
              textDecoration: 'none', color: 'inherit',
              padding: 'clamp(22px, 2.4vw, 32px)', minHeight: 150,
              justifyContent: 'space-between', background: 'var(--bg-card)',
            }}>
              <span className="cat-no" style={{ color: 'var(--accent)' }}>{t.tag}</span>
              <span className="display" style={{ marginTop: 10, fontSize: 'clamp(22px,2vw,30px)', fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1.1 }}>{t.title}</span>
              <span style={{ marginTop: 10, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)' }}>{t.note}</span>
              <span className="mono" style={{ marginTop: 16, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase' }}>{t.cta} →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── InStock — featured + recent ───────────────────────────────
function InStock({ go }) {
  // Sprint 16: исключаем ровно те работы, что уже показаны в ленте «Новое в мастерской»,
  // а не всё пополнение целиком — иначе работа 2026 года никогда не вернётся
  // в «Избранные», даже когда перестанет быть новой.
  // И только свободные: PP-01 — featured, но sold + commission (это услуга, не товар).
  // hero печатает «работу месяца» — она же стояла первой в «Избранных»
  // (то же, что Sprint 15 чинил для обложек серий, только для этой секции).
  const skip = new Set([heroArt().id, ...freshHighlights(LANE_SIZE).map((a) => a.id)]);
  const free = (a) => a.status === 'available' && !a.commission && !skip.has(a.id);
  const fts = featuredArtworks().filter(free);
  // хвост добирается по цене, а не по году: секция называется «Избранные»,
  // и три миниатюры по 5 000 ₽ рядом с Ангкором за 130 000 читаются как случайность
  const rest = visibleArtworks()
    .filter((a) => free(a) && !a.featured)
    .sort((a, b) => b.price - a.price);
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

        <div className="mb-grid">
          {items.map((a, i) => (
            <ArtCard key={a.id} art={a} index={i + 1} total={items.length} priority={i < 3} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Packaging — open box + thank-you card ─────────────────────
// ── На стене ─────────────────────────────────────────────────
// Sprint 16: до этого «как будет выглядеть у меня» отвечали только три
// обобщённые комнаты на посадочных серий. Здесь — конкретные работы
// в конкретных интерьерах, крупным планом и с кликом на карточку.
function OnTheWall() {
  const shots = INTERIOR_SHOTS;
  return (
    <section className="resp-pad" style={{ padding: '120px 40px' }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <Eyebrow accent>На стене</Eyebrow>
            <h2 className="display resp-h1" style={{
              margin: '24px 0 0', fontSize: 'clamp(34px, 4.4vw, 68px)',
              lineHeight: 0.99, fontWeight: 500, letterSpacing: '-.03em',
            }}>
              Как это выглядит{' '}<br/>в <span className="italic" style={{ color: 'var(--accent)' }}>комнате</span>
            </h2>
            <p style={{ marginTop: 22, maxWidth: 520, fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)', fontWeight: 300 }}>
              Размер в сантиметрах мало что говорит, пока картина не&nbsp;на&nbsp;стене.
              Здесь — работы из&nbsp;каталога в&nbsp;реальных интерьерах: кабинет, прихожая,
              коридор, гостиная со&nbsp;стеллажом.
            </p>
          </div>
          <a href={routeToPath('catalog')} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
            Весь каталог →
          </a>
        </div>

        <div className="mb-grid" style={{ marginTop: 40 }}>
          {shots.map((sh) => {
            const art = sh.art ? artworkById(sh.art) : null;
            const img = (
              // width/height не для вёрстки, а чтобы браузер знал пропорцию
              // до загрузки: карточки каталога держит aspect-ratio, эти — нет.
              <img {...interiorSrc(sh.file)} width={1047} height={1280}
                   sizes="(max-width: 600px) 92vw, (max-width: 900px) 46vw, 30vw"
                   alt={art ? `Картина «${art.title}» в интерьере — ${sh.caption}` : sh.caption}
                   loading="lazy" decoding="async"
                   style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--r-md)' }} />
            );
            return (
              <figure key={sh.file} data-rev style={{ margin: 0 }}>
                {art
                  ? <a href={hasStorePage(art.id) ? routeToPath('painting', { id: art.id }) : askAboutHref(art)}
                       style={{ display: 'block', textDecoration: 'none' }}>{img}</a>
                  : img}
                <figcaption style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                  {art && <span className="cat-no" style={{ display: 'block', marginBottom: 4 }}>{art.title} · {dimsLabel(art)}</span>}
                  {sh.caption}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

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
              Картина приезжает{' '}<br/>как <span className="italic" style={{ color: 'var(--accent)' }}>подарок</span>
            </h2>
            <p style={{
              marginTop: 32, maxWidth: 480, fontSize: 16, lineHeight: 1.7,
              color: 'var(--ink-2)', fontWeight: 300,
            }}>
              Каждая работа приезжает с&nbsp;открыткой из&nbsp;страны вдохновения и&nbsp;сертификатом подлинности.
            </p>
            <ul style={{
              marginTop: 32, padding: 0, listStyle: 'none',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {[
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
            <p style={{ margin: '28px 0 0', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Ищете <a href="/podarok" className="uh-tap" style={{ color: 'var(--accent)', textDecoration: 'none' }}>картину в подарок</a> — отдельная подборка оригиналов с сертификатом.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats row ────────────────────────────────────────────────
// §1.7: в hero уже стоят 21 / от 2 / 15+ — здесь другие показатели,
// иначе одни и те же цифры печатались на странице дважды.
function StatsRow() {
  const items = [
    // §1.7: «лет практики» уже стоит в hero — здесь другие показатели
    { n: String(SERIES.length), l: `${pluralOf(SERIES.length, ['серия', 'серии', 'серий'])} в развитии`, c: SERIES.length },
    { n: String(freshCount()), l: `${plural(freshCount())} в пополнении`, c: freshCount() },
    { n: 'от 2', l: 'недель средний срок', c: null },
    { n: 'РФ', l: 'доставка и страховка', c: null },
  ];
  return (
    <section className="mb-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <div className="card-soft" style={{
        maxWidth: 'var(--max)', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--rule-soft)',
      }}>
        {items.map((it) => (
          <div key={it.l} style={{
            padding: 'clamp(24px, 2.6vw, 40px)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div className="display" style={{
              fontSize: 'clamp(40px, 5vw, 76px)', fontWeight: 500, lineHeight: .92,
              letterSpacing: '-.04em', color: 'var(--accent)',
            }} {...(it.c ? { 'data-count': String(it.c), 'data-count-suffix': it.n.endsWith('+') ? '+' : '' } : {})}>{it.n}</div>
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
              От брифа{' '}<br/>до <span className="italic" style={{ color: 'var(--accent)' }}>подрамника</span>
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

// ── LeadForm — открытая форма заявки ─────────────────────────
// Sprint 15 (Ф0): доставка через скрытые нативные формы Tilda (submitLead):
//   A [data-mbezu-lead] — ПД → Входящие + Email (РФ), критична, ждём await
//   B [data-mbezu-notify] — обезличенное уведомление → Telegram, не блокирует UI
// «✓ принято» показывается ТОЛЬКО при успехе A. Раньше форма писала в localStorage
// браузера клиента и всё равно показывала успех — ни одна заявка не доходила.

/** UTM-метки, сохранённые при первом заходе (см. analytics.ts) — уезжают вместе с заявкой. */
function utmFromStorage(): Record<string, string> {
  try {
    const raw = localStorage.getItem('mbezu-utm');
    if (!raw) return {};
    const u = JSON.parse(raw);
    return {
      utm_source: u.utm_source || '', utm_medium: u.utm_medium || '',
      utm_campaign: u.utm_campaign || '', utm_content: u.utm_content || '',
    };
  } catch { return {}; }
}

function LeadForm({ go }) {
  const [lead, setLead] = React.useState({ name: '', contact: '', about: '', consent: false, trap: '' });
  const [state, setState] = React.useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [touched, setTouched] = React.useState(false);
  const [ref, setRef] = React.useState('');

  const nameOk = lead.name.trim().length >= 2;
  const contactOk = lead.contact.trim().length >= 5;
  const valid = nameOk && contactOk && lead.consent;

  const upd = (k: string, v: unknown) => setLead((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setTouched(true);
    if (!valid || state === 'sending') return;   // кнопка заблокирована на время отправки
    setState('sending');
    // Sprint 15 (Ф0): реальная доставка. Контакт может быть телефоном/почтой/telegram —
    // кладём в оба поля, лишнее в скрытой форме просто не заполнится.
    const contact = lead.contact.trim();
    // ref один на попытку: при повторе после ошибки переиспользуем прежний,
    // иначе во Входящих появятся две карточки на одну заявку.
    const attemptRef = ref || leadRef();
    setRef(attemptRef);
    const res = await submitLead({
      lead_ref: attemptRef,
      name: lead.name.trim(),
      phone: contact,
      email: /@/.test(contact) ? contact : '',
      message: lead.about.trim(),
      source: 'home-cta',
      page: typeof location !== 'undefined' ? location.pathname : '/',
      [HONEYPOT_FIELD]: lead.trap,
      ...utmFromStorage(),
    });
    if (res.ok) { setRef(res.ref); setState('ok'); } else { setState('err'); }
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
            Заявка отправлена — художник свяжется лично
          </span>
        </div>
        {ref && (
          <p className="mono" style={{ margin: '12px 0 0', fontSize: 12.5, opacity: .8 }}>
            Номер заявки: <b>{ref}</b> — назовите его, если будете писать сами
          </p>
        )}
        <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.6, opacity: .85 }}>
          Хотите быстрее — напишите напрямую:{' '}
          <a href={ABOUT.contacts.telegramUrl} target="_blank" rel="noopener"
             style={{ color: 'var(--bg-cream)', fontWeight: 600 }}>Telegram</a>
        </p>
      </div>
    );
  }

  return (
    // Sprint 15 (аудит, направление 6): был <div> — Enter не отправлял заявку,
    // браузер хуже подставлял сохранённые контакты, скринридер не объявлял форму.
    // noValidate — потому что проверка своя, с человеческими подсказками ниже полей.
    <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Ловушка для ботов:человек её не видит (вне экрана, не в табуляции), бот заполняет всё подряд */}
      <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true"
             value={lead.trap} onChange={(e) => upd('trap', e.target.value)}
             style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      {/* 03.09 a11y: подписи полей были только placeholder — добавлены aria-label */}
      <input className="field" style={fieldStyle} placeholder="Имя *" aria-label="Имя"
             name="name" autoComplete="name" aria-required="true"
             aria-invalid={touched && !nameOk ? true : undefined}
             value={lead.name} onChange={(e) => upd('name', e.target.value)} />
      {touched && !nameOk && <span style={{ fontSize: 12, opacity: .85 }}>Укажите имя</span>}
      <input className="field" style={fieldStyle} placeholder="Телефон / Telegram / email *" aria-label="Телефон, Telegram или email"
             name="contact" autoComplete="tel" aria-required="true"
             aria-invalid={touched && !contactOk ? true : undefined}
             value={lead.contact} onChange={(e) => upd('contact', e.target.value)} />
      {touched && !contactOk && <span style={{ fontSize: 12, opacity: .85 }}>Укажите контакт — телефон, Telegram или email</span>}
      <textarea className="field" style={{ ...fieldStyle, minHeight: 84 }} rows={3} aria-label="О работе"
                placeholder="О работе: размер, настроение, место (необязательно)"
                value={lead.about} onChange={(e) => upd('about', e.target.value)} />

      <label style={{
        display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
        fontSize: 12.5, lineHeight: 1.55, opacity: .92,
      }}>
        <input type="checkbox" checked={lead.consent}
               onChange={(e) => upd('consent', e.target.checked)}
               style={{ marginTop: 3, accentColor: 'var(--bg-cream)', width: 18, height: 18, flexShrink: 0 }} />
        <span>
          Согласен(на) на обработку персональных данных (152-ФЗ) —{' '}
          <a href="/legal?section=privacy"
             onClick={(e) => { e.preventDefault(); go('legal', { section: 'privacy' }); }}
             className="uh-tap" style={{ color: 'var(--bg-cream)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>Политика ПД</a>
        </span>
      </label>
      {touched && !lead.consent && (
        <span style={{ fontSize: 12, opacity: .85 }}>Для отправки нужно согласие на обработку ПД</span>
      )}

      {state === 'err' && (
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--r-md)',
          background: 'rgba(245,239,226,0.16)', border: '1px solid rgba(245,239,226,0.4)',
          fontSize: 13.5, lineHeight: 1.6,
        }}>
          <b>Не удалось отправить заявку.</b> Напишите напрямую — ответим так же быстро:{' '}
          <a href={ABOUT.contacts.telegramUrl} target="_blank" rel="noopener"
             style={{ color: 'var(--bg-cream)', fontWeight: 600 }}>Telegram</a>{' · '}
          <a href={`mailto:${ABOUT.contacts.email}`}
             style={{ color: 'var(--bg-cream)', fontWeight: 600 }}>{ABOUT.contacts.email}</a>{' · '}
          <a href={`tel:${ABOUT.contacts.phone.replace(/\s/g, '')}`}
             style={{ color: 'var(--bg-cream)', fontWeight: 600 }}>{ABOUT.contacts.phone}</a>
        </div>
      )}

      <button className="btn" type="submit" disabled={state === 'sending'}
              style={{
                borderColor: 'var(--bg-cream)', color: 'var(--bg-cream)', background: 'transparent',
                alignSelf: 'flex-start', opacity: state === 'sending' ? .6 : 1,
              }}>
        {state === 'sending' ? 'Отправляем…' : 'Оставить заявку →'}
      </button>
    </form>
  );
}

// ── CommissionCTA — золотой terracotta-блок ─────────────────
function CommissionCTA({ go }) {
  return (
    <section id="zayavka" className="resp-pad" style={{
      padding: '0 40px', marginTop: 60, scrollMarginTop: 90,
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
        <div className="display" aria-hidden="true" style={{
          position: 'absolute', right: -30, top: -50,
          fontSize: 'clamp(180px, 22vw, 360px)',
          color: 'rgba(245,239,226,.10)',
          fontWeight: 500, letterSpacing: '-.04em', lineHeight: 1,
          pointerEvents: 'none', fontStyle: 'italic',
        }}>MB</div>

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
              Картина для вашего{' '}<br/><span style={{ fontStyle: 'italic' }}>пространства</span>
            </h2>
          </div>
          <div style={{ paddingBottom: 12 }}>
            <p style={{
              margin: '0 0 24px', fontSize: 17, lineHeight: 1.6,
              opacity: .82, fontWeight: 300,
            }}>
              Расскажите о&nbsp;комнате, размере и&nbsp;настроении. Художник ответит лично с&nbsp;эскизами и&nbsp;сроком.
            </p>
            {/* Sprint 11 (item 17): открытая форма заявки вместо кнопки */}
            <LeadForm go={go} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CommissionCTAShort — короткий повтор CTA внизу (Sprint 14 Ф1) ──
function CommissionCTAShort() {
  return (
    <section className="resp-pad" style={{ padding: '40px 40px 0' }}>
      <div className="card-soft resp-stack" style={{
        maxWidth: 'var(--max)', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 32,
        alignItems: 'center', padding: '40px 48px',
        borderRadius: 'var(--r-xl)', border: '1px solid var(--rule-soft)',
      }}>
        <div>
          <Eyebrow accent>Дочитали до конца?</Eyebrow>
          <h2 className="display resp-h2" style={{
            margin: '12px 0 0', fontSize: 'clamp(26px, 3vw, 38px)',
            fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1.1,
          }}>
            Картина маслом под ваш <span className="italic" style={{ color: 'var(--accent)' }}>интерьер</span>
          </h2>
        </div>
        <a href="#zayavka" className="btn btn-solid" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Заказать картину →
        </a>
      </div>
    </section>
  );
}

// ── Newsletter ───────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  // Sprint 15 (Ф0): подписка тоже ничего не отправляла — только показывала «Письмо отправлено».
  const [nlState, setNlState] = React.useState<'idle' | 'sending' | 'err'>('idle');
  // Sprint 15 §3.5: для рассылки нужны ДВА основания — обработка ПД (152-ФЗ)
  // и согласие на рекламные сообщения (ст. 18 ФЗ «О рекламе»). Одного мало.
  const [nlConsent, setNlConsent] = React.useState(false);
  const [nlAds, setNlAds] = React.useState(false);
  const [nlTouched, setNlTouched] = React.useState(false);
  const [nlTrap, setNlTrap] = React.useState('');
  const [nlRef, setNlRef] = React.useState('');

  const subscribe = async (e) => {
    e.preventDefault();
    setNlTouched(true);
    if (nlState === 'sending' || !nlConsent || !nlAds) return;
    setNlState('sending');
    const attemptRef = nlRef || leadRef();
    setNlRef(attemptRef);
    const res = await submitLead(
      {
        lead_ref: attemptRef, email: email.trim(), source: 'newsletter',
        page: typeof location !== 'undefined' ? location.pathname : '/',
        [HONEYPOT_FIELD]: nlTrap, ...utmFromStorage(),
      },
      { selector: '[data-mbezu-newsletter]' },
    );
    if (res.ok) { setSent(true); setNlState('idle'); } else { setNlState('err'); }
  };
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
          <form onSubmit={subscribe}
                className="nl-form"
                style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  background: 'var(--bg)', borderRadius: 'var(--r-pill)',
                  padding: 6, border: '1px solid var(--rule-soft)',
                  minWidth: 0, maxWidth: '100%',
                }}>
            {/* Sprint 15 (моб. аудит): fontSize 16 — меньше 16px iOS зумит страницу при фокусе */}
            {/* 03.09 a11y: aria-label (подпись была только placeholder); inline outline:none убран —
                он перебивал глобальный input:focus-visible, и фокус с клавиатуры был невидим */}
            <input type="email" placeholder="ваша почта" required aria-label="Электронная почта"
                   value={email} onChange={(e) => setEmail(e.target.value)}
                   style={{
                     border: 0, background: 'transparent', flex: 1,
                     minWidth: 0, width: '100%',
                     padding: '14px 22px',
                     fontFamily: 'var(--sans)', fontSize: 16, lineHeight: 1.3, color: 'var(--ink)',
                   }} />
            <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true"
                   value={nlTrap} onChange={(e) => setNlTrap(e.target.value)}
                   style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
            <button type="submit" className="btn btn-solid" disabled={nlState === 'sending'}
                    style={{ flexShrink: 0, opacity: nlState === 'sending' ? .6 : 1 }}>
              {nlState === 'sending' ? 'Отправляем…' : 'Подписаться'}
            </button>
          </form>
        )}
        {!sent && (
          /* Sprint 15 (моб. аудит): класс nl-consent — на мобиле согласия показываются ДО кнопки (order в styles.css) */
          <div className="nl-consent" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>
              <input type="checkbox" checked={nlConsent} onChange={(e) => setNlConsent(e.target.checked)}
                     style={{ marginTop: 2, width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0 }} />
              <span>Согласен(на) на обработку персональных данных (152-ФЗ) —{' '}
                <a href="/legal?section=privacy" className="uh-tap" style={{ color: 'var(--accent)' }}>Политика ПД</a></span>
            </label>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>
              <input type="checkbox" checked={nlAds} onChange={(e) => setNlAds(e.target.checked)}
                     style={{ marginTop: 2, width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0 }} />
              <span>Согласен(на) получать письма о новых работах и закрытых продажах (реклама)</span>
            </label>
            {nlTouched && (!nlConsent || !nlAds) && (
              <span style={{ fontSize: 12, color: 'var(--accent-deep)' }}>
                Для подписки нужны оба согласия
              </span>
            )}
          </div>
        )}
        {nlState === 'err' && !sent && (
          <div style={{ gridColumn: '1 / -1', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            Не удалось подписать. Напишите нам:{' '}
            <a href={`mailto:${ABOUT.contacts.email}`} style={{ color: 'var(--accent)' }}>{ABOUT.contacts.email}</a>
          </div>
        )}
      </div>
    </section>
  );
}

// ── HomePage композиция (HANDOFF §7) ──────────────────────────
function HomePage({ go }) {
  return (
    <div className="fade-in">
      <HeroCommission />
      <PathTiles />

      {/* Sprint 16: перечень был зашит руками и печатал 3 серии из 6 */}
      <Marquee items={[...SERIES.map((s) => s.title), '— серии одного автора —']} big />

      <FreshLane />
      <InStock go={go} />
      <SeriesTriptych go={go} />
      <ProcessRow />
      <OnTheWall />
      <Packaging />
      <ManifestBand />
      <StatsRow />
      <CommissionCTA go={go} />
      <FaqSection items={HOME_FAQ} title="Как выбрать и заказать картину" />
      {/* §1.13: пустой блок отзывов сам прячется, пока нет реальных отзывов */}
      <ReviewsSection />
      <CommissionCTAShort />
      <Newsletter />
    </div>
  );
}

export { HomePage };
export default HomePage;
