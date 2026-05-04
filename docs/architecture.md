# Architecture

## Data Flow

```
Browser
  │
  ├── src/lib/api-client.ts        (axios, baseURL: /api)
  │
  ▼
src/proxy.ts                       (route guard — checks JWT session cookie)
  │
  ▼
src/app/api/**/*.ts                (Next.js Route Handlers, server-side)
  │
  ├── src/lib/api-guard.ts         (Zod body validation + error helpers)
  │
  ▼
src/lib/dataverse/*.ts             (OData REST calls)
  │
  ▼
Microsoft Dataverse                (Azure AD client credentials OAuth2)
```

## Key Files

### `src/proxy.ts` — Route Guard

Next.js 16 uses `proxy.ts` (replacing the deprecated `middleware.ts`). The exported function must be named `proxy`.

Runs before every matched request. Logic:
1. If path is public (`/auth/login`, `/api/auth/*`, `/api/health`) → pass through
2. Read `sms.session` cookie
3. Verify JWT with `verifySessionToken()`
4. Unauthenticated API call → `401 { success: false, error: "Unauthorized" }`
5. Unauthenticated page → redirect to `/auth/login?callbackUrl=<original>`
6. Authenticated → pass through

```typescript
// src/proxy.ts
export async function proxy(request: NextRequest) { ... }

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/students/:path*', ...]
};
```

### `src/lib/session.ts` — JWT Tokens

Handles JWT creation and verification using the `jose` library.

- **Cookie name**: `sms.session`
- **Algorithm**: HS256
- **Lifetime**: 24 hours
- **Secret priority**: `AUTH_SECRET` → `NEXTAUTH_SECRET` → `'dev-fallback-change-in-prod'`
- **Payload**: `{ email, name, role }`

```typescript
createSessionToken(user: SessionUser): Promise<string>
verifySessionToken(token: string): Promise<SessionUser | null>
```

### `src/lib/api-guard.ts` — Route Handler Utilities

Used by every API route handler to provide consistent validation and error handling:

| Export | Description |
|--------|-------------|
| `parseBody(req, schema)` | Parses JSON body and validates against a Zod schema. Returns `{ data }` or `{ response }` |
| `serverError(error)` | Returns 500 — full message in development, generic message in production |
| `badRequest(msg)` | Returns 400 with the given message |
| `unauthorized()` | Returns 401 |
| `getSession(req)` | Reads and verifies the JWT cookie (for role-based logic beyond what the proxy handles) |

Usage pattern in every route handler:
```typescript
export async function POST(request: NextRequest) {
    try {
        const parsed = await parseBody(request, schema);
        if ('response' in parsed) return parsed.response;  // validation failed
        const data = await createEntity(parsed.data);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return serverError(error);
    }
}
```

### `src/lib/dataverse/` — Data Access Layer

Server-only. Each file follows a standard pattern:

```typescript
const TABLE = 'sms_<entityname>';
const SELECT = ['sms_field1', 'sms_field2', ...];

function mapEntity(item: Record<string, unknown>): Entity { ... }

export const getEntities = async (filters?) => { ... }  // returns { items, totalCount }
export const getEntityById = async (id: string) => { ... }
export const createEntity = async (data: CreateRequest) => { ... }
export const updateEntity = async (id: string, data: Partial<CreateRequest>) => { ... }
export const deleteEntity = async (id: string) => { ... }
```

The singleton `dataverseClient` in `client.ts` auto-attaches an Azure AD Bearer token. Tokens are cached and refreshed 5 minutes before expiry.

### `src/lib/api-client.ts` — Frontend API Wrapper

Axios instance with `baseURL: /api`. Exports a named object per resource. All methods are async and return the `data` field from the API response.

```typescript
import { studentsAPI, gradesAPI, attendanceAPI } from '@/lib/api-client';

const result = await studentsAPI.getAll({ search: 'John', classid: '...' });
const grade  = await gradesAPI.create({ studentid, subjectid, score: 85, ... });
```

## Page Structure

All authenticated pages live in `src/app/(dashboard)/`. The layout (`layout.tsx`) wraps every page in:

```
<Sidebar> + <Header> + <main>
```

Each page follows this pattern:
1. `useState` for rows, loading state, modal open/closed, the item being edited, the item pending deletion
2. `load()` async function that calls the API and sets state
3. `useEffect(() => { load() }, [])` to fetch on mount
4. `useMemo` for client-side filtering and pagination
5. A table with Edit + Delete action buttons
6. A `Dialog` containing the form (shared Add/Edit)
7. A `ConfirmDialog` for delete confirmation

## Form Pattern

All forms use react-hook-form + Zod:

```tsx
const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editing ? { ...editing } : {},
});
```

- `register(...)` for `Input`, `Textarea`, checkbox
- `<Controller>` for `SelectRoot` and `DatePicker`
- Two-section layout: plain div for primary fields + styled card for relational fields

```tsx
// Card section for lookups/relations
<div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section Name</p>
  {/* SelectRoot fields here */}
</div>
```

## Authentication Flow

```
1. User submits email + password at /auth/login
2. POST /api/auth/login
3. Server compares against ADMIN_EMAIL + ADMIN_PASSWORD
4. On match: creates JWT (jose SignJWT, HS256, 24h)
5. Sets httpOnly cookie: sms.session=<token>
6. Returns { ok: true }
7. Client redirects to /dashboard

8. Every subsequent request:
   src/proxy.ts reads cookie → verifies JWT → allows or blocks
```

## Security Model

| Concern | Implementation |
|---------|---------------|
| Route protection | `src/proxy.ts` — all routes except public paths require valid JWT |
| API protection | Middleware returns 401 before route handler runs |
| Input validation | Zod schemas in every POST/PUT route handler |
| Error sanitisation | `serverError()` returns generic message in production |
| Secret storage | Environment variables only — never in code |
| Token security | httpOnly cookie (not accessible via JavaScript), sameSite: lax |
| Dataverse access | Server-side only via Azure AD client credentials — credentials never reach the browser |
