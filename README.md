# Venture Log — UI Kit

A high-fidelity click-through prototype of the Venture Log personal website.

## Screens

- **Dashboard** — overview with stats, recent ideas, active projects
- **Ideas** — filterable list of all business ideas
- **New Idea** — capture form with title, stage, tags, description
- **Idea Detail** — view + edit an idea with notes
- **Projects** — list of active and archived projects with KPIs
- **Business Plans** — long-form document list
- **Plan Detail** — reading view of a business plan

## Components

| File | Contents |
|---|---|
| `Sidebar.jsx` | Fixed left navigation with logo, nav items, settings |
| `Cards.jsx` | `Badge`, `Tag`, `IdeaCard`, `ProjectCard` |
| `Dashboard.jsx` | Main dashboard screen |
| `IdeasPage.jsx` | Ideas list + filter + new idea form |
| `PlansPage.jsx` | Business plans list + reading view |
| `index.html` | App shell — wires all screens together |

## Design Tokens

All color and type tokens live in `../../colors_and_type.css`.
Fonts: Playfair Display (display), DM Sans (body), JetBrains Mono (mono).
Accent: `#D4A853` amber gold. Background: `#0D0C0A` warm near-black.
