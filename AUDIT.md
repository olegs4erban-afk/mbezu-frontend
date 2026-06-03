# AUDIT — mbezu-frontend (Sprint 3)

## Phase 2 — Runtime audit

Headless Chromium (1366×900) против `npm run preview`. Скриншоты: `audit/screens/<route>.png`.
`MV` = загружен ли тяжёлый `model-viewer` чанк (должно быть **no** везде — он ленивый).

| Route | HTTP | root children/text | console errors | warns | failed res | MV loaded |
|-------|------|--------------------|----------------|-------|-----------|-----------|
| home | 200 | 4/4604 | 0 | 0 | 0 | no |
| about | 200 | 4/3846 | 0 | 0 | 0 | no |
| catalog | 200 | 4/2465 | 0 | 0 | 0 | no |
| painting | 200 | 4/1992 | 1 | 0 | 1 | no |
| painting-clean | 200 | 4/1992 | 1 | 0 | 1 | no |
| commission | 200 | 4/1468 | 0 | 0 | 0 | no |
| cart | 200 | 4/934 | 0 | 0 | 0 | no |
| tracking | 200 | 4/1757 | 0 | 0 | 0 | no |
| legal | 200 | 4/6223 | 0 | 0 | 0 | no |

### Детали ошибок/упавших ресурсов
- **painting** console-error: `Failed to load resource: the server responded with a status of 400 ()`
- **painting** failed-resource: `400 https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=&margin=0&color=2a2520&bgcolor=f5efe2`
- **painting-clean** console-error: `Failed to load resource: the server responded with a status of 400 ()`
- **painting-clean** failed-resource: `400 https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=&margin=0&color=2a2520&bgcolor=f5efe2`

## Phase 3 — Lighthouse (mobile)

Цели: Perf ≥90, SEO 100, A11y ≥95, Best-Practices ≥95. Отчёты: `audit/lighthouse/<page>.report.html`.

| Page | Performance | Accessibility | Best-Practices | SEO |
|------|-------------|---------------|----------------|-----|
| home | 82 | 93 | 100 | 100 |
| about | 95 | 92 | 100 | 100 |
| catalog | 94 | 84 | 96 | 100 |
| painting | 95 | 94 | 96 | 100 |
