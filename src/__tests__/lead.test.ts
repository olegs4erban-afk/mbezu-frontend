import { describe, it, expect } from 'vitest';
import { buildNotifyPayload, NOTIFY_FIELDS, leadRef } from '../lib/tildaLead';

// Sprint 15 (Ф0, 152-ФЗ). Решение Олега: в Telegram уходит ОБЕЗЛИЧЕННОЕ уведомление.
// Эти тесты — не документация, а замок: если кто-то добавит notes/message в форму B,
// сборка упадёт, а не «обезличивание рассыплется» молча на проде.
describe('форма B (Telegram) — обезличивание', () => {
  const payloadСоВсемиПД = {
    lead_ref: 'K3F9-7QW2',
    name: 'Иван Иванов',
    phone: '+7 916 000-00-00',
    email: 'ivan@example.com',
    city: 'Москва',
    message: 'Позвоните мне на +7 916 111-22-33',
    notes: 'мой телефон 89990001122, пишите в телеграм @ivan',
    size: '50x70', style: 'urban', palette: '#A08A4E',
    budget: 60000, weeks: 8,
    source: 'commission-brief', page: '/commission', ts: '2026-07-28T12:00:00.000Z',
  };

  it('пропускает ровно шесть разрешённых полей', () => {
    const b = buildNotifyPayload(payloadСоВсемиПД);
    expect(Object.keys(b).sort()).toEqual(['budget', 'city', 'lead_ref', 'page', 'source', 'ts']);
  });

  it('НЕ пропускает свободный текст — там клиент пишет контакты', () => {
    const b = buildNotifyPayload(payloadСоВсемиПД);
    expect(b).not.toHaveProperty('notes');
    expect(b).not.toHaveProperty('message');
    const serialized = JSON.stringify(b);
    expect(serialized).not.toContain('89990001122');
    expect(serialized).not.toContain('@ivan');
    expect(serialized).not.toContain('916');
  });

  it('НЕ пропускает имя, телефон, email', () => {
    const b = buildNotifyPayload(payloadСоВсемиПД);
    for (const k of ['name', 'phone', 'email']) expect(b).not.toHaveProperty(k);
    expect(JSON.stringify(b)).not.toContain('Иван');
    expect(JSON.stringify(b)).not.toContain('example.com');
  });

  it('белый список не расширен незаметно', () => {
    expect([...NOTIFY_FIELDS]).toEqual(['lead_ref', 'source', 'page', 'city', 'budget', 'ts']);
  });

  it('новое поле в payload не протекает в уведомление', () => {
    const b = buildNotifyPayload({ ...payloadСоВсемиПД, secret_comment: 'телефон 89161112233' });
    expect(JSON.stringify(b)).not.toContain('8916');
  });

  it('пустые значения не отправляются', () => {
    const b = buildNotifyPayload({ lead_ref: 'X1', source: 'home-cta', city: '', budget: undefined });
    expect(b).toEqual({ lead_ref: 'X1', source: 'home-cta' });
  });
});

describe('lead_ref — связка Telegram ↔ Входящие', () => {
  it('формат XXXX-XXXX, читаемый вслух', () => {
    expect(leadRef()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
  it('не содержит похожих символов 0/O и 1/I', () => {
    for (let i = 0; i < 50; i++) expect(leadRef()).not.toMatch(/[01OI]/);
  });
  it('разные вызовы дают разные ref', () => {
    const s = new Set(Array.from({ length: 200 }, () => leadRef()));
    expect(s.size).toBeGreaterThan(190);
  });
});
