# PROGRESS — Sprint 2 · сборка `mbezu-frontend`

> Журнал возобновляемого прогона по `../sprint-2.md`. После каждой фазы — строка `[done]` + commit.
> **При обрыве сессии:** читай этот файл, продолжай с первой незавершённой фазы. НЕ начинай заново.
> **Прод НЕ трогаем:** ни Tilda-записи, ни публикации, ни правок T123. Всё локально.

## Текущий статус
- **Активная фаза:** Phase 6 (подготовка деплоя + финал) — следующая.
- **Последняя завершённая:** Phase 5.
- Репозиторий: `C:\MBezu\mbezu-frontend` (branch `main`). GitHub remote: пока нет.

## Ключевые факты окружения
- node v24.14.1 · npm 11.11.0 · git 2.53.0 · **gh НЕ установлен** (Phase 6 push будет локальным).
- Источник истины: `C:\MBezu\mbez-final\` — распакован из вложенного (новейшего, 2026-05-13) `mbez-final.zip` внутри `files.zip`.
- Реальные фото работ: `mbez-final/assets/works/` (3 размера: `.jpg` / `@md.jpg` / `@sm.jpg`).

## Решения по архитектуре
- `PaintingPlate` выносится в `adapter.tsx` (Tilda-image-adapter), остальные атомы — в `atoms.tsx` (как в прод-T123).
- `tilda-images.ts` — карта/резолвер путей к изображениям.
- Глобалы (`Object.assign(window, …)`) → ES-импорты/экспорты. Babel-standalone убран.
- Мультистраничность: каждая `src/entries/<page>.ts` монтирует свою страницу в `#root`; `go(name, params)` навигирует по URL (модель прод-T123).
- Корзина — модуль `common/cart.ts` на `localStorage` (в dev-исходнике была in-memory; для мультистраницы нужна персистентность). Страницы получают `cart`/`addToCart`/`removeFromCart` через Shell.
- Dev-панель `tweaks-panel.jsx` в прод-сборку НЕ входит; `TWEAK_DEFAULTS` (accent `#b85c3a`, hero `editorial`, density `regular`) зашиты.
- AR (`@google/model-viewer`) — отдельный чанк; тяжёлый model-viewer импортируется динамически только при готовности AR-ассетов (сейчас `ready:false`).

## Лог фаз
- `[done] Phase 0 — Найти исходники` — 2026-06-03 23:27 +0300
  - Найден `mbez-final.zip`; внутри `files.zip` — более новый (05-13) `mbez-final.zip` + `page-legal.jsx`; распакован новейший = **14 файлов исходников + assets**.
  - Полный набор: data, atoms, ar, chrome, app, tweaks-panel + 8 страниц (home/catalog/painting/about/commission/cart/tracking/legal). **Заглушки не нужны** — все страницы реальные.
  - Фото 21/22 работ реальные; без фото — **MN-03**. Провизорные цена/размер (⚠ в исходнике) — **ST-08, TD-01, TD-02** (важно для Phase 5).
  - Расхождение со sprint-хинтом: sprint называл TS-01/ST-01/ST-02 «без фото» — в новейших данных у них фото ЕСТЬ. Применяю правило Phase 5 к фактическим данным.
  - **Дальше:** Phase 1 — создать структуру каталогов и конфиги.
- `[done] Phase 1 — Скелет репозитория` — 2026-06-03 23:31 +0300
  - Конфиги: `package.json` (vite/react/ts, scripts build/preview/prerender/typecheck), `vite.config.ts` (MPA: 8 HTML-входов, manualChunks common+ar, manifest), `tsconfig.json` (lenient), `prerender.config.ts`, `.gitignore`, `.gitattributes` (LF).
  - `public/`: `robots.txt` (+ sitemap ref), `favicon.svg`. `public/assets/works/` создан (фото скопируем в Phase 2/3).
  - 8 HTML-харнесов (index/about/catalog/painting/commission/cart/tracking/legal) → каждый грузит `/src/entries/<page>.ts`. Глобальный CSS будет импортирован из `app.tsx` (не инлайнится в HTML), поэтому `cssCodeSplit:false`.
  - Каталоги `src/{common,pages,ar,entries}` (пока `.gitkeep`).
  - Решение: сборка как Vite-MPA (HTML на маршрут) — даёт per-page чанки + превью маршрутов + `manifest.json` для Phase 5. Реальные прод-страницы (тонкие Tilda-контейнеры) — Phase 6.
  - **Дальше:** Phase 2 — портировать 14 JSX → TS/TSX, разнести по модулям, заменить window-глобалы на ES-импорты.
