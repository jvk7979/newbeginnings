import { useState } from 'react';
import { C } from '../../tokens';
import { useCommodities } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import CommodityCard from './CommodityCard';
import AddCommodityModal from './AddCommodityModal';
import LivePricesBar from './LivePricesBar';
import TodayPricesSheet from './TodayPricesSheet';
import { useLivePrices } from './useLivePrices';
import './markets-live.css';
import CommodityWatch from './CommodityWatch';
import EmptyState from './EmptyState';
import PageHeader, { PlusIcon } from '../../components/PageHeader';

const todayLabel = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function MarketsPage({ onNavigate }) {
  const { commodities, addCommodity, saveFeedResult, addManualPrices } = useCommodities();
  const { isViewer } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState('mandi'); // 'mandi' = price grid, 'watch' = analytics
  const canAdd = !isViewer;
  const [todayOpen, setTodayOpen] = useState(false);
  // Live mandi prices are fetched from this browser (data.gov.in refuses
  // cloud servers); only Editors save, so Viewers just see the result.
  const { status: liveStatus, refresh: refreshLive } = useLivePrices({ commodities, canEdit: canAdd, saveFeedResult });
  const mappedCount = commodities.filter(c => c?.agmarknet?.name).length;

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
          <LivePricesBar status={liveStatus} mappedCount={mappedCount} canEdit={canAdd}
            onCheck={() => refreshLive({ force: true })} onUpdateToday={() => setTodayOpen(true)} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {commodities.map(c => (
              <CommodityCard key={c.id} commodity={c}
                onOpen={(com) => onNavigate('commodity-detail', { id: com.id })} />
            ))}
          </div>
        </>
      )}

      {todayOpen && (
        <TodayPricesSheet commodities={commodities} onClose={() => setTodayOpen(false)} onSave={addManualPrices} />
      )}

      {addOpen && (
        <AddCommodityModal onClose={() => setAddOpen(false)} onAdd={addCommodity} />
      )}
    </div>
  );
}
