import { useState, useId, useRef } from 'react';
import { lookupTerm } from '../../utils/glossary';

// Inline term wrapper. Renders the term text (or supplied children)
// with a small ⓘ icon. Hover/focus pops a tooltip with the term's
// plain-English definition pulled from utils/glossary.js. The
// definition lookup falls back gracefully — if the term key isn't in
// the glossary the component still renders its content WITHOUT the
// icon, so missing entries fail silent (no broken UI, no console
// noise) and the writer can add the entry whenever.
//
// Usage:
//   <GlossaryTerm term="IRR" />                 // shows "IRR ⓘ"
//   <GlossaryTerm term="Effective CAPEX">CAPEX (eff)</GlossaryTerm>
export default function GlossaryTerm({ term, children, className = '', as: Tag = 'span' }) {
  const definition = lookupTerm(term);
  const [open, setOpen] = useState(false);
  const id = useId();
  const containerRef = useRef(null);

  // No glossary entry — render content without the ⓘ icon and bail.
  if (!definition) {
    return <Tag className={className}>{children ?? term}</Tag>;
  }

  return (
    <Tag
      ref={containerRef}
      className={`calc-glossary-term ${className}`.trim()}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={open ? id : undefined}
      tabIndex={0}>
      <span className="calc-glossary-text">{children ?? term}</span>
      <svg
        className="calc-glossary-icon"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="11"
        height="11">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      {open && (
        <span id={id} role="tooltip" className="calc-glossary-tooltip">
          <strong>{term}</strong>
          <span>{definition}</span>
        </span>
      )}
    </Tag>
  );
}
