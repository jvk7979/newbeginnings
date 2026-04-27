import { C } from '../tokens';

export default function Footer() {
  return (
    <footer style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.bg1, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, textAlign: 'center', lineHeight: 1.7 }}>
        <span style={{ fontWeight: 600, color: C.fg2 }}>The New Beginnings</span>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
        <span style={{ fontStyle: 'italic' }}>A fresh start. Endless possibilities.</span>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
        <span>© 2026</span>
      </div>
    </footer>
  );
}
