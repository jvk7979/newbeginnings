import { C, alpha } from '../tokens';
import logoImg from '../assets/logo.png';

// Cap line length at ~70-75ch on long-prose blocks; the surrounding
// outer container stays wider so the Page-by-page grid + Region focus
// can use the extra horizontal space.
const PROSE_MAX = 680;

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

// Page-by-page guide. Order matches the typical workflow: capture an
// idea, talk it through, promote to a project, run the calculator,
// keep documents in one place.
const PAGES = [
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    dest: 'dashboard',
    title: 'Home',
    desc: "Where I land first. Shows what's new, recent ideas, and a quick activity pulse so I can see what the family's been up to without opening every page.",
  },
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/><path d="M12 17v4"/></svg>,
    dest: 'ideas',
    title: 'Ideas',
    desc: 'Anywhere I catch a venture spark — a half-formed thought from a phone call, a number I overheard, a lead I want to chase. Tag it, set its status, attach a PDF if I have one. Open any idea to start a topic-based discussion: Risk, Buyers, Pricing, Status, Question, or General. Replies, edits, and emoji reactions are built in.',
  },
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    dest: 'projects',
    title: 'Projects',
    desc: 'When an idea earns it, I promote it into a project — a structured document with sections, an executive summary, sources, and an attached feasibility report. Each project can link back to the idea it grew from, so the trail stays. Tick "Eligible for Calculations" on a project to make it appear in the calculator dropdown.',
  },
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
    dest: 'calculations',
    title: 'Calculations',
    desc: 'The financial calculator. Pick a project, enter capex, products, costs, financing, and any subsidies you qualify for. The page shows IRR, NPV, payback, DSCR, and a year-by-year cash-flow projection in real time. Save persists to that project. The Sensitivity tab tells me which inputs move IRR most. The Compare tab lets me put two projects side-by-side.',
  },
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><circle cx="11" cy="14" r="3"/><path d="M13.5 16.5l2.5 2.5"/></svg>,
    dest: 'documents',
    title: 'Documents',
    desc: "Where the PDFs live — feasibility reports, market studies, government scheme docs, anything I want all of us reading the same copy of. Read directly in the app, no download needed.",
  },
];

const REGIONS = [
  { name: 'Rajahmundry',    desc: 'The cultural capital of Andhra Pradesh — rich heritage, river trade, and growing industrial potential. Home base.' },
  { name: 'Godavari Delta', desc: "India's rice bowl. 720 million coconuts a year, plus fish, prawn, and jute. The agricultural backbone of every venture I evaluate here." },
  { name: 'Konaseema',      desc: 'The "Paradise of Andhra" — palm groves, waterways, and untapped agri-processing opportunities. Most coir and coconut work threads through here.' },
];

export default function AboutPage({ onNavigate }) {
  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ display: 'inline-block', background: '#fffdf9', borderRadius: 16, padding: '20px 32px', marginBottom: 22, boxShadow: '0 4px 24px rgba(60,40,10,0.10), 0 1px 4px rgba(60,40,10,0.06)', border: `1px solid ${alpha(C.accent, 33)}` }}>
          <img src={logoImg} alt="The New Beginnings" style={{ width: 'clamp(200px, 45vw, 380px)', height: 'auto', display: 'block' }} />
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(14px, 2vw, 16px)', fontStyle: 'italic', color: C.fg3 }}>A fresh start. Endless possibilities.</div>
      </div>

      {/* Why I built this — first-person opening */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader label="Why I built this" />
        <div style={{ maxWidth: PROSE_MAX }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: C.fg2, lineHeight: 1.75, margin: '0 0 14px 0' }}>
            I built this so we'd have one place to capture every venture idea, talk it through as a family, and run the numbers without flipping between five apps. Half-finished spreadsheets, ideas lost in WhatsApp threads, feasibility reports buried in email — everything we used to scatter now lives in one trail.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: C.fg2, lineHeight: 1.75, margin: 0 }}>
            Everything you see here started in our living-room conversations about what to build next in the Godavari and Konaseema region.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div style={{ background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 10, padding: '24px 28px', marginBottom: 32, maxWidth: PROSE_MAX }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, marginBottom: 10 }}>Mission</div>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontWeight: 600, color: C.fg1, lineHeight: 1.65, margin: 0 }}>
          "To identify, evaluate, and build sustainable ventures that create local value —
          leveraging the agricultural abundance, craftsmanship, and community of the Godavari delta."
        </p>
      </div>

      {/* How to use this site — workflow walkthrough */}
      <div style={{ marginBottom: 32, maxWidth: PROSE_MAX }}>
        <SectionHeader label="How I use this site" />
        <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' }}>
          <ol style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, lineHeight: 1.85, margin: 0, paddingLeft: 22 }}>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: C.fg1 }}>Capture an idea.</strong> Anything I want to think about goes in <button onClick={() => onNavigate('ideas')} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 600, cursor: 'pointer', padding: 0, font: 'inherit' }}>Ideas</button> — even half-formed ones. I tag it, set the status, and add any context I have.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: C.fg1 }}>Discuss it as a family.</strong> Every idea has topic threads (Risk, Buyers, Pricing, etc.). I drop comments, the family replies, we react with emoji, the trail stays. No more lost WhatsApp messages.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: C.fg1 }}>Promote it to a project.</strong> Once an idea earns it, I open <button onClick={() => onNavigate('projects')} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 600, cursor: 'pointer', padding: 0, font: 'inherit' }}>Projects</button> and create a structured plan — sections, executive summary, sources, attached feasibility PDF. The project links back to the idea so we can always see where it came from.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: C.fg1 }}>Run the numbers.</strong> Tick "Eligible for Calculations" on the project, then open <button onClick={() => onNavigate('calculations')} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 600, cursor: 'pointer', padding: 0, font: 'inherit' }}>Calculations</button>. Capex, products, costs, subsidies — IRR, NPV, payback, DSCR all live. Save when I want to lock it in. Use Sensitivity to see which inputs matter most; use Compare to put two projects side-by-side.
            </li>
            <li>
              <strong style={{ color: C.fg1 }}>Keep the documents in one place.</strong> Feasibility reports and market studies live in <button onClick={() => onNavigate('documents')} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 600, cursor: 'pointer', padding: 0, font: 'inherit' }}>Documents</button> — readable directly in the app, no downloads, same copy for everyone.
            </li>
          </ol>
        </div>
      </div>

      {/* Page by page guide */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader label="Page by page" />
        <div className="grid-2">
          {PAGES.map(p => (
            <button key={p.title} onClick={() => onNavigate(p.dest)}
              aria-label={`Open ${p.title}`}
              style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', textAlign: 'left', cursor: 'pointer', transition: 'border 120ms, background 120ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = alpha(C.accent, 55); e.currentTarget.style.background = alpha(C.accent, 5); }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg1; }}>
              <span style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>{p.icon}</span>
              <div style={{ paddingTop: 4, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: C.fg1 }}>{p.title}</span>
                  <span aria-hidden="true" style={{ color: C.accent, fontSize: 16, flexShrink: 0 }}>→</span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Region focus */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader label="Region focus" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      </div>

      </div>
    </div>
  );
}