- `[done] Phase 2 — Портирование исходников в модули` — 2026-06-03 23:40 +0300
  - Транскомпиляция через `../port.py` (вне репо): тела компонентов скопированы **дословно**, переписаны только импорты/экспорты.
  - `src/common/`: `data.ts` (img→`worksImage`, `imageOf` учитывает `TILDA_IMAGES`), `atoms.tsx` (без PaintingPlate), `chrome.tsx`, `styles.css` (12.5 КБ, извлечён из Mbez.html `<style>` — `:root` переменные сохранены).
  - Рукописные модули: `tilda-images.ts`, `adapter.tsx` (PaintingPlate), `ar/ar.tsx` (model-viewer импортируется динамически при `ready`), `app.tsx` (Shell + `go()` URL-навигация + `renderPage`), `cart.ts` (localStorage + `useCart`), `seo.ts` (JSON-LD генераторы), `analytics.ts` (Метрика/GA4/VK — плейсхолдеры, no-op пока ID не настоящие).
  - `src/pages/` 8 страниц (default-export), `src/entries/` 8 точек входа (.ts, JSX-free: компонент + props-factory).
  - Все `Object.assign(window,…)` убраны (проверено grep'ом). Глобалы → ES-импорты.
  - Фото: 63 файла (21 работа × 3 размера) → `public/assets/works/`. `public/assets/ar/README.txt`.
  - ~4900 строк TS/TSX. Babel-standalone убран (компиляция на билде).
  - **Дальше:** Phase 3 — `npm install` (ретраи) + `npm run build` до зелёного, проверить чанки.
- `[done] Phase 3 — Сборка и чанки` — 2026-06-04 00:00 +0300
  - `npm install` — успешно с 1-й попытки (84 пакета). `npm run build` — **EXIT 0, без предупреждений**.
  - 🐞 Найдено и исправлено: первая сборка засосала **three.js** (зависимость model-viewer) в `common` (908 КБ) — `manualChunks` отправлял все `node_modules` кроме model-viewer в common. Починка: в `common` идёт ТОЛЬКО react/react-dom/scheduler; three+model-viewer уходят в ленивый async-чанк.
  - Чанки `dist/assets/`: `common` 179 КБ (react + весь src/common) · per-page: home 30 / legal 35 / cart 16 / commission 10 / painting 9 / tracking 9 / about 8 / catalog 6 КБ · `ar` 5.3 КБ · `model-viewer` 908 КБ (**lazy**, three.js внутри).
  - ✅ model-viewer/three **НЕ preload-ится ни на одной странице** (проверено по dist/*.html) — грузится только динамически при готовности AR-ассетов.
  - `cssCodeSplit:false` → один `style-*.css` 9.2 КБ со всеми `:root` переменными. `chunkSizeWarningLimit:950` (единственный крупный чанк — ленивый 3D).
  - Рендер-гейт: `scripts/smoke.tsx` (SSR `renderToStaticMarkup` всех 8 страниц + 3 вариаций) — **все рендерятся без ошибок**. Playwright не установлен → SSR-смоук вместо headless-браузера.
  - `package-lock.json` закоммичен. `dist/` и `node_modules/` в .gitignore.
  - **Дальше:** Phase 4 — пререндер критичных страниц в dist, `seo.ts` JSON-LD + per-page meta, `analytics.ts` (плейсхолдеры), `sitemap.xml` + `robots.txt` на билде.
- `[done] Phase 4 — Пререндер, SEO, аналитика` — 2026-06-04 00:14 +0300
  - `scripts/prerender.tsx` (запускается из `npm run build` после vite): SSR-рендер каждого маршрута → инжект в `<div id="root">` + SEO в `<head>`. **30 HTML**: home/about/catalog/commission/tracking/legal (контент+SEO), cart (head-only, noindex), painting шаблон + **22 per-artwork** страницы (clean URL `/painting/<id>`).
  - `seo.ts`: `seoFor(route)` — единый резолвер title/description/canonical/OG + JSON-LD. Генераторы: Organization, Person, Product (на каждую работу, цена/наличие/размеры), BreadcrumbList. `applySeo`/`injectJsonLd` для клиента.
  - JSON-LD скрипты в пререндере получают `id="ld-<route>-<i>"` — совпадает с клиентским `injectJsonLd`, поэтому при загрузке заменяются (без дублей).
  - Точки входа вызывают `applySeo(seoFor(...))` — корректный SEO для динамики (`/painting?id=`, `?series=`, `?section=`).
  - `analytics.ts`: Я.Метрика + GA4 + VK + UTM-capture. **ID — плейсхолдеры**, трекеры не грузятся пока ID не настоящие → `TODO-incomplete.md` §1.
  - `dist/sitemap.xml` (27 URL: 5 статик + 22 painting) + `public/robots.txt` (ссылка на sitemap).
  - Гидрация: клиент использует `createRoot` (не hydrate) — пререндер = SEO/first-paint, затем React перерисовывает. Без mismatch-warnings.
  - Smoke (SSR) после изменений — зелёный. Создан `TODO-incomplete.md` (analytics ID, MN-03 без фото, ST-08/TD-01/TD-02 провизорные, AR-ассеты, деплой).
  - **Дальше:** Phase 5 — painting-контейнеры (тонкие Tilda-сниппеты) для работ с фото+ценой+размером → `painting-containers.md`; исключения в `TODO-incomplete.md`.
- `[done] Phase 5 — Контейнеры painting (модель L3, БЕЗ деплоя)` — 2026-06-04 00:25 +0300
  - `scripts/gen-containers.tsx` (`npm run containers`) читает РЕАЛЬНЫЕ хеши чанков из `dist/painting.html` и пишет `painting-containers.md`.
  - **18 готовых контейнеров** (работы с фото + ценой + размером). Контейнер тонкий: `<div id=root>` + `window.__MB_ART_ID` + загрузка `style`/`common`/`ar`/`painting` чанков с `https://cdn.mbezu.ru`. Плюс per-page SEO (title/description/OG/canonical).
  - Вход `painting` теперь читает `window.__MB_ART_ID` (приоритетнее URL) — один контейнер работает на любой painting-странице Tilda.
  - **Отложены 4** (в `TODO-incomplete.md`): MN-03 (нет фото); ST-08, TD-01, TD-02 (цена/размер провизорные).
  - 🚫 В Tilda НИЧЕГО не вставлено — только сгенерирован markdown (как требует sprint).
  - **Дальше:** Phase 6 — `DEPLOY.md` (Cloudflare Pages + реальные ID + переподключение Tilda с владельцем); GitHub push если есть `gh` (нет → локально).
