import { useState, useEffect } from 'react';
import { query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { activityCol } from '../data/paths';
import { C } from '../tokens';

// Dashboard activity feed — the latest "who did what" events written by
// AppContext.logActivity (creates / deletes / status changes / idea
// promotions). Renders nothing at all until the first event exists, so a
// fresh workspace doesn't show an empty chrome box.

const FEED_LIMIT = 8;

function relativeTime(ms) {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// One sentence per event kind. `title` is quoted so feed lines read
// naturally even when titles contain verbs themselves.
function describe(ev) {
  const t = ev.title ? `“${ev.title}”` : `a ${ev.entity}`;
  switch (ev.kind) {
    case 'created':  return <>added {ev.entity} <strong>{t}</strong></>;
    case 'deleted':  return <>deleted {ev.entity} <strong>{t}</strong></>;
    case 'promoted': return <>promoted an idea to project <strong>{t}</strong></>;
    case 'status':   return <>moved {ev.entity} <strong>{t}</strong> to <strong>{ev.detail}</strong></>;
    default:         return <>updated {ev.entity} <strong>{t}</strong></>;
  }
}

const KIND_ICONS = {
  created: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="12" height="12" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  deleted: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="12" height="12" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  promoted: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  status: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

export default function ActivityFeed() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const q = query(activityCol(db), orderBy('at', 'desc'), limit(FEED_LIMIT));
    return onSnapshot(q, (snap) => setEvents(snap.docs.map(d => d.data())), () => setEvents([]));
  }, []);

  if (events.length === 0) return null;

  return (
    <section className="dh-activity-section">
      <div className="dh-section-head">
        <div>
          <span className="dh-section-kicker">Workspace</span>
          <h2 className="dh-section-title">Recent Activity</h2>
        </div>
      </div>
      <div className="dh-activity">
      {events.map(ev => (
        <div key={ev.id} className="dh-activity-row">
          <span className={`dh-activity-icon dh-activity-icon-${ev.kind}`} aria-hidden="true">
            {KIND_ICONS[ev.kind] || KIND_ICONS.status}
          </span>
          <span className="dh-activity-text">
            <strong>{(ev.by || 'Someone').split(/\s+/)[0]}</strong> {describe(ev)}
          </span>
          <span className="dh-activity-time" style={{ color: C.fg3 }}>{relativeTime(ev.at)}</span>
        </div>
      ))}
      </div>
    </section>
  );
}
