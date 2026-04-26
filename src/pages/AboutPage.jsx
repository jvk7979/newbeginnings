import { C } from '../tokens';

const PILLARS = [
  {
    icon: '💡',
    title: 'Ideas',
    desc: 'Capture every venture idea — from a quick spark to a fully researched opportunity. Tag, filter, and track each idea through its lifecycle.',
  },
  {
    icon: '📋',
    title: 'Plans',
    desc: 'Build structured business plans with multiple sections. Store feasibility reports, financial models, and strategic roadmaps in one place.',
  },
  {
    icon: '🚀',
    title: 'Projects',
    desc: 'Track active ventures with KPIs, progress, and next actions. Turn ideas into real projects with clear milestones.',
  },
  {
    icon: '📁',
    title: 'Files',
    desc: 'Upload PDFs, reports, and documents to GitHub and link them here. Extract and read content directly in the app.',
  },
];

const REGIONS = [
  { name: 'Rajahmundry', desc: 'The cultural capital of Andhra Pradesh, with rich heritage, river trade, and growing industrial potential.' },
  { name: 'Godavari Delta', desc: 'India\'s rice bowl. 720 million coconuts produced annually. Rich agricultural base powering agri-processing ventures.' },
  { name: 'Konaseema', desc: 'Known as the "Paradise of Andhra" — palm groves, waterways, and untapped agri-processing opportunities.' },
];

export default function AboutPage({ onNavigate }) {
  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <svg width="40" height="40" viewBox="0 0 46 46" fill="none">
            <path d="M23 2 C23 2 18 9 23 16 C28 9 23 2 23 2Z" fill={C.accent}/>
            <path d="M15 6 C15 6 18 13 23 16 C20 10 15 6 15 6Z" fill={C.accent} opacity="0.6"/>
            <path d="M31 6 C31 6 28 13 23 16 C26 10 31 6 31 6Z" fill={C.accent} opacity="0.6"/>
            <path d="M4 24 C10 19 16 19 23 24 C30 29 36 29 42 24" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M4 32 C10 27 16 27 23 32 C30 37 36 37 42 32" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
            <path d="M4 40 C10 35 16 35 23 40 C30 45 36 45 42 40" stroke={C.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.3"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: C.fg1, lineHeight: 1.2 }}>The New Beginning</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 2 }}>A Rajahmundry Ventures Workspace</div>
          </div>
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.75, maxWidth: 640, margin: 0 }}>
          A personal workspace to capture, plan, and build ventures rooted in the Godavari and Konaseema region.
          Built for the long game — not just ideas, but the discipline to execute them.
        </p>
      </div>

      {/* Mission */}
      <div style={{ background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 10, padding: '24px 28px', marginBottom: 32 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, marginBottom: 10 }}>Mission</div>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 600, color: C.fg1, lineHeight: 1.65, margin: 0 }}>
          "To identify, evaluate, and build sustainable ventures that create local value —
          leveraging the agricultural abundance, craftsmanship, and community of the Godavari delta."
        </p>
      </div>

      {/* What this app is */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>Four Pillars</div>
      <div className="grid-2" style={{ marginBottom: 32 }}>
        {PILLARS.map(p => (
          <div key={p.title} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.6 }}>{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Regions */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>Region Focus</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {REGIONS.map(r => (
          <div key={r.name} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 4, minHeight: 40, background: C.accent, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>How Files Work</div>
      <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 24px', marginBottom: 32 }}>
        <ol style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
          <li>Upload a PDF or document to your GitHub repo under <code style={{ fontFamily: "'JetBrains Mono', monospace", background: C.bg2, padding: '1px 5px', borderRadius: 3 }}>public/files/</code></li>
          <li>In the Files section, click <strong>+ Add File</strong> and enter the file name and details</li>
          <li>Open the file card to extract and read the PDF content directly in the app</li>
          <li>Documents are private — only visible when you're signed in</li>
        </ol>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 20 }}>
        <button onClick={() => onNavigate('ideas')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
          Explore Ideas
        </button>
        <button onClick={() => onNavigate('projects')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          View Projects
        </button>
        <button onClick={() => onNavigate('documents')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          Open Files
        </button>
      </div>
    </div>
  );
}
