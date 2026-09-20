// ─────────────────────────────────────────────────────────────
// tilda-chrome.ts — HANDOFF §1.1–1.2: на странице ровно одна шапка
// и один подвал.
//
// На прод-страницах Tilda рядом с нашим контейнером лежат её собственные
// блоки меню и подвала (на главной — rec3526953701 и rec3526968401).
// Доступа к редактору Tilda из сборки нет, но этот модуль грузится ТОЛЬКО
// вместе с витриной (его тянет наш чанк), то есть выполняется исключительно
// на страницах, где шапку и подвал рисует React. На чисто тильдовских
// страницах (/podarok, /journal, посадочные) он не подключается вовсе.
//
// Прячем всё, кроме:
//   · нашей собственной записи (в ней #root),
//   · нативной корзины 706 (кнопка «Купить» и чекаут ЮKassa),
//   · скрытых форм-приёмников заявок (input[name="lead_ref"]),
//   · нативного каталога Store 776 (он и так скрыт инлайном).
// ─────────────────────────────────────────────────────────────

const KEEP_TYPES = new Set(['706', '776']);

export function hideTildaDuplicateChrome(): void {
  if (typeof document === 'undefined') return;
  const root = document.getElementById('root');
  if (!root) return;
  const ours = root.closest('[id^="rec"]');
  if (!ours) return; // не Tilda — локальный превью/CDN, прятать нечего

  document.querySelectorAll<HTMLElement>('.t-rec').forEach((el) => {
    if (el === ours || el.contains(ours) || ours.contains(el)) return;
    const type = el.getAttribute('data-record-type') || '';
    if (KEEP_TYPES.has(type)) return;
    if (el.querySelector('input[name="lead_ref"]')) return;
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
  });
}
