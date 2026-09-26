import { PlusIcon } from './PageHeader';

// Shared empty state — badge with illustration, serif title, one line of
// copy, one primary action. Visual comes from .empty-state in styles.css
// (the design the Ideas page already used); every page now uses this one
// component instead of its own box-and-button.
//
//   <EmptyState art={<IllIdea />} title="No ideas yet" copy="…"
//     actionLabel="Capture an idea" onAction={…} />
//
// `compact` is for tight spots such as the Dashboard columns. Omit
// actionLabel (e.g. for Viewers) to show the explanation without a button.
export default function EmptyState({
  art, title, copy, actionLabel, onAction, secondary, compact = false, fill = false,
  // Pass `actionIcon={null}` for actions that don't create something
  // (e.g. "Go to Projects"), which shouldn't wear a "+".
  actionIcon = <PlusIcon size={compact ? 12 : 14} />,
}) {
  const box = (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      {art && <div className="empty-state-art" aria-hidden="true">{art}</div>}
      <div className="empty-state-title">{title}</div>
      {copy && <div className="empty-state-copy">{copy}</div>}
      {(actionLabel || secondary) && (
        <div className="empty-state-actions">
          {actionLabel && (
            <button type="button" className={`ui-btn ui-btn--primary${compact ? ' ui-btn--sm' : ''}`} onClick={onAction}>
              {actionIcon}{actionLabel}
            </button>
          )}
          {secondary}
        </div>
      )}
    </div>
  );
  // `fill` centres the card in the remaining page height (used where the
  // empty state is the whole page, e.g. Calculations with no projects).
  if (fill) {
    return <div className="empty-state-wrap" style={{ flex: 1, alignItems: 'center', padding: '32px 16px' }}>{box}</div>;
  }
  return <div className="empty-state-wrap">{box}</div>;
}
