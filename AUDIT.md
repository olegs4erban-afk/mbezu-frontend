# AUDIT — mbezu-frontend (Sprint 3)

Curated **before → after** для hardening-фаз. Сырые прогоны: `npm run audit` (runtime) и
`scripts/lh.mjs` (Lighthouse) пишут в `audit/last-*.md` + `audit/*-results.json` (не перетирают этот файл).
Метод: headless Chromium против `npm run preview` (`--host 127.0.0.1`). Lighthouse — mobile preset.

## Phase 2 — Runtime audit (Playwright)

Проверка каждого маршрута: HTTP, `#root` смонтирован и непустой, console-errors/pageerrors,
упавшие ресурсы, загрузился ли (ленивый) `model-viewer`.

| | Before | After |
|---|--------|-------|
| Маршрутов чисто | 7 / 9 | **9 / 9** |
| `model-viewer` загружен | 0 / 9 (ленивый ✓) | 0 / 9 (ленивый ✓) |
| Проблемы | painting, painting-clean: 400 на `api.qrserver.com` (пустой `data=` в QR-`<img>` из пререндера) | — нет |

Скриншоты: `audit/screens/<route>.png` (регенерируются `npm run audit`).

## Phase 3 — Lighthouse (mobile)  ·  before → after

Цели: Perf ≥90 · A11y ≥95 · Best-Practices ≥95 · SEO 100.

| Page | Performance | Accessibility | Best-Practices | SEO |
|------|-------------|---------------|----------------|-----|
| home | 82 → **91** ✅ | 93 → **95** ✅ | 100 → 100 | 100 |
| about | 95 → **95** ✅ | 92 → **95** ✅ | 100 → 100 | 100 |
| catalog | 94 → **92** ✅ | 84 → **95** ✅ | 96 → 96 | 100 |
| painting | 95 → **94** ✅ | 94 → **96** ✅ | 96 → **100** | 100 |

**Все цели достигнуты** на всех проверенных страницах.

## Phase 4 — что починили

**A11y (контраст был главным провалом — 36–66 элементов на странице):**
- `--ink-3` затемнён `#9a8a72 → #67583f` — проходит WCAG AA (≥4.5:1) на bone/card/soft фонах (eyebrow, cat-no, подписи).
- Футер: приглушённый текст `rgba(245,239,226,.5/.55) → .72` (контраст на тёмном фоне).
- Skip-link «К содержимому» + `<main id="main">`; видимый `:focus-visible` outline.
- catalog: `aria-label` на двух `<select>` (фильтр/сортировка); `.sr-only` `<h2>` перед сеткой (чинит heading-order h1→h3).
- Мобильная кнопка меню: `aria-label` + `aria-expanded`; декоративная стрелка `→` → `aria-hidden`.

**Perf:**
- `PaintingPlate`: адаптивный `srcSet` (320/768/1600w) + `sizes` (моб. грузит @sm/@md вместо 1600px).
- LCP-картинки (hero на home, главная на painting): `loading="eager"` + `fetchpriority="high"`.
- `model-viewer` + three.js остаются ленивым async-чанком (подтверждено в рантайме — MV=0/9).

**Bug-fix:**
- `QrBlock` больше не рендерит `<img>` с пустым `data=` при SSR/пререндере → нет 400 (и painting BP 96 → 100).

## Остаточные оптимизации (не блокеры — цели достигнуты)
- **Кэш-заголовки** для `/assets/*` (`immutable`) — делается в Phase 5 (`public/_headers`); в `vite preview` не виден, но будет в проде (Cloudflare).
- **WebP/AVIF** (`modern-image-formats`, ~115–355 KiB экономии) — нужен build-пайплайн изображений (`sharp` не установлен) → см. `TODO-incomplete.md`.
- **Шрифты**: home LCP/CLS чувствительны к загрузке Google Fonts; вариант самохостинга/тюнинга `font-display` — UX/инфра-решение, см. `TODO-incomplete.md`.
