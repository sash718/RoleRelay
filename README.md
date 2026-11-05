# RoleRelay

Find the opportunity. Form the right team.

Frontend-only FSD I project foundation built with React, Vite, JavaScript, plain CSS, and React Router.

## Current status

Implemented: shared responsive layout, four navigable route introductions, a not-found page, browser-storage helpers, and storage tests.

Not implemented: event fetching, team forms, matching, candidate comparison, or saved-workspace UI. No events or people are fabricated. Route introductions explicitly describe unfinished features.

## Setup

Use Node.js 24 LTS and npm. After cloning, run:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Do not open index.html directly.

## Commands

```sh
npm run lint
npm test
npm run build
npm run preview
```

Preview checks the built site locally; it is not a production server. Deploy the generated dist directory to a static host. Hash-based routes such as /#/team work without host rewrite rules. The relative Vite base supports deployment under a subdirectory.

## Structure and shared files

- `src/main.jsx`: mounts React and the router.
- `src/App.jsx`: layout, navigation, route introductions, titles, and navigation focus.
- `src/components/FeatureIntro.jsx`: honest foundation-only route content. Owners replace it with real feature pages later.
- `src/styles.css`: shared tokens, layout, and responsive styles.
- `src/services/storage.js`: read/parse/validate and save helpers with explicit result statuses.
- `tests/storage.test.js`: storage failure and serialization checks using Node's test runner.

Coordinate edits to App.jsx, styles.css, storage.js, and package files. Add feature-specific files only when implementing them.

Storage helpers are not wired to a user interface yet. A feature must provide a complete schema validator, validate before saving, show failure messages, and preserve unreadable data until the user explicitly chooses recovery. Missing data is distinct from damaged data. Tests can pass a storage substitute without a browser.

## Feature ownership

| Contributor | Implementation responsibility |
| --- | --- |
| Member 1 | Opportunity discovery, fetch, search/filtering, and loading/error states |
| Member 2 | Team/member forms, required skills and roles, validation, and localStorage integration |
| Member 3 | Pure gap/matching functions, ranking, explanations, and algorithm tests |
| Member 4 | Candidate comparison, saved workspace, dynamic coverage, and UI integration tests |

Member 3 owns shared coverage calculations; Members 2 and 4 consume them. Agree the saved data shape before implementing independent features.

## Collaboration

Use one shared GitHub repository, each member's own account, feature branches (for example `feat/opportunity-discovery`), and small descriptive commits. Open a pull request and have a different member review it before merging. Run all checks and verify the affected journey. Resolve shared-file conflicts with the other owner rather than blindly accepting one side.

No repository has been initialized or remote configured by this setup. The team chooses its repository and makes its own commits. Never change authors to manufacture contributions. If sharing a laptop, prefer separate OS accounts with each person's own GitHub authentication and checkout; sign out afterward. Never share passwords or tokens. Codex can help explain/review work but must not generate completed modules and distribute authorship artificially.

## Data and limitations

There is no backend, authentication, database, live event API, or shared-user service. Future event data will be loaded with Fetch from a maintained catalog with source URLs and last-checked dates. A fetched static catalog is not a custom REST API.

Future user-created records will be local to the browser and origin. They will not synchronize across devices; clearing site data removes them. No invitations or registration actions will be simulated. External registration must use official links.

## Manual foundation check

Open all four navigation links, refresh a hash route, try an unknown route, use keyboard navigation and the skip link, and inspect at mobile and desktop widths. Feature-level accessibility and end-to-end tests follow when those features exist.

## Setup verification

On 4 November 2026, lint and production build passed, and all six storage tests passed. Browser checks covered all four navigation links, hash-route refresh, unknown-route recovery, skip-link focus, and desktop/375px layouts. No browser warnings or errors were reported during that check.

The installation audit reported five moderate development-tool advisories in the ESLint/minimatch dependency chain. Its suggested forced ESLint downgrade is incompatible with this lint configuration and was not applied. Recheck with `npm audit` before upgrading dependencies; do not run forced fixes blindly.

## Next milestone

Agree the event catalog and workspace schemas, then let Member 1 implement genuine, curated opportunity discovery. Do not treat this foundation as a finished application.
