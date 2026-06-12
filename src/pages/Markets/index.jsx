import { useState } from 'react';
import { C } from '../../tokens';
import { useCommodities } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import CommodityCard from './CommodityCard';
import AddCommodityModal from './AddCommodityModal';
import AutoFetchSettings from './AutoFetchSettings';
import CommodityWatch from './CommodityWatch';
import EmptyState from './EmptyState';

const todayLabel = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function MarketsPage({ onNavigate }) {
  const { commodities, addCommodity } = useCommodities();
  const { isViewer } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState('mandi'); // 'mandi' = price grid, 'watch' = analytics
  const canAdd = !isViewer;

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: C.fg3, marginBottom: 10, textTransform: 'uppercase' }}>
          Markets
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title" style={{ fontFamily: "'Inter', Georgia, serif", fontSize: 34, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15 }}>
              Today's Mandi
            </h1>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 4 }}>
              {todayLabel()} · {commodities.length} {commodities.length === 1 ? 'commodity' : 'commodities'} tracked
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            <div role="group" aria-label="View" style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
              {[['mandi', "Today's Mandi"], ['watch', 'Commodity Watch']].map(([v, label]) => (
                <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '7px 13px', border: 'none', cursor: 'pointer', background: view === v ? C.accent : 'transparent', color: view === v ? '#fff' : C.fg2 }}>
                  {label}
                </button>
              ))}
            </div>
            {canAdd && (
              <button onClick={() => setAddOpen(true)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
                + Track
              </button>
            )}
          </div>
        </div>
      </div>

      {commodities.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} canAdd={canAdd} />
      ) : view === 'watch' ? (
        <CommodityWatch commodities={commodities} />
      ) : (
        <>
          {canAdd && <AutoFetchSettings />}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {commodities.map(c => (
              <CommodityCard key={c.id} commodity={c}
                onOpen={(com) => onNavigate('commodity-detail', { id: com.id })} />
            ))}
          </div>
        </>
      )}

      {addOpen && (
        <AddCommodityModal onClose={() => setAddOpen(false)} onAdd={addCommodity} />
      )}
    </div>
  );
}
