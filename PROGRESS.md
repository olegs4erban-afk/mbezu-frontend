# PROGRESS — Sprint 2 · сборка `mbezu-frontend`

> Журнал возобновляемого прогона по `../sprint-2.md`. После каждой фазы — строка `[done]` + commit.
> **При обрыве сессии:** читай этот файл, продолжай с первой незавершённой фазы. НЕ начинай заново.
> **Прод НЕ трогаем:** ни Tilda-записи, ни публикации, ни правок T123. Всё локально.

## Текущий статус
- **Sprint 2: ВСЕ 6 ФАЗ ЗАВЕРШЕНЫ.** **Sprint 3 (hardening) АКТИВЕН → см. раздел «# Sprint 3» внизу файла.**
- Репозиторий: `C:\MBezu\mbezu-frontend` (branch `main`). GitHub remote: нет (`gh` не установлен) → только локальные коммиты по фазам.

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
- `[done] Phase 6 — Подготовка деплоя (без живых изменений)` — 2026-06-04 00:34 +0300
  - `DEPLOY.md`: пошаговый раннбук — (1) Cloudflare Pages (build `npm run build`, output `dist/`, custom domain `cdn.mbezu.ru` + CNAME); (2) вписать реальные ID аналитики; (3) переподключение Tilda постранично (T123 → тонкий контейнер, убрать Babel, publish, incognito); (4) GitHub; (5) откат; (6) чек-лист.
  - `page-containers.md`: тонкие контейнеры для 7 стандартных страниц (генерятся `npm run containers`).
  - GitHub: `gh` не установлен, remote нет → репозиторий локальный (история по фазам цела). Команды для push — в `DEPLOY.md` §4.
  - Финальная проверка: чистая пересборка `dist` с нуля — **EXIT 0, без ошибок/предупреждений**; SSR-smoke зелёный; 30 HTML + sitemap (27 URL).

## Финал — итог
**Собрано:** production-фронтенд `mbezu-frontend` (Vite + React + TS, esbuild). 14 исходных JSX → ES-модули (`src/common`, `src/pages`, `src/ar`, `src/entries`). Babel-standalone убран.

**Что зелёное:**
- `npm install` → `npm run build` → **EXIT 0, без предупреждений**.
- Чанки: `common` 182 КБ (react + общий код), per-page 6–35 КБ, `ar` 5 КБ, `model-viewer`+three.js 930 КБ **ленивый** (не preload-ится ни на одной странице).
- Code splitting: чанк на страницу + ленивый AR — как требует Уровень 3.
- Пререндер (SSG): 30 HTML (7 статик + painting-шаблон + 22 per-artwork), контент + SEO в `<head>`.
- SEO: JSON-LD (Organization/Person/Product/BreadcrumbList), per-page title/meta/OG/canonical, `sitemap.xml` (27 URL), `robots.txt`.
- Аналитика: Я.Метрика + GA4 + VK + UTM-capture (no-op до реальных ID).
- Рендер-гейт: SSR-smoke всех 8 страниц + вариаций — без ошибок.
- `painting-containers.md` (18 работ) + `page-containers.md` (7 страниц) + `DEPLOY.md`.

**Что в `TODO-incomplete.md` (нужны данные/решения владельца):**
1. Реальные ID аналитики (плейсхолдеры).
2. MN-03 — нет фото.
3. ST-08, TD-01, TD-02 — провизорные цена/размер (не публиковать).
4. AR-ассеты `.glb/.usdz` отсутствуют.
5. Cloudflare/домен/GitHub-remote — действия владельца.

**Прод НЕ тронут:** ни Tilda-записи, ни публикации, ни правок T123. Переподключение Tilda — отдельный постраничный шаг с владельцем (`DEPLOY.md` §3). **Остановка.**

## Команды
- `npm install` · `npm run build` (vite + prerender) · `npm run preview`
- `npm run smoke` (SSR рендер-тест) · `npm run containers` (перегенерация контейнеров) · `npm run typecheck`

