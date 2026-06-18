# School Management System (SMS)

A multi-tenant, full-stack school management system built with Next.js 16 and Microsoft Dataverse for nursery-to-secondary schools. It supports multiple curriculum types (GES, Cambridge, IB, American, French), configurable modules, and role-based access — running many independent schools from a single installation.

## Features

### Academic
| Module | Description |
|--------|-------------|
| Students | Enrol, edit, track profile, parent links, promotion history |
| Teachers | Staff records, subject and class assignments |
| Parents | Parent profiles, linked to student records |
| Classes & Subjects | Class management with grade levels and departments |
| Timetable | Weekly period scheduling per class |
| Attendance | Daily mark-attendance with trend charts |
| Gradebook | Class scores + exam scores → automatic letter grades (GES A1–F9 scale built in) |
| Exams | Exam scheduling and result entry |
| Enrollments | Student-class enrollment management |
| Promotions | End-of-year bulk student promotion / retention |
| Report Cards | Per-student per-term report with print/PDF output |

### Administration
| Module | Description |
|--------|-------------|
| Employees | Non-teaching staff records |
| Staff Leave | Leave applications and approval tracking |
| Announcements | School-wide notice board |
| Activities | Extra-curricular activity management |
| Disciplinary | Student disciplinary case logging |
| Health / Medical | Student medical records |
| Setup | Academic years, terms, grade levels, departments, fee types, school profile, users |

### Finance
| Module | Description |
|--------|-------------|
| Fees | Fee invoice generation and tracking |
| Fee Payments | Payment recording and receipt generation |
| Fee Structures | Fee templates by grade level / term |
| Fee Types | Configurable fee categories |
| Scholarships | Scholarship assignments |
| Finance Dashboard | Revenue summaries and payment status |

### Operations
| Module | Description |
|--------|-------------|
| Inventory | Stock items with quantity and reorder tracking |
| Procurement | Purchase orders and supplier management |
| Transport | Vehicle fleet and route management |
| Library | Book catalogue and loan tracking |
| Pool Management | Pool sessions, rentals, and transactions |

### Platform
| Module | Description |
|--------|-------------|
| Multi-tenancy | Each school is an isolated tenant; data is filtered by school on every query |
| Onboarding | Guided setup wizard to register a new school or switch between schools |
| School Profile | Logo, motto, colors, address, EMIS code, curriculum type |
| Branding | Per-school sidebar colors and logo applied dynamically via CSS variables |
| User Management | Per-school user accounts + a super-admin **Module Access** matrix to grant each role specific modules |
| Reports | National exam results and custom report generation |
| AI Assistant | Built-in AI chat for data queries |
| Parent Portal | Standalone `/parent` experience: announcements, per-child class info / attendance / grades / fees / report card, and feedback — with its own light/dark theme, independent of the admin theme |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Microsoft Dataverse (OData v4 REST API) |
| Auth — sessions | Custom JWT via `jose`; httpOnly cookie `sms.session` |
| Auth — Dataverse | Azure AD client credentials (server-side only) |
| Multi-tenancy | `AsyncLocalStorage` — `schoolId` injected per request via `x-school-id` header |
| UI | Tailwind CSS v4, shadcn/ui, Lucide icons |
| Forms | react-hook-form + Zod (client and server validation) |
| i18n | 5 locales: English, French, Spanish, German, Portuguese |
| Dark mode | Tailwind `dark:` classes + system preference toggle (parent portal has its own scoped theme) |
| Testing | Vitest unit tests (`npm test`) + GitHub Actions CI (lint → test → build) |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` from the table below:

```env
# Microsoft Dataverse
DATAVERSE_URL=https://yourorg.crm.dynamics.com
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# App auth
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_SECRET=same-as-AUTH_SECRET

