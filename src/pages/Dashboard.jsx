import { useMemo } from 'react';
import { C } from '../tokens';
import { useIdeas, usePlans, useFiles } from '../context/AppContext';
import { runCalc, DEFAULT_CALC_INPUT } from '../utils/calcEngine';
import heroImg from '../assets/hero_godavari.png';

// Heritage Dashboard. Designed around the Godavari hero photo as the
// magazine cover — coconut cream surfaces, deep coconut green accents,
// terracotta KPI icons, gold dividers, calligraphic Pinyon Script
// flourishes for the brand voice. The hero, KPI strip, and three-
// column body re-use the editorial structure the rest of the app
// has settled on.
//
// KPI metrics (Revenue / EBITDA / NPV / Payback) are aggregated by
// running the calc engine across every project where eligibleForCalc
// is true. Projects without saved calc input fall back to engine
// defaults so the tile shows ₹0 instead of dashes — keeps the strip
// looking complete on a near-empty workspace.

const STATUS_COLORS = {
  draft:         '#1E40AF',
  validating:    '#854D0E',
  active:        '#065F46',
  archived:      '#4B5563',
};

const IDEA_STATUS_LABELS = { draft: 'Draft', validating: 'Validating', active: 'Active', archived: 'Archived' };
const PLAN_STATUS_LABELS = { draft: 'Draft', active: 'Active', archived: 'Archived' };

