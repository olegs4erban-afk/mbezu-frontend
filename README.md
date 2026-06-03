# mbezu-frontend

Production-фронтенд интернет-магазина художницы **Mila Bezú** (`mbezu.ru`) — Уровень 3.
Vite + React 18 + TypeScript, esbuild, per-page чанки, пререндер (SSG), SEO (JSON-LD), ленивый AR.

- **Путь репозитория:** `C:\MBezu\mbezu-frontend`
- **Источник вёрстки:** `C:\MBezu\mbez-final\` (14 JSX, распакованы из `files.zip`); портированы в `src/`.
- **Прод НЕ затронут:** живой Tilda-сайт не трогался. Переподключение — отдельный шаг (`DEPLOY.md`).

## Команды
```bash
npm install            # установка
npm run dev            # дев-сервер Vite
npm run build          # прод-сборка (vite build + пререндер SSG в dist/)
npm run preview        # отдать собранный dist/ (порт 4173)
npm test               # vitest (юнит-тесты)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run audit          # Playwright runtime-аудит (нужен запущенный preview; см. AUDIT.md)
npm run containers     # перегенерировать painting-/page-containers.md под текущие хеши
```

## Архитектура
```
src/common/   data.ts (22 работы, helpers) · tilda-images.ts (резолвер фото) · adapter.tsx (PaintingPlate)
              atoms.tsx · chrome.tsx (TopBar/Footer) · app.tsx (Shell + routeToPath/go + mount)
              cart.ts (localStorage) · seo.ts (JSON-LD + seoFor) · analytics.ts (Метрика/GA4/VK) · styles.css
src/pages/    home/about/catalog/painting/commission/cart/tracking/legal .tsx (default-export)
src/ar/       ar.tsx — AR-компоненты; @google/model-viewer импортируется динамически (ленивый чанк)
src/entries/  <route>.ts — точка входа: применяет SEO + монтирует страницу в #root
scripts/      prerender.tsx (SSG+sitemap) · gen-containers.tsx · audit.mjs · lh.mjs · smoke.tsx
```
- **Мультистраничность:** на каждый маршрут — свой HTML-харнес + entry-чанк; `common` (react + общий код) шарится; `ar` отдельный; `model-viewer`+three.js — ленивый async-чанк.
- **Навигация:** `go(name, params)` → URL (`routeToPath`); painting также читает `window.__MB_ART_ID` (для Tilda-контейнеров).
- **Пререндер:** `npm run build` рендерит маршруты в `dist/*.html` (контент + SEO в `<head>`), + 22 `dist/painting/<id>.html`, + `sitemap.xml`.

## Структура `dist/`
```
index.html, about.html, catalog.html, painting.html, commission.html, cart.html, tracking.html, legal.html
painting/<id>.html   × 22 (clean-URL страницы работ)
assets/  common-<hash>.js · <page>-<hash>.js × 8 · ar-<hash>.js · model-viewer-<hash>.js (lazy) · style-<hash>.css · works/*.jpg
sitemap.xml · robots.txt · favicon.svg · _headers · _redirects
```

## Качество (Sprint 3)
- Lighthouse (mobile): **Perf ≥90, A11y ≥95, Best-Practices ≥95, SEO 100** на home/about/catalog/painting (before/after — `AUDIT.md`).
- Runtime-аудит: **9/9 маршрутов чисто**, `model-viewer` не грузится вне AR (ленивость).
- `npm test` — 19 юнит-тестов; `typecheck`/`lint`/`build` — зелёные.
- CI: `.github/workflows/deploy.yml` (gate + Lighthouse-бюджет + деплой; инертен без секретов).

## Деплой
Полный раннбук — **`DEPLOY.md`** (Cloudflare Pages, домен `cdn.mbezu.ru`, реальные ID, переподключение Tilda, CSP enforce, откат).
Контейнеры для вставки в Tilda — **`painting-containers.md`** (18 работ) и **`page-containers.md`** (7 страниц).

## Handover — что заблокировано (см. `TODO-incomplete.md`)
**На владельце (деплой/инфра):**
- Cloudflare Pages проект + домен `cdn.mbezu.ru` (CNAME).
- GitHub: `gh` не установлен → репозиторий пока локальный (команды push — `DEPLOY.md §4`).
- Реальные ID аналитики (Я.Метрика/GA4/VK) — плейсхолдеры в `analytics.ts` (трекеры не грузятся, пока плейсхолдеры).
- Переключить CSP `Report-Only` → enforcing после проверки в проде (`DEPLOY.md §4a`).
- Репо-secrets для CI: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

**На Миле (контент/данные):**
- **MN-03 «Шторм»** — нет фото (рендерится плейсхолдер).
- **ST-08, TD-01, TD-02** — провизорные цена/размер («уточнить») → не публиковать как готовые.
- AR-ассеты `.glb/.usdz` отсутствуют (AR показывает placeholder).
- WebP/адаптив фото — остаточная перф-оптимизация (нужен image-пайплайн).

## Журнал
Пофазный лог Sprint 2 (сборка) и Sprint 3 (hardening) — **`PROGRESS.md`**.
