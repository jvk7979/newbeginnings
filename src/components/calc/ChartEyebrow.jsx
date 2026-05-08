// Shared chapter-style eyebrow rendered above every chart in the
// Calculations module. Replaces the per-chart eyebrow markup that lived
// in MetricDashboard (calc-gauge-eyebrow, calc-composition-eyebrow) with
// one place that owns the editorial typography.
export default function ChartEyebrow({ children }) {
  return <div className="calc-chart-eyebrow">{children}</div>;
}
