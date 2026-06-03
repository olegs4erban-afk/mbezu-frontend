# DEPLOY.md — деплой `mbezu-frontend` (Уровень 3)

> Раннбук на утро. **Прод Tilda сейчас не тронут.** Шаги 1–2 — автоматизируемы;
> шаг 3 (переподключение Tilda) — постранично, с владельцем, в incognito-проверкой.
> Перед всем: `npm ci && npm run build` локально — должно быть зелёным (см. PROGRESS.md).

---

## 0. Предусловия
- Node ≥ 20, репозиторий `mbezu-frontend` (этот каталог).
- Доступ к: Cloudflare (аккаунт), DNS-зоне `mbezu.ru`, админке Tilda (проект 13712449).
- Реальные ID аналитики на руках (Я.Метрика, GA4, VK) — см. `TODO-incomplete.md` §1.

## 1. Cloudflare Pages
1. Запушить репо на GitHub (см. §4), либо подключить через Direct Upload.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages**.
3. **Connect to Git** → выбрать репозиторий `mbezu-frontend`, ветка `main`.
4. Build settings:
   - **Framework preset:** None (Vite).
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 (переменная `NODE_VERSION=20` если нужно).
5. Deploy. Проверить превью-URL `*.pages.dev` (откроется home, `/painting/mn-01` и т.п.).
6. **Custom domain:** Pages → Custom domains → добавить `cdn.mbezu.ru`.
   - В DNS зоны `mbezu.ru` создать **CNAME `cdn` → `<project>.pages.dev`** (Proxied/оранжевое облако).
   - Дождаться выпуска сертификата (обычно минуты). Проверить `https://cdn.mbezu.ru/assets/...`.

> Чанки адресуются как `https://cdn.mbezu.ru/assets/<name>-<hash>.js`. Хеши меняются
> при каждой сборке — Tilda-контейнеры (§3) ссылаются на текущие; **после пересборки
> перегенерировать**: `npm run containers` и обновить вставленные сниппеты.

## 2. Реальные ID аналитики
1. Открыть `src/common/analytics.ts` → объект `ANALYTICS_IDS`.
2. Заменить плейсхолдеры на реальные: `yandexMetrika`, `ga4`, `vkPixel`
   (для VK дописать финальный сниппет в `initVkPixel`, если нужен Top/Ads pixel).
3. Пока ID содержат `X` — трекеры НЕ грузятся (защита). После замены — грузятся автоматически.
4. `npm run build`, commit, redeploy (Cloudflare пересоберёт сам при push).

## 3. Переподключение Tilda (постранично, с владельцем)
> Цель: заменить «толстый» inline-T123 (Babel + весь React-бандл) на **тонкий контейнер**,
> грузящий чанки с `cdn.mbezu.ru`. Делать по одной странице, проверяя в incognito.

**7 стандартных страниц** (home, catalog, painting-листинг? нет — это about/commission/cart/tracking/legal):
сниппеты в **`page-containers.md`**. На каждой странице Tilda:
  1. Открыть редактор страницы → найти блок T123 со старым inline-бандлом.
  2. Заменить его `code` на сниппет нужной страницы из `page-containers.md`.
  3. Из HEAD страницы (Tilda → Настройки → HEAD code) **убрать** загрузку Babel-standalone и
     старые `<script src=react...>` — теперь всё в чанках.
  4. SEO (Title/Description) — из блока страницы в `page-containers.md` → Настройки страницы.
  5. Опубликовать. Открыть в **incognito**, проверить: рендер, переходы, консоль без ошибок,
     корзина (localStorage), отсутствие двойной загрузки React.

**Painting-страницы** — сниппеты в **`painting-containers.md`** (18 работ):
  1. Для каждой работы создать/открыть страницу Tilda с alias `/painting/<id>` (напр. `/painting/mn-01`).
  2. T123 → вставить сниппет работы (в нём `window.__MB_ART_ID` уже проставлен).
  3. SEO Title/Description/OG-image — из блока работы.
  4. Publish + incognito-проверка (фото грузится, AR-плашка-placeholder ок, «в корзину» работает).
  5. Работы из раздела «Отложены» (MN-03, ST-08, TD-01, TD-02) — **не публиковать**, пока нет
     данных (`TODO-incomplete.md` §2–3).

## 4. GitHub
- На этой машине `gh` **не установлен**, git-remote не настроен → репозиторий пока **локальный**
  (история коммитов по фазам цела). Чтобы запушить:
  ```bash
  # вариант с gh:
  gh repo create mbezu-frontend --private --source=. --remote=origin --push
  # или вручную:
  git remote add origin git@github.com:<owner>/mbezu-frontend.git
  git push -u origin main
  ```
- Cloudflare Pages подключается к этому репозиторию (§1.3).

## 5. Откат
- Cloudflare Pages хранит прошлые деплои → **Rollback** в один клик.
- Tilda: вернуть прежний `code` блока T123 (Tilda хранит историю изменений страницы).
- Прод-страницы Tilda до §3 работают как раньше (inline-бандл) — переключение постраничное и обратимое.

## 6. Чек-лист готовности
- [ ] `npm ci && npm run build` зелёное локально
- [ ] Cloudflare Pages деплой зелёный, `*.pages.dev` открывается
- [ ] `cdn.mbezu.ru` отдаёт `/assets/*` по HTTPS
- [ ] Реальные ID аналитики вписаны, трекеры грузятся
- [ ] `npm run containers` перегенерирован под финальные хеши
- [ ] Постранично переподключены 7 страниц + painting (incognito-проверка)
- [ ] `sitemap.xml` доступен, отправлен в Я.Вебмастер / Search Console
