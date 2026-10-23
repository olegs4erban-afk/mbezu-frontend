# SEO-поля товаров Tilda Store — 24.10.2026

`applied-35.json` — seo_title / seo_descr, записанные через MCP `store_save_products`
в 35 карточек пополнения 2026 года (CT, TD-03…05, PP, MI, NC). До записи поля были пустыми
(Tilda показывала «Название - Mila Bezú»). Источник — `node --import tsx scripts/gen-products-seo.tsx <ID…>`
(факты только из data.ts), шаблон — как у первых 22 товаров (store-fleet-map.json, Sprint 15).

Как писали: Get товара → Save с title, gallery (из Get), seo_title, seo_descr; фискальные поля
у всех 35 были null и остались null; описание, цена, количество, характеристики, разделы — без изменений
(сверено по ответу Save). Проверка на домене: 56 из 56 страниц товара — 200, новый title и description.

Откат одной карточки: Save с пустыми seo_title и seo_descr (и gallery из Get).

⚠ Размеры 35 работ 2026 года оценочные (их подтверждает Мила). Если размер изменится —
поправить data.ts, пересобрать `gen-products-seo.tsx` и перезаписать два поля у этой карточки.
