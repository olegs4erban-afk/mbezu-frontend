# DEPLOY.md — деплой `mbezu-frontend` (Уровень 3)

> Раннбук на утро. **Прод Tilda сейчас не тронут.** Шаги 1–2 — автоматизируемы;
> шаг 3 (переподключение Tilda) — постранично, с владельцем, в incognito-проверкой.
> Перед всем: `npm ci && npm run build` локально — должно быть зелёным (см. PROGRESS.md).

---

## 0a. Платформа деплоя: GitHub Pages (актуально)
> Деплой переключён на **GitHub Pages**. Разделы §1–§4a (Cloudflare) оставлены как **альтернатива/fallback**.

1. Запушить репо на GitHub (см. §4): `git push -u origin main`.
2. **Settings → Pages → Build and deployment → Source = «GitHub Actions».**
3. Workflow `.github/workflows/deploy.yml` на push в `main`: `npm ci` → typecheck → lint → test → build → Lighthouse-бюджет → `upload-pages-artifact` (`dist/`) → `deploy-pages`. **Секреты не нужны** (GITHUB_TOKEN + OIDC).
4. **Кастомный домен `cdn.mbezu.ru`:**
   - `public/CNAME` (→ `dist/CNAME`) уже содержит `cdn.mbezu.ru` — GitHub Pages подхватит домен.
   - В DNS зоны `mbezu.ru`: **CNAME `cdn` → `<github-user-или-org>.github.io`** (для apex был бы A-record; здесь поддомен → CNAME).
   - Settings → Pages → Custom domain: `cdn.mbezu.ru`, дождаться проверки DNS, включить **Enforce HTTPS**.
5. `base: '/'` в `vite.config.ts` (домен в корне) — ассеты адресуются от `/`.

### 0b. Заголовки и CSP на GitHub Pages
**GitHub Pages НЕ поддерживает кастомные HTTP-заголовки** — файлы `public/_headers` и `public/_redirects`
(формат Cloudflare) **игнорируются** (оставлены на случай возврата на Cloudflare). Значит:
- **Кэш**: GH Pages сам отдаёт хешированные `/assets/*` с дальним кэшем; отдельная настройка не нужна.
- **CSP + security**: ставятся **не на CDN, а в HEAD страниц Tilda** — именно Tilda отдаёт пользовательские
  страницы, а `cdn.mbezu.ru` (GH Pages) отдаёт только JS/CSS-чанки (суб-ресурсы).

**Сниппет CSP для вставки в HEAD страницы Tilda** (Настройки страницы → «HEAD code»; добавить на каждую страницу
с контейнером). Перенесён из `public/_headers`:
```html
<!-- M.Bez · CSP (вставить в HEAD страниц Tilda). Сначала ПРОТЕСТИРОВАТЬ в DevTools,
     дополнить домены по violation-репортам, и только потом полагаться на политику. -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.mbezu.ru https://mc.yandex.ru https://www.googletagmanager.com https://www.google-analytics.com https://vk.com https://*.vk.com https://unpkg.com https://*.tildacdn.com https://*.tilda.cc; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https://cdn.mbezu.ru https://api.qrserver.com https://*.tildacdn.com https://static.tildacdn.com https://res.cloudinary.com https://mc.yandex.ru https://www.google-analytics.com; connect-src 'self' https://cdn.mbezu.ru https://mc.yandex.ru https://www.google-analytics.com https://*.vk.com https://*.tilda.cc https://*.tildacdn.com https://res.cloudinary.com; media-src 'self' https://*.tildacdn.com; frame-src 'self' https://vk.com">
<meta name="referrer" content="strict-origin-when-cross-origin">
```
**Важные оговорки `<meta>`-CSP:**
- `<meta>`-CSP **enforcing** (report-only через meta невозможен) → перед вставкой прогнать политику в DevTools
  (вкладка Console покажет блокировки) и расширить список доменов; иначе можно молча сломать легитимный скрипт/картинку.
- Директивы `frame-ancestors`, `report-uri`/`report-to`, а также заголовки **HSTS / X-Frame-Options /
  X-Content-Type-Options** работают **только как HTTP-заголовки** и через `<meta>` НЕ задаются. На GH Pages их
  выставить нельзя; антикликджекинг при необходимости — настройками самого Tilda или фронтальным прокси.

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

### CI/CD (`.github/workflows/deploy.yml`)
- На push в `main`: `npm ci` → `typecheck` → `lint` → `build` → **Lighthouse-бюджет** (`@lhci/cli`, `lighthouserc.json` — фейл если ниже порога) → деплой на Cloudflare Pages.
- Деплой-шаг **инертен без секретов** (skip, workflow зелёный). Чтобы включить — добавить в **Settings → Secrets → Actions** репо:
  - `CLOUDFLARE_API_TOKEN` (токен с правами Pages:Edit)
  - `CLOUDFLARE_ACCOUNT_ID`
- Деплой использует `cloudflare/pages-action@v1`, `projectName: mbezu-frontend`, `directory: dist`.

## 4a. Заголовки / кэш / CSP (`public/_headers`, `public/_redirects`, `wrangler.toml`)
Файлы лежат в `public/` и копируются в `dist/` на билде — Cloudflare Pages читает их из корня вывода.
- **Кэш:** `/assets/*` (хешированные бандлы) — `immutable, 1 год`; `/assets/works/*` (стабильные имена фото) — 7 дней + SWR; HTML — `max-age=0, must-revalidate`.
- **Security:** `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `X-Frame-Options`.
- **CSP — сейчас `Content-Security-Policy-Report-Only` (НЕ enforcing):** ничего не блокирует, только репортит нарушения в консоль.
  Разрешённые источники (заранее): `cdn.mbezu.ru` · Я.Метрика `mc.yandex.ru` · GA `googletagmanager.com`/`google-analytics.com` ·
  VK `vk.com`/`*.vk.com` · model-viewer `unpkg.com` · Tilda Store/checkout `*.tildacdn.com`/`*.tilda.cc` ·
  Cloudinary `res.cloudinary.com` · QR `api.qrserver.com` · Google Fonts `fonts.googleapis.com`/`fonts.gstatic.com`.
  - **➡️ После проверки в проде** (открыть сайт, проверить, что в консоли нет нужных CSP-violation’ов от
    легитимных скриптов/картинок) — переименовать заголовок `Content-Security-Policy-Report-Only` → `Content-Security-Policy`
    в `public/_headers`, дополнив список доменов тем, что всплывёт в репортах. Тогда CSP станет enforcing.
- **Redirects:** SPA catch-all НЕ используется (это пререндеренный MPA; каждый маршрут и `/painting/<id>` — свой статический HTML,
  Pages сам резолвит clean-URL). Только канонизация `/index.html`,`/home` → `/`.

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
