import SharedEmptyState from '../../components/EmptyState';
import { IllScenario } from '../../components/illustrations';

// Shown when there are no commodities tracked yet. `canAdd` gates the CTA so
// viewers see the explanation but no action. Uses the shared empty state.
export default function EmptyState({ onAdd, canAdd }) {
  return (
    <SharedEmptyState
      art={<IllScenario size={40} />}
      title="No commodities tracked yet"
      copy="Track the price of raw materials — coconut husk, coir fiber, copra and more — week by week."
      actionLabel={canAdd ? 'Track your first commodity' : null}
      onAction={onAdd}
    />
  );
}
