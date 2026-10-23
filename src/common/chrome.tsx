import React from 'react';
import { ABOUT } from './data';
// Sprint 15 (аудит): пункты меню, таб-бар и подвал — настоящие <a href>,
// а не «#» с обработчиком. go() и так делал обычный переход по адресу.
import { routeToPath } from './routes';
import type { RouteName } from './routes';
import { track } from './analytics';

// ─────────────────────────────────────────────────────────────
// chrome.tsx — каркас сайта: шапка, нижняя навигация, подвал.
//
// Версия 2 (23.10.2026, вариант B):
//   · одна шапка на все ширины — раскладку переключает CSS, а не JS.
//     Раньше useIsMobile() подменял десктопную шапку мобильной после
//     монтирования: пререндер отдавал десктопную, и на телефоне шапка
//     прыгала (CLS) — плюс тёмная полоса доверия над ней;
//   · подвал — только по-русски, без домашнего адреса ИП (он есть
//     в оферте и реквизитах) и без ссылки на Instagram;
//   · бегущая строка и липкая тёмная панель с главной убраны.
// ─────────────────────────────────────────────────────────────

/** Аудит r2: бейдж корзины считал старую in-memory корзину — теперь читает нативную Tilda (localStorage.tcart). */
function useTildaCartCount(fallback: number): number {
  const read = () => { try { const t = JSON.parse(localStorage.getItem('tcart') || '{}'); return Array.isArray(t.products) ? t.products.length : 0; } catch { return 0; } };
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const upd = () => setN(read());
    upd(); window.addEventListener('storage', upd); const t = setInterval(upd, 1500);
    return () => { window.removeEventListener('storage', upd); clearInterval(t); };
  }, []);
  return Math.max(n, fallback);
}

// Sprint 15 (аудит): страница /cart пустая — на ней стоят только блоки корзины
// Tilda (706). Поэтому «Корзина» открывает РАБОЧУЮ нативную корзину Tilda,
// а href="/cart" остаётся как запасной путь и для робота.
function openNativeCart(e: React.MouseEvent) {
  track('cart_open'); // цель Метрики — интерес к покупке (и по href, и нативно)
  const open = (window as any).tcart__openCart;
  if (typeof open !== 'function') return;      // нет скрипта — уходим по href
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // новая вкладка
  e.preventDefault();
  open();
}

// ── Логотип MBezu — слово в Inter Tight italic ────────────────
function LogoMB({ size, href, onClick }: { size?: number; href?: string; onClick?: () => void }) {
  const style: React.CSSProperties | undefined = size ? { fontSize: size } : undefined;
  if (href) return <a href={href} className="mb-logo" aria-label="MBezu — на главную" style={style}>MBezu</a>;
  return <span className="mb-logo" onClick={onClick} style={style}>MBezu</span>;
}

// ── Контакты (одни на всю шапку и подвал) ─────────────────────
const PHONE_HREF = `tel:${ABOUT.contacts.phone.replace(/[^\d+]/g, '')}`;
const TG_HREF = ABOUT.contacts.telegramUrl;
/** +7 916 764 10 39 → +7 916 764-10-39 (так номер читают и набирают) */
const PHONE_LABEL = ABOUT.contacts.phone.replace(/(\d{3}) (\d{2}) (\d{2})$/, '$1-$2-$3');

// Пункты меню — один набор на все страницы.
const NAV: Array<{ id: string; label: string; href: string }> = [
  { id: 'catalog',    label: 'Каталог',   href: routeToPath('catalog') },
  { id: 'commission', label: 'На заказ',  href: routeToPath('commission') },
  { id: 'podarok',    label: 'В подарок', href: '/podarok' },
  { id: 'journal',    label: 'Журнал',    href: '/journal' },
  { id: 'about',      label: 'Художник',  href: routeToPath('about') },
];

const ICON = {
  phone: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2.1z" />
    </svg>
  ),
  cart: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 7h12l1.2 13H4.8L6 7z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  ),
  tg: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.8.8l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1 .5l.4-5 9-8.1c.4-.4-.1-.6-.6-.2L6.6 12.1 1.8 10.6c-1-.3-1-1 .2-1.5l18.5-7.1c.9-.3 1.6.2 1.4 2.3z" />
    </svg>
  ),
};

function CartBadge({ n }: { n: number }) {
  if (!n) return null;
  return <span className="mb-cart-badge">{n}</span>;
}

