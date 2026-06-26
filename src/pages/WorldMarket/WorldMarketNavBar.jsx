// src/pages/WorldMarket/WorldMarketNavBar.jsx
//
// Tab bar + KPI header strip with Year and Source selectors.

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { fmtUsd, getWorldMarketSyncInfo, seedYearToFirestore } from './comtradeDataset';

const YEARS = ['2025', '2024', '2023', '2022'];
const ADMIN_EMAILS = new Set(['thenewbeginningsventure@gmail.com', 'nsivasree99@gmail.com']);

export default function WorldMarketNavBar({
  tab, setTab,
  topPartners, partnerCount,
  year, setYear,
  source, setSource,
  onNavigate,
}) {
  const { user } = useAuth();
  const isAdmin = user?.email && ADMIN_EMAILS.has(user.email.toLowerCase());

  const [syncInfo,    setSyncInfo]    = useState(null);
  const [seeding,     setSeeding]     = useState(false);
  const [seedResult,  setSeedResult]  = useState(null);
  const [syncPaused,  setSyncPaused]  = useState(null); // null = loading
  const [togglingPause, setTogglingPause] = useState(false);

  useEffect(() => {
    setSyncInfo(null);
    getWorldMarketSyncInfo(year, source).then(setSyncInfo).catch(() => {});
  }, [year, source]);

  // Load the weekly sync pause state (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    getDoc(doc(db, 'marketsConfig', 'worldMarketSync'))
      .then(snap => setSyncPaused(snap.exists() ? (snap.data().paused === true) : false))
      .catch(() => setSyncPaused(false));
  }, [isAdmin]);

  async function handleSeed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const r = await seedYearToFirestore(year, source);
      setSeedResult(`✓ Seeded ${r.count} partners for ${source}/${year}`);
      getWorldMarketSyncInfo(year, source).then(setSyncInfo).catch(() => {});
    } catch (err) {
      setSeedResult(`✗ ${err.message}`);
    } finally {
      setSeeding(false);
    }
  }

  async function handleTogglePause() {
    setTogglingPause(true);
    try {
      const next = !syncPaused;
      await setDoc(doc(db, 'marketsConfig', 'worldMarketSync'), { paused: next }, { merge: true });
      setSyncPaused(next);
    } catch (err) {
      console.error('Failed to toggle sync pause:', err);
    } finally {
      setTogglingPause(false);
    }
  }

  const totalUsd   = topPartners.reduce((s, p) => s + (p.value_usd || 0), 0);
  const topCountry = topPartners[0]?.name || '—';

  const syncLabel = syncInfo?.fromFirestore
    ? syncInfo.syncedAt
      ? `Live · synced ${new Date(syncInfo.syncedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : 'Live · Firestore'
    : 'Static data';

  return (
    <>
      {/* Tab row */}
      <div className="wm-navbar" role="tablist">
        <button role="tab" aria-selected={tab === 'world'}
          className={`wm-tab${tab === 'world' ? ' active' : ''}`}
          onClick={() => setTab('world')}>
          <span className="wm-tab-idx">01</span> World
        </button>
        <button role="tab" aria-selected={tab === 'ap'}
          className={`wm-tab${tab === 'ap' ? ' active' : ''}`}
          onClick={() => setTab('ap')}>
          <span className="wm-tab-idx">02</span> Andhra Pradesh
        </button>
        <button
          className="wm-tab"
          style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.65 }}
          onClick={() => onNavigate?.('world-market-concepts')}
          title="Preview design concepts A / B / C"
        >
          Design Concepts ↗
        </button>
      </div>

      {/* Header strip */}
      <div className="wm-header-strip">
        {/* Title */}
        <div className="wm-header-text">
          <div className="wm-eyebrow">India · Agricultural Exports</div>
          <div className="wm-title">World <em>Market</em></div>
        </div>

        {/* KPI chips */}
        <div className="wm-kpi-chips">
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value">{totalUsd ? fmtUsd(totalUsd) : '—'}</div>
            <div className="wm-kpi-label">Total Exports</div>
          </div>
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value">{partnerCount || '—'}</div>
            <div className="wm-kpi-label">Markets</div>
          </div>
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value" style={{ fontSize: 13, lineHeight: 1.2 }}>{topCountry}</div>
            <div className="wm-kpi-label">Top Importer</div>
          </div>
        </div>

        {/* Year + Source selectors — right side of header */}
        <div className="wm-header-selectors">
          <div className="wm-hsel-group">
            <span className="wm-hsel-label">Year</span>
            <select className="wm-hsel-select" value={year} onChange={e => setYear(e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="wm-hsel-group">
            <span className="wm-hsel-label">Source</span>
            <select className="wm-hsel-select" value={source} onChange={e => setSource(e.target.value)}>
              <option value="apeda">APEDA</option>
              <option value="oec">OEC</option>
            </select>
          </div>
          {/* Sync status badge */}
          {syncInfo && (
            <div className="wm-sync-badge" title={syncInfo.fromFirestore ? 'Data loaded from Firestore (live)' : 'Using bundled static data'}>
              <span className={`wm-sync-dot${syncInfo.fromFirestore ? ' wm-sync-dot-live' : ''}`}/>
              {syncLabel}
            </div>
          )}
          {/* Admin controls — only visible to admin emails */}
          {isAdmin && (
            <div className="wm-seed-wrap">
              <div className="wm-admin-row">
                <button
                  className="wm-seed-btn"
                  onClick={handleSeed}
                  disabled={seeding}
                  title={`Push static ${source}/${year} data to Firestore`}
                >
                  {seeding ? 'Seeding…' : '↑ Seed Cloud'}
                </button>
                {source === 'oec' && syncPaused !== null && (
                  <button
                    className={`wm-pause-btn${syncPaused ? ' wm-pause-btn-paused' : ''}`}
                    onClick={handleTogglePause}
                    disabled={togglingPause}
                    title={syncPaused ? 'Weekly OEC sync is paused — click to resume' : 'Pause weekly OEC sync'}
                  >
                    {togglingPause ? '…' : syncPaused ? '▶ Resume sync' : '⏸ Pause sync'}
                  </button>
                )}
              </div>
              {seedResult && <div className="wm-seed-result">{seedResult}</div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
