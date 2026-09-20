import React from 'react';
import { ABOUT } from './data';
// Sprint 15 (аудит): пункты меню, таб-бар и подвал — настоящие <a href>,
// а не «#» с обработчиком. go() и так делал обычный переход по адресу.
import { routeToPath } from './routes';
import type { RouteName } from './routes';
import { track } from './analytics';

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
// Tilda (706) и ни одного контейнера витрины, а создать блок программно нельзя
// (эндпоинт создания записи 404 на любую команду). Поэтому «Корзина» открывает
// РАБОЧУЮ нативную корзину Tilda, а href="/cart" остаётся как запасной путь
// и для робота. Функция появляется вместе с tilda-cart-1.1.min.js.
function openNativeCart(e: React.MouseEvent) {
  track('cart_open'); // Sprint 15: цель Метрики — интерес к покупке (и по href, и нативно)
  const open = (window as any).tcart__openCart;
  if (typeof open !== 'function') return;      // нет скрипта — уходим по href
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // новая вкладка
  e.preventDefault();
  open();
}

// ─────────────────────────────────────────────────────────────
// chrome.jsx — каркас сайта: TopBar / Footer / Marquee / ZeroBanner.
// ─────────────────────────────────────────────────────────────

// ── Логотип MBezu — wordmark в Inter Tight (Sprint 10: без подписи Maison · Moscou) ──
// 03.09 a11y: был <div onClick> — логотип не попадал в Tab и не имел роли/имени.
// С href — настоящая ссылка на главную (go('home') и так делал обычный переход по адресу).
function LogoMB({ size = 32, href, onClick }: { size?: number; href?: string; onClick?: () => void }) {
  const inner = (
    <div className="display" style={{
      fontSize: size, fontWeight: 500, letterSpacing: '-.02em',
      color: 'var(--ink)', fontStyle: 'italic',
    }}>MBezu</div>
  );
  const style: React.CSSProperties = {
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
    lineHeight: 1, cursor: (href || onClick) ? 'pointer' : 'default',
    textDecoration: 'none', color: 'inherit',
  };
  if (href) return <a href={href} aria-label="MBezu — на главную" style={style}>{inner}</a>;
  return <div onClick={onClick} style={style}>{inner}</div>;
}

// ── Контакты (одни на всю шапку/панель) ───────────────────────
const PHONE_HREF = `tel:${ABOUT.contacts.phone.replace(/[^\d+]/g, '')}`;
const TG_HREF = ABOUT.contacts.telegramUrl;

// Пункты меню — один набор на все страницы (HANDOFF §3: одна шапка,
// полный набор пунктов бывшего меню Tilda).
const NAV: Array<{ id: string; label: string; href: string }> = [
  { id: 'catalog',    label: 'Каталог',   href: routeToPath('catalog') },
  { id: 'commission', label: 'На заказ',  href: routeToPath('commission') },
  { id: 'podarok',    label: 'В подарок', href: '/podarok' },
  { id: 'journal',    label: 'Журнал',    href: '/journal' },
  { id: 'about',      label: 'Художник',  href: routeToPath('about') },
];

/** <900px — мобильная раскладка. Считаем в JS, а не медиазапросом:
 *  в DOM не должно быть десктопной шапки (её ширина ломала сетку, §13.6). */
function useIsMobile(): boolean {
  const [m, setM] = React.useState(() => (typeof window === 'undefined' ? false : window.innerWidth < 900));
  React.useEffect(() => {
    const upd = () => setM(window.innerWidth < 900);
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);
  return m;
}

const ICON = {
  phone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2.1z" />
    </svg>
  ),
  cart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  return (
    <span style={{
      position: 'absolute', top: -5, right: -8,
      minWidth: 17, height: 17, padding: '0 4px',
      background: 'var(--accent)', color: 'var(--bg)',
      borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700,
      display: 'inline-grid', placeItems: 'center', lineHeight: 1,
    }}>{n}</span>
  );
}

