# page-containers.md — тонкие Tilda-контейнеры для 7 стандартных страниц

> ⚠️ Материал для шага с владельцем. **В Tilda НЕ вставлено.** Хеши = текущая сборка.
> На каждую страницу Tilda: T123 → сниппет ниже; SEO Title/Description из блока; убрать Babel из HEAD; publish; проверить incognito.

### home  (Tilda alias: `/`)
- **SEO Title:** Mila Bezú — интерьерная живопись маслом · Москва
- **SEO Description:** Картины маслом современной российской художницы Mila Bezú. Серии «Улицы мира», «Монохромная», «Тихая сила» и «Тондо». Работы в наличии и на заказ. Доставка по РФ.
```html
<!-- M.Bez · home -->
<div id="root"></div>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-BTwwbX5Y.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-1BQTux0a.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-loVv6ycp.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/home-D3AMM90w.js"></script>
```

### about  (Tilda alias: `/about`)
- **SEO Title:** О художнице — Mila Bezú · 15 лет масляной живописи
- **SEO Description:** Художник-живописец из Москвы. 15 лет практики масляной живописи. Образование в области дизайна интерьера определяет особый подход — каждая работа создаётся с пониманием того, как она будет жить в реальном пространстве.
```html
<!-- M.Bez · about -->
<div id="root"></div>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-BTwwbX5Y.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-1BQTux0a.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/about-BjCPdX1N.js"></script>
```

### catalog  (Tilda alias: `/catalog`)
- **SEO Title:** Каталог работ — Mila Bezú
- **SEO Description:** Каталог живописи маслом Mila Bezú: 22 работы в четырёх сериях. Пейзажи, море, ботаника, города. Купить картину или заказать.
```html
<!-- M.Bez · catalog -->
<div id="root"></div>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-BTwwbX5Y.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-1BQTux0a.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/catalog-CRt5EWQn.js"></script>
```

### commission  (Tilda alias: `/commission`)
- **SEO Title:** Картина на заказ — Mila Bezú
- **SEO Description:** Закажите картину маслом под ваше пространство. Бриф из 6 шагов: размер, сюжет, палитра, сроки. Студия в Москве, доставка по РФ.
```html
<!-- M.Bez · commission -->
<div id="root"></div>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-BTwwbX5Y.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-1BQTux0a.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/commission-BaQCu9KP.js"></script>
```

### cart  (Tilda alias: `/cart`)
- **SEO Title:** Корзина — Mila Bezú
- **SEO Description:** Корзина и оформление заказа.
- **robots:** noindex (служебная страница)
```html
<!-- M.Bez · cart -->
<div id="root"></div>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-BTwwbX5Y.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-1BQTux0a.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/cart-Dc4zqpIZ.js"></script>
```

### tracking  (Tilda alias: `/tracking`)
- **SEO Title:** Статус заказа — Mila Bezú
- **SEO Description:** Отслеживание статуса вашего заказа.
- **robots:** noindex (служебная страница)
```html
<!-- M.Bez · tracking -->
<div id="root"></div>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-BTwwbX5Y.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-1BQTux0a.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/tracking-DpfqauyP.js"></script>
```

### legal  (Tilda alias: `/legal`)
- **SEO Title:** Документы и реквизиты — Mila Bezú
- **SEO Description:** Оферта, политика обработки персональных данных, доставка, возврат и реквизиты. ИП Клевер Л.А., ИНН 772273980162.
```html
<!-- M.Bez · legal -->
<div id="root"></div>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-BTwwbX5Y.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-1BQTux0a.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/legal-D7DBtttN.js"></script>
```
