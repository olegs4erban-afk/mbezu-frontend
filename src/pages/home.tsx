import React from 'react';
import { ArtCard } from '../common/atoms';
import { ABOUT, SERIES, artworkById, dimsLabel, featuredArtworks, formatPrice, askAboutHref } from '../common/data';
import { hasStorePage } from '../common/store-urls';
import { INTERIOR_BASE, interiorSrc } from '../common/interiors';
import { submitLead, leadRef, HONEYPOT_FIELD } from '../lib/tildaLead';
import { getUtmFields, track } from '../common/analytics';
import { HeroDoors, type HeroDoor } from '../common/hero-doors';
import {
  HOME_FAQ, INTERIOR_GUIDE_URL, freshCount, freshHighlights, freshStamp,
  inStockCount, plural, pluralOf, priceRange, workCount,
} from '../common/seo';
import { routeToPath } from '../common/routes';

// ─────────────────────────────────────────────────────────────
// home.tsx — главная MBezu, версия 2 (вариант B, 23.10.2026).
//
// Первый экран — «две двери»: купить готовую работу или заказать новую.
// У каждой двери своя цель Метрики (hero_stock_click / hero_commission_click).
// Ниже пять коротких секций: новое в мастерской → два пути по шагам →
// примерка на стене → художник → вопросы и заявка.
//
// Все числа считаются из data.ts (seo.ts), ничего не вписано руками.
// Сроков, которых нет в данных и на сайте («отправка за 3–5 дней»,
// «15 лет практики»), здесь нет сознательно: единый срок решает Мила.
// ─────────────────────────────────────────────────────────────

const CDN = 'https://cdn.mbezu.ru/assets';
const TG_HREF = ABOUT.contacts.telegramUrl;

/** «35 новых работ», «31 новая работа», «32 новые работы» */
const newWorks = (n: number) => `${n} ${pluralOf(n, ['новая', 'новые', 'новых'])} ${plural(n)}`;

// ── Первый экран: две двери ──────────────────────────────────
function heroDoors(): HeroDoor[] {
  const n = inStockCount();
  const from = formatPrice(priceRange().from);
  const room = interiorSrc('gostinaya');
  const pet = artworkById('PP-01');
  return [
    {
      id: 'stock',
      kicker: `В наличии ${n} ${plural(n)}, от ${from}`,
      title: 'Купить картину из\u00a0наличия',
      text: 'Оригиналы в единственном экземпляре, с подписью автора и сертификатом подлинности. Доставка по России со страховкой.',
      image: {
        src: room.src,
        srcSet: room.srcSet,
        width: 1600, height: 1000,
        alt: 'Картина маслом с морской волной над диваном в светлой гостиной',
        // картина висит в верхней трети кадра — её и держим
        position: '50% 22%',
        positionMobile: '50% 8%',
      },
      cta: { label: `Смотреть ${n} ${plural(n)}`, href: routeToPath('catalog'), goal: 'hero_stock_click' },
      secondary: { label: 'Картина в подарок', href: '/podarok' },
      tone: 'gold',
      priority: true,
    },
    {
      id: 'commission',
      kicker: 'На заказ — эскизы до предоплаты',
      title: 'Заказать картину под ваш интерьер',
      text: 'Размер, палитра и сюжет\u00a0— ваши. Мила предложит 2–3 эскиза, предоплата 50\u00a0%\u00a0— только после утверждения эскиза. Портрет питомца\u00a0— по фотографиям.',
      image: {
        // кадр головы из фото работы PP-01 (public/assets/hero/podenko*.webp)
        src: `${CDN}/hero/podenko.webp`,
        srcSet: `${CDN}/hero/podenko@480.webp 480w, ${CDN}/hero/podenko@640.webp 640w, ${CDN}/hero/podenko.webp 788w`,
        width: 788, height: 768,
        alt: pet
          ? `Портрет «${pet.title}» — масло и поталь на холсте, пример картины на заказ`
          : 'Портрет собаки маслом на золотом фоне — пример картины на заказ',
        position: '50% 78%',
        positionMobile: '50% 58%',
      },
      cta: { label: 'Заполнить бриф', href: routeToPath('commission'), goal: 'hero_commission_click' },
      secondary: { label: 'Портрет питомца по фото', href: routeToPath('catalog', { series: 'pets' }) },
      tone: 'ink',
    },
  ];
}

