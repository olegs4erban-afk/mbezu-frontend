// ─────────────────────────────────────────────────────────────
// reveal.ts — анимации по скроллу (HANDOFF §11).
//
// Сознательно БЕЗ animation-timeline: view()/scroll(root) — §13.1–13.2:
// нет поддержки в Safari/Firefox, а при клонировании DOM (скриншот, print,
// парсер) элементы остаются в from-состоянии, то есть opacity:0, и страница
// отдаётся пустой. Здесь скрытое состояние ставит JS — без JS контент виден.
// ─────────────────────────────────────────────────────────────

const REDUCED = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** [data-rev] → плавное появление при входе в экран. */
export function initReveal(): void {
  if (typeof document === 'undefined' || REDUCED()) return;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-rev]'));
  if (!nodes.length || typeof IntersectionObserver !== 'function') return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      io.unobserve(el);
      el.style.opacity = '1';
      el.style.transform = 'none';
      // §13.4: инлайновый transform побеждает :hover по специфичности —
      // снимаем свойства по окончании перехода, иначе карточки перестают подниматься.
      setTimeout(() => {
        el.style.removeProperty('transition');
        el.style.removeProperty('transform');
        el.style.removeProperty('opacity');
      }, 1100);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  nodes.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.94) return; // уже в экране
    el.style.transition = 'opacity .85s cubic-bezier(.16,1,.3,1), transform .95s cubic-bezier(.16,1,.3,1)';
    el.style.opacity = '0';
    el.style.transform = el.dataset.rev === 'scale' ? 'scale(.94)' : 'translateY(30px)';
    io.observe(el);
  });
}

/**
 * [data-count] → счётчик от нуля при входе в экран.
 * §13.11: конечное число лежит в разметке — без JS и в клоне DOM оно и остаётся.
 */
export function initCounters(): void {
  if (typeof document === 'undefined' || REDUCED()) return;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
  if (!nodes.length || typeof IntersectionObserver !== 'function') return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      io.unobserve(el);
      const target = Number(el.dataset.count || '0');
      if (!Number.isFinite(target) || target <= 0) return;
      const prefix = el.dataset.countPrefix || '';
      const suffix = el.dataset.countSuffix || '';
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1100);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + String(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });

  nodes.forEach((el) => io.observe(el));
}

/** Полоса прогресса чтения под шапкой — слушателем scroll, не CSS-таймлайном (§13.2). */
export function initProgress(): void {
  if (typeof document === 'undefined') return;
  const bar = document.getElementById('mb-progress');
  if (!bar) return;
  const upd = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    bar.style.transform = `scaleX(${p})`;
  };
  window.addEventListener('scroll', upd, { passive: true });
  window.addEventListener('resize', upd, { passive: true });
  upd();
}

/** Все эффекты разом — вызывается из Shell после монтирования. */
export function initMotion(): void {
  initReveal();
  initCounters();
  initProgress();
}
