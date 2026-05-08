// Vintage engraving silhouette — branching tree / dendrogram, three
// forks. Used for the Calculations "pick a project" empty-state — the
// branching shape mirrors the scenario-fork concept. Single fill via
// currentColor.
export default function IllScenario({ size = 40 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" fill="currentColor">
      {/* root trunk */}
      <rect x="38.6" y="56" width="2.8" height="14" rx="0.4" />
      {/* root flare — small triangular base */}
      <path d="M34 70 L 46 70 L 44 73 L 36 73 Z" />
      {/* primary fork from trunk top */}
      <path d="M38 56 L 18 38 L 19.5 38 L 39 55 Z" />
      <path d="M42 56 L 62 38 L 60.5 38 L 41 55 Z" />
      {/* secondary forks — left branch */}
      <path d="M18 38 L 8 22 L 9.4 22 L 19 38 Z" />
      <path d="M18 38 L 26 22 L 24.6 22 L 17.5 38 Z" />
      {/* secondary forks — right branch */}
      <path d="M62 38 L 72 22 L 70.6 22 L 61 38 Z" />
      <path d="M62 38 L 54 22 L 55.4 22 L 62.5 38 Z" />
      {/* terminal nodes — small fruits / decision points */}
      <circle cx="8" cy="20" r="2.4" />
      <circle cx="25" cy="20" r="2.4" />
      <circle cx="55" cy="20" r="2.4" />
      <circle cx="72" cy="20" r="2.4" />
    </svg>
  );
}