function HomeHero() {
  return (
    <HeroDoors
      title={<>Картины маслом Милы&nbsp;Бэзу&nbsp;—{' '}<span className="hd-h1-tail">в&nbsp;наличии и&nbsp;на&nbsp;заказ</span></>}
      doors={heroDoors()}
    />
  );
}

// ── Полоса фактов под первым экраном ─────────────────────────
function FactsStrip() {
  const n = inStockCount();
  const facts: Array<[string, string]> = [
    [`${n} ${plural(n)} в наличии`, `от ${formatPrice(priceRange().from)} до ${formatPrice(priceRange().to)}`],
    ['Сертификат подлинности', 'и подпись автора на каждой работе'],
    ['Доставка по России', 'со страховкой, в защитной упаковке'],
    ['Мастерская в Москве', 'показ работ по записи'],
  ];
  return (
    <section className="v2-facts" aria-label="Коротко о магазине">
      <ul className="v2-facts-in">
        {facts.map(([t, s]) => (
          <li key={t}><b>{t}</b><span>{s}</span></li>
        ))}
      </ul>
    </section>
  );
}

// ── Новое в мастерской ───────────────────────────────────────
// Только свободные работы: портреты питомцев в пополнении — примеры услуги
// (sold + commission), им место во второй двери, а не в витрине «купить».
const LANE_SIZE = 8;

function freshLane() {
  const free = (a: any) => a.status === 'available' && !a.commission;
  const fresh = freshHighlights(60).filter(free);
  const seen = new Set(fresh.map((a: any) => a.id));
  const fill = featuredArtworks().filter((a: any) => free(a) && !seen.has(a.id));
  return [...fresh, ...fill].slice(0, LANE_SIZE);
}

