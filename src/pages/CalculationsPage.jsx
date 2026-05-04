// Re-export shim so the existing lazy import in App.jsx keeps working.
// Real implementation lives in pages/Calculations/ (split into Hero,
// MetricDashboard, AssumptionsPanel, and 5 lazy-loaded tab files).
export { default } from './Calculations';
