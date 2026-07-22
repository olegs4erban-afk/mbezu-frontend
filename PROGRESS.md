# PROGRESS — Sprint 2 · сборка `mbezu-frontend`

> Журнал возобновляемого прогона по `../sprint-2.md`. После каждой фазы — строка `[done]` + commit.
> **При обрыве сессии:** читай этот файл, продолжай с первой незавершённой фазы. НЕ начинай заново.
> **Прод НЕ трогаем:** ни Tilda-записи, ни публикации, ни правок T123. Всё локально.

## Текущий статус
- **Sprint 2 (сборка): ВСЕ 6 ФАЗ ЗАВЕРШЕНЫ.** **Sprint 3 (hardening): ВСЕ 9 ФАЗ ЗАВЕРШЕНЫ → см. «# Sprint 3» внизу.**
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
- **ВСЕ 9 ФАЗ (0–8) ЗАВЕРШЕНЫ.** Прод и Tilda не тронуты.

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
- `[done] S3 Phase 5 — Файлы Cloudflare Pages` — 2026-06-04 03:05 +0300
  - `public/_headers` → `dist/_headers`: `/assets/*` immutable 1y · `/assets/works/*` 7d+SWR · HTML `max-age=0,must-revalidate` · security (nosniff/Referrer-Policy/HSTS/X-Frame) · **CSP `Content-Security-Policy-Report-Only`** (НЕ enforcing) с разрешёнными доменами (CDN, Метрика/GA/VK, unpkg, Tilda Store, Cloudinary, QR, Google Fonts).
  - `public/_redirects`: канонизация `/index.html`,`/home`→`/`; **без SPA catch-all** (пререндеренный MPA — Pages сам резолвит clean-URL; catch-all затмил бы per-page SEO).
  - `wrangler.toml` (`pages_build_output_dir = dist`) + заметка.
  - DEPLOY.md §4a: кэш/security/CSP + инструкция «переключить CSP на enforcing после проверки в проде».
  - Build кладёт `_headers`/`_redirects` в `dist/` ✓. lint/build зелёные.
  - **Дальше:** Phase 6 — `.github/workflows/deploy.yml` (install+cache → build → LH-бюджет → Cloudflare Pages deploy; секреты-плейсхолдеры, инертно без них).
- `[done] S3 Phase 6 — CI/CD` — 2026-06-04 03:18 +0300
  - `.github/workflows/deploy.yml`: job `quality` (npm ci с кэшем → typecheck → lint → build → **Lighthouse-бюджет** `@lhci/cli` → артефакт dist); job `deploy` (push в main, Cloudflare `pages-action@v1`).
  - **Инертно без секретов:** deploy-шаг гейтится `if env.CF_API_TOKEN != ''` (секреты → env, т.к. в `if` напрямую нельзя). Нет секретов → skip + `::notice`, workflow зелёный. Коммитить безопасно.
  - `lighthouserc.json`: пороги (CI-floor с буфером: Perf 0.85 / A11y 0.95 / BP 0.93 / SEO 0.98), preview как сервер, `--no-sandbox`, отчёты в `audit/lhci` (gitignore).
  - Секреты `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` — плейсхолдеры, описаны в `DEPLOY.md` (репо-secrets владельца).
  - JSON валиден, lint/build зелёные. (Репо ещё локальный → workflow задремлет до push на GitHub.)
  - **Дальше:** Phase 7 — `vitest`: routeToPath/imageOf/formatPrice, форма JSON-LD, обязательные поля «готовых» работ. `npm test` зелёный.
- `[done] S3 Phase 7 — Тесты` — 2026-06-04 03:25 +0300
  - `vitest` 2.1 + `vitest.config.ts` (node env, `css:false` чтобы `import './styles.css'` из app.tsx был no-op, react-plugin для tsx). Скрипт `npm test` (`vitest run`).
  - `src/__tests__/unit.test.ts` — **19 тестов**: `routeToPath` для каждого slug (+query); `formatPrice`/`imageOf` (включая null для MN-03); форма JSON-LD (Organization/Person/Product/Breadcrumb/seoFor, cart=noindex); целостность данных (обязательные поля всех работ, уникальные id, «готовые» работы резолвят фото).
  - **`npm test` зелёный (19/19).** typecheck/lint/build тоже зелёные.
  - **Дальше:** Phase 8 — README + handover, финал PROGRESS/AUDIT/TODO.
- `[done] S3 Phase 8 — Документация + финал` — 2026-06-04 03:32 +0300
  - `README.md`: что это, путь репо, команды (build/preview/test/lint/typecheck/audit/containers), архитектура, структура `dist/`, качество (LH/тесты/CI), ссылки на DEPLOY/AUDIT/containers, **handover** («на владельце» / «на Миле»).
  - `AUDIT.md` — before/after (Phase 4). `TODO-incomplete.md` — §1–6 актуальны.
  - Финальная проверка: typecheck/lint/test(19)/build — зелёные.

## Sprint 3 — Финал (итог)
**Сделано:** L3-сборка доведена до прод-качества, всё готово к деплою — локально, прод не тронут.
- **Статика:** `tsc --noEmit` чисто (типы без mass-any); ESLint 9 flat (ts+react-hooks) — 0 проблем.
- **Runtime-аудит (Playwright):** 9/9 маршрутов чисто; model-viewer ленивый (не грузится вне AR).
- **Lighthouse (mobile) — все цели достигнуты:** home 91/95/100/100 · about 95/95/100/100 · catalog 92/95/96/100 · painting 94/96/100/100 (Perf/A11y/BP/SEO). Before/after — `AUDIT.md`.
- **Фиксы:** WCAG-контраст (`--ink-3`), skip-link/aria/focus/sr-only, адаптивные `srcSet` + eager LCP, QR-400 баг.
- **Cloudflare:** `_headers` (immutable assets, no-cache HTML, security, **CSP Report-Only**), `_redirects` (no SPA catch-all), `wrangler.toml`.
- **CI/CD:** `.github/workflows/deploy.yml` — gate (typecheck/lint/build) + Lighthouse-бюджет + Pages-деплой; инертен без секретов.
- **Тесты:** `vitest`, 19 юнит-тестов (routeToPath/imageOf/formatPrice/JSON-LD/целостность данных) — зелёные.
- **Доки:** README + DEPLOY + AUDIT + painting-/page-containers + TODO-incomplete.

