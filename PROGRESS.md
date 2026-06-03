# PROGRESS — Sprint 2 · сборка `mbezu-frontend`

> Журнал возобновляемого прогона по `../sprint-2.md`. После каждой фазы — строка `[done]` + commit.
> **При обрыве сессии:** читай этот файл, продолжай с первой незавершённой фазы. НЕ начинай заново.
> **Прод НЕ трогаем:** ни Tilda-записи, ни публикации, ни правок T123. Всё локально.

## Текущий статус
- **Активная фаза:** Phase 2 (порт исходников в модули) — следующая.
- **Последняя завершённая:** Phase 1.
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
