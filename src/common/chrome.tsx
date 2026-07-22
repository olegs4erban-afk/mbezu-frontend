import React from 'react';
import { ABOUT } from './data';

// ─────────────────────────────────────────────────────────────
// chrome.jsx — каркас сайта: TopBar / Footer / Marquee / ZeroBanner.
// ─────────────────────────────────────────────────────────────

// ── Логотип MBezu — wordmark в Inter Tight (Sprint 10: без подписи Maison · Moscou) ──
function LogoMB({ size = 32, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      lineHeight: 1, cursor: onClick ? 'pointer' : 'default',
    }}>
      <div className="display" style={{
        fontSize: size, fontWeight: 500, letterSpacing: '-.02em',
        color: 'var(--ink)', fontStyle: 'italic',
      }}>MBezu</div>
    </div>
  );
}

// ── ZeroBanner — тонкий «индекс выпуска» вверху ───────────────
function ZeroBanner() {
  const date = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <div className="resp-pad" style={{
      padding: '12px 40px',
      background: 'var(--bg-soft)',
      borderBottom: '1px solid var(--rule-soft)',
    }}>
      <div style={{
        maxWidth: 'var(--max)', margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }} className="eyebrow">
        <span>Mila Bezú</span>
        <span className="resp-hide" style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 16, height: 1, background: 'var(--accent)' }} />
          <span>21 работа · 4 серии · масло на холсте</span>
          <span style={{ width: 16, height: 1, background: 'var(--accent)' }} />
        </span>
        <span>{date} · Moscou</span>
      </div>
    </div>
  );
}

// ── TopBar — навигация и корзина ──────────────────────────────
function TopBar({ route, go, cartCount }) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { id: 'catalog',    label: 'Каталог' },
    { id: 'commission', label: 'На заказ' },
    { id: 'about',      label: 'Художница' },
    { id: 'tracking',   label: 'Статус заказа' },
  ];

  return (
    <>
      <ZeroBanner />
      <header className="resp-pad" style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: scrolled ? '14px 40px' : '24px 40px',
        background: scrolled ? 'rgba(237, 229, 214, 0.92)' : 'var(--bg)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--rule-soft)' : '1px solid transparent',
        transition: 'all .25s cubic-bezier(.2,.7,.2,1)',
      }}>
        <div style={{
          maxWidth: 'var(--max)', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <LogoMB size={28} onClick={() => go('home')} />

          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {navItems.map((n) => (
              <a key={n.id} href="#" onClick={(e) => { e.preventDefault(); go(n.id); }}
                 className="uh"
                 style={{
                   textDecoration: 'none', color: route === n.id ? 'var(--accent)' : 'var(--ink)',
                   fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase',
                   fontWeight: 500,
                 }}>{n.label}</a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); go('cart'); }}
               style={{
                 textDecoration: 'none', color: 'var(--ink)',
                 fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase',
                 fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8,
               }} className="hide-mobile">
              Корзина {cartCount > 0 && (
                <span style={{
                  background: 'var(--accent)', color: 'var(--bg)',
                  width: 22, height: 22, borderRadius: 'var(--r-pill)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 600,
                }}>{cartCount}</span>
              )}
            </a>
          </div>
        </div>
        {/* Sprint 11: мобильный бургер убран — навигация на мобайле через нижний таб-бар */}
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

function BottomTabBar({ route, go, cartCount }) {
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
          <a key={t.id} href="#"
             onClick={(e) => { e.preventDefault(); go(t.id); }}
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

// ── Marquee — бегущая строка ──────────────────────────────────
function Marquee({ items, big }) {
  const stream = [...items, ...items, ...items];
  return (
    <div style={{
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
              <a href={`https://t.me/${ABOUT.contacts.telegram}`} target="_blank" rel="noopener"
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
              {[['catalog', 'Каталог'], ['commission', 'На заказ'], ['cart', 'Корзина'], ['tracking', 'Отследить заказ']].map(([id, label]) => (
                <li key={id}>
                  <a href="#" onClick={(e) => { e.preventDefault(); go(id); }}
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14 }}
                     className="uh">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow" style={{ color: 'rgba(245, 239, 226, .72)', marginBottom: 20 }}>Студия</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li><a href="#" onClick={(e) => { e.preventDefault(); go('about'); }} className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14 }}>О художнице</a></li>
              <li><span style={{ color: 'rgba(245,239,226,.72)', fontSize: 14 }}>Школа · скоро</span></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); go('legal', { section: 'delivery' }); }} className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14 }}>Доставка и оплата</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); go('legal', { section: 'returns' }); }} className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14 }}>Возврат и обмен</a></li>
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
                  <a href="#" onClick={(e) => { e.preventDefault(); go('legal', { section: sec }); }} className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none', fontSize: 14 }}>{lbl}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="eyebrow" style={{ color: 'rgba(245, 239, 226, .72)', marginBottom: 20 }}>Связь</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <li><a href={`mailto:${ABOUT.contacts.email}`} className="uh"
                     style={{ color: 'rgba(245,239,226,.85)', textDecoration: 'none' }}>{ABOUT.contacts.email}</a></li>
              <li><a href={`tel:${ABOUT.contacts.phone.replace(/\s/g, '')}`} className="uh"
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

export { TopBar, Footer, Marquee, LogoMB, BottomTabBar };
