/**
 * update-all-records.ts
 *
 * Two-phase update:
 *   1. Update all sms_schools records with complete/enhanced profile data.
 *   2. For every other entity table, find records that have no _sms_school_value
 *      and associate them with Grey Academy (the original school).
 *
 * Run: npx ts-node --skipProject scripts/update-all-records.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxiosInstance = any;

const T   = process.env.AZURE_TENANT_ID!;
const C   = process.env.AZURE_CLIENT_ID!;
const S   = process.env.AZURE_CLIENT_SECRET!;
const D   = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

// ── Auth ─────────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20_000 },
    );
    return res.data.access_token;
}

function makeClient(token: string): AxiosInstance {
    return axios.create({
        baseURL: API,
        timeout: 30_000,
        headers: {
            Authorization:      `Bearer ${token}`,
            'Content-Type':     'application/json',
            Accept:             'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version':    '4.0',
        },
    });
}

// ── Phase 1: School profile updates ─────────────────────────────────────────
// Type: 1=GES 2=Cambridge 3=IB 4=American 5=French 6=Mixed
// Level: 1=Primary 2=JHS 3=SHS 4=International 5=All

const SCHOOL_UPDATES: Record<string, Record<string, unknown>> = {
    'Grey Academy': {
        sms_motto:    'Shaping Minds, Building Futures',
        sms_emiscode: 'G1000001',
        sms_email:    'admin@greyacademy.edu.gh',
        sms_phone:    '+233 30 391 5000',
        sms_website:  'www.greyacademy.edu.gh',
        sms_type:     1,   // GES
        sms_level:    5,   // All
    },
    'Westbridge International School': {
        sms_motto:    'Excellence Without Limits',
        sms_emiscode: 'G9000001',
        sms_email:    'info@westbridge.edu.gh',
        sms_phone:    '+233 30 277 0001',
        sms_website:  'www.westbridge.edu.gh',
        sms_type:     2,   // Cambridge
        sms_level:    4,   // International
    },
    'Kumasi Technical Institute': {
        sms_motto:    'Skills for the Future',
        sms_emiscode: 'A4000099',
        sms_email:    'admin@kti.edu.gh',
        sms_phone:    '+233 32 202 5500',
        sms_website:  'www.kti.edu.gh',
        sms_type:     1,   // GES
        sms_level:    3,   // SHS
    },
    'Takoradi Harbour Primary School': {
        sms_motto:    'Building Bright Futures',
        sms_emiscode: 'W2000011',
        sms_email:    'info@thps.edu.gh',
        sms_phone:    '+233 31 202 3344',
        sms_website:  'www.thps.edu.gh',
        sms_type:     1,   // GES
        sms_level:    1,   // Primary
    },
    'Cape Coast Academy': {
        sms_motto:    'Knowledge is Power',
        sms_emiscode: 'C3000055',
        sms_email:    'admin@capecoastacademy.edu.gh',
        sms_phone:    '+233 33 213 0088',
        sms_website:  'www.capecoastacademy.edu.gh',
        sms_type:     1,   // GES
        sms_level:    5,   // All
    },
    'Ho International Baccalaureate School': {
        sms_motto:    'Inquire. Think. Act.',
        sms_emiscode: 'V5000033',
        sms_email:    'info@hoibs.edu.gh',
        sms_phone:    '+233 36 202 7700',
        sms_website:  'www.hoibs.edu.gh',
        sms_type:     3,   // IB
        sms_level:    4,   // International
    },
    'Tamale American School': {
        sms_motto:    "Empowering Tomorrow's Leaders",
        sms_emiscode: 'N7000077',
        sms_email:    'admin@tamaleamerican.edu.gh',
        sms_phone:    '+233 37 202 4455',
        sms_website:  'www.tamaleamerican.edu.gh',
        sms_type:     4,   // American
        sms_level:    5,   // All
    },
    'Bolgatanga STEM Academy': {
        sms_motto:    'Science Drives Progress',
        sms_emiscode: 'UE8000044',
        sms_email:    'info@bolgstem.edu.gh',
        sms_phone:    '+233 38 202 1122',
        sms_website:  'www.bolgstem.edu.gh',
        sms_type:     6,   // Mixed
        sms_level:    3,   // SHS
    },
};

// ── Phase 2: Entity tables to associate with Grey Academy ────────────────────

// Table name → primary key field name
const ENTITY_TABLES: { table: string; idField: string }[] = [
    { table: 'sms_students',       idField: 'sms_studentid'       },
    { table: 'sms_teachers',       idField: 'sms_teacherid'       },
    { table: 'sms_employees',      idField: 'sms_employeeid'      },
    { table: 'sms_classes',        idField: 'sms_classid'         },
    { table: 'sms_subjects',       idField: 'sms_subjectid'       },
    { table: 'sms_terms',          idField: 'sms_termid'          },
    { table: 'sms_academicyears',  idField: 'sms_academicyearid'  },
    { table: 'sms_gradelevels',    idField: 'sms_gradelevelid'    },
    { table: 'sms_departments',    idField: 'sms_departmentid'    },
    { table: 'sms_exams',          idField: 'sms_examid'          },
    { table: 'sms_examresults',    idField: 'sms_examresultid'    },
    { table: 'sms_grades',         idField: 'sms_gradeid'         },
    { table: 'sms_attendances',    idField: 'sms_attendanceid'    },
    { table: 'sms_enrollments',    idField: 'sms_enrollmentid'    },
    { table: 'sms_fees',           idField: 'sms_feeid'           },
    { table: 'sms_feestructures',  idField: 'sms_feestructureid'  },
    { table: 'sms_feepayments',    idField: 'sms_feepaymentid'    },
    { table: 'sms_feetypes',       idField: 'sms_feetypeid'       },
    { table: 'sms_librarybooks',   idField: 'sms_librarybookid'   },
    { table: 'sms_libraryloans',   idField: 'sms_libraryloanid'   },
    { table: 'sms_medical',        idField: 'sms_medicalid'       },
    { table: 'sms_disciplinary',   idField: 'sms_disciplinaryid'  },
    { table: 'sms_activities',     idField: 'sms_activityid'      },
    { table: 'sms_announcements',  idField: 'sms_announcementid'  },
    { table: 'sms_staffleaves',    idField: 'sms_staffleaveid'    },
    { table: 'sms_inventoryitems', idField: 'sms_inventoryitemid' },
    { table: 'sms_vehicles',       idField: 'sms_vehicleid'       },
    { table: 'sms_expenditures',   idField: 'sms_expenditureid'   },
    { table: 'sms_scholarships',   idField: 'sms_scholarshipid'   },
    { table: 'sms_promotions',     idField: 'sms_promotionid'     },
    { table: 'sms_parents',        idField: 'sms_parentid'        },
    { table: 'sms_poolsessions',   idField: 'sms_poolsessionid'   },
    { table: 'sms_poolrentals',    idField: 'sms_poolrentalid'    },
    { table: 'sms_pooltransactions', idField: 'sms_pooltransactionid' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getAll<T>(client: AxiosInstance, url: string): Promise<T[]> {
    const rows: T[] = [];
    let next: string | undefined = url;
    while (next) {
        const res: { data: { value: T[]; '@odata.nextLink'?: string } } = await client.get(next);
        rows.push(...res.data.value);
        next = res.data['@odata.nextLink'];
    }
    return rows;
}

async function patchRecord(client: AxiosInstance, table: string, id: string, payload: Record<string, unknown>) {
    await client.patch(`${table}(${id})`, payload, {
        headers: { 'If-Match': '*' },
    });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    if (!T || !C || !S || !D) {
        console.error('Missing required env vars');
        process.exit(1);
    }

    console.log('Obtaining access token…');
    const token  = await getToken();
    const client = makeClient(token);

    // ── Phase 1: Update school profiles ──────────────────────────────────────

    console.log('\n══ PHASE 1: Update school profiles ══\n');

    const schools = await getAll<Record<string, unknown>>(
        client,
        `sms_schools?$select=sms_schoolid,sms_name`,
    );

    console.log(`Found ${schools.length} school(s)\n`);

    let greyAcademyId = '';

    for (const school of schools) {
        const id   = school.sms_schoolid as string;
        const name = school.sms_name     as string;
        const updates = SCHOOL_UPDATES[name];

        if (name === 'Grey Academy') greyAcademyId = id;

        if (!updates) {
            console.log(`  ⚬ ${name} — no update defined, skipping`);
            continue;
        }

        try {
            await patchRecord(client, 'sms_schools', id, updates);
            console.log(`  ✓ ${name}`);
        } catch (err: unknown) {
            const e = err as { response?: { data?: unknown }; message?: string };
            console.error(`  ✗ ${name}:`, e.response?.data ?? e.message);
        }
    }

    if (!greyAcademyId) {
        console.error('\nCould not find Grey Academy — skipping Phase 2.');
        return;
    }

    // ── Phase 2: Associate orphaned records with Grey Academy ─────────────────

    console.log(`\n══ PHASE 2: Associate existing records → Grey Academy (${greyAcademyId}) ══\n`);

    const schoolBind = `/sms_schools(${greyAcademyId})`;

    for (const { table, idField } of ENTITY_TABLES) {
        let records: Record<string, unknown>[];
        try {
            records = await getAll<Record<string, unknown>>(
                client,
                `${table}?$select=${idField},_sms_school_value&$filter=_sms_school_value eq null`,
            );
        } catch {
            // Table may not have _sms_school_value or may not exist yet — skip silently
            continue;
        }

        if (records.length === 0) {
            console.log(`  ⚬ ${table}: all records already associated`);
            continue;
        }

        let ok = 0, fail = 0;
        for (const rec of records) {
            const id = rec[idField] as string;
            if (!id) continue;
            try {
                await patchRecord(client, table, id, { 'sms_school@odata.bind': schoolBind });
                ok++;
            } catch {
                fail++;
            }
        }

        const status = fail > 0 ? `${ok} ✓  ${fail} ✗` : `${ok} ✓`;
        console.log(`  ${table}: ${records.length} orphaned → ${status}`);
    }

    console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