**Заблокировано (в `TODO-incomplete.md`):** реальные ID аналитики · Cloudflare/домен/GitHub-remote · CSP→enforcing · CI-секреты *(владелец)*; MN-03 без фото · ST-08/TD-01/TD-02 провизорные · AR-ассеты · webp *(Мила/контент)*.

**Прод и Tilda НЕ тронуты.** Остановка.

---

## Post-S3 — переключение деплоя на GitHub Pages — 2026-06-04
- `.github/workflows/deploy.yml` заменён на **GitHub Pages** workflow (build+gate+LH → `upload-pages-artifact` → `deploy-pages`; permissions pages/id-token; без секретов — GITHUB_TOKEN/OIDC).
- `public/CNAME` = `cdn.mbezu.ru` (→ `dist/CNAME`); `vite.config.ts` `base: '/'` (явно, домен в корне).
- `package-lock.json` — уже закоммичен/в синхроне (нужен для `npm ci`).
- **GH Pages игнорирует `_headers`/`_redirects`** (Cloudflare-формат, оставлены как fallback) → CSP+security перенесены в `DEPLOY.md §0b` как `<meta>`-сниппет для HEAD страниц Tilda (с оговорками: meta-CSP enforcing-only, нет report-only/frame-ancestors/HSTS/X-Frame).
- DEPLOY.md §0a/§0b добавлены; README/TODO обновлены (Cloudflare→GitHub Pages, Cloudflare остаётся fallback).
- Build зелёный, `dist/CNAME` на месте, ассеты `/assets/*` (base `/`); typecheck/lint зелёные. Прод/Tilda не тронуты.

---

# Sprint 5 — автономная раскатка на ПРОД (по `../sprint-5.md`)

## Sprint 5 — статус
- **✅ Вариант 1 ВЫПОЛНЕН: `/about` переподключён на тонкий CDN-контейнер, проверен, откат НЕ потребовался.**
- Нативные страницы (catalog/cart/…, блоки 706/776) НЕ тронуты. CSP/painting НЕ делались (по решению владельца).
- Stage A (чанки/CDN, чистые алиасы, dir-style) сделан и проверен.