# Bootstrap admin (always available, bypasses Dataverse)
ADMIN_EMAIL=admin@yourschool.edu.gh
ADMIN_PASSWORD=strong-password-here
```

> Never commit `.env.local` — it is already in `.gitignore`.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First-time visitors are redirected to `/onboarding` to register or select a school.

### 4. Production build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── proxy.ts                    # Route guard — verifies JWT, injects x-school-id header
├── app/
│   ├── (dashboard)/            # All authenticated pages (wrapped in Sidebar + Header)
│   │   ├── dashboard/          # Home dashboard with KPI cards and charts
│   │   ├── students/           # Student management + [id] detail page
│   │   ├── teachers/           # Teacher management
│   │   ├── employees/          # Employee (non-teaching staff) management
│   │   ├── parents/            # Parent profiles
│   │   ├── classes/            # Class management
│   │   ├── subjects/           # Subject catalogue
│   │   ├── attendance/         # Daily attendance
│   │   ├── gradebook/          # Scores and grade calculation
│   │   ├── exams/              # Exam scheduling and results
│   │   ├── enrollments/        # Student-class enrollment
│   │   ├── fees/               # Fee invoices
│   │   ├── finance/            # Fee payments, fee structures, scholarships
│   │   ├── inventory/          # Stock management
│   │   ├── procurement/        # Purchase orders
│   │   ├── transport/          # Vehicle and route management
│   │   ├── library/            # Book catalogue and loans
│   │   ├── pool/               # Pool sessions and rentals
│   │   ├── health/             # Student medical records
│   │   ├── disciplinary/       # Disciplinary cases
│   │   ├── activities/         # Extra-curricular activities
│   │   ├── announcements/      # School notices
│   │   ├── staff-leave/        # Staff leave management
│   │   ├── timetable/          # Weekly timetable
│   │   ├── reports/            # Report cards + national exam reports
│   │   ├── portal/             # Student / parent self-service portal
│   │   ├── profile/            # User profile
│   │   └── setup/              # Academic years, terms, grade levels, fee types,
│   │                           #   school profile, user management
│   ├── api/                    # Next.js Route Handlers (server-side)
│   ├── auth/login/             # Login page (public)
│   └── onboarding/             # School registration / switcher (public)
├── lib/
│   ├── api-client.ts           # Frontend axios wrapper (baseURL /api)
│   ├── api-guard.ts            # Server-side Zod body parser + error helpers
│   ├── session.ts              # JWT sign/verify via jose
│   ├── i18n/                   # Translations (en, fr, es, de, pt)
│   └── dataverse/              # OData data access layer (server-only)
│       ├── client.ts           # Singleton DataverseClient with auto Bearer token
│       ├── auth.ts             # Azure AD client credentials token cache
│       ├── tenant.ts           # AsyncLocalStorage school-ID resolver
│       └── *.ts                # One module per entity
├── components/
│   ├── layout/                 # Sidebar (dynamic branding), Header
│   └── ui/                     # shadcn/ui + custom components
├── contexts/
│   ├── AuthContext.tsx          # Session user state
│   └── BrandContext.tsx         # Per-school colors, name, motto, logo
└── types/                      # Shared TypeScript types
```

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATAVERSE_URL` | Yes | Dataverse org URL (`https://org.crm.dynamics.com`) |
| `AZURE_TENANT_ID` | Yes | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Yes | App registration client ID |
| `AZURE_CLIENT_SECRET` | Yes | App registration client secret |
| `AUTH_SECRET` | Yes | JWT signing secret. **Production requires ≥32 chars** — the app throws on a missing/weak secret |
| `NEXTAUTH_SECRET` | Yes | Fallback JWT secret |
| `NEXTAUTH_URL` | Yes | Public app base URL |
| `ADMIN_EMAIL` | Yes | Bootstrap admin email (env-only, no Dataverse lookup) |
| `ADMIN_PASSWORD` | Yes | Bootstrap admin password |

## Multi-Tenancy

Each school is a fully isolated tenant. The mechanism:

