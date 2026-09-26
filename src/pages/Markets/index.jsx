import { useState } from 'react';
import { C } from '../../tokens';
import { useCommodities } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import CommodityCard from './CommodityCard';
import AddCommodityModal from './AddCommodityModal';
import AutoFetchSettings from './AutoFetchSettings';
import CommodityWatch from './CommodityWatch';
import EmptyState from './EmptyState';
import PageHeader, { PlusIcon } from '../../components/PageHeader';

const todayLabel = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function MarketsPage({ onNavigate }) {
  const { commodities, addCommodity } = useCommodities();
  const { isViewer } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState('mandi'); // 'mandi' = price grid, 'watch' = analytics
  const canAdd = !isViewer;

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      <PageHeader
        eyebrow="Markets"
        title="Today's Mandi"
        count={commodities.length}
        subtitle={`${todayLabel()} · raw-material prices, week by week`}
        actions={<>
          <div className="ui-seg" role="group" aria-label="View">
            {[['mandi', "Today's Mandi"], ['watch', 'Commodity Watch']].map(([v, label]) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}>{label}</button>
            ))}
          </div>
          {canAdd && (
            <button type="button" className="ui-btn ui-btn--primary" onClick={() => setAddOpen(true)}>
              <PlusIcon />Track
            </button>
          )}
        </>}
      />

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