// ── Тёмная полоса доверия над шапкой (только десктоп, §13.17) ──
function TrustStrip() {
  return (
    <div className="mb-trust" style={{
      background: 'var(--bg-deep)', color: 'rgba(245,239,226,.82)',
      padding: '9px clamp(16px,3.5vw,48px)',
    }}>
      <div className="mono" style={{
        maxWidth: 'var(--max)', margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', gap: 20,
        fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase',
      }}>
        <span>Оригиналы маслом · сертификат подлинности</span>
        <span>Доставка по РФ · Москва, показ по записи</span>
      </div>
    </div>
  );
}

// ── TopBar — одна шапка на все страницы ───────────────────────
function TopBar({ route, cartCount: cartProp, primaryCta }: {
  route?: string; go?: unknown; cartCount?: number;
  primaryCta?: { label: string; href: string };
}) {
  const cartCount = useTildaCartCount(cartProp || 0);
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const cta = primaryCta || { label: 'Заказать картину', href: routeToPath('commission') };

  React.useEffect(() => { if (!isMobile) setOpen(false); }, [isMobile]);

  const barStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 60,
    background: 'rgba(237, 229, 214, .94)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    borderBottom: '1px solid var(--rule-soft)',
  };

  const iconBtn: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 'var(--r-pill)',
    display: 'inline-grid', placeItems: 'center', position: 'relative',
    color: 'var(--ink)', textDecoration: 'none',
    background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
  };

  if (isMobile) {
    return (
      <header style={barStyle} data-mb-header="mobile">
        <div style={{
          height: 61, padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <LogoMB size={23} href={routeToPath('home')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <a href={PHONE_HREF} aria-label="Позвонить" style={iconBtn}
               onClick={() => track('phone_click')}>{ICON.phone}</a>
            <a href={routeToPath('cart')} onClick={openNativeCart} aria-label="Корзина" style={iconBtn}>
              {ICON.cart}<CartBadge n={cartCount} />
            </a>
            <button type="button" aria-label={open ? 'Закрыть меню' : 'Меню'}
                    aria-expanded={open} onClick={() => setOpen((v) => !v)}
                    style={iconBtn}>
              <span style={{ display: 'block', width: 21, height: 15, position: 'relative' }} aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    position: 'absolute', left: 0, right: 0, height: 1.6,
                    background: 'var(--ink)', borderRadius: 2,
                    top: i === 0 ? 0 : i === 1 ? 6.8 : 13.6,
                    transition: 'transform .3s cubic-bezier(.16,1,.3,1), opacity .3s',
                    transform: open
                      ? (i === 0 ? 'translateY(6.8px) rotate(45deg)' : i === 2 ? 'translateY(-6.8px) rotate(-45deg)' : 'none')
                      : 'none',
                    opacity: open && i === 1 ? 0 : 1,
                  }} />
                ))}
              </span>
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Основная навигация" style={{
            borderTop: '1px solid var(--rule-soft)',
            background: 'var(--bg)',
            padding: '4px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
            maxHeight: 'calc(100vh - 61px)', overflowY: 'auto',
          }}>
            {NAV.map((n) => (
              <a key={n.id} href={n.href}
                 aria-current={route === n.id ? 'page' : undefined}
                 style={{
                   display: 'flex', alignItems: 'center', minHeight: 52,
                   borderBottom: '1px solid var(--rule-soft)',
                   textDecoration: 'none', fontSize: 16, fontWeight: 500,
                   color: route === n.id ? 'var(--accent)' : 'var(--ink)',
                 }}>{n.label}</a>
            ))}
            <a href={cta.href} className="btn btn-solid" style={{
              width: '100%', justifyContent: 'center', marginTop: 16,
              textDecoration: 'none', minHeight: 52,
            }}>{cta.label}</a>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <a href={PHONE_HREF} onClick={() => track('phone_click')}
                 className="btn btn-ghost" style={{ flex: '1 1 0', justifyContent: 'center', textDecoration: 'none', minHeight: 48, fontSize: 12 }}>
                {ABOUT.contacts.phone}
              </a>
              <a href={TG_HREF} target="_blank" rel="noopener" aria-label="Telegram"
                 className="btn btn-ghost" style={{ flex: '0 0 auto', justifyContent: 'center', textDecoration: 'none', minHeight: 48 }}>
                {ICON.tg}
              </a>
            </div>
          </nav>
        )}
        <div className="mb-progress-track" aria-hidden="true"><span id="mb-progress" /></div>
      </header>
    );
  }

  return (
    <>
      <TrustStrip />
      <header style={barStyle} data-mb-header="desktop">
        <div style={{
          maxWidth: 'var(--max)', margin: '0 auto',
          padding: '12px clamp(16px,3.5vw,48px)',
          display: 'flex', alignItems: 'center', gap: 'clamp(12px, 1.6vw, 28px)',
        }}>
          <LogoMB size={26} href={routeToPath('home')} />
          <nav aria-label="Основная навигация" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 1.5vw, 26px)' }}>
            {NAV.map((n) => (
              <a key={n.id} href={n.href} className="uh"
                 aria-current={route === n.id ? 'page' : undefined}
                 style={{
                   textDecoration: 'none', color: route === n.id ? 'var(--accent)' : 'var(--ink)',
                   fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 500,
                   display: 'inline-flex', alignItems: 'center', minHeight: 44,
                 }}>{n.label}</a>
            ))}
          </nav>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1vw, 14px)' }}>
            <a href={PHONE_HREF} onClick={() => track('phone_click')}
               style={{
                 textDecoration: 'none', color: 'var(--ink)', fontWeight: 500, fontSize: 14,
                 display: 'inline-flex', alignItems: 'center', minHeight: 44, whiteSpace: 'nowrap',
               }} className="uh">{ABOUT.contacts.phone}</a>
            <a href={TG_HREF} target="_blank" rel="noopener" className="btn btn-ghost" aria-label="Написать в Telegram"
               style={{ textDecoration: 'none', minHeight: 44, minWidth: 44, padding: '12px 14px', justifyContent: 'center' }}>
              {ICON.tg}
            </a>
            <a href={routeToPath('cart')} onClick={openNativeCart} className="btn btn-solid"
               style={{ textDecoration: 'none', minHeight: 44, padding: '12px 18px', fontSize: 11, position: 'relative' }}>
              {ICON.cart} Корзина<CartBadge n={cartCount} />
            </a>
          </div>
        </div>
        <div className="mb-progress-track" aria-hidden="true"><span id="mb-progress" /></div>
      </header>
    </>
  );
}

