import React from 'react';
import { PaintingPlate } from '../common/adapter';
import { ArtCard, Breadcrumbs, Eyebrow } from '../common/atoms';
import { StickyBar } from '../common/chrome';
import { ABOUT, ARTWORKS, artworkById, formatPrice, imageOf, seriesById, isCurved, dimsLabel } from '../common/data';
import { ProductReviews } from '../common/reviews-section';
import { interiorsFor, interiorSrc } from '../common/interiors';
import { routeToPath } from '../common/routes';
import { cardSrcSet } from '../common/tilda-images';
import { storeProductPath } from '../common/store-urls';

// ─────────────────────────────────────────────────────────────
// painting.tsx — карточка работы (редизайн 2026, HANDOFF §10).
// Модель «Купить сейчас»: работа в паспарту + ракурсы + блок масштаба,
// справа липкая колонка покупки. Липкая нижняя панель — своя (цена + купить).
// ─────────────────────────────────────────────────────────────

const VIEWS: Array<{ label: string; pos: string; scale: number }> = [
  { label: 'Работа',  pos: '50% 50%', scale: 1 },
  { label: 'Гребень', pos: '35% 35%', scale: 1.9 },
  { label: 'Фактура', pos: '65% 60%', scale: 2.2 },
  { label: 'Подпись', pos: '85% 90%', scale: 2.6 },
];

const FURNITURE = [
  { id: 'sofa',  label: 'Диван',  w: 220, h: 80 },
  { id: 'door',  label: 'Дверь',  w: 90,  h: 200 },
  { id: 'chest', label: 'Комод',  w: 120, h: 85 },
];

