# Architecture

## Data Flow

```
Browser
  │
  ├── src/lib/api-client.ts        (axios, baseURL: /api)
  │
  ▼
src/proxy.ts                       (route guard — verifies JWT, injects x-school-id header)
  │
  ▼
src/app/api/**/*.ts                (Next.js Route Handlers, server-side)
  │
  ├── src/lib/api-guard.ts         (Zod body validation + error helpers)
  │
  ▼
src/lib/dataverse/*.ts             (OData REST calls — auto-scoped to active school)
  │
  ▼
Microsoft Dataverse                (Azure AD client credentials OAuth2)
```

## Key Files

### `src/proxy.ts` — Route Guard

Next.js 16 uses `proxy.ts` (replacing the deprecated `middleware.ts`). The exported function must be named `proxy`.

Runs before every matched request. Logic:

1. If path is public (`/auth/login`, `/api/auth/*`, `/api/health`, `/onboarding`) → pass through
2. Read `sms.session` cookie
3. Verify JWT with `verifySessionToken()`
4. Unauthenticated API call → `401 { success: false, error: "Unauthorized" }`
5. Unauthenticated page → redirect to `/auth/login?callbackUrl=<original>`
6. Authenticated → decode JWT, inject `x-school-id: <schoolId>` header, pass through

```typescript
// src/proxy.ts
export async function proxy(request: NextRequest) { ... }

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/students/:path*', ...]
};
```

### `src/lib/session.ts` — JWT Tokens

- **Cookie name**: `sms.session`
- **Algorithm**: HS256
- **Lifetime**: 24 hours
- **Secret priority**: `AUTH_SECRET` → `NEXTAUTH_SECRET` → dev-only fallback. **In production the app throws if no secret of ≥32 chars is configured** (it will not sign/verify tokens with the public dev fallback).
- **Payload**: `{ userid, email, name, role, userrole, schoolId }`

```typescript
createSessionToken(user: SessionUser): Promise<string>
verifySessionToken(token: string): Promise<SessionUser | null>
```

### `src/lib/dataverse/tenant.ts` — Multi-Tenancy

`AsyncLocalStorage`-based school ID resolver. Every request that hits a route handler is wrapped in `withTenant(schoolId, fn)` so the school ID is available to all nested Dataverse calls without passing it explicitly.

```typescript
withTenant(schoolId: string, fn: () => Promise<T>): Promise<T>
getTenantId(): string | undefined
```

`registerTenantResolver(getTenantId)` connects this to `DataverseClient` at startup without importing `async_hooks` into the client bundle.

### `src/lib/dataverse/client.ts` — Dataverse Client

Singleton `DataverseClient` (axios). It auto-attaches a Bearer token from `auth.ts` (cached, refreshed 5 min before expiry) and reads the active `schoolId` from `getTenantId()`. Tenant isolation is enforced on **every** operation, not just list queries — the pure helpers live in `src/lib/dataverse/tenant-guard.ts` (unit tested):

| Operation | Enforcement |
|-----------|-------------|
| Collection GET (`get`) | Appends `$filter=_sms_school_value eq <schoolId>` to the query |
| Single-record GET (`table(id)`) | Cannot be `$filter`ed, so the client selects `_sms_school_value`, then **throws a 404 if the record belongs to another school** |
| PATCH / DELETE (`table(id)`) | `assertOwnership()` first reads the record's school and **refuses (404) on a tenant mismatch** before mutating |
| POST | Binds the new row to the active school via `'sms_school@odata.bind'` |

This closes cross-tenant access by GUID: a user from School A cannot read, update, or delete School B's records even with a known ID. The super admin (`bootstrap`, no `schoolId` in scope) is intentionally unrestricted.

> **Exception**: `sms_schools` / `sms_schoolbranchs` are root/tenant tables with no `_sms_school_value` and are exempt from the filter. Route handlers that read the school profile call `getSchoolById(session.schoolId)` explicitly.

### `src/lib/api-guard.ts` — Route Handler Utilities

