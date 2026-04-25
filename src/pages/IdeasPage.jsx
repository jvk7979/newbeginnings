import { useState } from 'react';
import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import IdeaCard from '../components/IdeaCard';

const FILTERS = ['all', 'draft', 'validating', 'active', 'archived'];

export default function IdeasPage({ onNavigate }) {
  const { ideas } = useAppData();
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: C.bg0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em' }}>Ideas</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>
            {filter === 'all' ? `${ideas.length} ideas` : `${filtered.length} of ${ideas.length} ideas`}
          </div>
        </div>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={() => onNavigate('new-idea')}>+ New Idea</button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '5px 12px', borderRadius: 999, border: `1px solid ${filter === f ? '#B8892A33' : C.border}`, background: filter === f ? C.accentBg : 'transparent', color: filter === f ? C.accent : C.fg3, cursor: 'pointer', fontWeight: filter === f ? 500 : 400 }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 40, textAlign: 'center' }}>No ideas with status "{filter}".</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {filtered.map(i => <IdeaCard key={i.id} {...i} onClick={() => onNavigate('idea-detail', i)} />)}
        </div>
      )}
    </div>
  );
}