1. **Login** — the `sms.session` JWT embeds a `schoolId` (the school's Dataverse GUID).
2. **Proxy** (`src/proxy.ts`) — on every request, decodes the JWT and injects `x-school-id: <schoolId>`, **stripping any client-supplied value** so the tenant can only come from the verified token.
3. **Dataverse client** (`src/lib/dataverse/client.ts` + `tenant.ts`) — reads `schoolId` from `AsyncLocalStorage` and enforces isolation on **every** operation: list queries get a `_sms_school_value` filter, and single-record reads / PATCH / DELETE verify the record's school and return 404 on a cross-tenant mismatch.
4. **School switching** — `POST /api/school/switch` re-issues the JWT with the new `schoolId` and reloads the dashboard.
5. **Branding** — `BrandContext` fetches the active school's name, motto, and logo on mount; stores them in `localStorage` for instant display; applies primary/sidebar colors as CSS variables.

## User Roles

| Value | Role | Access |
|-------|------|--------|
| 1 | Admin | Full access |
| 2 | Teacher | Academic modules |
| 3 | Finance | Finance modules |
| 4 | Inventory Manager | Inventory, procurement |
| 5 | Transport Manager | Transport module |
| 6 | Pool Attendant | Pool module |
| 7 | Parent | Student portal |
| 8 | Kitchen Attendant | Limited access |

## Dataverse Tables

All tables use the `sms_` prefix and include a `_sms_school_value` lookup for multi-tenancy.

`sms_schools`, `sms_users`, `sms_students`, `sms_teachers`, `sms_employees`, `sms_parents`, `sms_classes`, `sms_subjects`, `sms_departments`, `sms_gradelevels`, `sms_academicyears`, `sms_terms`, `sms_enrollments`, `sms_attendances`, `sms_grades`, `sms_exams`, `sms_examresults`, `sms_promotions`, `sms_fees`, `sms_feepayments`, `sms_feestructures`, `sms_feetypes`, `sms_scholarships`, `sms_timetable`, `sms_librarybooks`, `sms_libraryloans`, `sms_inventoryitems`, `sms_vehicles`, `sms_staffleaves`, `sms_activities`, `sms_announcements`, `sms_disciplinary`, `sms_medical`, `sms_expenditures`, `sms_poolsessions`, `sms_poolrentals`, `sms_pooltransactions`, `sms_procurement`

## Seed & Utility Scripts

Run any script with:
```bash
npx ts-node --skipProject scripts/<script-name>.ts
```

| Script | Purpose |
|--------|---------|
| `seed-people.ts` | Seed students, teachers, parents |
| `seed-schools.ts` | Create school records |
| `seed-school-users.ts` | Create per-school admin login accounts |
| `seed-academic-years.ts` | Create 4 academic years (2023–2027) per school |
| `seed-fee-types.ts` | Seed standard fee type categories |
| `seed-fees.ts` | Seed fee invoices |
| `seed-enrollments.ts` | Enroll students in classes |
| `seed-departments.ts` | Seed department records |
| `seed-grade-levels.ts` | Seed grade level records |
| `seed-exams.ts` | Seed exam records |
| `seed-inventory.ts` | Seed inventory items |
| `seed-procurement.ts` | Seed purchase orders |
| `seed-vehicles.ts` | Seed transport vehicles |
| `seed-library.ts` | Seed library books |
| `seed-pool.ts` | Seed pool sessions and rentals |
| `seed-staffleave.ts` | Seed staff leave records |
| `seed-activities.ts` | Seed activities |
| `seed-announcements.ts` | Seed announcements |
| `seed-scholarships.ts` | Seed scholarship records |
| `update-all-records.ts` | Patch school profiles + associate orphaned records with Grey Academy |
| `update-academic-years.ts` | Fix/upsert academic year records |
| `list-schools.ts` | Inspect current school records |
| `test-connection.ts` | Test Azure AD token + Dataverse connectivity |
| `test-dataverse.ts` | Full Dataverse CRUD test |
| `quick-test.ts` | Quick smoke test |

## NPM Scripts

```bash
npm run dev              # Development server (Turbopack)
npm run build            # Production build (must pass — zero TS errors)
npm run lint             # ESLint (CI gates on errors; warnings allowed)
npm test                 # Vitest unit tests (tenant isolation, rate limiter)
npm run test:watch       # Vitest in watch mode
npm run test:connection  # Test Azure AD token + Dataverse connectivity (manual, needs .env.local)
npm run test:dataverse   # Full Dataverse CRUD test (manual)
npm run test:quick       # Quick smoke test (manual)
```

## Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request: **lint → unit tests → production build**. The build is the hard gate (zero TypeScript errors); lint fails only on errors (not warnings).
