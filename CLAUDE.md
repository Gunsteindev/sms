# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
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
NEXTAUTH_SECRET       # Random secret for NextAuth
```

## Architecture

### Data Flow
```
Browser → src/lib/api-client.ts (axios, baseURL: /api)
       → src/app/api/**/*.ts (Next.js Route Handlers, server-side)
       → src/lib/dataverse/*.ts (OData REST calls)
       → Microsoft Dataverse (Azure AD client credentials OAuth2)
```

### Key Layers

**`src/lib/dataverse/`** — Server-only data access layer. `client.ts` is a singleton `DataverseClient` (axios) that auto-attaches a Bearer token from `auth.ts`. The token is cached in module-level variables; `getAccessToken()` refreshes it 5 minutes before expiry using the Azure AD client credentials flow. All entity modules (`students.ts`, `teachers.ts`, etc.) use `dataverseClient.getWithFilter()` which builds OData `$select`/`$filter`/`$orderby`/`$top`/`$skip` query strings.

**`src/app/api/`** — Next.js Route Handlers. Each resource has a `route.ts` (collection) and `[id]/route.ts` (single record). They import from `src/lib/dataverse/` and always return `{ success: boolean, data?, error? }`.

**`src/lib/api-client.ts`** — Frontend axios wrapper (baseURL `/api`). Exports named API objects (`studentsAPI`, `teachersAPI`, `attendanceAPI`, `classesAPI`, `feesAPI`, `dashboardAPI`) used by React components and hooks.

**`src/app/(dashboard)/`** — Route group for all authenticated pages. The layout wraps every page in `<Sidebar>` + `<Header>` + scrollable `<main>`.

**`src/types/`** — Shared types. `index.ts` defines `BaseEntity`, `ApiResponse<T>`, `PaginatedResponse<T>`, and `UserRole`. Each domain module in `dataverse/` also exports its own types (re-exported from `lib/dataverse/index.ts`).

**`src/hooks/`** — Custom hooks (`useStudents`, `useAttendance`, `useAuth`) that call `api-client.ts` functions and manage local state.

### Authentication
Two separate auth concerns:
1. **User sessions** — NextAuth v5 (`src/app/api/auth/[...nextauth]/route.ts`), `src/contexts/AuthContext.tsx`
2. **Dataverse API** — Azure AD client credentials (server-side only, in `src/lib/dataverse/auth.ts`)

The Dataverse client's response interceptor calls `window.location.href` on 401 — this will throw server-side; it is only safe in browser context.
