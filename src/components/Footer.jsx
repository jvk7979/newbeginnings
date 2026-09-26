import { C } from '../tokens';

// `className` lets App hide the footer on phones (see .app-footer in ui.css),
// where the bottom tab bar already provides the page chrome.
export default function Footer({ className }) {
  return (
    <footer className={className} style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.bg1, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', color: C.fg3, textAlign: 'center', lineHeight: 1.6 }}>
        <span style={{ fontWeight: 600, color: C.fg2 }}>The New Beginnings</span>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
        <span style={{ fontStyle: 'italic' }}>A fresh start. Endless possibilities.</span>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
        <span>© 2026</span>
      </div>
    </footer>
  );
}
