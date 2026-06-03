# painting-containers.md — тонкие Tilda-контейнеры (Уровень 3)

> ⚠️ Материал для шага с владельцем. **Ничего из этого в Tilda НЕ вставлено.**
> Хеши чанков = ТЕКУЩАЯ сборка. После пересборки перегенерировать: `npm run containers`.

## На каждую painting-страницу Tilda
1. Создать страницу с alias вида `/painting/mn-01`.
2. Блок T123 (Custom HTML) → вставить сниппет работы (он сам тянет `common`+`painting` с CDN).
3. SEO-настройки страницы Tilda → Title/Description/OG-image из блока ниже.
4. Убрать Babel-standalone из HEAD (если был). Опубликовать, проверить в incognito.

Работа выбирается через `window.__MB_ART_ID` (вход `painting` читает его первым).

### Базовый шаблон (общий, `<ID>` заменить)
```html
<!-- M.Bez · painting · <ID> -->
<div id="root"></div>
<script>window.__MB_ART_ID="<ID>";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

## Готовые контейнеры — 18 работ (фото + цена + размер)

### MN-01 · Wave sepia (Волна в сепии)
- Серия: **Монохромная серия** · 100×60 см · 210 000 ₽ · available
- **SEO Title:** Wave sepia · Волна в сепии — Монохромная серия · Mila Bezú
- **SEO Description:** Монохромная волна в момент наивысшего напряжения — секунда до падения. Палитра сепии убирает всё лишнее, оставляя только силу и форму. 100×60 см, холст, масло, на подрамнике. 210 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/mn-01.jpg
- **Canonical:** https://mbezu.ru/painting/mn-01
```html
<!-- M.Bez · painting · MN-01 -->
<div id="root"></div>
<script>window.__MB_ART_ID="MN-01";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### MN-02 · Вершина
- Серия: **Монохромная серия** · 30×30 см · 42 000 ₽ · available
- **SEO Title:** Вершина — Монохромная серия · Mila Bezú
- **SEO Description:** Острый пик уходит в светлые облака. Форма без цвета — только свет, тень и вертикаль. 30×30 см, холст на картоне, масло. 42 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/mn-02.jpg
- **Canonical:** https://mbezu.ru/painting/mn-02
```html
<!-- M.Bez · painting · MN-02 -->
<div id="root"></div>
<script>window.__MB_ART_ID="MN-02";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### MN-04 · Перевал
- Серия: **Монохромная серия** · 30×30 см · 42 000 ₽ · available
- **SEO Title:** Перевал — Монохромная серия · Mila Bezú
- **SEO Description:** Горный пейзаж с долиной — панорама снега и леса в серебряном свете. Самая тихая из трёх работ серии. 30×30 см, холст на картоне, масло. 42 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/mn-04.jpg
- **Canonical:** https://mbezu.ru/painting/mn-04
```html
<!-- M.Bez · painting · MN-04 -->
<div id="root"></div>
<script>window.__MB_ART_ID="MN-04";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### MN-05 · Камни на берегу
- Серия: **Монохромная серия** · 30×40 см · 62 000 ₽ · available
- **SEO Title:** Камни на берегу — Монохромная серия · Mila Bezú
- **SEO Description:** Морская пена омывает камни — натюрморт о движении и покое. Детальная проработка текстуры камней и пены. 30×40 см, холст, масло, на подрамнике. 62 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/mn-05.jpg
- **Canonical:** https://mbezu.ru/painting/mn-05
```html
<!-- M.Bez · painting · MN-05 -->
<div id="root"></div>
<script>window.__MB_ART_ID="MN-05";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### MN-06 · Shell (Ракушка)
- Серия: **Монохромная серия** · 24×30 см · 38 000 ₽ · available
- **SEO Title:** Shell · Ракушка — Монохромная серия · Mila Bezú
- **SEO Description:** Ракушка на мокром песке — натюрморт о времени и море. Каждая деталь текстуры написана с натуры. 24×30 см, холст, масло, на подрамнике. 38 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/mn-06.jpg
- **Canonical:** https://mbezu.ru/painting/mn-06
```html
<!-- M.Bez · painting · MN-06 -->
<div id="root"></div>
<script>window.__MB_ART_ID="MN-06";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### ST-01 · Греция. Полдень
- Серия: **Улицы мира** · 18×24 см · 38 000 ₽ · available
- **SEO Title:** Греция. Полдень — Улицы мира · Mila Bezú
- **SEO Description:** Белые стены, синяя дверь, горшки с геранью — полдень в греческом переулке. Написана по мотивам личной поездки. 18×24 см, холст, масло, на подрамнике. 38 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/st-01.jpg
- **Canonical:** https://mbezu.ru/painting/st-01
```html
<!-- M.Bez · painting · ST-01 -->
<div id="root"></div>
<script>window.__MB_ART_ID="ST-01";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### ST-02 · Некуда спешить
- Серия: **Улицы мира** · 18×24 см · 38 000 ₽ · available
- **SEO Title:** Некуда спешить — Улицы мира · Mila Bezú
- **SEO Description:** Фонарь, ступени, цветы в горшках — переулок, по которому хочется пройти снова и снова. Греция, написана с натуры. 18×24 см, холст, масло, на подрамнике. 38 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/st-02.jpg
- **Canonical:** https://mbezu.ru/painting/st-02
```html
<!-- M.Bez · painting · ST-02 -->
<div id="root"></div>
<script>window.__MB_ART_ID="ST-02";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### ST-03 · Франция. Лаванда
- Серия: **Улицы мира** · 15×15 см · 28 000 ₽ · available
- **SEO Title:** Франция. Лаванда — Улицы мира · Mila Bezú
- **SEO Description:** Лавандовое поле Прованса крупным планом — аромат, который можно почти почувствовать. 15×15 см, холст на картоне, масло. 28 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/st-03.jpg
- **Canonical:** https://mbezu.ru/painting/st-03
```html
<!-- M.Bez · painting · ST-03 -->
<div id="root"></div>
<script>window.__MB_ART_ID="ST-03";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### ST-04 · Франция. Le Bouquineur (Книжная лавка в Париже)
- Серия: **Улицы мира** · 15×15 см · 28 000 ₽ · available
- **SEO Title:** Франция. Le Bouquineur · Книжная лавка в Париже — Улицы мира · Mila Bezú
- **SEO Description:** Книжная лавка в Париже — стопки книг, голубые ставни, каштан над крышей. Место, где время замедляется. 15×15 см, холст на картоне, масло. 28 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/st-04.jpg
- **Canonical:** https://mbezu.ru/painting/st-04
```html
<!-- M.Bez · painting · ST-04 -->
<div id="root"></div>
<script>window.__MB_ART_ID="ST-04";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### ST-05 · Ангкор-Ват (Камбоджа)
- Серия: **Улицы мира** · 100×80 см · 380 000 ₽ · available
- **SEO Title:** Ангкор-Ват · Камбоджа — Улицы мира · Mila Bezú
- **SEO Description:** Храм, который смотрит на тебя сотнями каменных лиц. Написан по впечатлениям от поездки — воздух Камбоджи, тяжёлый и горячий, до сих пор ощущается в этой работе. 100×80 см, холст, масло, на подрамнике. 380 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/st-05.jpg
- **Canonical:** https://mbezu.ru/painting/st-05
```html
<!-- M.Bez · painting · ST-05 -->
<div id="root"></div>
<script>window.__MB_ART_ID="ST-05";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### ST-06 · Рисовое поле (Вьетнам)
- Серия: **Улицы мира** · 40×50 см · 88 000 ₽ · available
- **SEO Title:** Рисовое поле · Вьетнам — Улицы мира · Mila Bezú
- **SEO Description:** Бесконечная перспектива рисовых полей Вьетнама — тропинка уходит в горизонт между зелёными рядами. 40×50 см, холст, масло, на подрамнике. 88 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/st-06.jpg
- **Canonical:** https://mbezu.ru/painting/st-06
```html
<!-- M.Bez · painting · ST-06 -->
<div id="root"></div>
<script>window.__MB_ART_ID="ST-06";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### ST-07 · Крыши старого города
- Серия: **Улицы мира** · 25×70 см · 105 000 ₽ · available
- **SEO Title:** Крыши старого города — Улицы мира · Mila Bezú
- **SEO Description:** Панорама черепичных крыш европейского старого города — купола, шпили, трубы. 25×70 см, холст, масло, на подрамнике. 105 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/st-07.jpg
- **Canonical:** https://mbezu.ru/painting/st-07
```html
<!-- M.Bez · painting · ST-07 -->
<div id="root"></div>
<script>window.__MB_ART_ID="ST-07";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### TS-01 · Freedom (Свобода)
- Серия: **Тихая сила** · 70×50 см · 140 000 ₽ · available
- **SEO Title:** Freedom · Свобода — Тихая сила · Mila Bezú
- **SEO Description:** Зелёная волна в полном движении — свобода как физическое ощущение. Работа о том моменте, когда море говорит громче всего. 70×50 см, холст, масло, на подрамнике. 140 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/ts-01.jpg
- **Canonical:** https://mbezu.ru/painting/ts-01
```html
<!-- M.Bez · painting · TS-01 -->
<div id="root"></div>
<script>window.__MB_ART_ID="TS-01";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### TS-02 · Зеркало леса
- Серия: **Тихая сила** · 50×90 см · 165 000 ₽ · available
- **SEO Title:** Зеркало леса — Тихая сила · Mila Bezú
- **SEO Description:** Осенний лес отражается в тёмной воде — горизонтальная композиция, тёплая палитра. Момент между последним теплом и первым снегом. 50×90 см, холст, масло, на подрамнике. 165 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/ts-02.jpg
- **Canonical:** https://mbezu.ru/painting/ts-02
```html
<!-- M.Bez · painting · TS-02 -->
<div id="root"></div>
<script>window.__MB_ART_ID="TS-02";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### TS-03 · Waterlilies (Кувшинки)
- Серия: **Тихая сила** · 50×50 см · 105 000 ₽ · available
- **SEO Title:** Waterlilies · Кувшинки — Тихая сила · Mila Bezú
- **SEO Description:** Кувшинки на тёмной воде — вечный сюжет, написанный заново. Каждый цветок — отдельная история света. 50×50 см, холст, масло, на подрамнике. 105 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/ts-03.jpg
- **Canonical:** https://mbezu.ru/painting/ts-03
```html
<!-- M.Bez · painting · TS-03 -->
<div id="root"></div>
<script>window.__MB_ART_ID="TS-03";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### TS-04 · Тропические листья
- Серия: **Тихая сила** · 40×30 см · 68 000 ₽ · available
- **SEO Title:** Тропические листья — Тихая сила · Mila Bezú
- **SEO Description:** Тропические листья с каплями воды — гиперреалистичная детализация на тёмном фоне. Ощущение влажного тепла. 40×30 см, холст, масло, на подрамнике. 68 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/ts-04.jpg
- **Canonical:** https://mbezu.ru/painting/ts-04
```html
<!-- M.Bez · painting · TS-04 -->
<div id="root"></div>
<script>window.__MB_ART_ID="TS-04";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### TS-05 · Дождь пошёл
- Серия: **Тихая сила** · 18×24 см · 36 000 ₽ · available
- **SEO Title:** Дождь пошёл — Тихая сила · Mila Bezú
- **SEO Description:** Зелёные листья в каплях дождя на тёмном фоне — момент после ливня. Свет играет на каждой капле. 18×24 см, холст, масло, на подрамнике. 36 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/ts-05.jpg
- **Canonical:** https://mbezu.ru/painting/ts-05
```html
<!-- M.Bez · painting · TS-05 -->
<div id="root"></div>
<script>window.__MB_ART_ID="TS-05";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

