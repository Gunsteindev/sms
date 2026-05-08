# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build — must pass with zero TS errors before any PR
npm run lint         # Run ESLint

# Dataverse scripts (require .env.local)
npm run test:connection   # Test Azure AD token + Dataverse connectivity
npm run test:dataverse    # Full Dataverse CRUD test
npm run test:quick        # Quick smoke test

# Seed / utility scripts
npx ts-node --skipProject scripts/<name>.ts
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
ADMIN_EMAIL           # Bootstrap admin login email (checked before Dataverse)
ADMIN_PASSWORD        # Bootstrap admin login password
```

## Architecture

### Data Flow
```
Browser → src/lib/api-client.ts (axios, baseURL: /api)
       → src/proxy.ts (route guard — verifies JWT, injects x-school-id header)
       → src/app/api/**/*.ts (Next.js Route Handlers, server-side)
       → src/lib/api-guard.ts (Zod body validation + error helpers)
       → src/lib/dataverse/*.ts (OData REST calls, tenant-filtered)
       → Microsoft Dataverse (Azure AD client credentials OAuth2)
```

### Key Layers

**`src/proxy.ts`** — Next.js 16 route guard (replaces deprecated `middleware.ts`). Exported function must be named `proxy`, not `middleware`. Runs before every matched request. Returns `401` for unauthenticated API calls; redirects to `/auth/login` for page requests. Decodes the JWT and injects `x-school-id: <schoolId>` header so route handlers can read the active tenant. Public paths: `/api/auth/*`, `/api/health`, `/auth/login`, `/onboarding`.

**`src/lib/api-guard.ts`** — Server-side utilities:
- `serverError(error)` — sanitised 500 (full message in dev, generic in prod)
- `badRequest(msg)` — 400 response
- `parseBody(req, zodSchema)` — JSON parse + Zod validate; returns `{ data }` or `{ response }`
- `getSession(req)` — reads and verifies the JWT session cookie

**`src/lib/session.ts`** — JWT sign/verify using `jose`. Cookie: `sms.session` (httpOnly, sameSite: lax). Token lifetime: 24 h. Payload includes `userid`, `email`, `name`, `role`, `userrole`, `schoolId`. Secret from `AUTH_SECRET ?? NEXTAUTH_SECRET ?? 'dev-fallback-change-in-prod'`.

**`src/lib/dataverse/client.ts`** — Singleton `DataverseClient` (axios). Auto-attaches Bearer token from `auth.ts` (cached, refreshed 5 min before expiry). Reads the active `schoolId` via the tenant resolver and automatically appends `$filter=_sms_school_value eq '<schoolId>'` to every GET request — **except** for tables that are the root entity themselves (`sms_schools`) or explicitly exempt.

**`src/lib/dataverse/tenant.ts`** — `AsyncLocalStorage`-based school-ID resolver. `withTenant(schoolId, fn)` runs `fn` with the given school in scope. `getTenantId()` returns the current school ID. Registered with `DataverseClient` via `registerTenantResolver()` to avoid importing `async_hooks` on the client bundle.

**`src/lib/dataverse/`** — Server-only data access layer. One module per entity (`students.ts`, `teachers.ts`, `academicYears.ts`, etc.). Each exports typed CRUD functions. All use `dataverseClient.getWithFilter()` which builds OData `$select`/`$filter`/`$orderby`/`$top`/`$skip` strings.

**`src/app/api/`** — Route Handlers. Each resource: `route.ts` (collection GET/POST) and `[id]/route.ts` (single GET/PUT/DELETE). Always return `{ success: boolean, data?, error? }`. Use `parseBody` + `serverError` from `api-guard.ts` — never return raw `error.message` or `error.response?.data`.

**`src/lib/api-client.ts`** — Frontend axios wrapper (baseURL `/api`). Exports named API objects used by React pages: `studentsAPI`, `teachersAPI`, `employeesAPI`, `parentsAPI`, `classesAPI`, `subjectsAPI`, `departmentsAPI`, `attendanceAPI`, `gradesAPI`, `examsAPI`, `enrollmentsAPI`, `feesAPI`, `feesPaymentAPI`, `feeStructuresAPI`, `feeTypesAPI`, `scholarshipsAPI`, `promotionsAPI`, `timetableAPI`, `libraryAPI`, `inventoryAPI`, `transportAPI`, `poolAPI`, `staffLeaveAPI`, `activitiesAPI`, `announcementsAPI`, `disciplinaryAPI`, `healthAPI`, `reportsAPI`, `dashboardAPI`, `schoolAPI`, `usersAPI`, `academicYearsAPI`, `termsAPI`, `gradeLevelsAPI`.

**`src/app/(dashboard)/`** — Route group for all authenticated pages. Layout wraps every page in `<Sidebar>` + `<Header>` + scrollable `<main>`.

**`src/contexts/AuthContext.tsx`** — Client-side session user state. `SessionUser` includes `schoolId?: string`.

**`src/contexts/BrandContext.tsx`** — Per-school branding state. Fetches from `GET /api/school` on mount; caches in `localStorage` under keys `sms-brand-colors` and `sms-brand-school`. Provides `colors { primary, sidebar }`, `school { name, motto, logo }`, `setColors`, `setSchool`. Applies colors immediately as CSS variables (`--school-primary`, `--school-sidebar`, `--primary`, `--ring`). Export `BRAND_SCHOOL_KEY = 'sms-brand-school'` for use in school-switch flows (clear before redirecting to prevent stale flash).

### Multi-Tenancy

Every entity table has a `_sms_school_value` lookup column linking records to `sms_schools`. The flow:

1. Login → `sms.session` JWT embeds `schoolId`.
2. `src/proxy.ts` decodes JWT → injects `x-school-id` header.
3. Route handlers call `withTenant(schoolId, async () => { ... })` so `AsyncLocalStorage` carries the school ID through all Dataverse calls.
4. `DataverseClient` reads `getTenantId()` and appends the school filter automatically.
5. School switching: `POST /api/school/switch { schoolId }` → re-issues JWT with new `schoolId` → clear `localStorage.removeItem(BRAND_SCHOOL_KEY)` → `window.location.replace('/dashboard')`.

**Special case — `sms_schools`:** This IS the root entity; it has no `_sms_school_value`. Use `getSchoolById(session.schoolId)` explicitly in route handlers — do not rely on the auto-filter.

### Authentication

Two separate concerns:

1. **User sessions** — Custom JWT (`jose`). Login at `POST /api/auth/login`. Cookie: `sms.session`. The bootstrap admin (env vars) always takes priority over Dataverse users.
2. **Dataverse API** — Azure AD client credentials (server-side only, `src/lib/dataverse/auth.ts`).

### Onboarding

`/onboarding` is public (not guarded). It serves two flows:
- **Select existing school** — search bar + scrollable list of schools → `POST /api/school/switch` → redirect to dashboard.
- **Register new school** — 3-step wizard (profile → location → curriculum) → `POST /api/onboarding/complete` → redirect to dashboard.

Admins can return to `/onboarding` at any time to switch between schools or add new ones.

### Sidebar Branding

`src/components/layout/Sidebar.tsx` reads `school` from `BrandContext`. The top section shows:
- School logo (`<img>`) if `school.logo` exists
- Initial-avatar div with `--school-primary` background if no logo
- School name in bold (fallback: "SchoolMS")
- Motto in italic (fallback: "Admin Portal")

### UI Components

All form components from `src/components/ui/`:
- `Input`, `Button`, `Label`, `Badge`, `Dialog`, `Textarea`
- `Select` — named exports: `SelectRoot`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`
- `DatePicker` — props: `value: string (YYYY-MM-DD)`, `onChange: (value: string) => void`, `id?`, `placeholder?`
- `Pagination` — props: `page`, `totalPages`, `total`, `pageSize`, `label`, `onChange`
- `ConfirmDialog` — delete confirmation modal
- `ReceiptDialog` — fee payment receipt

### Form Pattern

```tsx
// ST constant for Select trigger styling
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

// Two-section layout
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

- Class name: `classname` (from `sms_name`) — always use `c.classname ?? c.name` in dropdowns
- Student full name: `s.fullname || \`${s.firstname} ${s.lastname}\`.trim()`
- All lookup GUIDs follow the pattern `_sms_<entity>_value`
- All entity tables have `_sms_school_value` for multi-tenancy (except `sms_schools` itself)
- School binding for PATCH/POST: `'sms_school@odata.bind': \`/sms_schools(\${schoolId})\``

### User Roles

```
1 = Admin
2 = Teacher
3 = Finance
4 = Inventory Manager
5 = Transport Manager
6 = Pool Attendant
7 = Parent
8 = Kitchen Attendant
```

### Adding a New API Route

1. Create `src/lib/dataverse/<entity>.ts` — TABLE const, SELECT string, map function, CRUD exports.
2. Create `src/app/api/<entity>/route.ts` — `parseBody` + Zod schema + `serverError`.
3. Create `src/app/api/<entity>/[id]/route.ts` — GET/PUT/DELETE with `serverError`.
4. Add named API object to `src/lib/api-client.ts`.
5. `npm run build` must pass with zero TypeScript errors.

### Seed Scripts

All scripts in `scripts/` follow this pattern:

```ts
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
// ... getToken(), hdrs(), main()
```

Run with: `npx ts-node --skipProject scripts/<name>.ts`

Key scripts:
- `seed-school-users.ts` — creates one Admin user per school (password: `School@2025`)
- `seed-academic-years.ts` — creates 4 academic years (2023–2027) per school
- `update-all-records.ts` — patches school profiles + associates orphaned records with Grey Academy

### Next.js 16 Notes

- Route guard: `src/proxy.ts`, exported function named `proxy` (not `middleware`)
- `matcher` config uses the same format as Next.js middleware
- Read `node_modules/next/dist/docs/` before using any Next.js API — breaking changes exist vs earlier versions
