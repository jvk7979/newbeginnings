// Shared page header — one layout for every list / tool page:
//   eyebrow (small mono label) · serif title (+ optional count pill)
//   one line of description · actions on the right (stack on phones).
// Styles live in ui.css (.page-header*).
export default function PageHeader({ eyebrow, title, count, subtitle, actions, className = '' }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div className="page-header-text">
        {eyebrow && <p className="page-header-eyebrow">{eyebrow}</p>}
        <h1 className="page-header-title page-title">
          <span>{title}</span>
          {count !== undefined && count !== null && (
            <span className="page-header-count" aria-label={`${count} items`}>{count}</span>
          )}
        </h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

// Small inline "+" icon used by primary "Add / New" buttons so every one
// of them looks the same (some used a typed "+", some an icon).
export function PlusIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" focusable="false">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