### TS-06 · Бамбук
- Серия: **Тихая сила** · 18×24 см · 36 000 ₽ · available
- **SEO Title:** Бамбук — Тихая сила · Mila Bezú
- **SEO Description:** Молодые побеги бамбука на тёмном фоне — символ роста и спокойной силы. Тонкая детализация стволов и листьев. 18×24 см, холст, масло, на подрамнике. 36 000 ₽.
- **OG image:** https://mbezu.ru/assets/works/ts-06.jpg
- **Canonical:** https://mbezu.ru/painting/ts-06
```html
<!-- M.Bez · painting · TS-06 -->
<div id="root"></div>
<script>window.__MB_ART_ID="TS-06";</script>
<link rel="stylesheet" href="https://cdn.mbezu.ru/assets/style-Dh4G8_EM.css">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/common-Bl4308mH.js">
<link rel="modulepreload" crossorigin href="https://cdn.mbezu.ru/assets/ar-B8YB-RwZ.js">
<script type="module" crossorigin src="https://cdn.mbezu.ru/assets/painting-BCrpzL4m.js"></script>
```

## Отложены (НЕ генерируем — см. TODO-incomplete.md)
- **MN-03 · Шторм** — нет фото.
- **ST-08 · Обидуш** — цена/размер «уточнить».
- **TD-01 · Sands** — цена/размер «уточнить».
- **TD-02 · Hibiscus** — цена/размер «уточнить».
