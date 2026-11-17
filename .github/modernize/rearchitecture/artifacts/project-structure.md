# Project Structure

## Classification

- **Type:** Frontend single-page application (SPA), not a full-stack or monorepo project.
- **Runtime:** Browser application; there is no backend source, database schema, or ORM in this repository.
- **Product domain:** Event and wedding management, guest invitations and responses, check-in, and platform administration.

## Entrypoints and routing

- `index.html` provides the `#app` mount point and loads `src/main.ts`.
- `src/main.ts` creates the Vue app and Pinia store, installs the router, initializes the theme, registers the session-expiration handler, and mounts the app.
- `src/router/index.ts` defines browser-history routes and lazy-loads page components. Public routes are `/`, `/login`, and `/invitations/:token`. Authenticated pages are under `/dashboard`; `/agent/checkin/:id` is also routed.
- `src/App.vue` hosts the router view and global toast.
- `src/layouts/AppLayout.vue` and `src/views/admin/AdminShell.vue` are authenticated application shells. `src/views/EventDetailView.vue` wraps event-specific child routes.
- `vite.config.ts` installs the Vue plugin, maps `@` to `src`, and configures the development server on port 3000. `vercel.json` rewrites requests to `/` for SPA history fallback.

## Layers and file counts

Counts are source files under `src`, grouped by top-level directory (recursive):

| Layer / area | Files | Responsibility |
|---|---:|---|
| `views` | 37 | Routed pages, event tabs, forms, and admin screens |
| `components` | 29 | Reusable layout, dashboard, invitation, form, and common UI |
| `api` | 22 | Axios-backed REST clients, response parsing, and pagination |
| `stores` | 6 | Pinia auth, event selection, platform flags, notifications, theme, request state |
| `utils` | 4 | Event status, initials, QR, and timeout helpers |
| `composables` | 4 | Public invitation, RSVP, invitation-card, and QR-camera logic |
| `layouts` | 1 | Authenticated application shell |
| `router` | 1 | Route table and navigation guards |
| `models` | 1 | Authentication models and parsers |
| `src` root | 5 | App bootstrap, root view, global styles, navigation, permissions |
| **Total** | **110** | |

These are frontend source files only; generated output, dependencies, tests, and public assets are excluded.

## Functional areas

- Public landing and account login/registration.
- Event discovery, creation, event setup, event overview, and reporting/statistics.
- Guest and category management, invitations and bulk sending, RSVP, seating/tables, drinks, gallery, and internal event schedule.
- Organization members, user profile, and platform settings.
- Super-administrator console for users, organizations, events, and drink catalog.
- Guest-facing public invitation and staff/agent check-in.

## Configuration and runtime

- `package.json` declares Vite scripts, Vue/TypeScript dependencies, type checking, unit tests, and Playwright E2E tests.
- `tsconfig.json` enables strict TypeScript checking, ES2020 target/libs, bundler module resolution, and the `@/*` alias.
- `vite.config.ts`, `tailwind.config.cjs`, and `postcss.config.cjs` configure the development/build pipeline and styles.
- `playwright.config.ts` configures browser tests. `tests/` contains unit/E2E specifications and support modules.
- `.env.example` is present. `src/api/config.ts` reads `VITE_API_BASE_URL` and `VITE_WHATSAPP_CONTACT`; do not commit runtime values as source.
- `dist/` and `node_modules/` are present in the working directory but are generated/dependency directories, not application source.

## Architectural observations

- The browser client is organized by screens and REST resource modules, with Pinia holding cross-screen state.
- The frontend talks to an independently deployed HTTP API; backend behavior and persistence cannot be verified from this repository.
- Route-level permission checks mostly control navigation/UI presentation; comments in the source explicitly assign authoritative access control to the backend.
- Event and wedding terminology coexist in API models and route names; the event API is the primary resource surface, with compatibility parsers accepting legacy `weddingId` fields in places.