function fmtINR(n) {
  if (!n || !isFinite(n)) return '—';
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  if (Math.abs(n) >= 1000)     return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${Math.round(n)}`;
}

function fmtYears(y) {
  if (y === null || y === undefined || !isFinite(y)) return '—';
  return `${y.toFixed(1)} yrs`;
}

function loadCalcInput(plan) {
  const saved = plan?.calc;
  return saved && typeof saved === 'object'
    ? { ...DEFAULT_CALC_INPUT, ...saved }
    : DEFAULT_CALC_INPUT;
}

const ICON_LIGHTBULB = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/>
  </svg>
);
const ICON_PROJECT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const ICON_SPARKLE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
  </svg>
);
const ICON_RUPEE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <path d="M6 4h12M6 9h12M14 4c0 4-3 7-7 7l9 9"/>
  </svg>
);
const ICON_GROWTH = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/>
  </svg>
);
const ICON_NPV = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 10h4.5a1.5 1.5 0 0 1 0 3H9h6"/>
  </svg>
);
const ICON_CLOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>
  </svg>
);
const ICON_DOC = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
  </svg>
);

function KpiTile({ icon, label, value, hint }) {
  return (
    <div className="dh-kpi-tile">
      <div className="dh-kpi-icon">{icon}</div>
      <div className="dh-kpi-body">
        <div className="dh-kpi-value">{value}</div>
        <div className="dh-kpi-label">{label}</div>
        {hint && <div className="dh-kpi-hint">{hint}</div>}
      </div>
    </div>
  );
}

function SectionHeader({ kicker, title, actionLabel, onAction }) {
  return (
    <div className="dh-section-head">
      <div>
        {kicker && <span className="dh-section-kicker">{kicker}</span>}
        <h2 className="dh-section-title">{title}</h2>
      </div>
      {actionLabel && (
        <button onClick={onAction} className="dh-section-link">
          {actionLabel}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="12" height="12" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      )}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { ideas } = useIdeas();
  const { plans } = usePlans();
  const { files } = useFiles();

  const eligible = useMemo(() => plans.filter(p => p.eligibleForCalc), [plans]);

  // Aggregate calc metrics across every eligible project. The engine is
  // pure and fast (~milliseconds for ten years), so running it inline
  // for the dashboard KPI strip is cheaper than pre-computing on save
  // and keeps the tile values consistent with whatever the Calculations
  // page would show right now.
  const portfolio = useMemo(() => {
    if (eligible.length === 0) {
      return { revenue: 0, ebitda: 0, npv: 0, payback: null, count: 0 };
    }
    let revenue = 0, ebitda = 0, npv = 0;
    const paybacks = [];
    for (const p of eligible) {
      const out = runCalc(loadCalcInput(p));
      revenue += out.revenue || 0;
      ebitda  += out.ebitda  || 0;
      npv     += out.npv     || 0;
      if (out.payback !== null && isFinite(out.payback)) paybacks.push(out.payback);
    }
    const avgPayback = paybacks.length
      ? paybacks.reduce((a, b) => a + b, 0) / paybacks.length
      : null;
    return { revenue, ebitda, npv, payback: avgPayback, count: eligible.length };
  }, [eligible]);

  const featuredIdeas   = useMemo(() => ideas.slice(0, 3), [ideas]);
  const activeProjects  = useMemo(() => plans.filter(p => p.status === 'active' || !p.status).slice(0, 3), [plans]);
  const recentDocuments = useMemo(() => files.slice(0, 4), [files]);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="dh-page" style={{ background: C.bg0 }}>

      {/* ── Hero — full-bleed Godavari with editorial overlay ────────── */}
      <section className="dh-hero">
        <img src={heroImg} alt="Godavari river at dusk" className="dh-hero-img" />
        <div className="dh-hero-veil" aria-hidden="true" />
        <div className="dh-hero-content">
          <span className="dh-hero-eyebrow">{todayStr}</span>
          <h1 className="dh-hero-title">Welcome back.</h1>
          <p className="dh-hero-tagline">Build with purpose. Grow with roots.</p>
          <div className="dh-hero-meta">
            <span><strong>{ideas.length}</strong> ideas</span>
            <span className="dh-hero-meta-sep" />
            <span><strong>{plans.length}</strong> projects</span>
            {portfolio.count > 0 && <>
              <span className="dh-hero-meta-sep" />
              <span><strong>{portfolio.count}</strong> in calculation</span>
            </>}
          </div>
          <div className="dh-hero-actions">
            <button onClick={() => onNavigate('new-idea')} className="dh-btn dh-btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="13" height="13" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Idea
            </button>
            <button onClick={() => onNavigate('new-project')} className="dh-btn dh-btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="13" height="13" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Project
            </button>
          </div>
        </div>
      </section>

      <div className="dh-container">

        {/* ── KPI strip ────────────────────────────────────────────── */}
        <div className="dh-kpi-strip">
          <KpiTile icon={ICON_LIGHTBULB} label="Total Ideas"      value={ideas.length} />
          <KpiTile icon={ICON_PROJECT}   label="Active Projects"  value={plans.length} />
          <KpiTile icon={ICON_SPARKLE}   label="In Calculation"   value={portfolio.count} />
          <KpiTile icon={ICON_RUPEE}     label="Est. Revenue / yr" value={fmtINR(portfolio.revenue)} hint="across portfolio" />
          <KpiTile icon={ICON_GROWTH}    label="EBITDA / yr"      value={fmtINR(portfolio.ebitda)} hint="across portfolio" />
          <KpiTile icon={ICON_NPV}       label="NPV"              value={fmtINR(portfolio.npv)} hint="net present value" />
          <KpiTile icon={ICON_CLOCK}     label="Avg Payback"      value={fmtYears(portfolio.payback)} hint="across portfolio" />
        </div>

        {/* ── Three-column section: Featured / Active / Documents ─── */}
        <div className="dh-three-col">

          {/* Featured Ideas */}
          <div>
            <SectionHeader
              kicker="Pipeline"
              title="Featured Ideas"
              actionLabel={ideas.length > 0 ? 'View all' : null}
              onAction={() => onNavigate('ideas')}
            />
            {featuredIdeas.length === 0 ? (
              <EmptyTile
                copy="No ideas captured yet."
                btn="+ New Idea"
                onClick={() => onNavigate('new-idea')}
              />
            ) : (
              <div className="dh-stack">
                {featuredIdeas.map(idea => {
                  const sc = STATUS_COLORS[idea.status] || C.fg3;
                  return (
                    <button key={idea.id} onClick={() => onNavigate('idea-detail', idea)} className="dh-card-row">
                      <div className="dh-card-row-leaf" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M11 19c-7 0-7-9-7-9s5 0 7 4c2-4 7-4 7-4s0 9-7 9z"/><path d="M11 19v-7"/></svg>
                      </div>
                      <div className="dh-card-row-body">
                        <div className="dh-card-row-title">{idea.title}</div>
                        <div className="dh-card-row-meta">
                          <span style={{ color: sc, fontWeight: 600 }}>
                            <span className="dh-dot" style={{ background: sc }} />
                            {IDEA_STATUS_LABELS[idea.status] || idea.status || 'Draft'}
                          </span>
                          {idea.estimatedCapex > 0 && <span className="dh-mono">{fmtINR(idea.estimatedCapex)}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Projects */}
          <div>
            <SectionHeader
              kicker="In motion"
              title="Active Projects"
              actionLabel={plans.length > 0 ? 'View all' : null}
              onAction={() => onNavigate('projects')}
            />
            {activeProjects.length === 0 ? (
              <EmptyTile
                copy="No active projects."
                btn="+ New Project"
                onClick={() => onNavigate('new-project')}
              />
            ) : (
              <div className="dh-stack">
                {activeProjects.map(p => {
                  const sc = STATUS_COLORS[p.status] || C.fg3;
                  return (
                    <button key={p.id} onClick={() => onNavigate('project-detail', p)} className="dh-card-row">
                      <div className="dh-card-row-leaf dh-card-row-leaf-river" aria-hidden="true">
                        {ICON_PROJECT}
                      </div>
                      <div className="dh-card-row-body">
                        <div className="dh-card-row-title">{p.title}</div>
                        <div className="dh-card-row-meta">
                          <span style={{ color: sc, fontWeight: 600 }}>
                            <span className="dh-dot" style={{ background: sc }} />
                            {PLAN_STATUS_LABELS[p.status] || p.status || 'Active'}
                          </span>
                          {p.eligibleForCalc && (
                            <span className="dh-tag">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="10" height="10" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
                              Calc-ready
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <SectionHeader
              kicker="Library"
              title="Recent Documents"
              actionLabel={files.length > 0 ? 'View all' : null}
              onAction={() => onNavigate('documents')}
            />
            {recentDocuments.length === 0 ? (
              <EmptyTile
                copy="No documents uploaded."
                btn="Upload Document"
                onClick={() => onNavigate('documents')}
              />
            ) : (
              <div className="dh-stack">
                {recentDocuments.map(f => (
                  <button key={f.id} onClick={() => onNavigate('document-detail', f)} className="dh-card-row">
                    <div className="dh-card-row-leaf dh-card-row-leaf-gold" aria-hidden="true">
                      {ICON_DOC}
                    </div>
                    <div className="dh-card-row-body">
                      <div className="dh-card-row-title">{f.fileName || f.title || 'Untitled'}</div>
                      <div className="dh-card-row-meta">
                        <span className="dh-mono">{f.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                        {f.uploadedAt && <span style={{ color: C.fg3 }}>{new Date(f.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Closing tagline banner with palm-leaf flourishes ─────── */}
        <section className="dh-closing">
          <div className="dh-closing-leaf dh-closing-leaf-left" aria-hidden="true">
            <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width="80" height="80">
              <path d="M40 70 C 40 40, 40 20, 40 10"/>
              <path d="M40 60 C 25 55, 18 48, 10 42"/>
              <path d="M40 50 C 25 45, 18 38, 10 32"/>
              <path d="M40 40 C 28 35, 20 28, 14 22"/>
              <path d="M40 30 C 30 25, 24 18, 20 12"/>
              <path d="M40 60 C 55 55, 62 48, 70 42"/>
              <path d="M40 50 C 55 45, 62 38, 70 32"/>
              <path d="M40 40 C 52 35, 60 28, 66 22"/>
              <path d="M40 30 C 50 25, 56 18, 60 12"/>
            </svg>
          </div>
          <div className="dh-closing-leaf dh-closing-leaf-right" aria-hidden="true">
            <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width="80" height="80">
              <path d="M40 70 C 40 40, 40 20, 40 10"/>
              <path d="M40 60 C 25 55, 18 48, 10 42"/>
              <path d="M40 50 C 25 45, 18 38, 10 32"/>
              <path d="M40 40 C 28 35, 20 28, 14 22"/>
              <path d="M40 30 C 30 25, 24 18, 20 12"/>
              <path d="M40 60 C 55 55, 62 48, 70 42"/>
              <path d="M40 50 C 55 45, 62 38, 70 32"/>
              <path d="M40 40 C 52 35, 60 28, 66 22"/>
              <path d="M40 30 C 50 25, 56 18, 60 12"/>
            </svg>
          </div>
          <p className="dh-closing-script">A river nurtures every tree on its banks.</p>
          <p className="dh-closing-script dh-closing-script-2">A plan nurtures every dream you build.</p>
          <div className="dh-closing-rule" aria-hidden="true" />
          <p className="dh-closing-credit">— The New Beginnings · Rajahmundry Ventures</p>
        </section>
      </div>
    </div>
  );
}

function EmptyTile({ copy, btn, onClick }) {
  return (
    <div className="dh-empty">
      <div className="dh-empty-copy">{copy}</div>
      <button onClick={onClick} className="dh-btn dh-btn-primary dh-empty-btn">{btn}</button>
    </div>
  );
}
