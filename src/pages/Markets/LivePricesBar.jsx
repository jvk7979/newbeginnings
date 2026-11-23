// Status of the live mandi-price refresh (useLivePrices), with a manual
// "Check now" and the "Update today's prices" entry point. Replaces the old
// cloud-schedule panel: data.gov.in refuses cloud servers, so prices are now
// fetched from the visitor's browser.

function describe(status, mappedCount) {
  switch (status.state) {
    case 'checking':
      return { tone: 'busy', text: `Checking today's mandi prices for ${status.total} commodit${status.total === 1 ? 'y' : 'ies'}…` };
    case 'unavailable':
      return { tone: 'warn', text: `${status.reason} Showing the last saved prices. You can update them by hand.` };
    case 'done': {
      const parts = [];
      if (status.updated) parts.push(`${status.updated} updated`);
      if (status.unchanged) parts.push(`${status.unchanged} unchanged`);
      if (status.noData) parts.push(`${status.noData} with no mandi report today`);
      return { tone: 'ok', text: `Checked just now: ${parts.join(', ') || 'nothing new'}.` };
    }
    default:
      return mappedCount
        ? { tone: 'ok', text: 'Mandi prices are checked automatically when you open this page, at most every 3 hours.' }
        : { tone: 'muted', text: 'Link a commodity to its Agmarknet name to get daily mandi prices automatically.' };
  }
}

export default function LivePricesBar({ status, mappedCount, canEdit, onCheck, onUpdateToday }) {
  const { tone, text } = describe(status, mappedCount);
  return (
    <div className={`mk-live mk-live--${tone}`} role="status" aria-live="polite">
      <span className="mk-live-dot" aria-hidden="true" />
      <p className="mk-live-text">{text}</p>
      {canEdit && (
        <div className="mk-live-actions">
          {mappedCount > 0 && (
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onCheck} disabled={status.state === 'checking'}>
              Check now
            </button>
          )}
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onUpdateToday}>
            Update today's prices
          </button>
        </div>
      )}
    </div>
  );
}
