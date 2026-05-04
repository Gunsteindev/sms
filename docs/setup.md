# Setup & Configuration

## Prerequisites

- Node.js 18 or later
- A Microsoft Dataverse environment (Dynamics 365 / Power Platform)
- An Azure AD app registration with Dataverse permissions
- (Optional) An Anthropic API key for AI summaries

## Installation

```bash
git clone <repo-url>
cd sms
npm install
```

## Environment Variables

Create a `.env.local` file in the project root. This file is gitignored and must never be committed.

```env
# ── Microsoft Dataverse ──────────────────────────────────────────────────────
DATAVERSE_URL=https://yourorg.crm.dynamics.com
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-client-secret

# ── Application Auth ─────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-32-char-secret
NEXTAUTH_SECRET=your-32-char-secret   # can be the same as AUTH_SECRET
NEXTAUTH_URL=http://localhost:3000    # change to your domain in production

# ── Admin Account ────────────────────────────────────────────────────────────
ADMIN_EMAIL=admin@yourschool.edu.gh
ADMIN_PASSWORD=choose-a-strong-password

# ── Optional ─────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...          # required only for AI summary feature
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
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `ANTHROPIC_API_KEY` | No | Enables AI-generated dashboard summaries |
| `NODE_ENV` | Auto | Set by Next.js (`development` / `production`) |

## Azure AD Setup

1. Go to **Azure Portal → App registrations → New registration**
2. Give it a name (e.g. `SMS App`)
3. Under **Certificates & secrets**, create a new client secret — save it as `AZURE_CLIENT_SECRET`
4. Under **API permissions**, add:
   - `Dynamics CRM → user_impersonation` (delegated)  
   - Or use application-level permissions if available for your org
5. Grant admin consent for the permissions
6. Copy **Application (client) ID** → `AZURE_CLIENT_ID`
7. Copy **Directory (tenant) ID** → `AZURE_TENANT_ID`

## Dataverse Solution

The app expects a custom Dataverse solution with `sms_` prefixed tables. Required entities:

```
sms_students          sms_teachers          sms_employees
sms_classes           sms_subjects          sms_departments
sms_attendances       sms_grades            sms_exams
sms_examresults       sms_fees              sms_feepayments
sms_feestructures     sms_scholarships      sms_librarybooks
sms_libraryloans      sms_enrollments       sms_timetables
sms_terms             sms_academicyears     sms_gradelevels
sms_promotions        sms_disciplinary      sms_medical
sms_parents           sms_studentparents    sms_announcements
sms_users
```

Each entity should have the fields as described in the [Dataverse Schema](./schema.md) document.

## Running the App

```bash
# Development (with hot reload)
npm run dev

# Verify Dataverse connectivity
npm run test:connection

# Full CRUD test
npm run test:dataverse

# Production build check
npm run build

# Start production server (after build)
npm start
```

Open [http://localhost:3000](http://localhost:3000) and log in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Seeding Data

Several seed scripts are available for initial data setup:

```bash
npm run seed:departments     # Create default departments
npm run seed:grade-levels    # Create grade levels (KG1, KG2, Primary 1–6, JHS 1–3, SHS 1–3)
npm run seed:people          # Seed sample students and teachers
npm run seed:employees       # Seed staff records
npm run seed:fees            # Create fee structures
npm run seed:enrollments     # Enrol seeded students into classes
npm run seed:announcements   # Create sample announcements
npm run seed:scholarships    # Create sample scholarship records
```

## Docker

A `docker-compose.yml` is included for containerised deployment:

```bash
docker compose up --build
```

The app listens on port `3000` inside the container. Configure environment variables via a `.env` file or Docker secrets.
