// faq-section.tsx (Sprint 15) — видимый FAQ (accordion на <details>) под FAQPage-разметку.
import React from 'react';
import { Eyebrow } from './atoms';

export function FaqSection({ items, title = 'Частые вопросы', compact = false }: { items: Array<[string, string]>; title?: string; compact?: boolean }) {
  return (
    <section className="resp-pad" style={{ padding: compact ? '80px 40px' : '110px 40px 90px' }} aria-labelledby="faq-h2">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Eyebrow accent>Вопросы и ответы</Eyebrow>
        <h2 id="faq-h2" className="display" style={{ margin: '14px 0 26px', fontSize: 'clamp(28px,3.4vw,44px)', fontWeight: 500, letterSpacing: '-.02em' }}>{title}</h2>
        <div style={{ borderTop: '1px solid var(--rule-soft)' }}>
          {items.map(([q, a]) => (
            <details key={q} style={{ borderBottom: '1px solid var(--rule-soft)' }}>
              <summary style={{ cursor: 'pointer', padding: '18px 0', fontSize: 17, fontWeight: 500, listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', minHeight: 44 }}>
                <span>{q}</span>
                <span aria-hidden="true" style={{ color: 'var(--accent)', fontSize: 22, lineHeight: 1, flexShrink: 0 }}>+</span>
              </summary>
              <p style={{ margin: '0 0 20px', fontSize: 15.5, lineHeight: 1.65, color: 'var(--ink-2)', maxWidth: 760 }}>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
