import { useMemo } from 'react';
import { useIdeas, usePlans } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import heroImg from '../assets/hero_gpdavari1.webp';
import ActivityFeed from '../components/ActivityFeed';
import { fmtINR } from '../utils/format';
import { projectRow } from '../utils/projectMetrics';
import { buildStream, buildAttention, strongestCase, greetingFor } from '../utils/dashboardModel';
import { planStatusLabel } from '../utils/status';
import '../dashboard.css';

// Dashboard — "where are our ventures, and what needs us?"
//
//   band       the Godavari photo as a slim strip, with the greeting and
//              a one-line status of the whole workspace
//   stream     every idea and project placed on one channel, Ideas →
//              Shortlisted → Planning → Running numbers → Underway. The
//              channel widens downstream like the delta. This is the
//              page's one bold element; everything else stays quiet.
//   attention  things the numbers say need a decision
//   recent     the shared activity feed
//   best       the strongest modelled case so far
//
// All logic lives in utils/dashboardModel.js (unit tested); project
// figures come from utils/projectMetrics.js, the same source Portfolio uses.

const SHOW_PER_STAGE = 4;

const fmtPct = (v) => (v == null || !isFinite(v) ? '—' : `${v.toFixed(1)}%`);
const fmtYears = (v) => (v == null ? 'beyond its life' : `${v} year${v === 1 ? '' : 's'}`);

function firstNameOf(user) {
  const displayFirst = user?.displayName?.trim().split(/\s+/)[0];
  if (displayFirst) return displayFirst;
  const alpha = (user?.email?.split('@')[0] || '').match(/^[A-Za-z]+/)?.[0];
  return alpha ? alpha.charAt(0).toUpperCase() + alpha.slice(1).toLowerCase() : null;
}

