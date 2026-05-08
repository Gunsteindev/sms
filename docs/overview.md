# Ghana School Management System — Overview

## What It Is

A multi-tenant, full-stack web application for managing day-to-day operations of Ghanaian schools from nursery through secondary level. Built around the requirements of the Ghana Education Service (GES), it handles student records, academic assessments, term-end report cards, fee collection, library operations, staff management, transport, inventory, and more — across multiple independent school tenants in a single installation.

## Who It Is For

School administrators and academic staff who need a single system to:
- Enrol and manage students across grade levels
- Record continuous assessment and exam scores using the GES scale
- Generate GES-compliant termly report cards
- Track attendance, fees, and library activity
- Promote or retain students at the end of each academic year
- Manage transport, inventory, procurement, and staff leave

Designed for **multi-school deployments** — each school is a fully isolated tenant sharing no data with other schools.

## Feature Summary

### Academic
| Module | What It Does |
|--------|-------------|
| **Dashboard** | Live KPIs: students, teachers, attendance, revenue, trends, AI summary |
| **Students** | Full profiles, parent links, medical records, disciplinary history, enrolment |
| **Teachers** | Staff records, qualifications, subject and class assignments |
| **Employees** | Non-teaching staff by department |
| **Parents** | Guardian profiles linked to student records; portal access |
| **Classes & Subjects** | Class setup with grade level, room, capacity, timetable |
| **Enrollments** | Link students to classes per academic year and term |
| **Attendance** | Daily mark-attendance per class with trend charts |
| **Gradebook** | Enter class scores and compute GES grade letters in real time |
| **Exams** | Schedule exams, enter results, auto-calculate pass/fail |
| **Report Cards** | Per-student per-term report with GES formula and print-to-PDF |
| **Timetable** | Weekly period scheduling per class |
| **Promotions** | End-of-year bulk promote, retain, transfer, or graduate students |

### Administration
| Module | What It Does |
|--------|-------------|
| **Departments** | Academic departments with head-of-department |
| **Staff Leave** | Leave applications, approval workflow, leave history |
| **Announcements** | School-wide notice board with audience targeting |
| **Activities** | Extra-curricular clubs, sports, and participation tracking |
| **Disciplinary** | Incident logging, sanctions, resolution tracking |
| **Health / Medical** | Student medical visits, conditions, medications, vaccinations |
| **National Exams** | BECE / WASSCE registration, index numbers, results entry |

### Finance
| Module | What It Does |
|--------|-------------|
| **Fee Types** | Configurable fee categories (Tuition, Boarding, PTA, etc.) |
| **Fee Structures** | Fee templates by grade level, term, and fee type |
| **Fees** | Fee invoicing and outstanding balance tracking |
| **Fee Payments** | Payment recording with receipt generation |
| **Scholarships** | Scholarship awards: Full, Partial, Bursary |

### Operations
| Module | What It Does |
|--------|-------------|
| **Inventory** | Stock items, receipts, issues, and quantity tracking |
| **Procurement** | Purchase orders, approvals, supplier management |
| **Transport** | Vehicle fleet, routes, driver details, maintenance |
| **Library** | Book catalogue with issue/return/overdue tracking |
| **Swimming Pool** | Pool sessions, swim groups, rentals, transactions |

### Platform
| Module | What It Does |
|--------|-------------|
| **Onboarding** | Register a new school or switch the active school session |
| **School Profile** | Logo, motto, colours, EMIS code, curriculum type, branches |
| **User Management** | Per-school user accounts with role-based access |
| **Reports** | Attendance, academic, and financial summary reports |
| **AI Assistant** | Claude-powered natural language data queries |
| **Parent Portal** | Read-only portal for parents to view notices and child updates |
| **Settings** | Language (5 locales), dark mode, notification preferences |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Microsoft Dataverse (OData v4 REST API) |
| Identity — Dataverse | Azure AD client credentials (server-side only) |
| Session Auth | Custom JWT via `jose`; httpOnly cookie `sms.session` |
| Multi-tenancy | `AsyncLocalStorage` — `schoolId` scopes every Dataverse query |
| UI | Tailwind CSS v4, shadcn/ui, Lucide icons |
| Forms | react-hook-form + Zod (client and server validation) |
| Internationalisation | 5 locales: English, French, Spanish, German, Portuguese |
| Dark mode | Tailwind `dark:` classes + system preference toggle |
| AI | Anthropic Claude API (dashboard summaries, AI assistant) |
| Language | TypeScript throughout |

## Multi-Tenancy

Each school is a fully isolated tenant. The mechanism:

1. **Login** — the `sms.session` JWT embeds a `schoolId` (Dataverse GUID of `sms_schools`).
2. **`src/proxy.ts`** — on every request, decodes the JWT and injects an `x-school-id: <schoolId>` header.
3. **`src/lib/dataverse/tenant.ts`** — `AsyncLocalStorage` carries `schoolId` through all nested async calls within a request. The Dataverse client reads it and automatically appends `$filter=_sms_school_value eq '<schoolId>'` to every OData query.
4. **School switching** — `POST /api/school/switch { schoolId }` re-issues the JWT with the new school and reloads the dashboard.
5. **Branding** — `BrandContext` fetches the active school's name, motto, and colours on mount; caches in `localStorage`; applies CSS variables to the entire UI instantly.

> **Special case**: `sms_schools` is the root entity and has no `_sms_school_value`. Route handlers for the school profile must use `getSchoolById(session.schoolId)` explicitly — never rely on the auto-filter.

## User Roles

| Value | Role | Primary Access |
|-------|------|----------------|
| 1 | Admin | Full access to all modules |
| 2 | Teacher | Academic modules (attendance, gradebook, exams, timetable) |
| 3 | Finance | Finance modules (fees, payments, scholarships) |
| 4 | Inventory Manager | Inventory and procurement |
| 5 | Transport Manager | Transport module |
| 6 | Pool Attendant | Pool module |
| 7 | Parent | Parent portal (read-only) |
| 8 | Kitchen Attendant | Limited internal access |

## GES Grading Scale

The system implements the official Ghana Education Service grade scale:

| Score Range | Grade | Description |
|-------------|-------|-------------|
| 80 – 100 | A1 | Excellent |
| 70 – 79 | B2 | Very Good |
| 60 – 69 | B3 | Good |
| 55 – 59 | C4 | Credit |
| 50 – 54 | C5 | Credit |
| 45 – 49 | C6 | Credit |
| 40 – 44 | D7 | Pass |
| 35 – 39 | E8 | Pass |
| 0 – 34 | F9 | Fail |

**Final score formula:**
```
Class Score  = average of (Classwork + Homework + MidTerm scores) × 30%
Exam Score   = End-of-Term exam result × 70%
Final Score  = Class Score + Exam Score
```
