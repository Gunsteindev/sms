# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build (must pass before any PR)
npm run lint         # Run ESLint

# Dataverse connection test scripts (require env vars)
npm run test:connection   # Test Azure AD token + Dataverse connectivity
npm run test:dataverse    # Full Dataverse CRUD test
npm run test:quick        # Quick smoke test
```

## Required Environment Variables

```
DATAVERSE_URL         # e.g. https://yourorg.crm.dynamics.com
AZURE_TENANT_ID       # Azure AD tenant ID
AZURE_CLIENT_ID       # App registration client ID
AZURE_CLIENT_SECRET   # App registration client secret
NEXTAUTH_URL          # e.g. http://localhost:3000
AUTH_SECRET           # JWT signing secret — generate with: openssl rand -base64 32
NEXTAUTH_SECRET       # Fallback JWT secret (same value as AUTH_SECRET is fine)
ADMIN_EMAIL           # Admin login email
ADMIN_PASSWORD        # Admin login password
```

## Architecture

### Data Flow
```
Browser → src/lib/api-client.ts (axios, baseURL: /api)
       → src/proxy.ts (route guard — verifies JWT session cookie)
       → src/app/api/**/*.ts (Next.js Route Handlers, server-side)
       → src/lib/api-guard.ts (Zod body validation + error helpers)
       → src/lib/dataverse/*.ts (OData REST calls)
       → Microsoft Dataverse (Azure AD client credentials OAuth2)
```

### Key Layers

**`src/proxy.ts`** — Next.js 16 route guard (replaces `middleware.ts`, which is deprecated). Exported function must be named `proxy`, not `middleware`. Runs before every request matched by `config.matcher`. Returns `401` for unauthenticated API calls; redirects to `/auth/login` for unauthenticated page requests. Public paths: `/api/auth/*`, `/api/health`, `/auth/login`.

**`src/lib/api-guard.ts`** — Server-side utilities for route handlers:
- `serverError(error)` — sanitised 500 response (full message in dev, generic in prod)
- `badRequest(msg)` — 400 response
- `parseBody(req, zodSchema)` — parses JSON body and validates with Zod; returns `{ data }` or `{ response }` (check with `'response' in parsed`)
- `getSession(req)` — reads and verifies the JWT session cookie (middleware already blocks unauthenticated requests, but this can be used for role checks)

**`src/lib/session.ts`** — JWT sign/verify using `jose`. Cookie name: `sms.session`. Token lifetime: 24 h. Secret from `AUTH_SECRET ?? NEXTAUTH_SECRET ?? 'dev-fallback-change-in-prod'`.

**`src/lib/dataverse/`** — Server-only data access layer. `client.ts` is a singleton `DataverseClient` (axios) that auto-attaches a Bearer token from `auth.ts`. The token is cached in module-level variables; `getAccessToken()` refreshes it 5 minutes before expiry using the Azure AD client credentials flow. All entity modules (`students.ts`, `teachers.ts`, etc.) use `dataverseClient.getWithFilter()` which builds OData `$select`/`$filter`/`$orderby`/`$top`/`$skip` query strings.

**`src/app/api/`** — Next.js Route Handlers. Each resource has a `route.ts` (collection) and `[id]/route.ts` (single record). They import from `src/lib/dataverse/` and always return `{ success: boolean, data?, error? }`. Use `parseBody` + `serverError` from `api-guard.ts` — never return raw `error.message` or `error.response?.data`.

**`src/lib/api-client.ts`** — Frontend axios wrapper (baseURL `/api`). Exports named API objects (`studentsAPI`, `teachersAPI`, `attendanceAPI`, `classesAPI`, `feesAPI`, `dashboardAPI`, `gradesAPI`, `promotionsAPI`, `reportsAPI`, etc.) used by React components.

**`src/app/(dashboard)/`** — Route group for all authenticated pages. The layout wraps every page in `<Sidebar>` + `<Header>` + scrollable `<main>`.

**`src/types/`** — Shared types. `index.ts` defines `BaseEntity`, `ApiResponse<T>`, `PaginatedResponse<T>`, and `UserRole`. Each domain module in `dataverse/` also exports its own types (re-exported from `lib/dataverse/index.ts`).

**`src/hooks/`** — Custom hooks (`useStudents`, `useAttendance`, `useAuth`) that call `api-client.ts` functions and manage local state.

### Authentication

Two separate auth concerns:
1. **User sessions** — Custom JWT via `jose` (`src/lib/session.ts`). Login at `POST /api/auth/login`. Cookie: `sms.session` (httpOnly, sameSite: lax). All routes protected by `src/proxy.ts`.
2. **Dataverse API** — Azure AD client credentials (server-side only, in `src/lib/dataverse/auth.ts`).

### UI Components

All form components use shadcn/ui from `src/components/ui/`:
- `Input`, `Button`, `Label`, `Badge`, `Dialog`, `Select` (from `@/components/ui/Select` — named exports `SelectRoot`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`)
- `DatePicker` — props: `value: string (YYYY-MM-DD)`, `onChange: (value: string) => void`, `id?`, `placeholder?`
- `Textarea` — drop-in replacement for `<textarea>`, same styling as `Input`
- `Pagination` — props: `page`, `totalPages`, `total`, `pageSize`, `label`, `onChange`
- `ConfirmDialog` — delete confirmation modal

### Form Pattern

All pages follow this pattern:
```tsx
// ST constant for Select trigger styling
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

// Two-section layout: plain section + card section
<div className="space-y-4">
  {/* Plain section — primary fields */}
  <div className="space-y-4"> ... </div>

  {/* Card section — relational/lookup fields */}
  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section Title</p>
    ...
  </div>
</div>
```

Use `Controller` from `react-hook-form` for `SelectRoot` and `DatePicker` fields. Use `register` for `Input`, `Textarea`, and checkbox fields.

### Dataverse Field Naming

- Class name maps to `classname` (from `sms_name`), not `name` — always use `c.classname ?? c.name` in dropdowns
- Student full name: `s.fullname || \`${s.firstname} ${s.lastname}\`.trim()`
- All Dataverse lookup fields use the pattern `_sms_<entity>_value` for the GUID

### Adding a New API Route

1. Create `src/lib/dataverse/<entity>.ts` — follow `students.ts` pattern: TABLE const, SELECT array, map function, CRUD exports
2. Create `src/app/api/<entity>/route.ts` — use `parseBody` + Zod schema + `serverError`
3. Create `src/app/api/<entity>/[id]/route.ts` — GET/PUT/DELETE with `serverError`
4. Add API client module to `src/lib/api-client.ts`
5. Build: `npm run build` must pass with zero TypeScript errors

### Next.js 16 Notes

- Route guard file is `src/proxy.ts` (not `middleware.ts`) — exported function named `proxy`
- `matcher` in `config` uses the same format as before
- Read `node_modules/next/dist/docs/` before using any Next.js API — breaking changes exist vs. earlier versions
