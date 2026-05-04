# Ghana School Management System

A full-stack school management system built with Next.js 16 and Microsoft Dataverse, designed for Ghanaian nursery-to-secondary schools following Ghana Education Service (GES) standards.

## Features

| Module | Description |
|--------|-------------|
| Students | Enrol, edit, track profile, parent links, medical & disciplinary records |
| Teachers | Staff records, subject assignments |
| Classes & Subjects | Class management with timetable |
| Attendance | Daily mark-attendance with trends |
| Gradebook | Class scores + exam scores → GES letter grades (A1–F9) |
| Exams | Exam scheduling and result entry |
| Report Cards | Per-student per-term report with print/PDF output |
| Fees & Finance | Fee structures, payments, scholarships |
| Library | Book catalogue and loan tracking |
| Promotions | End-of-year bulk student promotion / retention |
| Setup | Academic years, terms, grade levels |

## Tech Stack

- **Framework** — Next.js 16 (App Router, Turbopack)
- **Database** — Microsoft Dataverse (OData REST API)
- **Auth** — Custom JWT sessions via `jose` + Azure AD client credentials for Dataverse
- **UI** — Tailwind CSS, shadcn/ui components, Lucide icons
- **Forms** — react-hook-form + Zod validation (frontend and server-side)
- **Security** — `src/proxy.ts` guards all routes; `src/lib/api-guard.ts` validates every API request

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
# Microsoft Dataverse
DATAVERSE_URL=https://yourorg.crm.dynamics.com
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# App auth
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_SECRET=same-or-different-secret

# Admin login
ADMIN_EMAIL=admin@yourschool.edu.gh
ADMIN_PASSWORD=strong-password-here
```

> Never commit `.env.local`. It is already in `.gitignore`.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin credentials.

### 4. Production build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── proxy.ts                  # Route guard (auth check for all pages + API routes)
├── app/
│   ├── (dashboard)/          # All authenticated pages
│   ├── api/                  # Next.js Route Handlers
│   └── auth/login/           # Login page (public)
├── lib/
│   ├── api-client.ts         # Frontend axios wrapper (baseURL /api)
│   ├── api-guard.ts          # Server-side auth helpers + Zod body parser
│   ├── session.ts            # JWT sign/verify via jose
│   └── dataverse/            # OData data access layer (server-only)
├── components/
│   ├── layout/               # Sidebar, Header
│   └── ui/                   # shadcn/ui + custom components
└── types/                    # Shared TypeScript types
```

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATAVERSE_URL` | Yes | Your Dataverse org URL |
| `AZURE_TENANT_ID` | Yes | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Yes | App registration client ID |
| `AZURE_CLIENT_SECRET` | Yes | App registration client secret |
| `AUTH_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `NEXTAUTH_SECRET` | Yes | Fallback JWT secret |
| `NEXTAUTH_URL` | Yes | Public app URL |
| `ADMIN_EMAIL` | Yes | Login email for admin |
| `ADMIN_PASSWORD` | Yes | Login password for admin |

## Dataverse Setup

This app uses a custom Dataverse solution with `sms_` prefixed tables. Required entities:

`sms_students`, `sms_teachers`, `sms_classes`, `sms_subjects`, `sms_departments`, `sms_employees`, `sms_attendancerecords`, `sms_grades`, `sms_exams`, `sms_examresults`, `sms_fees`, `sms_feepayments`, `sms_feestructures`, `sms_scholarships`, `sms_books`, `sms_libraryloans`, `sms_enrollments`, `sms_timetable`, `sms_terms`, `sms_academicyears`, `sms_gradelevels`, `sms_promotions`, `sms_disciplinary`, `sms_medical`, `sms_parents`, `sms_announcements`

## Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run lint             # ESLint
npm run test:connection  # Test Azure AD token + Dataverse connectivity
npm run test:dataverse   # Full Dataverse CRUD test
npm run test:quick       # Quick smoke test
```