function FreshSection() {
  const items = freshLane();
  if (!items.length) return null;
  const total = freshCount();
  const n = inStockCount();
  const minMini = formatPrice(priceRange().from);
  return (
    <section className="v2-section" aria-labelledby="fresh-h2">
      <div className="v2-in">
        <div className="v2-head">
          <div>
            <p className="v2-label">Новое в мастерской</p>
            <h2 id="fresh-h2" className="v2-h2">{newWorks(total)} и&nbsp;две новые серии</h2>
            <p className="v2-lead">
              Пополнение каталога, {freshStamp()}: монохром и тондо, португальские улицы,
              первые миниатюры и портреты на сусальном золоте.
            </p>
          </div>
          <div className="v2-head-actions">
            <a className="btn btn-solid" href={routeToPath('catalog')}>Все {n} {plural(n)} в наличии</a>
            <a className="btn btn-ghost" href={`${routeToPath('catalog')}?new=1`}>Только новые</a>
          </div>
        </div>

        <div className="mb-grid">
          {items.map((a: any, i: number) => (
            <ArtCard key={a.id} art={a} index={i + 1} total={items.length} />
          ))}
        </div>

        <div className="v2-pills">
          <div className="v2-pill-row">
            <span className="v2-pill-label">Подобрать</span>
            <a className="mb-pill" href="/kartina-v-gostinuyu">В гостиную</a>
            <a className="mb-pill" href="/kartina-v-spalnyu">В спальню</a>
            <a className="mb-pill" href="/kartina-v-kabinet">В кабинет</a>
            <a className="mb-pill" href="/podarok">В подарок</a>
          </div>
          <div className="v2-pill-row">
            <span className="v2-pill-label">По сюжету</span>
            <a className="mb-pill" href="/catalog/more">Море и волны</a>
            <a className="mb-pill" href="/catalog/botanika">Цветы и растения</a>
            <a className="mb-pill" href="/catalog/gory">Горы</a>
            <a className="mb-pill" href={routeToPath('catalog', { series: 'mini' })}>Миниатюры от {minMini}</a>
            <a className="mb-pill" href={routeToPath('catalog', { series: 'tondi' })}>Круглые картины</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Два пути по шагам ────────────────────────────────────────
function PathsSection() {
  const stock = [
    'Выберите работу в каталоге: размер, цена и наличие указаны на карточке.',
    'Сомневаетесь в размере — пришлите фото стены в Telegram, покажем, как работа впишется.',
    'Оплата онлайн картой, доставка по России СДЭК или курьером со страховкой.',
    'В комплекте — подпись автора, сертификат подлинности, крепёж и открытка из мастерской.',
  ];
  const order = [
    'Бриф за 2 минуты: размер, палитра, настроение и комната, где будет висеть картина.',
    'Мила предложит 2–3 эскиза. Предоплата 50 % — только после того, как эскиз утверждён.',
    'Масло на холсте, подрамник. Остаток оплачивается, когда готовая работа согласована по фото.',
    'Срок зависит от размера — точную дату согласуем после эскиза. Доставка по России.',
  ];
  return (
    <section className="v2-section v2-soft" aria-labelledby="paths-h2">
      <div className="v2-in">
        <div className="v2-head v2-head-center">
          <div>
            <p className="v2-label">Два пути</p>
            <h2 id="paths-h2" className="v2-h2">Купить готовую или заказать новую</h2>
          </div>
        </div>
        <div className="v2-paths">
          <article className="v2-path">
            <p className="v2-path-kicker">В наличии</p>
            <h3 className="v2-h3">Как купить готовую работу</h3>
            <ol className="v2-steps">{stock.map((s) => <li key={s}>{s}</li>)}</ol>
            <a className="btn btn-solid" href={routeToPath('catalog')}
               onClick={() => track('paths_stock_click')}>Открыть каталог</a>
          </article>
          <article className="v2-path">
            <p className="v2-path-kicker">На заказ</p>
            <h3 className="v2-h3">Как заказать картину</h3>
            <ol className="v2-steps">{order.map((s) => <li key={s}>{s}</li>)}</ol>
            <a className="btn btn-ink" href={routeToPath('commission')}
               onClick={() => track('paths_commission_click')}>Заполнить бриф</a>
          </article>
        </div>
      </div>
    </section>
  );
}

// ── Примерка на стене ────────────────────────────────────────
function WallSection() {
  const main = artworkById('CT-01');
  const mainImg = interiorSrc('ct-01-kabinet');
  const href = (id: string) => {
    const art = artworkById(id);
    if (!art) return routeToPath('catalog');
    return hasStorePage(art.id) ? routeToPath('painting', { id: art.id }) : askAboutHref(art);
  };
  const thumbs: Array<{ file: string; art?: string; alt: string }> = [
    { file: 'td-02-stena', art: 'TD-02', alt: 'Круглая картина над деревянной панелью' },
    { file: 'ct-01-prihozhaya', art: 'CT-01', alt: 'Картина на тёмно-синей стене в прихожей' },
    { file: 'stena-lestnica', alt: 'Три работы разного размера на стене лестничного пролёта' },
  ];
  return (
    <section className="v2-section" aria-labelledby="wall-h2">
      <div className="v2-in v2-wall">
        <figure className="v2-wall-main">
          <a href={href('CT-01')}>
            <img {...mainImg} width={1047} height={1280}
                 sizes="(max-width: 900px) 92vw, 44vw"
                 alt={main ? `Картина «${main.title}», ${dimsLabel(main)}, в кабинете над рабочим столом` : 'Картина в кабинете над рабочим столом'}
                 loading="lazy" decoding="async" />
          </a>
          {main && <figcaption>«{main.title}», {dimsLabel(main)} — кабинет со светлой стеной</figcaption>}
        </figure>
        <div className="v2-wall-text">
          <p className="v2-label">Примерка на стене</p>
          <h2 id="wall-h2" className="v2-h2">Пришлите фото стены — покажем картину у&nbsp;вас</h2>
          <p className="v2-lead">
            Главный вопрос перед покупкой — впишется ли работа. Пришлите фото стены в&nbsp;Telegram:
            подберём размер, покажем две-три работы в&nbsp;вашем интерьере и&nbsp;подскажем высоту развески.
          </p>
          <p className="v2-note">
            Ориентир простой: ширина картины — около двух третей ширины мебели под ней,
            центр работы — на высоте около 150&nbsp;см от пола.
          </p>
          <div className="v2-actions">
            <a className="btn btn-solid" href={TG_HREF} target="_blank" rel="noopener"
               onClick={() => track('tg_click', { place: 'wall' })}>Прислать фото в Telegram</a>
            <a className="btn btn-ghost" href={INTERIOR_GUIDE_URL}>Как выбрать размер</a>
          </div>
          <ul className="v2-wall-thumbs">
            {thumbs.map((t) => {
              const s = interiorSrc(t.file);
              const img = (
                <img src={`${INTERIOR_BASE}/${t.file}@480.webp`} srcSet={s.srcSet}
                     sizes="(max-width: 600px) 30vw, 12vw" width={393} height={480}
                     alt={t.alt} loading="lazy" decoding="async" />
              );
              return <li key={t.file}>{t.art ? <a href={href(t.art)}>{img}</a> : img}</li>;
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── Художник ─────────────────────────────────────────────────
function ArtistSection() {
  return (
    <section className="v2-section v2-soft" aria-labelledby="artist-h2">
      <div className="v2-in v2-artist">
        <div className="v2-artist-text">
          <p className="v2-label">Художник</p>
          <h2 id="artist-h2" className="v2-h2">Мила Бэзу пишет маслом море, горы, города и&nbsp;ботанику</h2>
          <p className="v2-lead">
            Образование в&nbsp;области дизайна интерьера определяет подход: каждая работа пишется
            с&nbsp;мыслью о&nbsp;том, как она будет жить в&nbsp;комнате — рядом с&nbsp;каким светом,
            мебелью и&nbsp;стенами. Серии рождаются из&nbsp;путешествий, по&nbsp;живым впечатлениям
            от&nbsp;света и&nbsp;архитектуры места.
          </p>
          <ul className="v2-ticks">
            <li>{SERIES.length} {pluralOf(SERIES.length, ['серия', 'серии', 'серий'])} и {workCount()} {plural(workCount())} в каталоге</li>
            <li>Каждая работа — в единственном экземпляре, с подписью и сертификатом</li>
            <li>Мастерская в Москве — показ работ по записи</li>
          </ul>
          <a className="btn btn-ghost" href={routeToPath('about')}>О художнике</a>
        </div>
        <div className="v2-artist-photos">
          <img src={`${CDN}/about-author@800.webp`} width={800} height={1028}
               srcSet={`${CDN}/about-author@480.webp 480w, ${CDN}/about-author@800.webp 800w, ${CDN}/about-author.webp 1100w`}
               sizes="(max-width: 900px) 50vw, 26vw"
               alt="Мила Бэзу, художник" loading="lazy" decoding="async" />
          <img src={`${CDN}/about-studio-6@720.webp`} width={576} height={720}
               sizes="(max-width: 900px) 46vw, 24vw"
               alt="Стена мастерской: работы разных серий рядом друг с другом" loading="lazy" decoding="async" />
        </div>
      </div>
    </section>
  );
}

// ── Форма заявки ─────────────────────────────────────────────
// Доставка — через скрытые нативные формы Tilda (submitLead): ПД уходят во
// «Входящие» и на почту, в Telegram — только обезличенное уведомление.
// «Заявка отправлена» показывается ТОЛЬКО при успехе основной формы.
function LeadForm() {
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
    if (!valid || state === 'sending') return;
    setState('sending');
    const contact = lead.contact.trim();
    // один номер на попытку: повтор после ошибки не плодит две карточки во «Входящих»
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
      ...getUtmFields(),
    });
    if (res.ok) { setRef(res.ref); setState('ok'); } else { setState('err'); }
  };

  if (state === 'ok') {
    return (
      <div className="v2-form-ok" role="status">
        <p className="v2-h3">Заявка отправлена — Мила ответит лично</p>
        {ref && <p>Номер заявки: <b>{ref}</b> — назовите его, если будете писать сами.</p>}
        <p>Хотите быстрее — <a href={TG_HREF} target="_blank" rel="noopener"
             onClick={() => track('tg_click', { place: 'lead-ok' })}>напишите в Telegram</a>.</p>
      </div>
    );
  }

  return (
    <form noValidate className="v2-form" aria-label="Заявка на картину"
          onSubmit={(e) => { e.preventDefault(); submit(); }}>
      {/* ловушка для ботов: человек её не видит и не попадает в неё табом */}
      <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true"
             value={lead.trap} onChange={(e) => upd('trap', e.target.value)} className="v2-trap" />
      <label className="v2-field">
        <span>Имя</span>
        <input className="field" name="name" autoComplete="name" aria-required="true"
               aria-invalid={touched && !nameOk ? true : undefined}
               value={lead.name} onChange={(e) => upd('name', e.target.value)} />
      </label>
      {touched && !nameOk && <span className="v2-hint">Укажите имя</span>}
      <label className="v2-field">
        <span>Телефон, Telegram или почта</span>
        <input className="field" name="contact" autoComplete="tel" aria-required="true"
               aria-invalid={touched && !contactOk ? true : undefined}
               value={lead.contact} onChange={(e) => upd('contact', e.target.value)} />
      </label>
      {touched && !contactOk && <span className="v2-hint">Укажите, как с вами связаться</span>}
      <label className="v2-field">
        <span>О картине <i>— необязательно</i></span>
        <textarea className="field" rows={3} value={lead.about}
                  placeholder="Комната, размер, настроение"
                  onChange={(e) => upd('about', e.target.value)} />
      </label>

      <label className="v2-consent">
        <input type="checkbox" checked={lead.consent} aria-required="true"
               aria-invalid={touched && !lead.consent ? true : undefined}
               onChange={(e) => upd('consent', e.target.checked)} />
        <span>
          Согласен(на) на обработку персональных данных (152-ФЗ) —{' '}
          <a href={routeToPath('legal', { section: 'privacy' })}>политика обработки ПД</a>
        </span>
      </label>
      {touched && !lead.consent && <span className="v2-hint">Для отправки нужно согласие на обработку персональных данных</span>}

      {state === 'err' && (
        <div className="v2-form-err" role="alert">
          <b>Не удалось отправить заявку.</b> Напишите напрямую — ответим так же быстро:{' '}
          <a href={TG_HREF} target="_blank" rel="noopener">Telegram</a>{' · '}
          <a href={`mailto:${ABOUT.contacts.email}`}>{ABOUT.contacts.email}</a>{' · '}
          <a href={`tel:${ABOUT.contacts.phone.replace(/\s/g, '')}`}>{ABOUT.contacts.phone}</a>
        </div>
      )}

      <button className="btn btn-solid" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Отправляем…' : 'Оставить заявку'}
      </button>
    </form>
  );
}

// ── Вопросы и заявка ─────────────────────────────────────────
// FAQPage-разметка главной (homeFaqLd) описывает ровно этот видимый список.
function FaqLeadSection() {
  return (
    <section className="v2-section" aria-labelledby="faq-h2">
      <div className="v2-in v2-faq-lead">
        <div className="v2-faq">
          <p className="v2-label">Вопросы и ответы</p>
          <h2 id="faq-h2" className="v2-h2 v2-h2-sm">Как выбрать и заказать картину</h2>
          <div className="v2-faq-list">
            {HOME_FAQ.map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary><span>{q}</span><i aria-hidden="true" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
        <aside id="zayavka" className="v2-lead-card" aria-labelledby="lead-h3">
          <h3 id="lead-h3" className="v2-h3">Не нашли ответ — спросите Милу</h3>
          <p className="v2-lead-card-text">
            Опишите задачу: комната, размер, настроение. Мила ответит лично в&nbsp;течение дня.
          </p>
          <LeadForm />
          <p className="v2-lead-card-alt">
            Или сразу в&nbsp;<a href={TG_HREF} target="_blank" rel="noopener"
              onClick={() => track('tg_click', { place: 'lead-card' })}>Telegram</a>
          </p>
        </aside>
      </div>
    </section>
  );
}

// ── Композиция ───────────────────────────────────────────────
function HomePage(_props: { go?: unknown }) {
  return (
    <>
      <HomeHero />
      <FactsStrip />
      <FreshSection />
      <PathsSection />
      <WallSection />
      <ArtistSection />
      <FaqLeadSection />
    </>
  );
}

export { HomePage };
export default HomePage;
