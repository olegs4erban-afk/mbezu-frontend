// ─────────────────────────────────────────────────────────────
// tildaLead.ts (Sprint 15, Ф0.4) — доставка заявки в нативные формы Tilda.
//
// До этого формы писали лид в localStorage браузера клиента и показывали
// «✓ Заявка принята». Ни одна заявка не доходила. Здесь — реальный транспорт.
//
// 152-ФЗ (решение Олега, вариант 2 «обезличенное уведомление»):
//   форма A  [data-mbezu-lead]    — все ПД → Входящие Tilda + Email (РФ). Telegram НЕ подключать.
//   форма B  [data-mbezu-notify]  — только lead_ref/source/page/city/budget/ts → только Telegram.
// Связь между ними — lead_ref: в Telegram «Заявка K3F9-7QW2 · Москва · 60 000 ₽»,
// по нему во Входящих находится карточка с контактами.
//
// ⚠️ Состав полей формы B — ЗАКРЫТЫЙ СПИСОК (NOTIFY_FIELDS). Любое поле со свободным
// текстом (notes, message) обрушивает обезличивание: клиент впишет туда телефон.
// Поэтому B собирается белым списком, а не «payload минус лишнее» — чтобы новое поле
// в payload физически не могло утечь в Telegram. Есть тест: notes/message не проходят.
//
// Транспорт спрятан за sendLead()/submitLead(): в Sprint 16 под ним меняется
// Tilda-форма на Yandex Cloud Function без правки компонентов.
// ─────────────────────────────────────────────────────────────

export type LeadSource = 'home-cta' | 'commission-brief' | 'newsletter';

export interface LeadPayload {
  lead_ref?: string;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  message?: string;
  notes?: string;
  size?: string;
  style?: string;
  palette?: string;
  budget?: string | number;
  weeks?: string | number;
  source: LeadSource;
  page?: string;
  ts?: string;
  [k: string]: unknown;
}

/** ЕДИНСТВЕННЫЙ разрешённый состав уведомления (Telegram). Не расширять без пересмотра 152-ФЗ-решения. */
export const NOTIFY_FIELDS = ['lead_ref', 'source', 'page', 'city', 'budget', 'ts'] as const;

/** Короткий человекочитаемый идентификатор заявки: K3F9-7QW2 */
export function leadRef(now: number = Date.now()): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без похожих 0/O, 1/I
  const rnd = (n: number) => Array.from({ length: n }, () => A[Math.floor(Math.random() * A.length)]).join('');
  const t = now.toString(36).toUpperCase().slice(-4);
  return `${t}-${rnd(4)}`;
}

/**
 * Собирает payload формы B строго по белому списку.
 * Свободный текст (notes/message/name/phone/email) отсекается структурно.
 */
export function buildNotifyPayload(payload: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of NOTIFY_FIELDS) {
    const v = payload[k];
    if (v != null && v !== '') out[k] = String(v);
  }
  return out;
}

/** React-контролируемым инпутам значение ставится нативным сеттером, иначе Tilda его не увидит. */
function setNative(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  desc?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export interface SendOptions {
  selector?: string;
  timeout?: number;
  /** для тестов/будущего транспорта */
  doc?: Document;
}

/**
 * Заполняет скрытую форму Tilda и сабмитит её. Резолвится, когда Tilda подтвердила отправку.
 * Отсутствие блока формы — это ошибка (а не «тихий успех»): UI обязан показать фолбэк с контактами.
 */
export function sendLead(payload: Record<string, unknown>, opts: SendOptions = {}): Promise<boolean> {
  const { selector = '[data-mbezu-lead]', timeout = 12000, doc = typeof document !== 'undefined' ? document : undefined } = opts;
  if (!doc) return Promise.reject(new Error('no-document'));

  const form = (doc.querySelector(`form${selector}`)
    || doc.querySelector(`${selector} form.js-form-proccess`)
    || doc.querySelector(`${selector} form`)) as HTMLFormElement | null;
  if (!form) return Promise.reject(new Error(`tilda-form-not-found:${selector}`));

  for (const [k, v] of Object.entries(payload)) {
    const el = form.querySelector(`[name="${k}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el && v != null && v !== '') setNative(el, String(v));
  }

  return new Promise<boolean>((resolve, reject) => {
    const t = setTimeout(() => { obs.disconnect(); reject(new Error('tilda-form-timeout')); }, timeout);
    const done = () => { clearTimeout(t); obs.disconnect(); resolve(true); };
    form.addEventListener('tildaform:aftersuccess', done, { once: true } as AddEventListenerOptions);
    const obs = new MutationObserver(() => {
      const box = form.parentElement?.querySelector('.js-successbox') as HTMLElement | null;
      if (box && getComputedStyle(box).display !== 'none') done();
    });
    obs.observe(form.parentElement || form, { attributes: true, subtree: true, childList: true });
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else (form.querySelector('[type=submit]') as HTMLElement | null)?.click();
  });
}

export interface SubmitResult { ok: boolean; ref: string; notified: boolean; error?: string }

/**
 * Полный цикл отправки заявки (Ф0.4):
 *   1) форма A с ПД — КРИТИЧНА, ждём await; провал → ok=false, UI показывает фолбэк с контактами.
 *   2) форма B (уведомление) — вторична, не блокирует UI; её падение только логируется:
 *      заявка уже сохранена во Входящих, потеряно лишь уведомление.
 * Обратный порядок недопустим: «ok» при упавшей A = та же ложь, что и localStorage.
 */
export async function submitLead(payload: LeadPayload, opts: SendOptions = {}): Promise<SubmitResult> {
  const ref = payload.lead_ref || leadRef();
  const ts = payload.ts || new Date().toISOString();
  const full = { ...payload, lead_ref: ref, ts };

  // локальный дубль — только для диагностики, каналом доставки НЕ считается
  try {
    const box = JSON.parse(localStorage.getItem('mbezu-leads') || '[]');
    box.push({ ...full, _local: true });
    localStorage.setItem('mbezu-leads', JSON.stringify(box));
  } catch { /* приватный режим — не мешаем отправке */ }

  try {
    await sendLead(full, { ...opts, selector: opts.selector || '[data-mbezu-lead]' });
  } catch (e) {
    return { ok: false, ref, notified: false, error: String((e as Error).message || e) };
  }

  let notified = false;
  try {
    await sendLead(buildNotifyPayload(full), { ...opts, selector: '[data-mbezu-notify]', timeout: 8000 });
    notified = true;
  } catch (e) {
    // не влияет на UI — заявка уже во Входящих
    console.warn('[lead] уведомление не ушло:', (e as Error).message, '· ref', ref);
  }
  return { ok: true, ref, notified };
}