/** Блок масштаба: условная стена 340×260 см, проценты считаются от неё. */
function ScaleBlock({ w, h, round }: { w: number; h: number; round: boolean }) {
  const [f, setF] = React.useState('sofa');
  const item = FURNITURE.find((x) => x.id === f)!;
  const WALL_W = 340, WALL_H = 260;
  const pct = (v: number, base: number) => `${(v / base) * 100}%`;
  const isDoor = item.id === 'door';
  // Центр картины — 150 см от пола; рядом с дверью работа висит сбоку,
  // иначе она визуально «висит на двери».
  const artBottom = 150 - h / 2;

  return (
    <section style={{ marginTop: 'clamp(32px, 4vw, 56px)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow accent>Масштаб</Eyebrow>
          <h2 className="display" style={{ margin: '10px 0 0', fontSize: 'clamp(22px,2.4vw,30px)', fontWeight: 500, letterSpacing: '-.02em' }}>
            {round ? `⌀ ${w} см` : `${w}×${h} см`} рядом с мебелью
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FURNITURE.map((x) => (
            <button key={x.id} type="button" className={'chip' + (f === x.id ? ' is-active' : '')}
                    aria-pressed={f === x.id} onClick={() => setF(x.id)}>
              {x.label} {x.id === 'door' ? x.h : x.w}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 18, position: 'relative',
        aspectRatio: `${WALL_W} / ${WALL_H}`,
        background: 'linear-gradient(180deg, #e9e1d1 0%, #ded5c3 100%)',
        border: '1px solid var(--rule-soft)', borderRadius: 'var(--r-md)',
        overflow: 'hidden',
      }} aria-hidden="true">
        {/* пол */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '6%', background: 'rgba(42,37,32,.14)' }} />
        {/* мебель */}
        <div style={{
          position: 'absolute', bottom: '6%',
          left: isDoor ? '6%' : '50%',
          transform: isDoor ? 'none' : 'translateX(-50%)',
          width: pct(item.w, WALL_W), height: pct(item.h, WALL_H),
          background: 'rgba(42,37,32,.22)', borderRadius: isDoor ? '4px 4px 0 0' : '8px',
        }} />
        {/* картина */}
        <div style={{
          position: 'absolute',
          bottom: `calc(6% + ${(artBottom / WALL_H) * 100}%)`,
          left: isDoor ? '62%' : '50%',
          transform: 'translateX(-50%)',
          width: pct(w, WALL_W), height: pct(round ? w : h, WALL_H),
          background: 'var(--accent)', opacity: .9,
          borderRadius: round ? '50%' : 4,
          boxShadow: '0 12px 26px -14px rgba(42,37,32,.8)',
        }} />
      </div>
      <p className="cat-no" style={{ marginTop: 10 }}>
        Условная стена 340×260 см · центр работы 150 см от пола
      </p>
    </section>
  );
}

function PaintingPage({ go, id }) {
  const art = artworkById(id);
  const [view, setView] = React.useState(0);
  const [tab, setTab] = React.useState('about');
  if (!art) return null;

  const series = seriesById(art.series);
  const index = ARTWORKS.findIndex((a) => a.id === id) + 1;
  const related = ARTWORKS.filter((a) => a.series === art.series && a.id !== art.id && !a.hidden).slice(0, 4);
  const round = art.shape === 'round';
  const curved = isCurved(art);
  // Портреты питомцев — примеры направления: работа у владельца, продаётся не она, а заказ
  const onCommission = !!art.commission;
  const shots = interiorsFor(art.id);
  const dims = dimsLabel(art);
  // Картинка работы — самый тяжёлый элемент страницы; без srcSet телефон
  // качал самый крупный файл при ширине отрисовки ~360 px.
  const mainSrcSet = cardSrcSet(art.id);
  const src = imageOf(art, 'full');
  // Покупка живёт в нативном Store Tilda (корзина 706 → ЮKassa).
  // Sprint 16: фолбэк был routeToPath('catalog') — кнопка «Купить сейчас» у 35 работ
  // без страницы Store уводила в общий каталог, то есть в никуда.
  const buyHref = storeProductPath(art.id) || routeToPath('commission', { ref: art.id });
  const inStore = !!storeProductPath(art.id);
  const askHref = ABOUT.contacts.telegramUrl;
  const v = VIEWS[view];

  return (
    <>
      <div className="fade-in mb-section" style={{ paddingTop: 'clamp(18px, 2.2vw, 32px)' }}>
        <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
          <Breadcrumbs items={[
            { label: 'MBezu', href: '/' },
            { label: 'Каталог', href: '/catalog' },
            { label: series?.title || '', href: routeToPath('catalog', { series: art.series }) },
            { label: art.title },
          ]} />

          <div className="mb-cols" style={{ marginTop: 24, alignItems: 'flex-start' }}>
            {/* ЛЕВО — работа */}
            <div style={{ flex: '1.4 1 460px', minWidth: 0 }}>
              <div className="mb-mat mb-mat-wide" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--rule-soft)' }}>
                {src ? (
                  <img src={src} srcSet={mainSrcSet} sizes="(max-width: 900px) 94vw, 58vw"
                       alt={`${art.title}${art.subtitle ? '. ' + art.subtitle : ''} — картина маслом, ${dims}, ${art.year}`}
                       loading="eager" decoding="async"
                       {...{ fetchpriority: 'high' }}
                       style={{
                         objectPosition: v.pos,
                         transform: `scale(${v.scale})`,
                         transition: 'transform .6s cubic-bezier(.16,1,.3,1), object-position .6s cubic-bezier(.16,1,.3,1)',
                         borderRadius: curved ? '50%' : 0,
                       }} />
                ) : (
                  <PaintingPlate art={art} size="full" fit="bare" objectFit="contain" plain showMeta={false} />
                )}
                {art.featured && <span className="mb-badge">Флагман</span>}
                <span className="mb-size">Оригинал · 1 из 1</span>
              </div>

              {/* Ракурсы. Пока это кадрирование одного файла — когда появятся
                  макро-съёмки, здесь встанут отдельные изображения. */}
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {VIEWS.map((x, i) => (
                  <button key={x.label} type="button" aria-pressed={view === i}
                          onClick={() => setView(i)}
                          style={{
                            aspectRatio: '1', cursor: 'pointer', padding: 0, minHeight: 44,
                            border: view === i ? '2px solid var(--accent)' : '1px solid var(--rule-soft)',
                            borderRadius: 'var(--r-sm)', overflow: 'hidden', position: 'relative',
                            background: src
                              ? `url(${src}) ${x.pos} / ${x.scale * 100}% no-repeat, var(--mat)`
                              : 'var(--mat)',
                            opacity: view === i ? 1 : .72, transition: 'opacity .2s',
                          }}>
                    <span style={{
                      position: 'absolute', bottom: 4, left: 4, right: 4,
                      fontFamily: 'var(--mono)', fontSize: 8.5,
                      color: 'var(--ink)', letterSpacing: '.14em', textTransform: 'uppercase',
                      background: 'rgba(245,239,226,.82)', borderRadius: 4, padding: '2px 0',
                    }}>{x.label}</span>
                  </button>
                ))}
              </div>

              <div className="cat-no" style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{art.medium}</span>
                <span>{art.id} · {index} / {ARTWORKS.length}</span>
              </div>

              {/* Sprint 16: схема масштаба считала формой только 'round' — овальное
                  тондо получало круглую картинку и прямоугольную схему рядом */}
              <ScaleBlock w={art.w} h={art.h} round={curved} />
            </div>

            {/* ПРАВО — покупка */}
            <aside style={{ flex: '1 1 340px', minWidth: 0, position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
              <Eyebrow accent>
                <span aria-hidden="true" style={{ color: series?.color }}>● </span>
                {series?.title} · {art.year}
              </Eyebrow>
              <h1 className="display" style={{
                margin: '16px 0 8px', fontSize: 'clamp(32px, 3.6vw, 56px)',
                lineHeight: 1, fontWeight: 500, letterSpacing: '-.03em',
              }}>{art.title}</h1>
              {art.subtitle && (
                <p className="italic" style={{ margin: 0, fontSize: 18, color: 'var(--ink-2)', fontStyle: 'italic' }}>{art.subtitle}</p>
              )}
              <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>{art.description}</p>

              {/* Блок покупки */}
              <div style={{
                marginTop: 24, padding: 'clamp(18px, 1.8vw, 26px)',
                background: 'var(--bg-card)', border: '1px solid var(--rule-soft)',
                borderRadius: 'var(--r-lg)',
              }}>
                <div className="display" style={{
                  fontSize: 'clamp(34px, 3.6vw, 46px)', fontWeight: 600,
                  letterSpacing: '-.03em', lineHeight: 1,
                }}>{formatPrice(art.price)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 14, color: 'var(--ink-2)' }}>
                  {!onCommission && <span className="mb-pulse" aria-hidden="true" />}
                  {onCommission ? `Работа у владельца · ${art.w}×${art.h} см — цена такого портрета`
                    : art.status === 'sold' ? 'Продано' : 'В наличии · 1 шт'}
                </div>
                <div className="cat-no" style={{ marginTop: 8 }}>
                  {onCommission ? 'Срок работы 3–5 недель' : 'Отгрузка 1–2 дня после оплаты'}
                </div>

                <a href={onCommission ? routeToPath('commission', { ref: art.id }) : buyHref}
                   className="btn btn-solid" style={{
                  marginTop: 18, width: '100%', justifyContent: 'center',
                  minHeight: 58, textDecoration: 'none', fontSize: 13,
                }}>{onCommission ? 'Заказать портрет питомца' : inStore ? 'Купить сейчас' : 'Спросить о работе'}</a>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                  {!onCommission && (
                    <a href={routeToPath('commission', { ref: art.id })} className="btn btn-ghost"
                       style={{ justifyContent: 'center', textDecoration: 'none', fontSize: 11 }}>Похожую на заказ</a>
                  )}
                  <a href={askHref} target="_blank" rel="noopener" className="btn btn-ghost"
                     style={{ gridColumn: onCommission ? '1 / -1' : undefined, justifyContent: 'center', textDecoration: 'none', fontSize: 11 }}>Задать вопрос</a>
                </div>

                <ul style={{ margin: '20px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 9 }}>
                  {(onCommission
                    ? ['Пишется по вашим фотографиям питомца', 'Масло и поталь на холсте 40×60 см',
                       'Эскиз на согласование до начала работы', 'Сертификат подлинности и авторская подпись']
                    : ['Оригинал маслом, единственный экземпляр', 'Сертификат подлинности и авторская подпись',
                       'Доставка по РФ со страховкой', 'Возврат 14 дней по закону']).map((g) => (
                    <li key={g} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--ink-2)' }}>
                      <span aria-hidden="true" style={{ color: 'var(--accent)' }}>◆</span>{g}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Характеристики */}
              <dl style={{ margin: '24px 0 0', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px 20px' }}>
                {[
                  ['Техника', art.medium],
                  ['Стиль', art.style],
                  ['Размер', dims],
                  ['Год', String(art.year)],
                  ['Оформление', art.framing],
                  ['Каталог', `№ ${String(index).padStart(3, '0')} / ${String(ARTWORKS.length).padStart(3, '0')}`],
                  ['Подпись', 'Авторская, лиц. сторона'],
                  ['Сертификат', 'Прилагается'],
                ].map(([k, val]) => (
                  <React.Fragment key={k}>
                    <dt className="cat-no">{k}</dt>
                    <dd style={{ margin: 0, fontSize: 13.5, textAlign: 'right' }}>{val}</dd>
                  </React.Fragment>
                ))}
              </dl>

              {/* Табы */}
              <div style={{ marginTop: 28 }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--rule-soft)', flexWrap: 'wrap' }}>
                  {[['about', 'Описание'], ['history', 'История'], ['delivery', 'Доставка']].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k}
                            style={{
                              background: 'transparent', border: 0, padding: '14px 18px 12px 0',
                              marginRight: 20, minHeight: 44, fontFamily: 'var(--mono)', fontSize: 11,
                              letterSpacing: '.14em', textTransform: 'uppercase',
                              color: tab === k ? 'var(--ink)' : 'var(--ink-3)',
                              borderBottom: tab === k ? '2px solid var(--accent)' : '2px solid transparent',
                              cursor: 'pointer', fontWeight: 500,
                            }}>{l}</button>
                  ))}
                </div>
                <div style={{ paddingTop: 20, fontSize: 14, lineHeight: 1.7, color: 'var(--ink-2)' }}>
                  {tab === 'about' && <p style={{ margin: 0 }}>{art.description}</p>}
                  {tab === 'history' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <p style={{ margin: 0 }}>Работа из серии «{series?.title}», {series?.years}. Написана в студии Mila Bezú в Москве.</p>
                      <p style={{ margin: 0 }}>Каждая работа в серии — самостоятельный сюжет, объединённый общим художественным языком.</p>
                    </div>
                  )}
                  {tab === 'delivery' && (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <li>• СДЭК · 5–7 дней · от 4 500 ₽</li>
                      <li>• Арт-логистика · 7–10 дней · от 9 000 ₽</li>
                      <li>• Самовывоз · Москва · по записи · бесплатно</li>
                      <li style={{ paddingTop: 8, color: 'var(--ink-3)' }}>
                        Каждая работа упаковывается в фирменную упаковку с защитой от&nbsp;влаги и&nbsp;деформации.
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {/* В интерьере — реальные кадры работы на стене */}
          {shots.length > 0 && (
            <section style={{ marginTop: 'clamp(48px, 6vw, 90px)' }}>
              <Eyebrow accent>В интерьере</Eyebrow>
              <h2 className="display" style={{ margin: '12px 0 0', fontSize: 'clamp(24px, 3vw, 44px)', fontWeight: 500, letterSpacing: '-.025em' }}>
                «{art.title}» на стене
              </h2>
              <p style={{ margin: '10px 0 0', maxWidth: 640, fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>
                {dims} в разных комнатах — чтобы масштаб и цвет читались до покупки, а не после.
              </p>
              <div className="mb-grid" style={{ marginTop: 26 }}>
                {shots.map((sh) => (
                  <figure key={sh.file} data-rev style={{ margin: 0 }}>
                    <img {...interiorSrc(sh.file)} width={1047} height={1280}
                         sizes="(max-width: 600px) 92vw, (max-width: 900px) 46vw, 30vw"
                         alt={`«${art.title}» — ${sh.caption}`}
                         loading="lazy" decoding="async"
                         style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--r-md)' }} />
                    <figcaption style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>{sh.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Что приедет в коробке */}
          <section style={{
            marginTop: 'clamp(48px, 6vw, 90px)',
            background: 'var(--bg-deep)', color: 'var(--bg-cream)',
            borderRadius: 'var(--r-xl)', padding: 'clamp(26px, 3.4vw, 52px)',
          }}>
            <div className="eyebrow" style={{ color: 'rgba(245,239,226,.7)' }}>Что приедет в коробке</div>
            <div className="mb-grid-wide" style={{ marginTop: 22 }}>
              {[
                ['Работа маслом', `${dims}, на галерейном подрамнике, покрыта лаком`],
                ['Сертификат подлинности', 'С номером работы, датой и подписью художника'],
                ['Крепёж', 'Готова к подвесу — ничего докупать не нужно'],
                ['Упаковка', 'Жёсткий короб, защита от влаги и деформации'],
              ].map(([t, d]) => (
                <div key={t} data-rev>
                  <h3 className="display" style={{ margin: 0, fontSize: 19, fontWeight: 500 }}>{t}</h3>
                  <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6, color: 'rgba(245,239,226,.78)' }}>{d}</p>
                </div>
              ))}
            </div>
          </section>

          <ProductReviews productId={art.id} />

          {related.length > 0 && (
            <section style={{ marginTop: 'clamp(48px, 6vw, 90px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 26, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <Eyebrow accent>Из той же серии</Eyebrow>
                  <h2 className="display" style={{ margin: '12px 0 0', fontSize: 'clamp(24px, 3vw, 44px)', fontWeight: 500, letterSpacing: '-.025em' }}>
                    «{series?.title}»
                  </h2>
                </div>
                <a href={routeToPath('catalog', { series: art.series })} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                  Вся серия →
                </a>
              </div>
              <div className="mb-grid">
                {related.map((a) => <ArtCard key={a.id} art={a} />)}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Липкая панель покупки (§3): цена + название/размер + действия */}
      <StickyBar
        text={<><b>{formatPrice(art.price)}</b> · {art.title} · {dims}</>}
        primary={{ label: onCommission ? 'Заказать портрет' : inStore ? 'Купить сейчас' : 'Спросить о работе',
                   href: onCommission ? routeToPath('commission', { ref: art.id }) : buyHref }}
        secondary={{ label: 'Вопрос', href: askHref }}
      />
    </>
  );
}

export { PaintingPage };
export default PaintingPage;
