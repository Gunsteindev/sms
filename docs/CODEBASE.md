# SMS Codebase Guide

A practical reference for engineers working on this codebase. Read this before writing any code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Quick Start](#3-quick-start)
4. [Directory Structure](#4-directory-structure)
5. [Architecture & Data Flow](#5-architecture--data-flow)
6. [Key Concepts](#6-key-concepts)
   - [Multi-tenancy](#multi-tenancy)
   - [Authentication](#authentication)
   - [Dataverse OData API](#dataverse-odata-api)
   - [Option-set Constants](#option-set-constants)
7. [Frontend Patterns](#7-frontend-patterns)
   - [API Client](#api-client)
   - [Hooks](#hooks)
   - [Forms](#forms)
   - [Components](#components)
8. [Backend Patterns](#8-backend-patterns)
   - [Route Handlers](#route-handlers)
   - [Dataverse Modules](#dataverse-modules)
9. [Adding a New Entity](#9-adding-a-new-entity)
10. [Constants Reference](#10-constants-reference)
11. [Environment Variables](#11-environment-variables)
12. [Scripts & Utilities](#12-scripts--utilities)
13. [Common Pitfalls](#13-common-pitfalls)

---

## 1. Project Overview

**SMS** is a multi-tenant school management system. Each school (tenant) is isolated — their students, staff, fees, and settings are all scoped to their `schoolId`. A single deployment serves multiple schools simultaneously.

The system covers: student enrollment, attendance, grades, exams, fee management, library, inventory, transport, pool, extracurricular activities, HR, and school-level configuration.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Forms | react-hook-form + Zod |
| HTTP client | Axios (frontend) |
| Database | Microsoft Dataverse (via OData v9.2 REST API) |
| Auth — sessions | Custom JWT (`jose`) |
| Auth — Dataverse | Azure AD client credentials (OAuth2) |
| State | React Context (auth, theme, branding) |
| Toast | react-hot-toast |

---

## 3. Quick Start

```bash
# Install dependencies
npm install

# Start development server (Turbopack)
npm run dev

# Production build — must pass with zero TS errors before any PR
npm run build

# Lint
npm run lint

# Test Dataverse connectivity (requires .env.local)
npm run test:connection
npm run test:dataverse
npm run test:quick
```

Copy `.env.local.example` to `.env.local` and fill in all required values (see [Environment Variables](#11-environment-variables)).

---

## 4. Directory Structure

```
src/
├── app/
│   ├── (dashboard)/          # Authenticated pages — wrapped in Sidebar + Header
│   │   ├── students/         # /students list page
│   │   │   └── [id]/         # /students/:id detail page
│   │   ├── teachers/
│   │   ├── fees/
│   │   └── ...               # One folder per domain (31 total)
│   ├── api/                  # Next.js Route Handlers (server-side)
│   │   ├── students/
│   │   │   ├── route.ts      # GET /api/students, POST /api/students
│   │   │   └── [id]/
│   │   │       └── route.ts  # GET/PUT/DELETE /api/students/:id
│   │   └── ...               # One folder per domain
│   ├── auth/login/           # Public login page
│   └── onboarding/           # Public school setup / school-switch page
│
├── components/
│   ├── ui/                   # Reusable primitives (Button, Input, Badge, Dialog…)
│   │   └── index.ts          # Barrel — import from '@/components/ui'
│   ├── students/             # Student-specific components
│   │   ├── StudentTable.tsx
│   │   ├── StudentCard.tsx
│   │   ├── StudentForm.tsx
│   │   └── index.ts          # Barrel
│   ├── layout/               # Sidebar, Header
│   │   └── index.ts
│   ├── attendance/           # AttendanceSheet, AttendanceCalendar
│   │   └── index.ts
│   └── charts/               # AttendanceChart, PerformanceChart
│       └── index.ts
│
├── hooks/
│   ├── usePaginatedList.ts   # Generic server-paginated list hook
│   ├── useStudents.ts        # Entity-specific wrapper over usePaginatedList
│   ├── useAttendance.ts
│   └── useAuth.ts
│
├── lib/
│   ├── api/                  # Frontend HTTP clients (browser only)
│   │   ├── client.ts         # Axios instance + response interceptor
│   │   ├── people.ts         # studentsAPI, teachersAPI, parentsAPI, employeesAPI
│   │   ├── academic.ts       # classesAPI, subjectsAPI, examsAPI, termsAPI…
│   │   ├── finance.ts        # feesAPI, feeStructuresAPI, feePaymentsAPI…
│   │   ├── operations.ts     # attendanceAPI, gradesAPI, promotionsAPI…
│   │   ├── facilities.ts     # libraryAPI, inventoryAPI, transportAPI, poolAPI…
│   │   ├── school-admin.ts   # schoolAPI, usersAPI, dashboardAPI, reportsAPI…
│   │   └── index.ts          # Re-exports everything
│   │
│   ├── api-client.ts         # Legacy import path — re-exports src/lib/api/index.ts
│   │                         # (kept for backward compat; prefer @/lib/api/*)
│   │
│   ├── constants/
│   │   └── index.ts          # All Dataverse option-set values (gender, status…)
│   │
│   ├── types/
│   │   └── api.ts            # PagedResponse<T>, SingleResponse<T>, ApiError
│   │
│   ├── dataverse/            # Server-only data access layer
│   │   ├── client.ts         # DataverseClient singleton (axios + auto-auth)
│   │   ├── auth.ts           # Azure AD token cache (client credentials)
│   │   ├── tenant.ts         # AsyncLocalStorage school-ID resolver
│   │   ├── students.ts       # Student CRUD + types
│   │   ├── teachers.ts
│   │   └── ...               # One file per entity (38 total)
│   │
│   ├── api-guard.ts          # Server-side helpers: withSchool, parseBody, serverError
│   ├── session.ts            # JWT sign/verify (jose), cookie management
│   ├── csv.ts                # CSV export utility
│   └── modules.ts            # School module enable/disable config
│
├── contexts/
│   ├── AuthContext.tsx        # Client session user (userid, role, schoolId)
│   ├── BrandContext.tsx       # Per-school colors, logo, name — reads /api/school
│   ├── ThemeContext.tsx       # Dark/light mode
│   ├── SchoolSettingsContext.tsx
│   └── I18nContext.tsx
│
└── proxy.ts                  # Next.js route guard (replaces middleware.ts)
                              # Verifies JWT, injects x-school-id header
```

---

## 5. Architecture & Data Flow

```
Browser
  │
  │  React pages import from @/lib/api/*
  ▼
src/lib/api/client.ts          (axios, baseURL: /api)
  │  response interceptor unwraps response.data automatically
  ▼
src/proxy.ts                   (route guard — runs before every request)
  │  • Reads sms.session cookie → verifies JWT
  │  • Unauthenticated API → 401
  │  • Unauthenticated page → redirect /auth/login
  │  • Injects x-school-id header from JWT payload
  ▼
src/app/api/**/*.ts            (Next.js Route Handlers, server-side only)
  │  • withSchool(req, fn) — reads x-school-id, sets AsyncLocalStorage scope
  │  • parseBody(req, zodSchema) — JSON parse + Zod validation
  │  • serverError(error) — sanitised 500 (full detail in dev, generic in prod)
  ▼
src/lib/dataverse/*.ts         (OData queries, server-only)
  │  • dataverseClient automatically appends $filter=_sms_school_value eq '<id>'
  │  • to every GET — tenants are isolated at the query layer
  ▼
Microsoft Dataverse            (Azure AD client credentials OAuth2)
```

**Response shape** — every route handler returns:

```ts
// Collection
{ success: true, data: T[], totalCount: number, page?: number, pageSize?: number }

// Single record
{ success: true, data: T, message?: string }

// Error
{ success: false, error: string, dvMessage?: string }  // dvMessage only in dev
```

---

## 6. Key Concepts

### Multi-tenancy

Every entity table has `_sms_school_value` linking it to `sms_schools`. The tenant ID flows through the request like this:

1. Login → JWT payload includes `schoolId`
2. `proxy.ts` decodes JWT → injects `x-school-id` header
3. Route handlers call `withSchool(req, async () => { ... })` from `api-guard.ts`
4. `withSchool` calls `withTenant(schoolId, fn)` from `dataverse/tenant.ts`
5. `AsyncLocalStorage` carries `schoolId` through all nested Dataverse calls
6. `DataverseClient.get()` reads `getTenantId()` and appends the school filter automatically

**Exception:** `sms_schools` itself has no `_sms_school_value` — it is the root entity. Never use the auto-filter for it; call `getSchoolById(session.schoolId)` explicitly.

**School switching:** `POST /api/school/switch { schoolId }` re-issues the JWT with the new `schoolId`. The client must also call `localStorage.removeItem(BRAND_SCHOOL_KEY)` before redirecting to prevent a stale branding flash.

### Authentication

Two independent auth concerns:

| Concern | Mechanism |
|---|---|
| User sessions | Custom JWT (`jose`). Cookie: `sms.session` (httpOnly, sameSite: lax, 24 h TTL). |
| Dataverse API | Azure AD client credentials — auto-refreshed 5 min before expiry in `dataverse/auth.ts` |

**Bootstrap admin:** `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.local` bypass Dataverse. This admin always takes priority. Use it when Dataverse user records are not yet set up.

**Session payload fields:** `userid`, `email`, `name`, `role`, `userrole`, `schoolId`

### Dataverse OData API

The Dataverse layer (`src/lib/dataverse/`) speaks OData v9.2 over HTTPS. Key patterns:

```ts
// GET collection with filters
const r = await dataverseClient.get(`sms_students?$select=...&$filter=...&$top=20&$skip=0&$count=true`);
const items = r.value;               // array of records
const total = r['@odata.count'];     // total matching (only when $count=true)
const nextLink = r['@odata.nextLink']; // cursor for next page (when present)

// GET single record
const r = await dataverseClient.get(`sms_students(${id})?$select=...`);

// CREATE — returns entity ID in the Location header (handled by client)
await dataverseClient.post('sms_students', payload);

// UPDATE — returns 204 No Content
await dataverseClient.patch(`sms_students(${id})`, payload);

// DELETE — returns 204 No Content
await dataverseClient.delete(`sms_students(${id})`);

// Bind a lookup (foreign key)
payload['sms_class@odata.bind'] = `/sms_classes(${classId})`;

// Bind to the school (required on create for every non-root entity)
payload['sms_school@odata.bind'] = `/sms_schools(${schoolId})`;
```

OData field naming conventions in this project:
- Table name: `sms_<entity>s` (e.g. `sms_students`, `sms_teachers`)
- Primary key: `sms_<entity>id` (e.g. `sms_studentid`)
- Lookup (foreign key) columns: `_sms_<entity>_value`
- Formatted values (display labels for lookups and option-sets): `<column>@OData.Community.Display.V1.FormattedValue`

### Option-set Constants

Dataverse option-sets use integer codes. All codes are defined in **`src/lib/constants/index.ts`** — never hardcode them in page files.

```ts
import {
  GENDER,                    // { Male: 1, Female: 2 }
  GENDER_LABEL,              // { 1: 'Male', 2: 'Female' }
  STUDENT_STATUS,            // { Active: 1, Graduated: 2, … }
  STUDENT_STATUS_LABEL,      // { 1: 'Active', 2: 'Graduated', … }
  STUDENT_STATUS_VARIANT,    // { 1: 'success', 2: 'info', … } — for Badge component
  STUDENT_STATUS_OPTIONS,    // [{ value: 1, label: 'Active', variant: 'success' }, …]
  ENROLLMENT_STATUS_CODE,    // 922330000 (only valid value in Dataverse right now)
  ENROLLMENT_STATUS_OPTIONS, // [{ value: 922330000, label: 'Enrolled' }]
  TEACHER_STATUS, TEACHER_STATUS_LABEL,
  EMPLOYEE_STATUS, EMPLOYEE_STATUS_LABEL, EMPLOYEE_TYPE, EMPLOYEE_TYPE_LABEL,
  USER_ROLE, USER_ROLE_LABEL,
} from '@/lib/constants';
```

> **Why `922330000`?** Dataverse option-sets created with a custom publisher prefix get codes in the `922330000+` range. The enrollment status table currently has only one option. All UI labels map to this single code until more options are added in the Power Apps admin.

---

## 7. Frontend Patterns

### API Client

Import from the domain module, not the generic `api-client`:

```ts
// Preferred — domain-scoped import
import { studentsAPI } from '@/lib/api/people';
import { feesAPI, feePaymentsAPI } from '@/lib/api/finance';
import { attendanceAPI } from '@/lib/api/operations';

// Legacy — still works (re-exports everything), but avoid in new code
import { studentsAPI } from '@/lib/api-client';
```

The axios interceptor in `src/lib/api/client.ts` unwraps `response.data` automatically, so every call resolves directly to the JSON body:

```ts
const res = await studentsAPI.getAll({ page: 1, pageSize: 20 });
// res is { success: true, data: Student[], totalCount: number }
```

Errors are thrown as the response body: `{ success: false, error: '...' }`.

### Hooks

**Generic paginated list:** `usePaginatedList<T>` in `src/hooks/usePaginatedList.ts`

```ts
import { usePaginatedList } from '@/hooks/usePaginatedList';

// Inside a component:
const { items, totalCount, loading, error, refetch } = usePaginatedList(
  () => teachersAPI.getAll({ page, pageSize, search }) as unknown as Promise<{ data: Teacher[]; totalCount: number }>,
  [page, pageSize, search]   // deps — re-fetches when any of these change
);
```

**Entity-specific hook:** wrap `usePaginatedList` and add domain logic:

```ts
// src/hooks/useTeachers.ts
export function useTeachers(page = 1, pageSize = 20, search?: string) {
  const result = usePaginatedList<Teacher>(
    () => teachersAPI.getAll({ page, pageSize, search }) as unknown as Promise<{ data: Teacher[]; totalCount: number }>,
    [page, pageSize, search]
  );
  return {
    teachers: result.items,
    loading:  result.loading,
    error:    result.error,
    refetch:  result.refetch,
    pagination: {
      page, pageSize,
      totalCount:  result.totalCount,
      hasNextPage: page * pageSize < result.totalCount,
    },
  };
}
```

### Forms

All forms use `react-hook-form` + `zod`. Pattern:

```tsx
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

// Use register for: Input, Textarea, checkboxes
<Input {...register('firstname')} />

// Use Controller for: SelectRoot, DatePicker (controlled components)
<Controller
  control={control}
  name="gender"
  render={({ field }) => (
    <SelectRoot value={field.value} onValueChange={field.onChange}>
      <SelectTrigger className={ST}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="Male">Male</SelectItem>
        <SelectItem value="Female">Female</SelectItem>
      </SelectContent>
    </SelectRoot>
  )}
/>

// DatePicker
<Controller
  control={control}
  name="dateofbirth"
  render={({ field }) => (
    <DatePicker value={field.value} onChange={field.onChange} />
  )}
/>
```

Form layout convention:

```tsx
<div className="space-y-4">
  {/* Primary fields — plain */}
  <div className="space-y-4"> ... </div>

  {/* Relational / lookup fields — card */}
  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section Title</p>
    ...
  </div>
</div>
```

### Components

Import from barrel paths:

```ts
// Preferred
import { StudentTable, StudentForm, StudentCard } from '@/components/students';
import { Button, Input, Badge, Dialog } from '@/components/ui';
import { Header, Sidebar } from '@/components/layout';

// Also fine (direct file import)
import { StudentTable } from '@/components/students/StudentTable';
```

UI component quick reference:

| Component | Import | Notes |
|---|---|---|
| `Button` | `@/components/ui` | `variant`: default, outline, ghost, destructive. `size`: default, sm, icon |
| `Input` | `@/components/ui` | Standard `<input>` wrapper |
| `Badge` | `@/components/ui` | `variant`: success, info, warning, error, default |
| `SelectRoot` + friends | `@/components/ui` | Named exports: `SelectRoot`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` |
| `DatePicker` | `@/components/ui` | Props: `value: string (YYYY-MM-DD)`, `onChange: (v: string) => void` |
| `Dialog` | `@/components/ui` | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` |
| `ConfirmDialog` | `@/components/ui` | Delete confirmation. Props: `open`, `onOpenChange`, `onConfirm`, `title`, `description` |
| `Pagination` | `@/components/ui` | Props: `page`, `totalPages`, `total`, `pageSize`, `label`, `onChange` |

---

## 8. Backend Patterns

### Route Handlers

Every route handler follows this structure:

```ts
// src/app/api/teachers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTeachers, createTeacher } from '@/lib/dataverse/teachers';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
  firstname: z.string().min(1),
  // ...
});

export async function GET(request: NextRequest) {
  return withSchool(request, async () => {
    try {
      const p      = request.nextUrl.searchParams;
      const search = p.get('search') || undefined;
      const result = await getTeachers({ search });
      return NextResponse.json({ success: true, data: result.items, totalCount: result.totalCount });
    } catch (error) {
      return serverError(error);   // logs + returns sanitised 500
    }
  });
}

export async function POST(request: NextRequest) {
  return withSchool(request, async () => {
    try {
      const parsed = await parseBody(request, createSchema);
      if ('response' in parsed) return parsed.response;   // 400 on validation failure
      const data = await createTeacher(parsed.data);
      return NextResponse.json({ success: true, data, message: 'Teacher created' }, { status: 201 });
    } catch (error) {
      return serverError(error);
    }
  });
}
```

Rules:
- Always wrap in `withSchool(request, async () => { ... })`
- Always catch and return `serverError(error)` — never let exceptions bubble
- Never return `error.message` or `error.response?.data` raw (this leaks internals)
- Validate with `parseBody(request, zodSchema)` — check `'response' in parsed` to short-circuit on validation failure

### Dataverse Modules

Each module in `src/lib/dataverse/` follows the same structure:

```ts
import { dataverseClient } from './client';

const TABLE = 'sms_teachers';

// ── Types ──────────────────────────────────────────────────────────────────
export interface Teacher { ... }
export interface CreateTeacherRequest { ... }
export interface TeacherFilters { search?: string; status?: number; page?: number; pageSize?: number; }

// ── SELECT strings ─────────────────────────────────────────────────────────
// LIST_SELECT omits large text/memo fields (e.g. base64 images) for list queries
const LIST_SELECT = [...].join(',');
const SELECT      = [..., 'sms_profilepicture', ...].join(',');  // full, for single-record fetch

// ── Map function ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeacher(item: any): Teacher { ... }

// ── CRUD exports ───────────────────────────────────────────────────────────
export const getTeachers    = async (filters?: TeacherFilters) => { ... };
export const getTeacherById = async (id: string): Promise<Teacher> => { ... };
export const createTeacher  = async (data: CreateTeacherRequest) => { ... };
export const updateTeacher  = async (id: string, data: Partial<CreateTeacherRequest>) => { ... };
export const deleteTeacher  = async (id: string): Promise<void> => { ... };
```

Key rules for Dataverse modules:
- Use `LIST_SELECT` (no large fields) for collection queries, full `SELECT` only for single-record fetches
- Use `$top=pageSize&$skip=(page-1)*pageSize&$count=true` for server-side pagination
- Bind lookups with `@odata.bind`, never send bare GUIDs for lookup columns
- Always escape OData string values: `value.replace(/'/g, "''")`
- `getStats` should use `$count=true&$top=1` parallel queries — never fetch all rows then filter client-side

---

## 9. Adding a New Entity

Follow these steps to add a new entity end-to-end. Example: `sms_houses` (boarding houses).

### Step 1 — Constants (if the entity has option-sets)

```ts
// src/lib/constants/index.ts
export const HOUSE_STATUS = { Active: 1, Inactive: 2 } as const;
export const HOUSE_STATUS_LABEL: Record<number, string> = { 1: 'Active', 2: 'Inactive' };
```

### Step 2 — Dataverse module

```ts
// src/lib/dataverse/houses.ts
import { dataverseClient } from './client';

const TABLE = 'sms_houses';

export interface House { houseid: string; name: string; capacity: number; statuscode: number; }
export interface CreateHouseRequest { name: string; capacity: number; statuscode?: number; }

const SELECT = 'sms_houseid,sms_name,sms_capacity,sms_statuscode,createdon';

function mapHouse(item: any): House {
  return {
    houseid:    item.sms_houseid,
    name:       item.sms_name      ?? '',
    capacity:   item.sms_capacity  ?? 0,
    statuscode: item.sms_statuscode ?? 1,
  };
}

export const getHouses = async () => {
  const r = await dataverseClient.get(`${TABLE}?$select=${SELECT}&$orderby=sms_name asc`);
  return { items: (r.value ?? []).map(mapHouse), totalCount: r['@odata.count'] ?? 0 };
};

export const getHouseById = async (id: string): Promise<House> => {
  const r = await dataverseClient.get(`${TABLE}(${id})?$select=${SELECT}`);
  return mapHouse(r);
};

export const createHouse = async (data: CreateHouseRequest) => {
  return dataverseClient.post(TABLE, { sms_name: data.name, sms_capacity: data.capacity });
};

export const updateHouse = async (id: string, data: Partial<CreateHouseRequest>) => {
  const payload: Record<string, unknown> = {};
  if (data.name     !== undefined) payload.sms_name     = data.name;
  if (data.capacity !== undefined) payload.sms_capacity = data.capacity;
  await dataverseClient.patch(`${TABLE}(${id})`, payload);
  return getHouseById(id);
};

export const deleteHouse = async (id: string): Promise<void> => {
  await dataverseClient.delete(`${TABLE}(${id})`);
};
```

### Step 3 — API route handlers

```ts
// src/app/api/houses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getHouses, createHouse } from '@/lib/dataverse/houses';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const createSchema = z.object({
  name:     z.string().min(1),
  capacity: z.number().int().positive(),
});

export async function GET(request: NextRequest) {
  return withSchool(request, async () => {
    try {
      const result = await getHouses();
      return NextResponse.json({ success: true, data: result.items, totalCount: result.totalCount });
    } catch (error) { return serverError(error); }
  });
}

export async function POST(request: NextRequest) {
  return withSchool(request, async () => {
    try {
      const parsed = await parseBody(request, createSchema);
      if ('response' in parsed) return parsed.response;
      const data = await createHouse(parsed.data);
      return NextResponse.json({ success: true, data, message: 'House created' }, { status: 201 });
    } catch (error) { return serverError(error); }
  });
}
```

```ts
// src/app/api/houses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getHouseById, updateHouse, deleteHouse } from '@/lib/dataverse/houses';
import { parseBody, serverError, withSchool } from '@/lib/api-guard';

const updateSchema = z.object({
  name:     z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  return withSchool(_, async () => {
    try {
      const data = await getHouseById(params.id);
      return NextResponse.json({ success: true, data });
    } catch (error) { return serverError(error); }
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withSchool(request, async () => {
    try {
      const parsed = await parseBody(request, updateSchema);
      if ('response' in parsed) return parsed.response;
      const data = await updateHouse(params.id, parsed.data);
      return NextResponse.json({ success: true, data });
    } catch (error) { return serverError(error); }
  });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  return withSchool(_, async () => {
    try {
      await deleteHouse(params.id);
      return NextResponse.json({ success: true, message: 'House deleted' });
    } catch (error) { return serverError(error); }
  });
}
```

### Step 4 — API client module

Add to the appropriate domain file or create `src/lib/api/facilities.ts`:

```ts
export const housesAPI = {
  getAll:  ()                      => apiClient.get('/houses'),
  getById: (id: string)            => apiClient.get(`/houses/${id}`),
  create:  (data: any)             => apiClient.post('/houses', data),
  update:  (id: string, data: any) => apiClient.put(`/houses/${id}`, data),
  delete:  (id: string)            => apiClient.delete(`/houses/${id}`),
};
```

Re-export it from `src/lib/api/index.ts`.

### Step 5 — Hook (if it's a list page)

```ts
// src/hooks/useHouses.ts
import { usePaginatedList } from './usePaginatedList';
import { housesAPI } from '@/lib/api/facilities';
import type { House } from '@/lib/dataverse/houses';

export function useHouses() {
  return usePaginatedList<House>(
    () => housesAPI.getAll() as unknown as Promise<{ data: House[]; totalCount: number }>,
    []
  );
}
```

### Step 6 — Verify

```bash
npm run build   # Must pass with zero TypeScript errors
```

---

## 10. Constants Reference

All constants live in `src/lib/constants/index.ts`.

### Gender (`sms_gender`)
| Code | Label |
|---|---|
| 1 | Male |
| 2 | Female |

### Student Status (`sms_studentstatus`)
| Code | Label | Badge variant |
|---|---|---|
| 1 | Active | success |
| 2 | Graduated | info |
| 3 | Transferred | warning |
| 4 | Suspended | error |

### Enrollment Status (`sms_enrollmentstatus`)
| Code | Label |
|---|---|
| 922330000 | Enrolled |

> Only one option currently exists in Dataverse. All UI labels map to `922330000`. Add more in Power Apps admin when needed.

### Teacher Status (`sms_teacherstatus`)
| Code | Label |
|---|---|
| 1 | Active |
| 2 | On Leave |
| 3 | Resigned |

### Employee Status (`sms_statuscode`) / Type (`sms_employeetype`)
| Code | Status | Type |
|---|---|---|
| 1 | Active | Full-time |
| 2 | On Leave | Part-time |
| 3 | Resigned | Contract |
| 4 | Terminated | Intern |

### User Roles (`sms_userrole`)
| Code | Role |
|---|---|
| 1 | Admin |
| 2 | Teacher |
| 3 | Finance |
| 4 | Inventory Manager |
| 5 | Transport Manager |
| 6 | Pool Attendant |
| 7 | Parent |
| 8 | Kitchen Attendant |

---

## 11. Environment Variables

```
DATAVERSE_URL          # https://yourorg.crm.dynamics.com
AZURE_TENANT_ID        # Azure AD tenant ID
AZURE_CLIENT_ID        # App registration client ID
AZURE_CLIENT_SECRET    # App registration client secret
NEXTAUTH_URL           # http://localhost:3000 (dev) or production URL
AUTH_SECRET            # JWT signing secret — openssl rand -base64 32
NEXTAUTH_SECRET        # Same value as AUTH_SECRET is fine
ADMIN_EMAIL            # Bootstrap admin login email (bypasses Dataverse)
ADMIN_PASSWORD         # Bootstrap admin login password
```

---

## 12. Scripts & Utilities

```bash
# Seed one admin user per school (password: School@2025)
npx ts-node --skipProject scripts/seed-school-users.ts

# Seed 4 academic years (2023–2027) per school
npx ts-node --skipProject scripts/seed-academic-years.ts

# Patch orphaned records → associate with a specific school
npx ts-node --skipProject scripts/update-all-records.ts
```

All scripts follow the same pattern — load `.env.local`, get an Azure AD token, call Dataverse directly via axios.

**CSV export:** `import { exportToCSV } from '@/lib/csv'` — pass column headers and a 2D array of values.

---

## 13. Common Pitfalls

### Dataverse option-set values are not always 1, 2, 3…

Custom publisher option-sets use codes in the `922330000+` range. Always check `src/lib/constants/index.ts` before assuming a value. Sending the wrong code causes a `400 "value X outside valid range"` error from Dataverse.

### `sms_profilepicture` is a Memo (text) column, not an Image column

It stores a base64 data URL string (e.g. `data:image/jpeg;base64,...`). Write it via PATCH like any other text field. Attempting binary PUT to a separate endpoint will fail — there is no image endpoint.

### Omit large Memo fields from list queries

`sms_profilepicture` is ~20 KB of base64 per student. Never include it in list `SELECT` strings — use a `LIST_SELECT` constant without it. Only fetch it in `getStudentById` (single record). See `src/lib/dataverse/students.ts` for the pattern.

### Lookup bindings must use `@odata.bind`, not bare GUIDs

```ts
// Wrong — Dataverse ignores bare GUID fields for lookup columns
payload._sms_class_value = classId;

// Correct
payload['sms_class@odata.bind'] = `/sms_classes(${classId})`;
```

### OData strings must escape single quotes

```ts
const q = userInput.replace(/'/g, "''");
`contains(sms_firstname,'${q}')`
```

Forgetting this causes OData parse errors when user input contains apostrophes (e.g. "O'Brien").

### `sms_schools` has no `_sms_school_value` column

It is the root entity. The auto-filter in `DataverseClient` skips it (it's in the `NO_TENANT_TABLES` list). Access it via `getSchoolById(schoolId)` — don't rely on the automatic filter.

### Route guard is `proxy.ts`, not `middleware.ts`

Next.js 16 renamed the middleware export. The exported function must be named `proxy` in `src/proxy.ts`. Do not create `middleware.ts` — it is deprecated and ignored.

### `withSchool` is required in every route handler

Forgetting it means `getTenantId()` returns `undefined` inside Dataverse calls, which causes the school filter to be empty and potentially leaks cross-tenant data.

### Dataverse `$skip` requires `$orderby`

OData pagination with `$skip` is undefined without a stable sort order. Always pair `$top`/`$skip` with an `$orderby` clause.

---

*Last updated: 2026-05-13*