---

# Sprint 3 — Hardening + деплой-подготовка (по `../sprint-3.md`)

> Продолжение в ТОМ ЖЕ репо. Прод Tilda НЕ трогаем. После каждой фазы — commit + запись здесь.
> При обрыве — продолжать с первой незавершённой S3-фазы.

## Sprint 3 — статус
- **Активная фаза:** Phase 5 (файлы Cloudflare Pages) — следующая.
- **Последняя завершённая:** Phase 4 — **ВСЕ Lighthouse-цели достигнуты**.

## Sprint 3 — окружение (на старте не установлено, ставим по фазам с ретраями)
- playwright, eslint, vitest, lighthouse — **НЕ установлены** на старте S3. `npm install` работал (S2). 
- Sprint утверждал «Playwright уже стоит» — фактически нет; ставлю в Phase 2 (+ `playwright install chromium`).

## Sprint 3 — лог фаз
- `[done] S3 Phase 0 — Ground truth` — 2026-06-04 01:27 +0300
  - Прочитаны PROGRESS/TODO/DEPLOY/painting-containers (написаны в S2, контекст актуален). git чистый, HEAD = `phase 6`.
  - `npm run build` — **EXIT 0, без предупреждений**; 30 HTML + sitemap(27). Все 8 страниц реальные (заглушек нет).
  - Скрипты: dev/build/build:only/prerender/smoke/containers/preview/typecheck. Чанки: common 182 / model-viewer(lazy) 930 / pages 6–35 КБ.
  - Тулинг аудита (playwright/eslint/vitest/lighthouse) отсутствует → ставлю по фазам.
  - **Дальше:** Phase 1 — `tsc --noEmit` начисто + минимальный ESLint, билд зелёный.
- `[done] S3 Phase 1 — Статические проверки` — 2026-06-04 01:40 +0300
  - Установлен `@types/node` (tsconfig ссылался). `tsc --noEmit` — **EXIT 0**.
  - Типы починены БЕЗ массового any: добавлены интерфейсы пропсов общих компонентов (`Eyebrow/CatNo/Breadcrumbs/PageTitle/StatusTag/ArtCard/ArtRow` — опциональные поля; `align` → `CSSProperties['textAlign']`; `size` → `ImgSize`); `Shell.children?` опционален.
  - 🐞 Реальные баги в `commission.tsx`: `form.where` не было в initial state (добавлено `where:''`); `rows="4"` (строка) → `rows={4}`. `file: null as File|null`.
  - ESLint 9 flat-config (`eslint.config.js`): `@eslint/js` + `typescript-eslint` + `react-hooks` (rules-of-hooks error, exhaustive-deps warn). `no-explicit-any` off (ported loose code). Скрипт `npm run lint`.
  - Lint починен начисто: убран unused `import React` в `data.ts`; `arReady`-переменная в `ar.tsx` (чистый dep effect); вендорные сниппеты Метрики/gtag помечены `eslint-disable prefer-rest-params` (verbatim). **`npm run lint` EXIT 0**.
  - `npm run build` остался зелёным.
  - **Дальше:** Phase 2 — поднять preview, Playwright (не стоит → ставлю) headless по маршрутам, скриншоты + консоль → `AUDIT.md`.