// ── BottomTabBar — нижняя app-style навигация (только мобайл, Sprint 11) ──
const TAB_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  catalog: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  commission: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
    </svg>
  ),
  cart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 7h12l1.2 13H4.8L6 7z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  ),
};

function BottomTabBar({ route, go, cartCount: cartProp }) {
  const cartCount = useTildaCartCount(cartProp);
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
              {t.id === 'cart' && cartCount > 0 && (
                <span className="tabbar-badge">{cartCount}</span>
              )}
            </span>
            <span className="tabbar-label">{t.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

// ── StickyBar — липкая нижняя панель (HANDOFF §3) ─────────────
// Панель закрывается: на мобиле она стояла над таб-баром и съедала экран.
// Решение помнится на время сессии — в следующий заход панель вернётся.
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

// ── Marquee — бегущая строка ──────────────────────────────────
function Marquee({ items, big }) {
  const stream = [...items, ...items, ...items];
  // 03.09 a11y: бегущая строка декоративна, а текст утроен — скринридеру не читаем
  return (
    <div aria-hidden="true" style={{
      padding: big ? '40px 0' : '20px 0',
      borderTop: '1px solid var(--rule-soft)',
      borderBottom: '1px solid var(--rule-soft)',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      <div style={{
        display: 'flex', gap: 56,
        animation: `marquee ${big ? 48 : 32}s linear infinite`,
        whiteSpace: 'nowrap',
      }}>
        {stream.map((t, i) => (
          <span key={i} style={{
            fontFamily: 'var(--display)',
            fontSize: big ? 'clamp(36px, 5vw, 76px)' : 13,
            fontWeight: big ? 500 : 500,
            letterSpacing: big ? '-.025em' : '.16em',
            textTransform: big ? 'none' : 'uppercase',
            color: i % 2 === 0 ? 'var(--ink)' : 'var(--accent)',
            fontStyle: i % 2 === 0 ? 'normal' : 'italic',
          }}>{t}</span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }`}</style>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer({ go }) {
  return (
    <footer className="resp-pad" style={{
      background: 'var(--bg-deep)',
      color: 'var(--bg-cream)',
      padding: '100px 40px 40px',
      marginTop: 80,
    }}>
      <div style={{ maxWidth: 'var(--max)', margin: '0 auto' }}>
        <div className="resp-stack" style={{
          display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 40,
          paddingBottom: 60, borderBottom: '1px solid rgba(245, 239, 226, 0.18)',
        }}>
          <div>
            <div className="display" style={{
              fontSize: 56, fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1,
              color: 'var(--bg-cream)', fontStyle: 'italic',
            }}>MBezu</div>
            <p style={{ marginTop: 24, maxWidth: 360, fontSize: 14, lineHeight: 1.6, color: 'rgba(245, 239, 226, .72)' }}>
              Mila Bezú — художник-живописец из Москвы. Интерьерная живопись маслом, на заказ и в наличии.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <a href={ABOUT.contacts.telegramUrl} target="_blank" rel="noopener"
                 style={{
                   color: 'var(--bg-cream)', textDecoration: 'none',
                   padding: '10px 18px', border: '1px solid rgba(245,239,226,.3)',
                   borderRadius: 'var(--r-pill)', fontSize: 12, letterSpacing: '.12em',
                   textTransform: 'uppercase',
                 }}>Telegram</a>
              <a href={`https://instagram.com/${ABOUT.contacts.instagram}`} target="_blank" rel="noopener"
                 style={{
                   color: 'var(--bg-cream)', textDecoration: 'none',
                   padding: '10px 18px', border: '1px solid rgba(245,239,226,.3)',
                   borderRadius: 'var(--r-pill)', fontSize: 12, letterSpacing: '.12em',
                   textTransform: 'uppercase',
                 }}>Instagram</a>
              <a href={`https://vk.com/${ABOUT.contacts.vk}`} target="_blank" rel="noopener"
                 style={{
                   color: 'var(--bg-cream)', textDecoration: 'none',
                   padding: '10px 18px', border: '1px solid rgba(245,239,226,.3)',
                   borderRadius: 'var(--r-pill)', fontSize: 12, letterSpacing: '.12em',
                   textTransform: 'uppercase',
                 }}>VK</a>
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ color: 'rgba(245, 239, 226, .72)', marginBottom: 20 }}>Магазин</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 02.09: сюжетные страницы каталога */}
              <li><a href="/catalog/more"
                   style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}
                   className="uh">Море и волны</a></li>
              <li><a href="/catalog/botanika"
                   style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}
                   className="uh">Цветы и растения</a></li>
              <li><a href="/catalog/gory"
                   style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}
                   className="uh">Горы</a></li>
              {/* Аудит r2 (SEO): интерьерные посадочные — прямые href, вне RouteName */}
              <li><a href="/kartina-v-gostinuyu"
                   style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}
                   className="uh">Картина в гостиную</a></li>
              <li><a href="/kartina-v-spalnyu"
                   style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}
                   className="uh">Картина в спальню</a></li>
              <li><a href="/kartina-v-kabinet"
                   style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}
                   className="uh">Картина в кабинет</a></li>
              {/* Sprint 15: посадочная «Картина в подарок» — прямой href, вне RouteName */}
              <li>
                <a href="/podarok"
                   style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}
                   className="uh">Картина в подарок</a>
              </li>
              {[['catalog', 'Каталог'], ['commission', 'На заказ'], ['cart', 'Корзина']].map(([id, label]) => (
                <li key={id}>
                  <a href={routeToPath(id as RouteName)}
                     onClick={id === 'cart' ? openNativeCart : undefined}
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}
                     className="uh">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow" style={{ color: 'rgba(245, 239, 226, .72)', marginBottom: 20 }}>Студия</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li><a href={routeToPath('about')} className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}>О художнике</a></li>
              {/* Sprint 15: журнал — страница Tilda вне RouteName, прямой href */}
              <li><a href="/journal" className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}>Журнал</a></li>
              <li><span style={{ color: 'rgba(245,239,226,.72)', fontSize: 14 }}>Школа · скоро</span></li>
              <li><a href={routeToPath('legal', { section: 'delivery' })} className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}>Доставка и оплата</a></li>
              <li><a href={routeToPath('legal', { section: 'returns' })} className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}>Возврат и обмен</a></li>
            </ul>
          </div>

          <div>
            <div className="eyebrow" style={{ color: 'rgba(245, 239, 226, .72)', marginBottom: 20 }}>Документы</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['offer', 'Оферта'],
                ['privacy', 'Политика ПД'],
                ['delivery', 'Доставка'],
                ['returns', 'Возврат'],
                ['requisites', 'Реквизиты'],
              ].map(([sec, lbl]) => (
                <li key={sec}>
                  <a href={routeToPath('legal', { section: sec })} className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14, display: 'inline-block', padding: '10px 0' }}>{lbl}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow" style={{ color: 'rgba(245, 239, 226, .72)', marginBottom: 20 }}>Связь</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              {/* Sprint 15 (моб. аудит): тап-цели контактов были 17px высотой; uh-tap растит их до ~40px без сдвига макета */}
              <li><a href={`mailto:${ABOUT.contacts.email}`} className="uh uh-tap"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none' }}>{ABOUT.contacts.email}</a></li>
              <li><a href={`tel:${ABOUT.contacts.phone.replace(/\s/g, '')}`} className="uh uh-tap"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none' }}>{ABOUT.contacts.phone}</a></li>
              <li style={{ color: 'rgba(245,239,226,.72)' }}>Москва · по записи</li>
            </ul>
          </div>
        </div>

        <div style={{
          paddingTop: 40, display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          {/* Реквизиты ИП — обязательно по законодательству РФ */}
          <div className="mono" style={{
            fontSize: 11, lineHeight: 1.7, letterSpacing: '.04em',
            color: 'rgba(245, 239, 226, .72)',
            display: 'flex', gap: 20, flexWrap: 'wrap',
          }}>
            <span>{ABOUT.legal.name_short}</span>
            <span>·</span>
            <span>ИНН {ABOUT.legal.inn}</span>
            <span>·</span>
            <span>ОГРНИП {ABOUT.legal.ogrnip}</span>
            <span>·</span>
            <span>{ABOUT.legal.address}</span>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 16,
            paddingTop: 24, borderTop: '1px solid rgba(245, 239, 226, .12)',
          }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.22em', color: 'rgba(245,239,226,.72)' }}>
              © MBEZU STUDIO · 2014–2026 · ВСЕ ПРАВА ЗАЩИЩЕНЫ
            </span>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.22em', color: 'rgba(245,239,226,.72)' }}>
              ХУДОЖНИК · MILA BEZÚ · MOSCOU
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { TopBar, Footer, Marquee, LogoMB, StickyBar, BottomTabBar };
