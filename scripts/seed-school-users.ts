/**
 * seed-school-users.ts
 *
 * Creates one Admin login account per school in sms_users.
 * Skips schools that already have an admin user linked.
 *
 * Default credentials per school:
 *   email:    admin@<domain>   (matches school profile email)
 *   password: School@2025
 *   role:     1 (Admin)
 *
 * Run: npx ts-node --skipProject scripts/seed-school-users.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
import bcrypt from 'bcryptjs';

const T   = process.env.AZURE_TENANT_ID!;
const C   = process.env.AZURE_CLIENT_ID!;
const S   = process.env.AZURE_CLIENT_SECRET!;
const D   = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

const DEFAULT_PASSWORD = 'School@2025';

interface SchoolDef {
    name:  string;
    email: string;
    admin: string;   // admin display name
}

// Maps school name → admin email (from school profile) + display name
const SCHOOL_ADMINS: SchoolDef[] = [
    { name: 'Grey Academy',                          email: 'admin@greyacademy.edu.gh',        admin: 'Grey Academy Admin'        },
    { name: 'Westbridge International School',       email: 'info@westbridge.edu.gh',          admin: 'Westbridge Admin'           },
    { name: 'Kumasi Technical Institute',            email: 'admin@kti.edu.gh',                admin: 'KTI Admin'                  },
    { name: 'Takoradi Harbour Primary School',       email: 'info@thps.edu.gh',                admin: 'Takoradi Harbour Admin'     },
    { name: 'Cape Coast Academy',                    email: 'admin@capecoastacademy.edu.gh',   admin: 'Cape Coast Academy Admin'   },
    { name: 'Ho International Baccalaureate School', email: 'info@hoibs.edu.gh',               admin: 'Ho IB Admin'                },
    { name: 'Tamale American School',                email: 'admin@tamaleamerican.edu.gh',     admin: 'Tamale American Admin'      },
    { name: 'Bolgatanga STEM Academy',               email: 'info@bolgstem.edu.gh',            admin: 'Bolgatanga STEM Admin'      },
];

async function getToken(): Promise<string> {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20_000 },
    )).data.access_token;
}

function hdrs(token: string) {
    return {
        Authorization:      `Bearer ${token}`,
        'Content-Type':     'application/json',
        Accept:             'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version':    '4.0',
    };
}

async function getAll<T>(token: string, url: string): Promise<T[]> {
    const rows: T[] = [];
    let next: string | undefined = url;
    while (next) {
        const res: { data: { value: T[]; '@odata.nextLink'?: string } } =
            await axios.get(next, { headers: hdrs(token), timeout: 30_000 });
        rows.push(...res.data.value);
        next = res.data['@odata.nextLink'];
    }
    return rows;
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars'); process.exit(1); }

    console.log('Obtaining access token…');
    const token = await getToken();

    // Fetch all schools
    const schools = await getAll<{ sms_schoolid: string; sms_name: string }>(
        token, `${API}/sms_schools?$select=sms_schoolid,sms_name`,
    );
    const schoolMap = new Map(schools.map(s => [s.sms_name, s.sms_schoolid]));

    // Fetch existing users to avoid duplicates
    const existingUsers = await getAll<{ sms_email: string; _sms_school_value: string | null }>(
        token,
        `${API}/sms_users?$select=sms_email,_sms_school_value`,
    );
    const existingEmails = new Set(existingUsers.map(u => (u.sms_email ?? '').toLowerCase()));

    console.log(`\nFound ${schools.length} schools, ${existingUsers.length} existing user(s)\n`);

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    console.log('Password hash generated (bcrypt, 12 rounds)\n');

    let created = 0, skipped = 0;

    for (const def of SCHOOL_ADMINS) {
        const schoolId = schoolMap.get(def.name);
        if (!schoolId) {
            console.log(`  ⚠  School not found: ${def.name} — skipping`);
            skipped++;
            continue;
        }

        if (existingEmails.has(def.email.toLowerCase())) {
            console.log(`  ⚬ ${def.name}  →  ${def.email}  (already exists)`);
            skipped++;
            continue;
        }

        try {
            await axios.post(
                `${API}/sms_users`,
                {
                    sms_name:                   def.admin,
                    sms_email:                  def.email.toLowerCase(),
                    sms_password:               passwordHash,
                    sms_userrole:               1,      // Admin
                    sms_isactive:               true,
                    'sms_school@odata.bind':    `/sms_schools(${schoolId})`,
                },
                { headers: hdrs(token), timeout: 30_000 },
            );
            console.log(`  ✓ Created  ${def.name}`);
            console.log(`            email:    ${def.email}`);
            console.log(`            password: ${DEFAULT_PASSWORD}`);
            created++;
        } catch (err: unknown) {
            const e = err as { response?: { data?: unknown }; message?: string };
            console.error(`  ✗ ${def.name}:`, e.response?.data ?? e.message);
        }
    }

    console.log(`\n── Summary ──────────────────────────────`);
    console.log(`  Created: ${created}   Skipped: ${skipped}`);
    console.log(`  Default password for all new accounts: ${DEFAULT_PASSWORD}`);
    console.log('Done.');
}

main().catch(e => { console.error(e.response?.data ?? e.message); process.exit(1); });
