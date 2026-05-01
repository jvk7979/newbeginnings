import { useMemo } from 'react';
import { C, alpha } from '../tokens';
import logoImg from '../assets/logo.png';
import { useIdeas, usePlans } from '../context/AppContext';

function SectionHeader({ label, actionLabel, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {actionLabel && (
        <button onClick={onAction}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {actionLabel}
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      )}
    </div>
  );
}

function buildActivityMap(ideas, plans) {
  const map = {};
  const bump = (dateStr) => {
    if (!dateStr) return;
    const key = String(dateStr).slice(0, 10);
    if (key.length === 10) map[key] = (map[key] || 0) + 1;
  };
  ideas.forEach(i => bump(i.date));
  plans.forEach(p => bump(p.updated || p.date));
  return map;
}

function ActivityHeatmap({ ideas, plans }) {
  const activityMap = useMemo(() => buildActivityMap(ideas, plans), [ideas, plans]);
  const maxCount = useMemo(() => Math.max(1, ...Object.values(activityMap)), [activityMap]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells = useMemo(() => {
    const result = [];
    const start = new Date(today);
    start.setDate(start.getDate() - 83);
    for (let d = 0; d < 84; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + d);
      const key = date.toISOString().slice(0, 10);
      result.push({ date, key, count: activityMap[key] || 0 });
    }
    return result;
  }, [activityMap]);

  const getColor = (count) => {
    if (count === 0) return C.bg2;
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return alpha(C.accent, 55);
    if (intensity < 0.5)  return alpha(C.accent, 99);
    if (intensity < 0.75) return alpha(C.accent, 155);
    return C.accent;
  };

  const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weeks = [];
  for (let w = 0; w < 12; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));

  const totalActivity = Object.values(activityMap).reduce((a, b) => a + b, 0);

  return (
    <div style={{ marginBottom: 32 }}>
      <SectionHeader label="Activity — last 12 weeks" />
      <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4, paddingTop: 0 }}>
            {WEEK_DAYS.map((d, i) => (
              <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, lineHeight: 1, height: 12, display: 'flex', alignItems: 'center' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3, flex: 1, overflowX: 'auto' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((cell) => (
                  <div key={cell.key}
                    title={`${cell.key}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
                    style={{ width: 12, height: 12, borderRadius: 2, background: getColor(cell.count), flexShrink: 0 }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 10 }}>
          {totalActivity === 0 ? 'No activity yet — start adding ideas and plans.' : `${totalActivity} total activit${totalActivity === 1 ? 'y' : 'ies'} in the last 12 weeks`}
        </div>
      </div>
    </div>
  );
}

const PILLARS = [
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/><path d="M12 17v4"/></svg>,
    title: 'Ideas',
    desc: 'Capture every venture idea — from a quick spark to a fully researched opportunity. Tag, filter, and track each idea through its lifecycle.',
  },
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    title: 'Plans',
    desc: 'Build structured business plans with multiple sections. Store feasibility reports, financial models, and strategic roadmaps in one place.',
  },
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><circle cx="11" cy="14" r="3"/><path d="M13.5 16.5l2.5 2.5"/></svg>,
    title: 'Documents',
    desc: 'Store PDFs, feasibility reports, and source materials. Read them directly in the app — and discuss with family.',
  },
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="13" y2="14"/></svg>,
    title: 'Discussion',
    desc: 'Every idea and plan has a comment thread. Brainstorm, ask questions, and align as a family.',
  },
];

const REGIONS = [
  { name: 'Rajahmundry', desc: 'The cultural capital of Andhra Pradesh, with rich heritage, river trade, and growing industrial potential.' },
  { name: 'Godavari Delta', desc: 'India\'s rice bowl. 720 million coconuts produced annually. Rich agricultural base powering agri-processing ventures.' },
  { name: 'Konaseema', desc: 'Known as the "Paradise of Andhra" — palm groves, waterways, and untapped agri-processing opportunities.' },
];

export default function AboutPage({ onNavigate }) {
  const { ideas } = useIdeas();
  const { plans } = usePlans();
  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'inline-block', background: '#fffdf9', borderRadius: 16, padding: '20px 32px', marginBottom: 22, boxShadow: '0 4px 24px rgba(60,40,10,0.10), 0 1px 4px rgba(60,40,10,0.06)', border: `1px solid ${alpha(C.accent, 33)}` }}>
          <img src={logoImg} alt="The New Beginnings" style={{ width: 'clamp(200px, 45vw, 380px)', height: 'auto', display: 'block' }} />
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(14px, 2vw, 16px)', fontStyle: 'italic', color: C.fg3, marginBottom: 20 }}>A fresh start. Endless possibilities.</div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: C.fg2, lineHeight: 1.75, maxWidth: 580, margin: '0 auto' }}>
          A family workspace to capture, plan, and build ventures rooted in the Godavari and Konaseema region.
          Built for the long game — not just ideas, but the discipline to execute them.
        </p>
      </div>

      {/* Mission */}
      <div style={{ background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 10, padding: '24px 28px', marginBottom: 32 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, marginBottom: 10 }}>Mission</div>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontWeight: 600, color: C.fg1, lineHeight: 1.65, margin: 0 }}>
          "To identify, evaluate, and build sustainable ventures that create local value —
          leveraging the agricultural abundance, craftsmanship, and community of the Godavari delta."
        </p>
      </div>

      {/* What this app is */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>Four Pillars</div>
      <div className="grid-2" style={{ marginBottom: 32 }}>
        {PILLARS.map(p => (
          <div key={p.title} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>{p.icon}</span>
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: C.fg1, marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.65 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Regions */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>Region Focus</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {REGIONS.map(r => (
          <div key={r.name} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 4, minHeight: 40, background: C.accent, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: C.fg1, marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>How Documents Work</div>
      <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 24px', marginBottom: 32 }}>
        <ol style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
          <li>Upload a PDF or document to your GitHub repo under <code style={{ fontFamily: "'JetBrains Mono', monospace", background: C.bg2, padding: '1px 5px', borderRadius: 3 }}>public/files/</code></li>
          <li>In the Documents section, click <strong>+ Add Document</strong> and enter the file name and details</li>
          <li>Open the document card to read the PDF directly in the app</li>
          <li>Documents are shared across all signed-in family members</li>
        </ol>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 20 }}>
        <button onClick={() => onNavigate('ideas')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
          Explore Ideas
        </button>
        <button onClick={() => onNavigate('plans')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          Business Plans
        </button>
        <button onClick={() => onNavigate('documents')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          Open Documents
        </button>
      </div>

      {/* Activity heatmap — workspace pulse at the bottom of the About page */}
      <div style={{ marginTop: 32 }}>
        <ActivityHeatmap ideas={ideas} plans={plans} />
      </div>

      </div>
    </div>
  );
}