// ── Шапка — одна разметка на все ширины ───────────────────────
function TopBar({ route, cartCount: cartProp }: { route?: string; go?: unknown; cartCount?: number }) {
  const cartCount = useTildaCartCount(cartProp || 0);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onResize = () => { if (window.innerWidth > 900) setOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [open]);

  return (
    <header className="mb-header" data-mb-header="v2">
      <div className="mb-header-in">
        <LogoMB href={routeToPath('home')} />
        <nav className="mb-nav" aria-label="Основная навигация">
          {NAV.map((n) => (
            <a key={n.id} href={n.href} aria-current={route === n.id ? 'page' : undefined}>{n.label}</a>
          ))}
        </nav>
        <div className="mb-header-actions">
          <a href={PHONE_HREF} className="mb-phone" onClick={() => track('phone_click')}>{PHONE_LABEL}</a>
          <a href={TG_HREF} target="_blank" rel="noopener" className="mb-pill-btn mb-tg"
             onClick={() => track('tg_click', { place: 'header' })}>Telegram</a>
          <a href={PHONE_HREF} className="mb-icon-btn mb-phone-icon" aria-label={`Позвонить: ${PHONE_LABEL}`}
             onClick={() => track('phone_click')}>{ICON.phone}</a>
          <a href={routeToPath('cart')} onClick={openNativeCart} className="mb-cart" aria-label={cartCount ? `Корзина: ${cartCount}` : 'Корзина'}>
            <span className="mb-cart-icon">{ICON.cart}<CartBadge n={cartCount} /></span>
            <span className="mb-cart-label">Корзина</span>
          </a>
          <button type="button" className="mb-icon-btn mb-menu-btn"
                  aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
                  aria-expanded={open} aria-controls="mb-menu"
                  onClick={() => setOpen((v) => !v)}>
            <span className={'mb-burger' + (open ? ' is-open' : '')} aria-hidden="true"><i /><i /><i /></span>
          </button>
        </div>
      </div>

      <nav id="mb-menu" className="mb-menu" aria-label="Меню" hidden={!open}>
        {NAV.map((n) => (
          <a key={n.id} href={n.href} aria-current={route === n.id ? 'page' : undefined}>{n.label}</a>
        ))}
        <div className="mb-menu-contacts">
          <a href={PHONE_HREF} className="btn btn-ghost" onClick={() => track('phone_click')}>{PHONE_LABEL}</a>
          <a href={TG_HREF} target="_blank" rel="noopener" className="btn btn-ghost"
             onClick={() => track('tg_click', { place: 'menu' })}>{ICON.tg} Telegram</a>
        </div>
      </nav>
      <div className="mb-progress-track" aria-hidden="true"><span id="mb-progress" /></div>
    </header>
  );
}

// ── BottomTabBar — нижняя навигация (только телефон) ──────────
const TAB_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  catalog: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  commission: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
    </svg>
  ),
  cart: ICON.cart,
};