| Export | Description |
|--------|-------------|
| `parseBody(req, schema)` | Parses JSON body and validates against a Zod schema. Returns `{ data }` or `{ response }` |
| `serverError(error)` | Returns 500 — full message in development, generic in production |
| `badRequest(msg)` | Returns 400 |
| `unauthorized()` | Returns 401 |
| `getSession(req)` | Reads and verifies the JWT cookie (for role-based logic) |
| `withSchool(req, fn)` | Runs `fn` inside `withTenant(<x-school-id>)` so Dataverse calls are tenant-scoped |
| `getSchoolId(req)` | Reads the `x-school-id` header (injected by the proxy) |
| `makeTableGuard(...names)` | Returns an `isTableMissing(e)` check for optional/unconfigured tables |

Usage pattern in every route handler:

```typescript
export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, schema);
        if ('response' in parsed) return parsed.response;
        const data = await createEntity(parsed.data);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
```

### `src/lib/dataverse/` — Data Access Layer

Server-only. One module per entity. Standard pattern:

```typescript
const TABLE  = 'sms_<entityname>';
const SELECT = 'sms_field1,sms_field2,...';

function mapEntity(item: any): Entity { ... }

export const getEntities    = async (filters?) => { ... }
export const getEntityById  = async (id: string) => { ... }
export const createEntity   = async (data: CreateRequest) => { ... }
export const updateEntity   = async (id: string, data: Partial<CreateRequest>) => { ... }
export const deleteEntity   = async (id: string): Promise<void> => { ... }
```

School binding on write: `'sms_school@odata.bind': \`/sms_schools(\${schoolId})\``

### `src/lib/api-client.ts` — Frontend API Wrapper

Axios instance with `baseURL: /api`. Exports a named object per resource.

```typescript
import { studentsAPI, gradesAPI, attendanceAPI, schoolAPI } from '@/lib/api-client';

const result = await studentsAPI.getAll({ search: 'John', classid: '...' });
await schoolAPI.switchSchool(schoolId);
```

Full list of exported API objects: `studentsAPI`, `teachersAPI`, `employeesAPI`, `parentsAPI`, `classesAPI`, `subjectsAPI`, `departmentsAPI`, `attendanceAPI`, `gradesAPI`, `examsAPI`, `enrollmentsAPI`, `feesAPI`, `feesPaymentAPI`, `feeStructuresAPI`, `feeTypesAPI`, `scholarshipsAPI`, `promotionsAPI`, `timetableAPI`, `libraryAPI`, `inventoryAPI`, `transportAPI`, `poolAPI`, `staffLeaveAPI`, `activitiesAPI`, `announcementsAPI`, `disciplinaryAPI`, `healthAPI`, `reportsAPI`, `dashboardAPI`, `schoolAPI`, `usersAPI`, `academicYearsAPI`, `termsAPI`, `gradeLevelsAPI`.

### `src/contexts/BrandContext.tsx` — Per-School Branding

Client-side context fetched from `GET /api/school` on mount. Provides:
- `colors { primary, sidebar }` — applied as CSS variables `--school-primary`, `--school-sidebar`, `--primary`, `--ring`
- `school { name, motto, logo }` — displayed in the sidebar top section

Cached in `localStorage` under `sms-brand-colors` and `sms-brand-school`. Export `BRAND_SCHOOL_KEY` and clear it before redirecting after a school switch to prevent stale data flashing:

```typescript
localStorage.removeItem(BRAND_SCHOOL_KEY);
window.location.replace('/dashboard');
```

## Page Structure

All authenticated pages live in `src/app/(dashboard)/`. The layout (`layout.tsx`) wraps every page in:

```
<Sidebar> + <Header> + <main>
```

Each page follows this pattern:
1. `useState` for rows, loading state, modal open/closed, editing item, deletion target
2. `load()` async function calling the API
3. `useEffect(() => { load() }, [])` on mount
4. `useMemo` for client-side filtering and pagination
5. Table with Edit + Delete actions
6. `Dialog` with shared Add/Edit form
7. `ConfirmDialog` for delete confirmation

## Form Pattern

```tsx
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing ? { ...editing } : {},
});
```

- `register(...)` for `Input`, `Textarea`, checkbox
- `<Controller>` for `SelectRoot` and `DatePicker`
- Two-section layout: plain div for primary fields + card div for relational/lookup fields

