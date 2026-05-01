import { C } from '../tokens';
import Badge from './Badge';
import { getCategoryStyle, IDEA_CATEGORIES } from '../utils/categoryStyles';
import QuickEditForm from './QuickEditForm';

const IDEA_STATUSES = [
  { id: 'draft',      label: 'Draft' },
  { id: 'validating', label: 'Researching' },
  { id: 'active',     label: 'Active' },
  { id: 'archived',   label: 'Archived' },
];

export default function IdeaCard({
  id, title, date, status, desc, category, onClick,
  editing = false, onStartEdit, onCancelEdit, onSaveEdit,
}) {
  const cat = getCategoryStyle(category);

  if (editing) {
    return (
      <div className="card-rich"
        style={{
          background: C.bg1,
          border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.accent}`,
          borderRadius: 10,
          padding: '16px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 160,
        }}>
        <QuickEditForm
          initialTitle={title} initialStatus={status} initialCategory={category}
          statuses={IDEA_STATUSES}
          categories={IDEA_CATEGORIES}
          onSave={async (patch) => { await onSaveEdit?.(patch); }}
          onCancel={() => onCancelEdit?.()} />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="card-interactive card-rich"
      style={{
        background: C.bg1,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.accent}`,
        borderRadius: 10,
        padding: '16px 18px',
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 160,
      }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
        {category
          ? <span style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: cat.color, background: cat.bg, padding: '2px 8px', borderRadius: 4 }}>{category}</span>
          : <span />
        }
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge status={status} />
          {onStartEdit && (
            <button
              type="button"
              aria-label={`Quick edit ${title}`}
              title="Quick edit"
              onClick={e => { e.stopPropagation(); onStartEdit(); }}
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: 'transparent', color: C.fg3, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: C.fg1, lineHeight: 1.35, marginBottom: desc ? 8 : 0, flex: desc ? 'none' : 1 }}>
        {title}
      </div>

      {desc && (
        <div style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 10 }}>
          {desc}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3 }}>{date}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, fontWeight: 600 }}>
          Open
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </div>
    </div>
  );
}