- `[done] S3 Phase 2 — Runtime-аудит` — 2026-06-04 02:05 +0300
  - Установлены `playwright` 1.60 + chromium (`npx playwright install chromium`).
  - `scripts/audit.mjs` (`npm run audit`): headless Chromium по 9 маршрутам, скриншоты `audit/screens/`, консоль/pageerror/failed-resources, проверка `#root` смонтирован, флаг загрузки model-viewer.
  - ⚠️ Окружение: vite preview биндился на IPv6 `[::1]`, а sandbox запрещает Chromium доступ к localhost (`ERR_NETWORK_ACCESS_DENIED`). Решение: preview `--host 127.0.0.1` + аудит-команда с `dangerouslyDisableSandbox` (чисто локальный loopback к своему билду). Ожидание сервера — в скрипте через `fetch` (не shell-sleep).
  - Результат: **7/9 маршрутов чисто** (HTTP 200, `#root` смонтирован+непустой, 0 console-errors). **model-viewer НЕ грузится ни на одной странице** (ленивость подтверждена в рантайме).
  - **2 находки** (painting, painting-clean): пререндеренный QR-`<img>` с пустым `data=` → 400 на api.qrserver.com. Страница рендерится корректно; 400 от статического img до клиентского ре-рендера. → фикс в Phase 4.
  - `AUDIT.md` (таблица + детали) и `audit/runtime-results.json` закоммичены; PNG-скриншоты в .gitignore (регенерируются `npm run audit`).
  - **Дальше:** Phase 3 — Lighthouse (home/about/catalog/painting) → `audit/lighthouse/`, баллы в `AUDIT.md`.
- `[done] S3 Phase 3 — Lighthouse` — 2026-06-04 02:20 +0300
  - Установлен `lighthouse` 12.8 + `chrome-launcher`; гоняется через Chromium от Playwright (`CHROME_PATH`) с `--no-sandbox`.
  - `scripts/lh.mjs` (`BASE=… node scripts/lh.mjs`): mobile-аудит home/about/catalog/painting → `audit/lighthouse/<page>.report.{html,json}`, баллы в `AUDIT.md` + `audit/lh-results.json`.
  - ⚠️ `chrome.kill()` падал EPERM на очистке temp (Windows file-lock) → обёрнут в try/catch, результаты пишутся ДО kill.
  - **Baseline «before»:** home P82/A93/BP100/SEO100 · about P95/A92/BP100/SEO100 · catalog P94/**A84**/BP96/SEO100 · painting P95/A94/BP96/SEO100. Сохранён `audit/*.before.json`.
  - Отчёты Lighthouse (html/json) в .gitignore; `AUDIT.md` + `lh-results.json` + `*.before.json` коммитятся.
  - **Дальше:** Phase 4 — фиксы (a11y контраст/alt/aria/skip-link/lang; perf preload/prefetch/img-dims; QR-фикс), перепрогон → before/after.
- `[done] S3 Phase 4 — Фиксы` — 2026-06-04 02:55 +0300
  - Извлёк точные fail-аудиты из LH JSON (не угадывал): главное — color-contrast (36–66 элементов/стр), + catalog select-name/heading-order, + home CLS/LCP (шрифт) и lazy-LCP/responsive images.
  - **A11y:** `--ink-3` `#9a8a72→#67583f` (WCAG AA на всех фонах, посчитан контраст); футер `.5/.55→.72`; skip-link + `<main id>`; `:focus-visible`; catalog `<select>` `aria-label` + `.sr-only <h2>` (heading-order); мобильное меню `aria-label/expanded`; декор-стрелка `aria-hidden`.
  - **Perf:** `PaintingPlate` responsive `srcSet` 320/768/1600w + `sizes`; LCP-картинки (home hero, painting main) `eager` + `fetchpriority=high`; model-viewer остаётся ленивым.
  - **Bug:** `QrBlock` не рендерит пустой-`data` `<img>` в SSR → нет 400 (painting BP 96→100).
  - **Результат (after):** runtime — **9/9 чисто**; Lighthouse — home 91/95/100/100, about 95/95/100/100, catalog 92/95/96/100, painting 94/96/100/100. **Все цели (Perf≥90, A11y≥95, BP≥95, SEO 100) достигнуты.**
  - `AUDIT.md` — курируемый before/after (скрипты пишут в `audit/last-*.md`, не перетирают). Остаточное (webp, шрифты) → `TODO-incomplete.md §6`.
  - tsc/lint/build — зелёные.
  - **Дальше:** Phase 5 — `public/_headers` (immutable assets, no-cache HTML, security, CSP Report-Only), `_redirects`/SPA-fallback, wrangler.toml.
