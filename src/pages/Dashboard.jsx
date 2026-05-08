import { useMemo } from 'react';
import { C } from '../tokens';
import { useIdeas, usePlans, useFiles } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import heroImg from '../assets/hero_gpdavari1.webp';
import { IllIdea, IllPlan, IllDoc } from '../components/illustrations';
import { useReveal } from '../utils/useReveal';
import { useCountUp } from '../utils/useCountUp';

// Heritage Dashboard. Designed around the Godavari hero photo as the
// magazine cover — coconut cream surfaces, deep coconut green accents,
// terracotta KPI icons, gold dividers, calligraphic Pinyon Script
// flourishes for the brand voice. Hero shows full-bleed with no overlay
// strip; the KPI strip sits BELOW the hero so the photo is fully
// visible, then the three-column body and closing tagline banner.
//
// KPI strip is now count-only (Total Ideas / Active Projects / In
// Calculation) — the financial tiles (Revenue / EBITDA / NPV / Avg
// Payback) were removed because they truncated awkwardly in narrow
// columns and duplicated what the Calculations page already shows.

const STATUS_COLORS = {
  draft:         '#3150b7',
  validating:    '#854D0E',
  active:        '#065F46',
  archived:      '#36040d',
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
  const { user }  = useAuth();

  const eligibleCount   = useMemo(() => plans.filter(p => p.eligibleForCalc).length, [plans]);
  const featuredIdeas   = useMemo(() => ideas.slice(0, 3), [ideas]);
  const activeProjects  = useMemo(() => plans.filter(p => p.status === 'active' || !p.status).slice(0, 3), [plans]);
  const recentDocuments = useMemo(() => files.slice(0, 4), [files]);

  // Scroll-reveal observers — one per section so the strip, the
  // three-column body, and the closing tagline each animate in once
  // they peek into the viewport. Reduced motion bypasses all three
  // (useReveal returns visible:true immediately).
  const kpiReveal     = useReveal();
  const colsReveal    = useReveal();
  const closingReveal = useReveal();

  // KPI count-up — gated on the strip becoming visible so the user
  // actually sees the tween. If the strip is already on-screen on first
  // mount (short data, no scroll), the hook starts the tween straight
  // away. Reduced motion returns the target instantly.
  const ideasCountAnim    = useCountUp(ideas.length,     { enabled: kpiReveal.visible });
  const plansCountAnim    = useCountUp(plans.length,     { enabled: kpiReveal.visible });
  const eligibleCountAnim = useCountUp(eligibleCount,    { enabled: kpiReveal.visible });

  // First-name resolution for the hero greeting:
  //   1. Use the first token of displayName when set (e.g. "Venkat Krishna" -> "Venkat").
  //   2. Otherwise fall back to the local part of the email, with the first
  //      letter upper-cased (e.g. "venkat@new..." -> "Venkat"). The email
  //      can contain dots / underscores / digits — keep just the leading
  //      alpha run so we don't render "Venkat.k1" in the headline.
  //   3. As a last resort, drop the comma-and-name entirely.
  const firstName = (() => {
    const displayFirst = user?.displayName?.trim().split(/\s+/)[0];
    if (displayFirst) return displayFirst;
    const local = user?.email?.split('@')[0] || '';
    const alpha = local.match(/^[A-Za-z]+/)?.[0];
    if (alpha) return alpha.charAt(0).toUpperCase() + alpha.slice(1).toLowerCase();
    return null;
  })();

  return (
    <div className="dh-page" style={{ background: C.bg0 }}>

      {/* ── Hero — Godavari banner with editorial overlay (top-left
            content card + top-right pull-quote on web/iPad). On mobile
            content collapses below the photo. ───────────────────────── */}
      <section className="dh-hero">
        <img src={heroImg} alt="Godavari river at dusk" className="dh-hero-img" />
        <div className="dh-hero-content">
          <span className="dh-hero-welcome">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true" style={{ marginLeft: 6, color: 'var(--c-h-gold)' }}>
              <path d="M12 2c-2.5 4-6 6-9 6 0 5 4 9 9 12 5-3 9-7 9-12-3 0-6.5-2-9-6z"/>
            </svg>
          </span>
          <h1 className="dh-hero-title">
            A fresh start.
            <span className="dh-hero-title-italic">Endless possibilities.</span>
          </h1>
          <p className="dh-hero-tagline">
            Turn your ideas into thriving businesses with clarity,<br />
            structure, and regional wisdom.
          </p>
          <div className="dh-hero-actions">
            <button onClick={() => onNavigate('new-idea')} className="dh-btn dh-btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="13" height="13" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Idea
            </button>
            <button onClick={() => onNavigate('ideas')} className="dh-btn dh-btn-outline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true"><path d="M11 19c-7 0-7-9-7-9s5 0 7 4c2-4 7-4 7-4s0 9-7 9z"/><path d="M11 19v-7"/></svg>
              Explore Ideas
            </button>
          </div>
        </div>

      </section>

      <div className="dh-container dh-container-pad">

        {/* ── KPI strip — sits BELOW the hero so the photo is fully visible.
              Reveal-fade fires once the strip scrolls into view; the three
              tile values count up from 0 in the same beat. */}
        <div ref={kpiReveal.ref}
             className={`dh-kpi-strip reveal-fade${kpiReveal.visible ? ' is-visible' : ''}`}>
          <KpiTile icon={ICON_LIGHTBULB} label="Total Ideas"     value={ideasCountAnim} />
          <KpiTile icon={ICON_PROJECT}   label="Active Projects" value={plansCountAnim} />
          <KpiTile icon={ICON_SPARKLE}   label="In Calculation"  value={eligibleCountAnim} />
        </div>

        {/* ── Three-column section: Featured / Active / Documents ───
              Each column reveal-fades with a staggered delay so the eye
              tracks left-to-right rather than three columns popping
              simultaneously. The container holds the observer; children
              read its visible state via the className expression. */}
        <div ref={colsReveal.ref} className="dh-three-col">

          {/* Featured Ideas */}
          <div className={`reveal-fade${colsReveal.visible ? ' is-visible' : ''}`}
               style={{ transitionDelay: '0ms' }}>
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
                art={<IllIdea />}
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
          <div className={`reveal-fade${colsReveal.visible ? ' is-visible' : ''}`}
               style={{ transitionDelay: '60ms' }}>
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
                art={<IllPlan />}
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
          <div className={`reveal-fade${colsReveal.visible ? ' is-visible' : ''}`}
               style={{ transitionDelay: '120ms' }}>
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
                art={<IllDoc />}
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
        <section ref={closingReveal.ref}
                 className={`dh-closing reveal-fade${closingReveal.visible ? ' is-visible' : ''}`}>
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
          <p className="dh-closing-intro">A fresh start. Endless possibilities.</p>
          <p className="dh-closing-script">A river nurtures every tree on its banks.</p>
          <p className="dh-closing-script dh-closing-script-2">A plan nurtures every dream you build.</p>
        </section>
      </div>
    </div>
  );
}

function EmptyTile({ copy, btn, onClick, art }) {
  return (
    <div className="dh-empty">
      {art && <div className="dh-empty-art" aria-hidden="true">{art}</div>}
      <div className="dh-empty-copy">{copy}</div>
      <button onClick={onClick} className="dh-btn dh-btn-primary dh-empty-btn">{btn}</button>
    </div>
  );
}