```tsx
<div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section Name</p>
  {/* SelectRoot fields */}
</div>
```

## Authentication Flow

```
1. User submits email + password at /auth/login
2. POST /api/auth/login
   → Rate-limited per IP (50/15min) and per IP+email (10/15min); over-limit → 429.
      In-memory limiter (src/lib/rate-limit.ts) — back with Redis for multi-instance deploys.
3a. Bootstrap check: email+password matches ADMIN_EMAIL/ADMIN_PASSWORD env vars
    → createSessionToken({ userid: 'bootstrap', schoolId: undefined })
3b. Dataverse user check: getUserForAuth(email) → bcrypt.compare(password, hash)
    → createSessionToken({ userid, email, name, role, userrole, schoolId })
4. JWT signed (HS256, 24 h), set as httpOnly cookie sms.session
5. Returns { ok: true }
6. Client redirects to /dashboard (or /onboarding if no schoolId)

7. Every subsequent request:
   proxy.ts reads cookie → verifies JWT → injects x-school-id header → allows or blocks
```

## Security Model

| Concern | Implementation |
|---------|---------------|
| Route + role protection | `src/proxy.ts` — all non-public routes require a valid JWT; `ROLE_ACCESS` enforces per-path role allow-lists |
| API protection | Proxy returns 401 (unauth) / 403 (wrong role) before the route handler runs |
| Tenant header integrity | Proxy **strips any client-supplied `x-school-id`** and sets it only from the verified JWT |
| Tenant isolation | Enforced on list **and** single-record reads, plus PATCH/DELETE (see Dataverse Client) — not just list queries |
| Input validation | Zod schemas in every POST/PUT route handler via `parseBody` |
| Brute-force protection | Per-IP and per-IP+email rate limiting on `/api/auth/login` (429) |
| Error sanitisation | `serverError()` returns a generic message in production |
| Secret storage | Environment variables only; production refuses a weak/missing `AUTH_SECRET` |
| Token security | httpOnly cookie (JS-inaccessible), `sameSite: lax`, `secure` in production |
| Dataverse access | Server-side only via Azure AD credentials — never reaches the browser |
| Password hashing | bcrypt (12 rounds) for all Dataverse user accounts |

> **Known gaps before full commercial launch** (tracked): no audit logging, no JWT revocation before expiry, the rate limiter is per-instance (needs Redis for multi-instance), and no payment-gateway integration. See the project README / assessment notes.

## Role-Based Module Access

Beyond the proxy's path/role guard, the **super admin** can configure which modules each role sees from **User Management → Module Access**. The matrix is stored per-school as JSON in `sms_schools.sms_rolemoduleaccess` and exposed through `BrandContext` (`roleModuleAccess`). The Sidebar and the dashboard route guard consult `roleHasModule()` (in `src/lib/modules.ts`), falling back to the built-in defaults when a role has no saved entry. School-wide module enablement (`sms_enabledmodule`) still applies first.

## Testing & CI

- **Unit tests** — [Vitest](https://vitest.dev). Run with `npm test` (watch: `npm run test:watch`). Test files live beside the code as `*.test.ts`. Current coverage focuses on the security-critical pure logic: tenant isolation (`src/lib/dataverse/tenant-guard.test.ts`) and the login rate limiter (`src/lib/rate-limit.test.ts`).
- **CI** — `.github/workflows/ci.yml` runs on every push/PR: `npm run lint` → `npm test` → `npm run build`. The lint step fails on **errors** (warnings, e.g. `no-explicit-any` at the Dataverse boundary, are allowed as tracked tech debt).
- The `scripts/test:*` npm scripts are *manual* Dataverse integration probes, not part of the automated suite.

## Adding a New API Route

1. Create `src/lib/dataverse/<entity>.ts` — TABLE const, SELECT string, map function, CRUD exports. Include `_sms_school_value` in SELECT if the table supports it.
2. Create `src/app/api/<entity>/route.ts` — `parseBody` + Zod schema + `serverError`.
3. Create `src/app/api/<entity>/[id]/route.ts` — GET/PUT/DELETE with `serverError`.
4. Add named API object to `src/lib/api-client.ts`.
5. `npm run build` must pass with zero TypeScript errors.
