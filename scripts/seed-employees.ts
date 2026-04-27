/**
 * seed-employees.ts — Populates sms_users with school user accounts:
 *   1 Admin  (admin@school.com)
 *   Teachers matched from seeded sms_teachers
 *   Parent sample accounts
 * userrole: 1=Admin  2=Teacher  3=Parent  4=Student
 * Safe to re-run (skips by email).
 * Run: npm run seed:employees
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T   = process.env.AZURE_TENANT_ID!;
const C   = process.env.AZURE_CLIENT_ID!;
const S   = process.env.AZURE_CLIENT_SECRET!;
const D   = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

function hdr(tok: string) {
    return { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
}
function phdr(tok: string) {
    return { ...hdr(tok), 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

// ── Static user records ────────────────────────────────────────────────────────
// userrole: 1=Admin  2=Teacher  3=Parent  4=Student
// relatedrecord: 1=Student  2=Teacher  3=Parent  (not set for Admin)

interface UserSpec {
    name: string; email: string; password: string;
    role: number; isactive: boolean; relatedrecord?: number;
}

const ADMIN_USERS: UserSpec[] = [
    { name: 'Emmanuel Owusu-Ansah', email: 'admin@school.com',              password: 'Admin@1234',   role: 1, isactive: true },
    { name: 'Abena Osei-Bonsu',     email: 'abena.osei@school.com',        password: 'School@2024',  role: 1, isactive: true },
];

const PARENT_USERS: UserSpec[] = [
    { name: 'Kwesi Mensah',         email: 'kwesi.mensah@gmail.com',       password: 'Parent@2024',  role: 3, isactive: true, relatedrecord: 3 },
    { name: 'Ama Darko',            email: 'ama.darko@gmail.com',          password: 'Parent@2024',  role: 3, isactive: true, relatedrecord: 3 },
    { name: 'Joseph Asante',        email: 'joseph.asante@gmail.com',      password: 'Parent@2024',  role: 3, isactive: true, relatedrecord: 3 },
    { name: 'Grace Boateng',        email: 'grace.boateng@gmail.com',      password: 'Parent@2024',  role: 3, isactive: true, relatedrecord: 3 },
    { name: 'Isaac Quaye',          email: 'isaac.quaye@gmail.com',        password: 'Parent@2024',  role: 3, isactive: true, relatedrecord: 3 },
];

// Teacher emails match those seeded by seed-people.ts
const TEACHER_EMAILS = [
    { name: 'Akosua Mensah',         email: 'akosua.mensah@ghs.edu.gh'    },
    { name: 'Kofi Asante',           email: 'kofi.asante@ghs.edu.gh'      },
    { name: 'Abena Boateng',         email: 'abena.boateng@ghs.edu.gh'    },
    { name: 'Kwame Owusu',           email: 'kwame.owusu@ghs.edu.gh'      },
    { name: 'Ama Adjei',             email: 'ama.adjei@ghs.edu.gh'        },
    { name: 'Yaw Darko',             email: 'yaw.darko@ghs.edu.gh'        },
    { name: 'Efua Nkrumah',          email: 'efua.nkrumah@ghs.edu.gh'     },
    { name: 'Kojo Appiah',           email: 'kojo.appiah@ghs.edu.gh'      },
    { name: 'Adwoa Frimpong',        email: 'adwoa.frimpong@ghs.edu.gh'   },
    { name: 'Kwabena Osei',          email: 'kwabena.osei@ghs.edu.gh'     },
    { name: 'Akua Asare',            email: 'akua.asare@ghs.edu.gh'       },
    { name: 'Nana Acheampong',       email: 'nana.acheampong@ghs.edu.gh'  },
    { name: 'Fiifi Amoah',           email: 'fiifi.amoah@ghs.edu.gh'      },
    { name: 'Abla Kpodo',            email: 'abla.kpodo@ghs.edu.gh'       },
    { name: 'Bright Ofori',          email: 'bright.ofori@ghs.edu.gh'     },
    { name: 'Comfort Acquah',        email: 'comfort.acquah@ghs.edu.gh'   },
];

const TEACHER_USERS: UserSpec[] = TEACHER_EMAILS.map(t => ({
    name: t.name, email: t.email, password: 'Teacher@2024', role: 2, isactive: true, relatedrecord: 2,
}));

const ALL_USERS: UserSpec[] = [...ADMIN_USERS, ...TEACHER_USERS, ...PARENT_USERS];

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
    console.log('=== Seed sms_users — School User Accounts ===\n');

    const tok = await getToken();
    console.log('Token OK.\n');

    // Fetch existing users to skip duplicates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await axios.get<any>(
        `${API}/sms_users?$select=sms_userid,sms_email`,
        { headers: hdr(tok), timeout: 30000 }
    );
    const existingEmails = new Set<string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existing.data.value ?? []).map((u: any) => (u.sms_email ?? '').toLowerCase())
    );
    console.log(`  ${existingEmails.size} existing user(s) — skipping duplicates\n`);

    const ROLE_LABEL: Record<number, string> = { 1: 'Admin', 2: 'Teacher', 3: 'Parent', 4: 'Student' };
    let created = 0, skipped = 0;

    for (const u of ALL_USERS) {
        if (existingEmails.has(u.email.toLowerCase())) { skipped++; continue; }

        const payload: Record<string, unknown> = {
            sms_name:     u.name,
            sms_email:    u.email,
            sms_password: u.password,
            sms_isactive: u.isactive,
            sms_userrole: u.role,
        };
        if (u.relatedrecord !== undefined) payload.sms_relatedrecord = u.relatedrecord;

        await axios.post(`${API}/sms_users`, payload, { headers: phdr(tok), timeout: 30000 });
        created++;
        process.stdout.write(`  ✓ ${u.name.padEnd(28)} [${ROLE_LABEL[u.role]}]\n`);
    }

    console.log(`\n✓ Done: ${created} created, ${skipped} already existed\n`);
    console.log(`  Breakdown:`);
    console.log(`    Admin   : ${ADMIN_USERS.length}`);
    console.log(`    Teacher : ${TEACHER_USERS.length}`);
    console.log(`    Parent  : ${PARENT_USERS.length}\n`);
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any).response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
