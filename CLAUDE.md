# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MacArt IMS** is a manufacturing Integrated Management System built on [Base44](https://base44.com) (a serverless app platform) with React. It covers production scheduling, quality control (NCRs, CAPAs), environmental compliance, and safety management.

## Commands

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Serve the production build locally
npm run lint         # ESLint (--quiet)
npm run lint:fix     # Auto-fix ESLint issues
npm run typecheck    # JSDoc-based type checking via jsconfig.json
```

There is no test framework configured. Quality is enforced through ESLint and `typecheck`.

## Architecture

### Tech Stack

- **React 18 + Vite** — frontend with ES modules and HMR
- **Base44 SDK** — serverless backend: auth, entity CRUD, app logs
- **React Router v6** — client-side routing
- **TanStack React Query v5** — server-state caching
- **shadcn/ui (Radix UI + Tailwind CSS)** — 50+ UI primitives in `src/components/ui/`

### Request Lifecycle

```
User action
  → Page component (useState for local/form state)
    → base44.entities.<Entity>.<method>()   ← all data access
      → Base44 backend (entity CRUD)
```

Auth state lives in `AuthContext` (Context API). Server cache lives in React Query. There is no Redux or Zustand.

### Key Files

| File | Role |
|---|---|
| `src/main.jsx` | Entry point — mounts `<App />` |
| `src/App.jsx` | Root: `AuthProvider` → `QueryClientProvider` → `Router` + all routes |
| `src/Layout.jsx` | Sidebar nav (5 groups, ~35 links) + responsive shell |
| `src/lib/AuthContext.jsx` | `useAuth()` hook — user, isAuthenticated, logout, navigateToLogin |
| `src/api/base44Client.js` | SDK initialisation (reads `VITE_BASE44_APP_ID`) |
| `src/pages.config.js` | **Auto-generated** by Vite plugin — only edit `mainPage` |
| `base44/entities/*.jsonc` | Declarative JSON schemas for ~30 backend entities |
| `base44/config.jsonc` | Deployment commands for Base44 host |

### Pages & Routing

Pages are React components under `src/pages/`. The Base44 Vite plugin auto-discovers them and writes `src/pages.config.js`. To add a page:

1. Create `src/pages/MyPage.jsx` with a default export.
2. Add a nav link in the appropriate group in `src/Layout.jsx`.

### Data Access Patterns

```js
// useEffect pattern (most pages)
useEffect(() => {
  base44.entities.WorkOrder.list("-planned_start", 100).then(setWos);
}, []);

// React Query pattern (some pages)
const { data = [] } = useQuery({
  queryKey: ["compliance-items"],
  queryFn: () => base44.entities.ComplianceItem.list("-section", 200),
});

// Mutations
await base44.entities.CustomerOrder.create(data);
await base44.entities.CustomerOrder.update(id, patch);
await base44.entities.OrderLine.filter({ status: "open" });
await base44.entities.WorkOrder.bulkCreate(array);
```

`base44.entities.<Entity>` methods: `list(sort, limit)`, `filter(conditions)`, `get(id)`, `create(data)`, `update(id, data)`, `bulkCreate(array)`.

### Authentication

```js
const { user, isAuthenticated, isLoadingAuth, authError, logout, navigateToLogin } = useAuth();
```

The auth flow in `AuthContext.jsx` performs two checks: app-level public settings → user-level session. Tokens are managed by the Base44 SDK (localStorage). To protect a page, check `isAuthenticated` before rendering.

### Styling Conventions

- Tailwind utility classes throughout; no CSS modules.
- Design tokens defined as CSS variables in `src/index.css` (dark theme, amber primary).
- Responsive via Tailwind breakpoints: `hidden lg:flex` is the main sidebar pattern.
- Status colours: green = good, amber = warning, red = critical.

### Entity Schemas

Defined in `base44/entities/*.jsonc`. Each file declares property types, enums, required fields, and defaults. The SDK syncs these with the backend automatically. To add an entity, create a new `.jsonc` file and start using `base44.entities.NewEntity` in code.

## Environment Variables

Create `.env.local` for local development:

```
VITE_BASE44_APP_ID=<app_uuid>
VITE_BASE44_APP_BASE_URL=<backend_url>   # optional override
```

## Conventions

- **File naming**: PascalCase for components/pages (`WorkOrderForm.jsx`), kebab-case for utilities (`app-params.js`, `query-client.js`).
- **State**: `useState` for local/form UI state; React Query for cached server data; `AuthContext` for auth only.
- **Forms**: local form object in `useState`, save on explicit submit, then refresh the list.
- **No unit tests**: rely on lint + typecheck + manual testing.
- **Package manager**: npm only (no yarn/pnpm).
