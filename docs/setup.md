# Setup & Configuration

## Prerequisites

- Node.js 18 or later
- A Microsoft Dataverse environment (Dynamics 365 / Power Platform)
- An Azure AD app registration with Dataverse API permissions
- (Optional) An Anthropic API key for AI summaries

## Installation

```bash
git clone <repo-url>
cd sms
npm install
```

## Environment Variables

Create `.env.local` in the project root. This file is gitignored and must never be committed.

```env
# ── Microsoft Dataverse ──────────────────────────────────────────────────────
DATAVERSE_URL=https://yourorg.crm.dynamics.com
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-client-secret

# ── Application Auth ─────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-32-char-secret
NEXTAUTH_SECRET=your-32-char-secret   # can be same as AUTH_SECRET
NEXTAUTH_URL=http://localhost:3000    # change to your domain in production

# ── Bootstrap Admin ───────────────────────────────────────────────────────────
# Always available — checked before Dataverse users. Use for initial setup only.
ADMIN_EMAIL=admin@yourschool.edu.gh
ADMIN_PASSWORD=choose-a-strong-password

# ── Optional ─────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...          # required only for AI summary / assistant feature
```

### Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATAVERSE_URL` | Yes | Base URL of your Dataverse org |
| `AZURE_TENANT_ID` | Yes | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Yes | App registration client ID |
| `AZURE_CLIENT_SECRET` | Yes | App registration client secret |
| `AUTH_SECRET` | Yes | JWT signing secret (min 32 characters) |
| `NEXTAUTH_SECRET` | Yes | Fallback JWT secret |
| `NEXTAUTH_URL` | Yes | Public URL of the app |
| `ADMIN_EMAIL` | Yes | Bootstrap admin email (bypasses Dataverse) |
| `ADMIN_PASSWORD` | Yes | Bootstrap admin password |
| `ANTHROPIC_API_KEY` | No | Enables AI dashboard summaries and assistant |
| `NODE_ENV` | Auto | Set by Next.js (`development` / `production`) |

## Azure AD Setup

1. Go to **Azure Portal → App registrations → New registration**
2. Give it a name (e.g. `SMS App`)
3. Under **Certificates & secrets**, create a new client secret — save it as `AZURE_CLIENT_SECRET`
4. Under **API permissions**, add `Dynamics CRM → user_impersonation` (delegated)
5. Grant admin consent for the permissions
6. Copy **Application (client) ID** → `AZURE_CLIENT_ID`
7. Copy **Directory (tenant) ID** → `AZURE_TENANT_ID`

## Dataverse Solution

The app expects a custom Dataverse solution with `sms_` prefixed tables. Every entity table (except `sms_schools` itself) must have a `_sms_school_value` lookup column linking records to `sms_schools`.

### Required Tables

```
sms_schools           sms_users             sms_students
sms_teachers          sms_employees         sms_parents
sms_classes           sms_subjects          sms_departments
sms_gradelevels       sms_academicyears     sms_terms
sms_enrollments       sms_attendances       sms_grades
sms_exams             sms_examresults       sms_promotions
sms_fees              sms_feepayments       sms_feestructures
sms_feetypes          sms_scholarships      sms_timetable
sms_librarybooks      sms_libraryloans      sms_inventoryitems
sms_vehicles          sms_staffleaves       sms_activities
sms_announcements     sms_disciplinary      sms_medical
sms_expenditures      sms_poolsessions      sms_poolrentals
sms_pooltransactions  sms_procurement       sms_studentparents
```

See [Dataverse Schema](./schema.md) for full field definitions.

## Running the App

```bash
# Development (with hot reload via Turbopack)
npm run dev

# Verify Dataverse connectivity
npm run test:connection

# Full CRUD test
npm run test:dataverse

# Production build check (must pass with zero TS errors)
npm run build

# Start production server (after build)
npm start
```

Open [http://localhost:3000](http://localhost:3000). First-time visitors without a school session are redirected to `/onboarding`.

## Onboarding: Registering Your First School

1. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
2. You will be redirected to `/onboarding`
3. Select **Register new school** and complete the 3-step wizard
4. You will be taken to the dashboard scoped to your new school

To add more schools or switch schools, revisit `/onboarding` from the browser address bar at any time.

## Seeding Data

All seed scripts are in `scripts/` and run with:

```bash
npx ts-node --skipProject scripts/<name>.ts
```

### Essential seed order (first-time setup)

| Order | Script | What It Does |
|-------|--------|-------------|
| 1 | `seed-schools.ts` | Create school records in Dataverse |
| 2 | `seed-school-users.ts` | Create one Admin login per school |
| 3 | `seed-academic-years.ts` | Create 4 academic years (2023–2027) per school |
| 4 | `seed-grade-levels.ts` | KG, Primary, JHS, SHS grade levels |
| 5 | `seed-departments.ts` | Academic departments |
| 6 | `seed-people.ts` | Sample students and teachers |
| 7 | `seed-enrollments.ts` | Enrol students into classes |

### Data update scripts

| Script | What It Does |
|--------|-------------|
| `update-all-records.ts` | Patch all school profiles + associate orphaned records with Grey Academy |
| `update-academic-years.ts` | Fix / upsert academic year records |

### Additional seed scripts

| Script | What It Does |
|--------|-------------|
| `seed-fee-types.ts` | Standard fee type categories |
| `seed-fees.ts` | Fee invoices |
| `seed-employees.ts` | Non-teaching staff records |
| `seed-exams.ts` | Exam sessions |
| `seed-inventory.ts` | Inventory items |
| `seed-procurement.ts` | Purchase orders |
| `seed-vehicles.ts` | Transport vehicles |
| `seed-library.ts` | Library books |
| `seed-pool.ts` | Pool sessions and rentals |
| `seed-staffleave.ts` | Staff leave records |
| `seed-activities.ts` | Extra-curricular activities |
| `seed-announcements.ts` | School announcements |
| `seed-scholarships.ts` | Scholarship records |
| `seed-timetable.ts` | Class timetable entries |

## School User Accounts

The `seed-school-users.ts` script creates one Admin account per school. Default credentials:

| School | Email | Password |
|--------|-------|----------|
| Grey Academy | admin@greyacademy.edu.gh | School@2025 |
| Westbridge International School | info@westbridge.edu.gh | School@2025 |
| Kumasi Technical Institute | admin@kti.edu.gh | School@2025 |
| Takoradi Harbour Primary School | info@thps.edu.gh | School@2025 |
| Cape Coast Academy | admin@capecoastacademy.edu.gh | School@2025 |
| Ho International Baccalaureate School | info@hoibs.edu.gh | School@2025 |
| Tamale American School | admin@tamaleamerican.edu.gh | School@2025 |
| Bolgatanga STEM Academy | info@bolgstem.edu.gh | School@2025 |

> Change all passwords after first login.

## Docker

A `docker-compose.yml` is included for containerised deployment:

```bash
docker compose up --build
```

The app listens on port `3000` inside the container. Configure environment variables via a `.env` file or Docker secrets. See [Deployment](./deployment.md) for full Docker and HTTPS setup.
