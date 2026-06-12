import { C, alpha } from '../../tokens';

// Type-filter chips. Labels are hardcoded (not derived from CLIP_TYPES)
// because the display casing differs from the badge casing (e.g. "PDF" vs
// "Quote") and "All" has no clip type.
const FILTER_CHIPS = [
  { value: 'all',   label: 'All' },
  { value: 'web',   label: 'Web' },
  { value: 'pdf',   label: 'PDF' },
  { value: 'quote', label: 'Quote' },
  { value: 'photo', label: 'Photo' },
];

export default function VaultHeader({
  planTitle, clipCount, view, onChangeView,
  typeFilter, onChangeTypeFilter, search, onChangeSearch,
  sort, onChangeSort, onNewClip, onBack, canAdd,
}) {
  const chipStyle = (active) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    padding: '5px 13px', borderRadius: 999, cursor: 'pointer',
    border: `1px solid ${active ? alpha(C.accent, 66) : C.border}`,
    background: active ? alpha(C.accent, 11) : 'transparent',
    color: active ? C.accent : C.fg2, transition: 'all 120ms',
  });

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: C.fg3, marginBottom: 10 }}>
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', color: C.fg3, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'uppercase' }}>
          Project
        </button>
        <span aria-hidden="true">/</span>
        <span style={{ textTransform: 'uppercase', color: C.fg2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{planTitle}</span>
        <span aria-hidden="true">/</span>
        <span style={{ textTransform: 'uppercase', color: C.accent }}>Research</span>
      </div>

      {/* Title row + New Clip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 className="page-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15 }}>
            Research Log
          </h1>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 4 }}>
            {clipCount} {clipCount === 1 ? 'clip' : 'clips'} · a running record of every source, quote, and field note
          </div>
        </div>
        {canAdd && (
          <button onClick={onNewClip}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            + New Clip
          </button>
        )}
      </div>

      {/* Controls: filter chips + search + sort + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_CHIPS.map(chip => (
            <button key={chip.value} onClick={() => onChangeTypeFilter(chip.value)} style={chipStyle(typeFilter === chip.value)}>
              {chip.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <input
            type="text"
            value={search}
            onChange={e => onChangeSearch(e.target.value)}
            placeholder="Search clips…"
            style={{ width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '7px 11px', outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = C.accentDim; }}
            onBlur={e => { e.target.style.borderColor = C.border; }}
          />
        </div>

        {view === 'grid' && (
          <div className="select-wrap">
            <select value={sort} onChange={e => onChangeSort(e.target.value)}
              style={{ appearance: 'none', cursor: 'pointer', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg2, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '7px 28px 7px 11px' }}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        )}

        <div role="group" aria-label="View" style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
          {['grid', 'timeline'].map(v => (
            <button key={v} onClick={() => onChangeView(v)} aria-pressed={view === v}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '7px 13px', border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: view === v ? C.accent : 'transparent', color: view === v ? '#fff' : C.fg2 }}>
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
