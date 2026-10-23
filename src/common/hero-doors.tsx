import React from 'react';
import { track } from './analytics';

// ─────────────────────────────────────────────────────────────
// hero-doors.tsx — первый экран главной: «две двери».
//
// Основа — компонент 21st.dev «Split Hero With Image Cards» (hero-08,
// felipemenezes098, получен через коннектор get_component 19078).
// Из него взята схема: общий заголовок над двумя карточками-изображениями,
// у каждой — заголовок, подпись и кнопка.
//
// Что переделано под MBezu (AI-генерация в аккаунте 21st.dev выключена,
// компонент «как есть» не ставим):
//   · без motion/react, react-wrap-balancer, shadcn, Tailwind и аватаров
//     «социального доказательства» — их нечем честно наполнить;
//     перенос строк — CSS text-wrap: balance;
//   · карточки стали полноэкранными «дверями»: на десктопе две половины
//     во всю высоту экрана, на телефоне — друг над другом, обе кнопки видны
//     без прокрутки;
//   · текст не лежит на фото: снизу бумажная «музейная этикетка» на токенах
//     Maison (bg-card, ink, accent), как подпись под картиной на стене —
//     сама работа на фото ничем не закрыта;
//   · вся дверь кликабельна через растянутую ссылку главной кнопки,
//     вторичная ссылка лежит над ней (вложенных <a> нет);
//   · у каждой двери своя цель Метрики;
//   · LCP-картинка грузится сразу (eager + fetchpriority=high), без
//     анимации появления и без opacity — иначе браузер не считает её LCP;
//   · кадрирование задаётся отдельно для десктопа и телефона (--pos / --pos-m).
// ─────────────────────────────────────────────────────────────

export interface HeroDoorSource {
  media: string;
  srcSet: string;
  sizes?: string;
}

export interface HeroDoorImage {
  src: string;
  srcSet?: string;
  sizes?: string;
  width: number;
  height: number;
  alt: string;
  /** другая картинка для узких экранов (арт-дирекшн через <picture>) */
  sources?: HeroDoorSource[];
  /** object-position на десктопе: что держать в кадре при обрезке */
  position?: string;
  /** object-position на телефоне */
  positionMobile?: string;
}

export interface HeroDoorLink {
  label: string;
  href: string;
  /** идентификатор цели Метрики */
  goal?: string;
}

export interface HeroDoor {
  id: string;
  /** строка над заголовком этикетки — факт, а не слоган */
  kicker: string;
  title: string;
  text: string;
  image: HeroDoorImage;
  cta: HeroDoorLink;
  secondary?: HeroDoorLink;
  /** цвет главной кнопки: золото (в наличии) или тёмная (на заказ) */
  tone: 'gold' | 'ink';
  /** картинка — кандидат в LCP */
  priority?: boolean;
}

function DoorImage({ image, priority }: { image: HeroDoorImage; priority?: boolean }) {
  const style = {
    ...(image.position ? { '--pos': image.position } : {}),
    ...(image.positionMobile ? { '--pos-m': image.positionMobile } : {}),
  } as React.CSSProperties;
  const img = (
    <img
      className="hd-img"
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.sizes || '(max-width: 900px) 100vw, 50vw'}
      width={image.width}
      height={image.height}
      alt={image.alt}
      // обе двери в первом экране: lazy здесь только задержал бы картинку
      loading="eager"
      {...(priority ? { fetchpriority: 'high' } : { decoding: 'async' as const })}
      style={style}
    />
  );
  if (!image.sources?.length) return img;
  return (
    <picture>
      {image.sources.map((s) => (
        <source key={s.media} media={s.media} srcSet={s.srcSet} sizes={s.sizes || '100vw'} />
      ))}
      {img}
    </picture>
  );
}

function Door({ door }: { door: HeroDoor }) {
  return (
    <div className={`hd-door hd-door-${door.tone}`}>
      <div className="hd-media">
        <DoorImage image={door.image} priority={door.priority} />
      </div>
      <div className="hd-label">
        <p className="hd-kicker">{door.kicker}</p>
        <h2 className="hd-h2">{door.title}</h2>
        <p className="hd-text">{door.text}</p>
        <div className="hd-actions">
          <a className="hd-cta" href={door.cta.href}
             onClick={() => { if (door.cta.goal) track(door.cta.goal); }}>
            {door.cta.label}
          </a>
          {door.secondary && (
            <a className="hd-secondary" href={door.secondary.href}
               onClick={() => { if (door.secondary?.goal) track(door.secondary.goal); }}>
              {door.secondary.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function HeroDoors({ title, doors, children }: {
  title: React.ReactNode;
  doors: HeroDoor[];
  /** то, что идёт сразу под дверями внутри первого экрана */
  children?: React.ReactNode;
}) {
  return (
    <section className="hd" aria-labelledby="hd-h1">
      <div className="hd-head">
        <h1 id="hd-h1" className="hd-h1">{title}</h1>
      </div>
      <div className="hd-doors">
        {doors.map((d) => <Door key={d.id} door={d} />)}
      </div>
      {children}
    </section>
  );
}

export default HeroDoors;
