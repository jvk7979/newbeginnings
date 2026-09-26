import { IS } from '../../components/calc/primitives';
import { IllCalc, IllScenario } from '../../components/illustrations';
import EmptyState from '../../components/EmptyState';

// Shared by the Calculations and Scenarios pages. Both use the app-wide
// <EmptyState>, centred in the page (`fill`).

export function EmptyNoEligible({ onNavigate }) {
  return (
    <EmptyState
      fill
      art={<IllCalc size={40} />}
      title="No projects ready to calculate"
      copy={<>Open a project, click <strong>Edit</strong> and tick <strong>“Eligible for Calculations”</strong>. It will show up here.</>}
      actionLabel="Go to Projects"
      actionIcon={null}
      onAction={() => onNavigate('projects')}
    />
  );
}

export function EmptyNoSelection({ eligible, onPick }) {
  return (
    <EmptyState
      fill
      art={<IllScenario size={40} />}
      title="Pick a project to begin"
      copy="Choose one of the projects you've marked eligible. Its saved calculation loads automatically."
      secondary={
        <select onChange={e => e.target.value && onPick(e.target.value)} defaultValue=""
          aria-label="Project"
          style={{ ...IS, fontSize: 14, padding: '9px 12px', width: 'min(320px, 100%)' }}>
          <option value="" disabled>Select a project…</option>
          {eligible.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      }
    />
  );
}