function joinNames(names) {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// The secondary line under a venture's name in the stream.
function ventureNote(entry, rows) {
  const { kind, item } = entry;
  if (kind === 'idea') {
    const parts = [item.category, item.estimatedCapex > 0 ? `${fmtINR(item.estimatedCapex)} est.` : null].filter(Boolean);
    return { text: parts.join(', ') || 'Idea' };
  }
  const r = rows[item.id];
  if (r?.verdict === 'Viable') return { text: `IRR ${fmtPct(r.irr)}, clears hurdle`, tone: 'good' };
  if (r?.verdict === 'Below hurdle') return { text: `Below ${r.hurdle}% hurdle`, tone: 'below' };
  if (item.eligibleForCalc) return { text: 'No numbers yet', tone: 'todo' };
  return { text: item.category || planStatusLabel(item.status) };
}

export default function Dashboard({ onNavigate }) {
  const { ideas } = useIdeas();
  const { plans } = usePlans();
  const { user } = useAuth();

  const rows = useMemo(() => {
    const out = {};
    for (const p of plans) if (p.eligibleForCalc) out[p.id] = projectRow(p);
    return out;
  }, [plans]);
  const { stages, total } = useMemo(() => buildStream(ideas, plans), [ideas, plans]);
  const attention = useMemo(() => buildAttention(plans, rows), [plans, rows]);
  const { best, viableCount, modelledCount } = useMemo(() => strongestCase(plans, rows), [plans, rows]);

  const name = firstNameOf(user);
  const open = (entry) => onNavigate(entry.kind === 'idea' ? 'idea-detail' : 'project-detail', entry.item);
  const openPlan = (plan) => onNavigate('project-detail', plan);

  let status;
  if (total === 0) status = <>Nothing in the stream yet. Capture your first idea to get started.</>;
  else if (attention.length === 0) status = <>You have <strong>{total} venture{total === 1 ? '' : 's'}</strong> on the go, and nothing needs your attention right now.</>;
  else status = <>You have <strong>{total} venture{total === 1 ? '' : 's'}</strong> on the go. <strong>{attention.length} {attention.length === 1 ? 'thing needs' : 'things need'} your attention.</strong></>;

  return (
    <div className="db-page">
      <header className="db-band">
        <img src={heroImg} alt="The Godavari at dusk, a boatman crossing near Rajahmundry" className="db-band-img" />
        <div className="db-wrap db-band-inner">
          <div className="db-greet">
            <h1>{greetingFor()}{name ? `, ${name}` : ''}</h1>
            <p>{status}</p>
          </div>
          <div className="db-actions">
            <button type="button" className="ui-btn ui-btn--secondary" onClick={() => onNavigate('ideas')}>Browse ideas</button>
            <button type="button" className="ui-btn ui-btn--primary" onClick={() => onNavigate('new-idea')}>New idea</button>
          </div>
        </div>
      </header>

      <div className="db-wrap">
        <section className="db-stream" aria-labelledby="db-stream-title">
          <div className="db-head">
            <h2 id="db-stream-title">From idea to underway</h2>
            <p>Every idea and project, placed at the stage it has reached.</p>
          </div>

          <div className="db-stages">
            <div className="db-channel" aria-hidden="true">
              <svg viewBox="0 0 1000 40" preserveAspectRatio="none" focusable="false">
                <path className="db-water" d="M0 15 C 120 9, 220 22, 330 14 S 560 7, 680 11 S 880 3, 1000 2 L 1000 38 C 880 37, 800 31, 680 30 S 450 31, 330 27 S 120 29, 0 25 Z" />
                <path className="db-current" d="M0 20 C 120 14, 220 27, 330 20 S 560 13, 680 21 S 880 15, 1000 20" />
              </svg>
            </div>
            <ol className="db-stage-list">
              {stages.map((stage, i) => (
                <li key={stage.id} className={`db-stage${i === stages.length - 1 ? ' is-last' : ''}`} style={{ '--i': i }}>
                  <div className="db-stage-name">{stage.name}</div>
                  <div className="db-stage-note">{stage.note}</div>
                  <div className="db-count" aria-label={`${stage.count} in ${stage.name}`}>{stage.count}</div>
                  {stage.count > 0 && (
                    <ul className="db-ventures">
                      {stage.entries.slice(0, SHOW_PER_STAGE).map(entry => {
                        const note = ventureNote(entry, rows);
                        return (
                          <li key={`${entry.kind}-${entry.item.id}`}>
                            <button type="button" onClick={() => open(entry)}>
                              {entry.item.title || 'Untitled'}
                              <span className={note.tone ? `is-${note.tone}` : undefined}>{note.text}</span>
                            </button>
                          </li>
                        );
                      })}
                      {stage.count > SHOW_PER_STAGE && (
                        <li>
                          <button type="button" className="db-more"
                            onClick={() => onNavigate(i < 2 ? 'ideas' : 'projects')}>
                            {stage.count - SHOW_PER_STAGE} more
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="db-lower">
          <section aria-labelledby="db-att-title">
            <div className="db-head"><h2 id="db-att-title">Needs your attention</h2></div>
            {attention.length === 0 ? (
              <p className="db-calm">
                {modelledCount === 0
                  ? 'Once a project has numbers in Calculations, anything that falls short of its hurdle shows up here.'
                  : 'Every modelled project clears its hurdle, and every project marked for calculation has numbers.'}
              </p>
            ) : (
              <ul className="db-attention">
                {attention.map(item => <AttentionItem key={item.key} item={item} onOpen={openPlan} onNavigate={onNavigate} />)}
              </ul>
            )}
          </section>

          <section aria-labelledby="db-recent-title">
            <div className="db-head"><h2 id="db-recent-title">Recent changes</h2></div>
            <ActivityFeed variant="dashboard" />
          </section>
        </div>

        {best && (
          <section className="db-best" aria-labelledby="db-best-title">
            <div className="db-best-text">
              <h2 id="db-best-title">Strongest case so far: {best.plan.title}</h2>
              <p>
                {viableCount === 1
                  ? `It is the only one of your ${modelledCount} modelled projects that clears its ${best.row.hurdle}% hurdle.`
                  : `${viableCount} of your ${modelledCount} modelled projects clear their hurdle. This one returns the most.`}
              </p>
              <dl className="db-figures">
                <div><dt>Return (IRR)</dt><dd>{fmtPct(best.row.irr)}</dd></div>
                <div><dt>Net present value</dt><dd>{best.row.npv == null ? '—' : fmtINR(best.row.npv)}</dd></div>
                <div><dt>Pays back in</dt><dd>{fmtYears(best.row.payback)}</dd></div>
              </dl>
            </div>
            <div className="db-best-actions">
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => openPlan(best.plan)}>Open project</button>
              <button type="button" className="ui-btn ui-btn--ghost" onClick={() => onNavigate('portfolio')}>Compare all in Portfolio</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AttentionItem({ item, onOpen, onNavigate }) {
  if (item.key === 'no-numbers') {
    const names = item.plans.map(p => p.title || 'Untitled');
    const n = names.length;
    return (
      <li className="is-todo">
        <span className="db-stripe" aria-hidden="true" />
        <div>
          <h3>{n === 1 ? `${names[0]} has no numbers yet` : `${n} projects have no numbers yet`}</h3>
          <p>{n === 1 ? 'It is' : `${joinNames(names)} are`} marked for calculation but {n === 1 ? 'has' : 'have'} no costs or prices entered.</p>
        </div>
        <button type="button" className="db-go" onClick={() => onNavigate('calculations')}>Add numbers</button>
      </li>
    );
  }
  if (item.unwritten) {
    return (
      <li className="is-todo">
        <span className="db-stripe" aria-hidden="true" />
        <div>
          <h3>{item.plan.title || 'Untitled'} has no write-up yet</h3>
          <p>Add a few plan sections or attach a document so everyone knows what the project is.</p>
        </div>
        <button type="button" className="db-go" onClick={() => onOpen(item.plan)}>Write it up</button>
      </li>
    );
  }
  const { plan, row } = item;
  const npv = row.npv == null ? null : fmtINR(row.npv);
  return (
    <li className="is-below">
      <span className="db-stripe" aria-hidden="true" />
      <div>
        <h3>{item.underway
          ? `${plan.title} is underway but below its ${row.hurdle}% hurdle`
          : `${plan.title} is below its ${row.hurdle}% hurdle`}</h3>
        <p>
          {npv ? <>Net present value is <span className="db-num">{npv}</span> at the current assumptions. </> : null}
          {item.underway ? 'Worth revisiting before more is spent.' : 'Check capacity and selling price first.'}
        </p>
      </div>
      <button type="button" className="db-go" onClick={() => onOpen(plan)}>Review</button>
    </li>
  );
}