function BottomTabBar({ route, cartCount: cartProp }: { route?: string; go?: unknown; cartCount?: number }) {
  const cartCount = useTildaCartCount(cartProp || 0);
  const tabs = [
    { id: 'home',       label: 'Главная' },
    { id: 'catalog',    label: 'Каталог' },
    { id: 'commission', label: 'На заказ' },
    { id: 'cart',       label: 'Корзина' },
  ];
  return (
    <nav className="tabbar" aria-label="Нижняя навигация">
      {tabs.map((t) => {
        const active = route === t.id;
        return (
          <a key={t.id} href={routeToPath(t.id as RouteName)}
             onClick={t.id === 'cart' ? openNativeCart : undefined}
             className={'tabbar-item' + (active ? ' is-active' : '')}
             aria-current={active ? 'page' : undefined}>
            <span className="tabbar-icon">
              {TAB_ICONS[t.id]}
              {t.id === 'cart' && cartCount > 0 && <span className="tabbar-badge">{cartCount}</span>}
            </span>
            <span className="tabbar-label">{t.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

// ── StickyBar — липкая нижняя панель ──────────────────────────
// На главной и в каталоге больше не используется: на телефоне она стояла
// над таб-баром и съедала экран. Осталась для страницы работы (/painting),
// где панель — это цена и «Купить сейчас».
const STICKY_CLOSED_KEY = 'mb-sticky-closed';

function StickyBar({ text, primary, secondary }: {
  text?: React.ReactNode;
  primary?: { label: string; href?: string; onClick?: (e: React.MouseEvent) => void };
  secondary?: { label: string; href: string } | null;
}) {
  const [closed, setClosed] = React.useState(false);
  React.useEffect(() => {
    try { if (sessionStorage.getItem(STICKY_CLOSED_KEY) === '1') setClosed(true); } catch { /* private mode */ }
  }, []);
  const close = () => {
    setClosed(true);
    try { sessionStorage.setItem(STICKY_CLOSED_KEY, '1'); } catch { /* private mode */ }
  };

  if (closed) return null;

  const p = primary || { label: 'Заказать картину', href: routeToPath('commission') };
  const s = secondary === undefined ? { label: 'Telegram', href: ABOUT.contacts.telegramUrl } : secondary;
  return (
    <div className="mb-sticky">
      <div className="mb-sticky-in">
        {text && <div className="mb-sticky-text">{text}</div>}
        <div className="mb-sticky-actions">
          <a href={p.href || '#'} onClick={p.onClick} className="btn btn-solid mb-sticky-cta">{p.label}</a>
          {s && (
            <a href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noopener"
               className="btn mb-sticky-alt">{s.label}</a>
          )}
        </div>
        <button type="button" className="mb-sticky-close" onClick={close} aria-label="Скрыть панель">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Подвал ────────────────────────────────────────────────────
const FOOTER_COLS: Array<{ title: string; links: Array<[string, string]> }> = [
  {
    title: 'Магазин',
    links: [
      [routeToPath('catalog'), 'Все работы'],
      ['/catalog/more', 'Море и волны'],
      ['/catalog/botanika', 'Цветы и растения'],
      ['/catalog/gory', 'Горы'],
      [routeToPath('catalog', { series: 'mini' }), 'Миниатюры'],
      [routeToPath('catalog', { series: 'tondi' }), 'Круглые картины'],
    ],
  },
  {
    title: 'Подобрать',
    links: [
      ['/kartina-v-gostinuyu', 'Картина в гостиную'],
      ['/kartina-v-spalnyu', 'Картина в спальню'],
      ['/kartina-v-kabinet', 'Картина в кабинет'],
      ['/podarok', 'Картина в подарок'],
      [routeToPath('commission'), 'Картина на заказ'],
    ],
  },
  {
    title: 'Мастерская',
    links: [
      [routeToPath('about'), 'О художнике'],
      ['/journal', 'Журнал'],
      [routeToPath('legal', { section: 'delivery' }), 'Доставка и оплата'],
      [routeToPath('legal', { section: 'returns' }), 'Возврат и обмен'],
    ],
  },
];

function Footer(_props: { go?: unknown }) {
  return (
    <footer className="mb-footer">
      <div className="mb-footer-in">
        <div className="mb-footer-grid">
          <div className="mb-footer-brand">
            <LogoMB href={routeToPath('home')} />
            <p>
              Картины маслом Милы Бэзу: оригиналы в&nbsp;наличии и&nbsp;на&nbsp;заказ.
              Мастерская в&nbsp;Москве, показ по&nbsp;записи, доставка по&nbsp;России.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="mb-footer-col">
              <p className="mb-footer-title">{col.title}</p>
              <ul>
                {col.links.map(([href, label]) => (
                  <li key={href + label}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mb-footer-col">
            <p className="mb-footer-title">Связь</p>
            <ul>
              <li><a href={PHONE_HREF} onClick={() => track('phone_click')}>{PHONE_LABEL}</a></li>
              <li><a href={TG_HREF} target="_blank" rel="noopener" onClick={() => track('tg_click', { place: 'footer' })}>Telegram</a></li>
              <li><a href={`https://vk.com/${ABOUT.contacts.vk}`} target="_blank" rel="noopener">ВКонтакте</a></li>
              <li><a href={`mailto:${ABOUT.contacts.email}`}>{ABOUT.contacts.email}</a></li>
            </ul>
          </div>
        </div>

        <div className="mb-footer-legal">
          {/* Сведения о продавце для дистанционной продажи. Полный адрес ИП —
              в оферте и реквизитах: в подвале каждой страницы он не нужен. */}
          <p>
            {ABOUT.legal.name_short}, ИНН&nbsp;{ABOUT.legal.inn}, ОГРНИП&nbsp;{ABOUT.legal.ogrnip}
          </p>
          <ul>
            <li><a href={routeToPath('legal', { section: 'offer' })}>Оферта</a></li>
            <li><a href={routeToPath('legal', { section: 'privacy' })}>Политика обработки персональных данных</a></li>
            <li><a href={routeToPath('legal', { section: 'requisites' })}>Реквизиты</a></li>
          </ul>
          <p className="mb-footer-copy">© 2014–2026 MBezu · Мила Бэзу</p>
        </div>
      </div>
    </footer>
  );
}

export { TopBar, Footer, LogoMB, StickyBar, BottomTabBar };
