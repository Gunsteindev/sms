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
- **Secret priority**: `AUTH_SECRET` → `NEXTAUTH_SECRET` → `'dev-fallback-change-in-prod'`
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

Singleton `DataverseClient` (axios). On every GET request it:
1. Auto-attaches a Bearer token from `auth.ts` (cached, refreshed 5 min before expiry)
2. Reads `getTenantId()` from the tenant resolver
3. Automatically appends `$filter=_sms_school_value eq '<schoolId>'` to every query

> **Exception**: `sms_schools` is the root entity and does not have `_sms_school_value`. Route handlers that read the school profile must call `getSchoolById(session.schoolId)` explicitly — do not rely on the auto-filter.

### `src/lib/api-guard.ts` — Route Handler Utilities

| Export | Description |
|--------|-------------|
| `parseBody(req, schema)` | Parses JSON body and validates against a Zod schema. Returns `{ data }` or `{ response }` |
| `serverError(error)` | Returns 500 — full message in development, generic in production |
| `badRequest(msg)` | Returns 400 |
| `unauthorized()` | Returns 401 |
| `getSession(req)` | Reads and verifies the JWT cookie (for role-based logic) |

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
| Route protection | `src/proxy.ts` — all routes except public paths require valid JWT |
| API protection | Proxy returns 401 before route handler runs |
| Input validation | Zod schemas in every POST/PUT route handler via `parseBody` |
| Error sanitisation | `serverError()` returns generic message in production |
| Secret storage | Environment variables only — never in code |
| Token security | httpOnly cookie (JS-inaccessible), sameSite: lax |
| Dataverse access | Server-side only via Azure AD credentials — never reach the browser |
| Tenant isolation | `_sms_school_value` filter injected on every OData query |
| Password hashing | bcrypt (12 rounds) for all Dataverse user accounts |

## Adding a New API Route

1. Create `src/lib/dataverse/<entity>.ts` — TABLE const, SELECT string, map function, CRUD exports. Include `_sms_school_value` in SELECT if the table supports it.
2. Create `src/app/api/<entity>/route.ts` — `parseBody` + Zod schema + `serverError`.
3. Create `src/app/api/<entity>/[id]/route.ts` — GET/PUT/DELETE with `serverError`.
4. Add named API object to `src/lib/api-client.ts`.
5. `npm run build` must pass with zero TypeScript errors.