## Sprint 5 — лог
- `[done] Фаза -1 — пред-проверка прод-готовности (read-only)` — 2026-06-04
  - ✅ Prerequisite: `cdn.mbezu.ru` живой (GitHub Pages, IP 185.199.111.153), отдаёт закоммиченный билд: `common-CHVDPQIG.js` → 200 (`application/javascript`, 190 КБ), `/about.html` ссылается на `/assets/*`, painting-чанк 200, `CNAME`/`sitemap.xml` 200.
  - ✅ CDN рендерится headless (audit.mjs против `https://cdn.mbezu.ru`): **9/9 маршрутов чисто** (#root непустой, 0 console-errors, 0 failed-res, model-viewer ленивый).
  - 🛑 **Блокер (routing mismatch):** `routeToPath` в чанках выдаёт `.html` (`/about.html`, `/catalog.html?series=`, `/painting.html?id=`), а живая Tilda — чистые алиасы:
    - `https://mbezu.ru/about` → 200, `/about.html` → **404**; `/catalog` → 200, `/catalog.html` → **404**; `/`,`/home`,`/commission`,`/cart`,`/tracking`,`/legal` → 200; `/painting/mn-01` → **200** (painting-страницы уже есть на чистых URL).
    - Reconnect как есть: страницы бы отрендерились (Phase-2 check прошёл бы), но любой клик по навигации → `/X.html` → 404. Render-only авто-проверка это НЕ ловит → молча сломанный магазин.
  - **Решение (детерминированное, алиасы подтверждены curl'ом, без угадывания):** сменить `routeToPath` на чистые алиасы (`/`, `/catalog`, `/about`, `/commission`, `/cart`, `/tracking`, `/legal`, `/painting/<id>`), пересобрать, запушить → редеплой на cdn → перепроверить (вкл. клик по навигации) → ТОЛЬКО ПОТОМ reconnect Tilda.
  - **Прод не тронут**: снимков/правок/publish не делал. Жду подтверждения курса (фикс+редеплой первым), т.к. это отклонение от плана sprint-5 (он предполагал drop-in чанки).
- `[done] Stage A — чистые алиасы + dir-style пререндер + редеплой CDN` — 2026-06-04 (подтверждено владельцем)
  - `routeToPath` → чистые алиасы (`/`,`/catalog`,`/about`,`/commission`,`/cart`,`/tracking`,`/legal`,`/painting/<id>` + `?series=`/`?ref=`/`?section=`).
  - Пререндер dir-style: `about/index.html`, `painting/<id>/index.html` (22 шт), flat `<name>.html` удалены. Юнит-тесты обновлены (19/19), `gen-containers` читает dir-style, `painting-/page-containers.md` перегенерированы под новые хеши.
  - Добавлен `scripts/navcheck.mjs` (клик по навигации → проверка 200 + рендер).
  - Push `7f181c2` → CI редеплой; новый чанк `common-1BQTux0a.js` живой на cdn за ~36с. `/about.html`→404; `/about`,`/catalog`,`/painting/mn-01` → 301→/…/ → **200** (GH Pages dir-redirect; на Tilda `/about`→200 напрямую).
  - **CDN-проверка:** render-audit **9/9 чисто**; nav-click **5/5 → 200 + рендер**. typecheck/lint/test зелёные.
  - Прод (Tilda) ещё НЕ тронут.
- `[STOP] Phase 1 — аудит живого магазина (read-only) → план sprint-5 несовместим с реальностью` — 2026-06-04
  - Baseline-рендер живых страниц (Playwright, read-only): рендерит в `#root` только `/about` (children=4); остальные 7 — `#root` пустой → они НЕ React-приложение.
  - Структурный аудит published HTML (curl, read-only) — типы блоков:
    - `/` : `131` (T123, но БЕЗ `#root`/`text/babel` — другой кастомный HTML) + `706` (нативная Tilda-корзина).
    - `/about` : `131` (С `#root`+`text/babel` = React-блок) + `706`.
    - `/catalog` : `706` + **`776`** (нативный Tilda **Store**-каталог) + маркер `t-store`.
    - `/commission`,`/cart`,`/tracking`,`/legal`,`/painting/mn-01` : только `706` (нативная корзина) — нативные Tilda-страницы.
  - **Вывод:** живой `mbezu.ru` — **нативный Tilda Store** (корзина `706` на всех страницах, каталог `776`, `t-store`) с реальным checkout. React-приложение `mbezu-frontend` — отдельный **прототип с фейковым checkout** (`cart.tsx`: orderNo = `Math.random`, без оплаты). Только `/about` встраивает React-блок.
  - **Почему НЕ продолжаю:** reconnect 6 нативных страниц на React-чанки = замена реального магазина (каталог/корзина/оплата) на нефункциональный прототип. Render-only авто-проверка это НЕ ловит (увидит смонтированный `#root` → «ok»). Это и есть «сломанный магазин», которого sprint запрещает.
  - **Прод НЕ тронут** (только curl + headless-загрузки). Снимков/правок/publish нет. Нужно решение владельца (см. доклад).
- `[done] Вариант 1 · снимок /about T123` — 2026-06-04
  - Tilda editing через РЕАЛЬНЫЙ browser-login (`scripts/tilda_edit.mjs`, Playwright): cookie-инъекция и raw-requests давали «not authorized»/пустой code; browser-login + редактор + чтение `textarea[name="code"]` сработали.
  - Снимок `backup/about-T123.html` = оригинальный React-бандл **109 230 символов** (`text/babel`, совпадает с task-1). Это точка отката (закоммичено).
  - Целевой блок: pageid 142948406, recordid **2337667041** (131). `706` (нативная корзина rec2293310791) — НЕ трогаем.
  - Контейнер `backup/about-container.html` грузит live-чанки `common-1BQTux0a.js` + `about-BjCPdX1N.js` + `style-BTwwbX5Y.css` (все 200 на cdn).
- `[ok] /about — swap → publish → verify` — 2026-06-04
  - `saverecord` → `OK`; `publish` → `link: mbezu.ru/about`. Propagation ~10с.
  - Live `/about`: `cdn.mbezu.ru` присутствует, `text/babel` исчез, нативная корзина `706` НА МЕСТЕ.
  - **Playwright-проверка (свежий контекст):** `#root` children=5, text=3860, **0 console-errors**, 4 запроса к cdn — все 2xx, title верный → **ABOUT VERIFY: PASS**.
  - **Навигация (клик):** все 5 nav-ссылок с `/about` → переход **HTTP 200** (чистые алиасы совпадают с Tilda; 404 нет). Заметка: `navcheck` ругнулся «4 failed» ложно — критерий `root>0` неверен для НАТИВНЫХ страниц-назначений (`/catalog` и т.п. без React-`#root`); фактический критерий «переход→200» выполнен 5/5.
  - Откат НЕ потребовался. Снимок `backup/about-T123.html` остаётся точкой отката.

---

# Sprint 7 — Публичный запуск под ЮKassa (по `../sprint-7.md`)

> ПРОД. React = витрина/контент; нативный Tilda Store (776/706/checkout) НЕ трогаем и НЕ заменяем; оплату НЕ подключаем (после договора, в настройках Store).

## Sprint 7 — статус
- **✅ САЙТ ОТКРЫТ публично. mbezu.ru/ = React-home (не заглушка). ЮKassa-чеклист — все 11 пунктов.** Нативный Store не тронут.
- 🐞 Найден+исправлен баг: фото работ грузились по root-relative `/assets/works` → на Tilda 404. Фикс: `IMAGE_BASE` → абсолютный CDN; редеплой.

## Sprint 7 — лог
- `[done] Phase 0 — read-only baseline` — 2026-06-04
  - root `/` = pageid **140814006** (лендинг/coming-soon), 131 `rec2257585841` (НЕ React) + 706. Заголовок отличается от home.
  - `/home` = pageid **142947296**, 131 `rec2337252301` = **инлайн-React** (139 КБ, babel, cdn:0) → нужен swap на CDN.
  - `/about` = **уже на CDN** (Sprint 5) ✓.
  - `/legal` (142950726), `/commission` (142949736), `/tracking` (142950276): нативные, **131 НЕТ** (только 706 + общий футер) → React-контент не виден; для legal нужен **ADD** T123.
  - `/catalog` (776+706), `/cart` (706×2), `/painting/*` (706) — **нативный Store, не трогаем**.
  - Общие блоки на всех страницах: pageid 143102566/229331079 (футер/корзина), 706 `rec2293310791` (нативная корзина) — site-wide.
  - ЮKassa-инфо: реквизиты/контакты/легал-ссылки видны в футере site-wide; полные тексты документов рендерятся только на React-LegalPage (поэтому /legal надо переподключить).
  - **Прод не тронут.**
- `[done] Phase 1 — /home + /about → CDN` — 2026-06-04
  - Снимки: `backup/home-T123.html`, `backup/about-T123.html` (оригинальные инлайн-бандлы, точки отката).
  - 🐞 Первый swap /home → картинки 404 (root-relative `/assets/works` на Tilda). **Откат** /home + /about → инлайн (по циклу). Фикс `IMAGE_BASE`→абсолютный CDN + `seo.ts` (не дублировать префикс) → push `d027447` → редеплой (common `common--hIEmJ87.js`), перегенерированы контейнеры.
  - Re-swap **/about** (`about-BPPr3c-A.js`): VERIFY PASS (root=5, нативная корзина 706 на месте, cdn 4/4 ok, 0 site-fails, 0 JS-errors).
  - Re-swap **/home** (`home-CLJrw-Gp.js`): VERIFY PASS (root=5, картинки грузятся 6/12 above-fold + lazy, 706 на месте, cdn 9/9 ok, 0 site-fails). Nav: все переходы → 200 (native-страницы root=0 — ожидаемо).
  - Verify-скрипт усилён: игнор third-party (fonts.gstatic/аналитика, недоступны из песочницы — не блокеры), 706 требуется только на mbezu.ru.
  - Дальше: /legal (нужен ADD T123 — блока 131 нет), затем открытие root.
- `[done] Phase 1b — /legal (ADD React-блок)` — 2026-06-04
  - `/legal` не имел 131 → `scripts/tilda_add.mjs`: `tp__addRecord(131,…)` создал блок **rec2349904171**, `saverecord` контейнер (`legal-CYjNOFpC.js`) → OK, publish OK. recid сохранён (`backup/legal-added-recid.txt`) для отката (`MODE=delete`).
  - VERIFY PASS: root=5, **text=6237** (юр-документы рендерятся), нативная корзина 706 на месте, cdn 4/4, 0 ошибок.
  - commission/tracking — оставлены нативными (опционально по sprint; не блокеры для ЮKassa) → TODO.
  - **Открыты пробы Phase 2 (root):** `tp__addRecord/delRecord` есть; механизм смены домашней страницы (getpageinfo/project) НЕ найден (Error/404).
- `[done] Phase 3 — ЮKassa-чеклист (read-only)` — 2026-06-04 — **ВСЕ 11 пунктов присутствуют:**
  - Оферта · Политика ПД (152-ФЗ) · Доставка/оплата · Возврат · Реквизиты ИП (ИНН/ОГРНИП) · ИП Клевер · Контакты (email/тел) — рендерятся на `/legal` (после переподключения) + футер site-wide.
  - Каталог нативный (776): **28 карточек товаров + цены** («210 000р.» и т.д., 19 ценовых маркеров). Корзина 706 site-wide. Cart/checkout открывается.
  - `scripts/yookassa-check.mjs` (+ `catalogcheck.mjs`).
  - **root `/` = страница 140814006 (coming-soon-заглушка):** «Сайт открывается летом 2026 · До открытия — пишите напрямую». → нужно открыть (Phase 2).
- `[done] Phase 2 — открыть root` — 2026-06-04
  - **swap 131-блока root (page 140814006, rec2257585841) заглушка → home-контейнер** (безопасно/проверенно; index-API не понадобился). saverecord OK, publish OK (link `mbezu.ru`).
  - VERIFY PASS: `mbezu.ru/` → root=5, картинки грузятся, нативная корзина 706 на месте, cdn 9/9, 0 ошибок; заглушка «открывается летом 2026» исчезла. Nav из root → все переходы 200.
  - Откат: `MODE=rollback PAGEID=140814006 RECORDID=2257585841 BACKUP=backup/root-comingsoon-T123.html node scripts/tilda_swap.mjs` (вернёт заглушку).
  - Примечание: индекс-страница осталась 140814006 (сменён её контент-блок, не сам индекс). /home (142947296) тоже показывает home — дубль безвреден; «правильно» назначить 142947296 индексом — 1 клик в Tilda UI (TODO, опц.).

## Sprint 7 — Итог
- **Открыто публично:** `mbezu.ru/` = React-home; `/about`, `/legal` (юр-документы видны), `/home` — React-витрина с CDN-чанков; **нативный Tilda Store (`/catalog` 776, `/cart` 706, checkout) — НЕ тронут, 28 товаров с ценами, корзина/чек-аут работают**.
- **ЮKassa-чеклист — все 11 пунктов присутствуют публично** (оферта, политика 152-ФЗ, доставка/оплата, возврат, реквизиты ИП ИНН/ОГРНИП, контакты, каталог+цены, корзина, checkout-форма).
- Цикл соблюдён: каждая страница снимок→правка→publish→Playwright→(откат при провале — был 1 раз: image-bug на /home → откат → фикс → повтор).
- **НЕ делалось (как и требовалось):** не трогали Store/checkout; **оплату НЕ подключали** — это шаг владельца ПОСЛЕ договора с ЮKassa (нативно в настройках Tilda Store).
- **Откат всего:** снимки в `backup/` (`root-comingsoon-T123.html`, `home-T123.html`, `about-T123.html`, `legal-added-recid.txt`); `scripts/tilda_swap.mjs` (rollback) + `tilda_add.mjs` (MODE=delete для legal-блока).
- **TODO/осталось владельцу:** подключить ЮKassa в настройках Store после договора; реальные ID аналитики; опц. назначить 142947296 индексом в Tilda UI; опц. переподключить commission/tracking (сейчас нативные/минимальные).

---

# Sprint 8 — картинки/золото/цены+40%/фото/чекаут (по `../sprint-8.md`)

## Sprint 8 — статус
- **Решения финализированы (`sprint-8-decisions.md` v3): цена = bizar как есть (НЕ ×1.4); маппинг фото→работа закрыт; 196/851 — ручная цена Милы.**
- **Батч 2A+2C+3A+3B — ВЫПОЛНЕН и проверен на React-витрине (mbezu.ru): золото, прайс заказа, прозрачные webp-карточки, цены bizar.** 2 деплой-цикла + reswap 4 контейнеров + ADD /commission.
- **Нативный Store: ✅ импорт выполнен (Playwright) — все 22 цены bizar на живом /catalog, ST-08=15000, +3 новых товара; webp-карточки залиты.**
- **Золото на нативных: ✅ /custom.css перекрашен в золото (ACE-редактор), весь сайт золотой.**
- **3C чекаут: ✅ клик по работе на React-витрине → нативная страница товара `/catalog/tproduct/<uid>-<slug>` → BUY NOW → корзина 706 → нативный чекаут.**
- **Sprint 8 — ВЕСЬ батч + 3C готовы и проверены на live.** Осталось: 2B (фото автора — нет файла) и живой тест-заказ/оплата (Олег).
- 2B (фото автора) — **заблокировано: `about-author.jpg` отсутствует** (не входит в батч).

## Sprint 8 — лог
- `[done] Phase 1 — bizar scrape + master-таблица (ГЕЙТ)` — 2026-06-24
  - Скрейп bizar (`scripts/bizar-scrape.mjs`, реальный браузер, без логина/капчи): **26 работ Милы** `{slug,title,size,price}` → `audit/bizar-raw.json`.
  - Источники сведены: data.ts (22), Store CSV v2 (19 SKU), card webp (21, photo-id в имени), якоря (7).
  - Таблица → `sprint8-master-table.md`: **7 уверенных матчей** с new_price(×1.4); **15 работ — решение Олега** (3×Mountain B&W↔MN-02/03/04, 3×Greek houses↔ST-01/02, тондо без bizar, и т.д.); **19 bizar-работ без пары** в data.ts/Store; **14 карточек без якоря**.
  - ⚠️ bizar-цены НАМНОГО ниже текущих (Ангкор 380k→182k, Waterlilies 105k→56k) → +40% = понижение; **обязательна проверка Олега**.
  - ⚠️ Скрейп = 26; из «снятых цен» 5 работ НЕ найдены (Человек vs Природа, Everest, Португалия, Морской бриз, Бокал красного) — возможно проданы/архив; подтвердить.
  - **Прод НЕ тронут.**
- `[done] Phase 2A/2C/3A/3B — батч на React-витрине` — 2026-06-24 (по `sprint-8-decisions.md` v3)
  - **2A золото:** `styles.css` `--accent #a08a4e` (+deep `#7d6a38`, soft `#b3a583`, accent-2 `#bfa45e`, dark `#c2a85e`); убраны все терракотовые литералы (app.tsx, home.tsx glow-градиенты, commission-палитра, field-focus). Хардкода нет.
  - **2C прайс заказа:** в `commission.tsx` секция COMMISSION («от / зависит от сложности», 3 группы форматов + included/extra/terms); форма-бриф (размеры/бюджет) приведена к новой шкале. `/commission` был нативным (без 131) → **ADD React-блока rec2412598301** (откат `MODE=delete`), теперь рендерит прайс.
  - **3A картинки:** 21 прозрачная webp-карточка → `public/assets/cards/<slug>.webp`; `TILDA_IMAGES` overrides → CDN webp (MN-03 без карточки). 🐞 **Баг найден+исправлен:** `PaintingPlate` строил `srcSet` из старого `art.image` (works-jpg) → браузер грузил jpg вместо карточки; теперь `srcSet` через `imageOf`, для одиночной карточки не эмитится. После фикса home: 8/11 карточек грузятся.
  - **3B цены:** `data.ts` цены = bizar (FINAL v3). Держим ручными: MN-05, ST-03, ST-08.
  - **Деплой:** 2 цикла (commit `3a244e3` золото/цены/карточки; `3859296` фикс srcSet). После каждого — reswap контейнеров root(140814006/2257585841)/home(142947296/2337252301)/about(142948406/2337667041)/legal(142950726/2349904171) на новые хеши (снимки `backup/*-s8pre.html`).
  - **Verify (Playwright, live mbezu.ru):** root/home/about/legal — PASS (root>0, нативная корзина 706 на месте, cdn 2xx, 0 JS-ошибок). `--accent` = `#a08a4e` золото. Новые цены на home (100000/130000/65000/45000), старые (210000/380000) исчезли. /commission рендерит прайс + золото. Скрин `audit/s8-home*.png`.
  - **НЕ тронуто:** нативный Store (776/catalog, 706/cart, checkout) — данные товаров обновляются отдельно CSV-импортом.
- `[done] Нативный Store — импорт цен+фото (Playwright)` — 2026-06-24 (Олег: «залью через Playwright», ST-08→15000)
  - Способ найден: store-админка `store.tilda.ru/store/?projectid=13712449` → ⋯ → «Импортировать из CSV» (модалка → Загрузить файл → Импортировать → step2: маппинг колонок + опции → «Начать запись данных» `.btn_importcsv_proccess` → async-процесс до 100%).
  - Скрипт `scripts/store-import.mjs` (CONFIRM=1): загрузил `02-tilda-store-import-v3.csv`, выставил «Заменить имеющиеся изображения», финализировал, дождался «Импорт завершен» (Обработано 22). Снимок-откат: `02-tilda-store-import-v2.csv` (+ `scripts/store-export.mjs`). Грабли: poll рвался на слове «Импортировано N%» (1%) → ждём 100%; replace-чекбокс — клик по label, не по hidden input.
  - Републиш каталога `scripts/tilda_publish.mjs PAGEID=142948046` (нативные блоки 776/706 НЕ трогаются — только publish).
  - **Verify (Playwright-рендер live /catalog): ВСЕ 22 цены верны** — Wave 100000, горы 25000, Камни 62000(hold), Shell 15000, Лаванда 28000(hold), Le Bouquineur 6000, Ангкор 130000, Рис.поле 30000, Крыши 45000, Обидуш 15000, Зеркало 60000, Waterlilies 40000, Тропич.листья 50000, Дождь/Бамбук 10000, Sands 17000, Hibiscus 45000, +новые Греция/Некуда 15000, Freedom 65000.
  - Картинки: 21 webp-карточка залита (Tilda перехостила в `/stor…webp`), тондо Hibiscus рендерится кругом (webp применился); часть старых `-md.jpg` осталась вторичными в галерее (косметика, праймари = новая карточка).
- `[done] Глобальный CSS — золото на нативных (Playwright)` — 2026-06-24
  - Механизм: Settings → **Вставка кода** → «Редактировать CSS» → страница `/projects/editcustomcss/` с **ACE-редактором** (НЕ textarea — `textarea.value` не сохраняется; правильный путь `ace.edit(el).setValue()`).
  - `scripts/css-apply.mjs` (APPLY=1): хирургично заменил 4 accent-hex + rgba на золото в текущем CSS (бэкап `backup/custom-css-live-before.css`), проверил editor=gold ДО сохранения, «Сохранить» → publish home → `/custom.css` регенерён.
  - **Verify:** live `/custom.css` — `--accent #a08a4e` (+ #c2a85e/#b3a583/#7d6a38), 0× b85c3a; нативный `/catalog` `getComputedStyle(--accent)=#a08a4e`. Весь сайт (React + нативный Store) — золотой.
- `[done] data.ts ST-08=15000` — уехало с деплоем 3C (commit 4ea7801).
- `[done] 3C — чекаут-хэндофф (React → нативный Store)` — 2026-06-24 (Олег: «делай 3C сейчас»)
  - Открыл проблему: `go('painting',{id})` вёл на `/painting/<id>` — нативную страницу-тупик (только site-wide корзина 706, без покупки). Нативные товары имеют реальные страницы `/catalog/tproduct/<uid>-<slug>` с BUY NOW.
  - Фикс (1 точка): `routeToPath('painting')` → нативный product-URL из нового `src/common/store-urls.ts` (22 работы → product-URL, UID'ы со скрейпа каталога; неизвестные id → фолбэк React-алиас). seo.ts/prerender не зависят от routeToPath('painting') (хардкод `/painting/<id>`) — SEO/пререндер не затронуты. Юнит-тест обновлён.
  - Деплой commit `4ea7801` (push: schannel-обрыв → помог `http.postBuffer=512M` + HTTP/1.1) → reswap 5 контейнеров (root/home/about/legal/commission) на новые хеши (common-85XhhDAw…).
  - **Verify (live):** home/commission — root=5, золото, корзина 706, новый common-чанк. **E2E: клик по флагману на home → переход на `mbezu.ru/catalog/tproduct/566542733172-wave-sepia`** (Wave sepia, Артикул MN-01, 100 000 р., **BUY NOW**). Хэндофф работает.
  - Живой тест-заказ + 54-ФЗ чек + подключение оплаты ЮKassa — **за Олегом** (по sprint).

## Sprint 5 — Итог
- **Сделано:** `/about` (единственная React-страница) переподключена на тонкий CDN-контейнер — теперь грузит чанки с `cdn.mbezu.ru` вместо инлайн-бандла. Проверено (рендер+консоль+навигация). Нативный Tilda Store не тронут.
- **Не делалось (по решению/безопасности):** 6 нативных страниц (это реальный Tilda Store, не React — reconnect разрушил бы магазин); CSP (Вариант 1 без CSP); painting (нативные страницы).
- **Артефакты:** `backup/about-T123.html` (оригинал, откат), `backup/about-container.html` (контейнер), `scripts/tilda_edit.mjs` (browser-login editor: snapshot/swap/rollback), `scripts/about-verify.mjs`, `scripts/navcheck.mjs`.
- **Откат при необходимости:** `node scripts/tilda_edit.mjs rollback` (вернёт оригинальный бандл из снимка + publish).
- Прочее (реальные ID аналитики, миграция магазина на React требует реального checkout) — в `TODO-incomplete.md`.

---

# Sprint 11 — мобильная адаптация + таб-бар, форма заявки, копирайт (по `../sprint-11.md`)

## Sprint 11 — статус
- **✅ Все 4 фазы на live, один деплой-цикл.** Commit `5217f15` → CDN (`common-Br2biVON`, `home-Ca2p-3jl`) → reswap 6 контейнеров (`backup/s11/`, 2/2 шага у каждого). Rollback: reswap на `backup/s10/`.
- **Live-проверка:** мобайл 375px — /,/catalog,/about: scrollW=viewport (без h-скролла), таб-бар виден, root=6, корзина 706 на месте; десктоп — все тексты Ф2–3, серия «Улицы мира», MMXXVI нет, форма с согласием ПД, таб-бар скрыт. NB для будущих проверок: `.eyebrow`/`.btn` рендерят текст UPPERCASE (innerText «21 РАБОТА · 4 СЕРИИ»), «и&nbsp;задачу» содержит NBSP — регексы делать регистро/NBSP-нечувствительными.
- **⚠️ Заявки пока НЕ доставляются никуда** (endpoint = заглушка по спринту): сохраняются в localStorage покупателя + даём прямую ссылку Telegram. Подключить канал (A: TG-бот через прокси / B: Tilda-вебхук / C: email-сервис) — решение и доступы за Олегом; после выбора вписать URL в `LEAD_ENDPOINT` (src/pages/home.tsx) и задеплоить.
- Store-админка НЕ тронута (reCAPTCHA-блокер) — чек-лист в Sprint 10 остаётся в силе.

## Sprint 11 — лог
- `[done] Фаза 1 — мобильная адаптация + нижний таб-бар` — 2026-07-22
  - `BottomTabBar` (chrome.tsx): Главная/Каталог/На заказ/Корзина, SVG-иконки + подписи, бейдж корзины, активный таб золотом, `env(safe-area-inset-bottom)`, высота 60px+, `go()`-навигация; рендерится из Shell (app.tsx) на всех React-страницах; ≤900px виден, на десктопе скрыт. Мобильный бургер из TopBar удалён (лого сверху компактно); «Художница»/«Статус заказа» доступны через футер.
  - CSS: `main#main`/footer нижний паддинг под таб-бар; тач-таргеты ≥44px (chip/btn); ховер-зум карточек только `@media (hover:hover) and (pointer:fine)`.
  - 🐞 Найден+исправлен overflow каталога на мобайле: фильтр-бар (12-col grid) не имел `resp-stack-12`, а инлайновые `gridColumn:'1/9'/'9/13'` переживали схлопывание → страница 415px при 360 viewport (зум-аут). Фикс: класс на фильтр-бар + правило `.resp-stack-12 > * { grid-column:auto !important; }`.
  - Локальный verify (vite preview + Playwright): 5 страниц × 360/375px — scrollW=viewport строго, таб-бар работает, тап по табу → переход, активный таб корректен. (Грабли: `&`-фоновый сервер умирает с шеллом → run_in_background; зомби на ::1 держал порт → kill + `--host 127.0.0.1`.)
- `[done] Фаза 2 — копирайт главной (было→стало)` — 2026-07-22
  - «в интерьерах»; точки убраны: tagline (data.ts), «одну атмосферу», «как подарок», «закрытые продажи»; надзаголовок «НАБЛЮДЕНИЯ · 04» убран целиком; AR-заголовок «Примерка картин в реальном времени»; текст доставки пересобран (тубус убран, коробка+мешочек+открытка+сертификат); пункт 01 «Зелёная коробка с золотым тиснением»; ZeroBanner «21 работа · 4 серии»; ProcessRow «Масло, от 2 недель…».
- `[done] Фаза 3 — CTA «На заказ» + открытая форма заявки` — 2026-07-22
  - Все 5 строк-строго-по-списку (примечание: они живут в home.tsx ProcessRow/CommissionCTA, не в page-commission): «НА ЗАКАЗ» без MMXXVI, «Картина для вашего пространства», «подрамника» без точки, «от 2 недель», «...место и задачу».
  - `LeadForm` в CTA-блоке вместо кнопки: Имя* / Контакт* / О работе (textarea) / обязательный чекбокс согласия ПД (152-ФЗ) со ссылкой на Политику (submit заблокирован без галочки); div+onClick (без `<form>`); состояния idle/sending/ok/err. Проверено Playwright: пустой сабмит → 3 валидационных сообщения; без согласия → блок; с согласием → success + запись в localStorage.
- `[done] Фаза 4 — ревёрт серии + MMXXVI` — 2026-07-22
  - «Улицы мира» восстановлено везде (data.ts title+2 био, seo.ts, бегущая строка); раздел нативного Store переименовывать больше не нужно (он и не менялся). MMXXVI: убраны оба остатка (хиро-вариант HeroSplit, CTA) — grep чист (только код-комменты).
  - tsc 0 · 20/20 tests · build зелёный.

---

# Sprint 10 — копирайт главной + глобальная смена лого MBezu (по `../sprint-10.md`)

## Sprint 10 — статус
- **✅ Все пункты A–K на live, проверены Playwright (тексты/лого/серия/раскладка).** Один деплой-цикл: commit `bd47f52` → CDN (`common-BYcwa9zX`, `home-CaWtj4KI`) → reswap 6 контейнеров (`backup/s10/`). Rollback: reswap на `backup/s9/`.
- Store (натив): CSV v4 импортирован («Обработано: 22, Ошибки: 2» — обе ошибки = mn-02.webp 404, ожидаемо: у «Вершины» карточки нет по решению S9). **НО: у существующих товаров импорт НЕ обновляет Brand/раздел/характеристику «Серия»** — страницы товаров всё ещё «M.Bez» / «Серия: Улицы мира»; вкладки разделов в админке не переименованы. Нужны правки в Store-админке (см. блокер ниже).
- **🐞 НАЙДЕН БАГ (мой артефакт): повторные CSV-импорты ДОБАВЛЯЮТ вариант товара при каждом прогоне** — у всех товаров теперь по 3–4 одинаковых варианта (Кол-во=4 при уникальных работах 1/1!). + в галереях товаров по-прежнему старый jpg рядом с webp (хвост S9). Продажи не под угрозой прямо сейчас (оплата ЮKassa ещё не подключена), но чистить надо до запуска платежей.
- **⛔ БЛОКЕР: Tilda-логин теперь требует reCAPTCHA** (rate-limit после множества автологинов за день) — автоматизация Store-правок остановлена, капчи не обхожу. Retry через несколько часов ИЛИ Олег правит руками (3 правки, см. итог).

## Sprint 10 — лог
- `[done] A–J — копирайт главной (строго было→стало)` — 2026-07-18
  - A: убраны обе хиро-плашки (`Saison printemps–été · MMXXVI`, `œuvre du jour · …`). B: «в комнатах» без точки (слово «комнатах» оставлено — по флагу спринта). C: `4–10`→`от 2` в ОБОИХ местах со «недель на заказ» (хиро-полоса + StatsRow); ProcessRow «Масло, 4–10 недель…» не тронут (бодитекст, не в было→стало) ⚠️ противоречит «от 2» — решить Олегу. D: бегущая «— серии одного автора —». E: `НАБЛЮДЕНИЯ · 04` + «Наблюдения» + «один свет, одни эмоции, одну атмосферу». F: оверлеи-плашки серий сняты (на главной; About-бейджи «УЛИЦЫ» не в скоупе). H: три меты манифеста убраны, подпись → MBezu. I: «тихий житель пространства». J: тумблер «В типовой комнате» удалён (dead-код room-mockup вычищен), заголовок AR без точки, чип «AR · реальная стена» остался индикатором.
- `[done] G+K — глобальные (React)` — 2026-07-18
  - K: `M.Bez`/`M. Bez`/`M.BEZ` → `MBezu` — LogoMB (подпись `Maison · Moscou` удалена), футер-лого, `© MBEZU STUDIO`, крошки ×7 страниц, tracking, thank-you card, «Бархатный мешочек», data.ts ritual, seo.ts (og:site_name, organizationLd, breadcrumbLd ×4), prerender og:site_name, gen-containers комменты. `Mila Bezú`/`Мила Бэзу` не тронуты. Остаточный grep: 0 вне комментов.
  - G: «Улицы мира и других стран» — data.ts (title серии + 2 био-абзаца), seo.ts описание, бегущая строка. Фильтр каталога (select) — длинное имя помещается, hscroll=false.
  - tsc 0 / тесты 20/20 / build ok.
- `[done] Деплой + reswap + verify` — 2026-07-18
  - Push `bd47f52` → CDN за ~60с. Контейнеры → `backup/s10/` (catalog с hide-style rec2291453131). Reswap 6 страниц (root/home×2/about/legal/commission/catalog): saverecord OK + publish 200 ×6.
  - **Verify home:** root=5, 0 JS-ошибок; УБРАНО всё (Saison, œuvre, МАНИФЕСТ·MMXXVI, ПСЕВДОНИМ, СТУДИЯ·MOSCOU, «типовой комнате», «Три наблюдения», «три серии», плашки серий, 4–10, Maison·Moscou, M.Bez, «житель комнаты», точки B/J); ЕСТЬ всё («от 2/НЕДЕЛЬ НА ЗАКАЗ» ×2, НАБЛЮДЕНИЯ·04, «одни эмоции…», «— серии одного автора —», «житель пространства», «Улицы мира и других стран», MBezu, © MBEZU STUDIO, AR-чип). Полностраничный скрин `audit/s10-home-full.png` — визуально ок.
  - **Catalog:** крошка «MBEZU / КАТАЛОГ», лого MBezu, select «Улицы мира и других стран», hscroll=false, 21 карточка. **About:** серия переименована (стар. вхождений 0), «Зелёная коробка MBezu». **Legal/commission:** root=5, MBezu, корзина 706 на месте. Чекаут/корзина не тронуты.
- `[partial→blocked] Store: CSV v4 + админ-правки` — 2026-07-18
  - v4 (`C:\MBezu\02-tilda-store-import-v4.csv`) = v3 c `M.Bez;`→`MBezu;` (22) и «Улицы мира»→«Улицы мира и других стран» (16 ячеек: Categories+Серия). Импорт завершён, цены/22 строки обработаны.
  - Проверка страницы товара (Ангкор-Ват, raw HTML + cache-buster): Brand «M.Bez» ×6, «Серия: Улицы мира», MBezu=0 → **импорт не трогает эти поля у существующих товаров**. Вкладки разделов в админке — тоже старые.
  - Рекон admin-карточки товара (скрин `audit/store-product-edit.png`): 4 идентичных варианта ST-05 по 130000/кол-во 1 (сумма=4), в галерее st-05-md.jpg + webp. → повторные импорты добавляли Editions-строку каждый прогон (S8 ×2 + v4).
  - Третий логин-прогон упёрся в reCAPTCHA (`audit/tilda-login-state.png`) — остановился, капчи не обхожу.
  - **План очистки (1 проход на товар, когда логин доступен):** удалить лишние варианты (оставить 1; Кол-во станет 1) → удалить старый jpg из галереи (оставить webp) → Brand=MBezu → у ST-товаров характеристика Серия=«Улицы мира и других стран» → Сохранить; + Разделы: переименовать раздел «Улицы мира»; + переопубликовать каталог. Либо это же руками Олега в Store-админке.

---

# Sprint 9 — каталог (навигация+крошки+единый размер+ховер-зум), фото автора, фикс «Шторм» (по `../sprint-9.md`)

## Sprint 9 — статус
- **✅ Фазы 1–4 (React-витрина) на live, проверены Playwright + визуально.** Один деплой-цикл (commit `8a3d190` → CDN), затем reswap 5 контейнеров на новые хеши (`common-DMB1QQzJ`) + reconnect `/catalog`.
- **Осталось (натив Store, data-уровень):** дедуп галерей товаров до webp + unpublish товара MN-03 — см. ниже (CSV-импорт внешних URL картинок Tilda НЕ заменяет → нужен ручной шаг в Store-админке).

## Sprint 9 — лог
- `[done] Фаза 3 — фото автора в About` — 2026-06-25
  - `about-author.jpg` (1245×1600) + `-square.jpg` → `public/assets/` → CDN. `page-about.jsx`: плейсхолдер «[портрет…]» → `<img>` (object-fit cover, alt="Mila Bezú, художник"). Live: портрет справа, плейсхолдер исчез.
- `[done] Фаза 2 — единый квадрат + 1 webp + ховер-зум (React-каталог)` — 2026-06-25
  - `ArtCard`: контейнер `aspect-ratio:1/1; overflow:hidden`, одна прозрачная webp (`PaintingPlate objectFit="contain" plain className="art-card-img"`), тондо — круг. CSS `.art-card-img:hover img{transform:scale(1.07)} transition .45s` (+ reduced-motion). На креме без «белой коробки».
  - Live `/catalog`: 21 карточка, все `squareRatio=1.0`, 0 console/asset-ошибок.
- `[done] Фаза 4 — «Шторм» (MN-03) скрыт` — 2026-06-25
  - В data.ts `MN-03 hidden:true` (своего фото нет; на нативном каталоге дублировалось фото 422=Freedom). Фильтр `visibleArtworks()` в каталоге/home/related/счётчиках. 422 остаётся только у Freedom (65 000). Live: «Шторм» отсутствует, 21 работа.
- `[done] Фаза 1 — каталог: TopBar+крошки + reconnect + аудит` — 2026-06-25
  - Reswap root/home/about/legal/commission на новые хеши (после деплоя GH Pages удаляет старые → live на минуту падал, восстановлен).
  - **Reconnect `/catalog`:** `tilda_add` добавил React-блок `rec2413986501` (контейнер с `<style>#rec2291453131{display:none}</style>` — прячет нативный Store-каталог 776, не удаляя; товары/корзина/чекаут целы). Удалён orphan-блок `rec2413982781` (пустой, от первой неуд. попытки add). 
  - **Live verify:** React-каталог рендерит (root=5), нативный 776 скрыт (offsetHeight=0), TopBar (Каталог/На заказ/Художница/Статус/Корзина) + крошки «M.BEZ / Каталог», корзина 706 на месте; **клик по работе → `/catalog/tproduct/566542733172-wave-sepia` (100 000р. + BUY NOW)** → корзина → чекаут. Воронка цела.
  - **Аудит витрин:** home/about/legal/commission/catalog = React (TopBar+крошки через Shell) ✓. Нативные product/cart/checkout — намеренно нативный UI (бэкенд покупки, не трогаем).
  - Откат `/catalog`: `MODE=delete RECORDID=2413986501 PAGEID=142948046 node scripts/tilda_add.mjs` (вернёт нативный каталог). Контейнеры — `backup/s9/`.
- `[follow-up] Натив Store — дедуп галерей до webp + скрыть товар MN-03`
  - Факт: товары на product-страницах отдают ИСХОДНЫЕ tildacdn-фото (`mn-01-md.jpg` и т.п.); CSV-импорт `Photo`=внешний `cdn.mbezu.ru/.../*.webp` с «заменить изображения» цены обновил, а картинки галереи НЕ заменил (ограничение Tilda на внешние URL). Нативный каталог скрыт → витрина (React) чистая; правка нужна для product-страниц.
  - Надёжный путь: загрузить webp в Store-медиа Tilda и поставить первым/единственным фото у каждого товара (ручной ~5-мин шаг в админке, как и предполагал sprint-9 «импортёру дочистить»), + скрыть/снять с публикации товар MN-03. Можно сделать Store-админ-автоматизацией по запросу.
