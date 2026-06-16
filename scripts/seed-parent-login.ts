/**
 * seed-parent-login.ts
 *
 * Creates a working PARENT login for testing the standalone parent portal (/parent):
 *   1. A parent record   (sms_parents)        — email must match the login
 *   2. A login account   (sms_users, role 7)  — same email, bcrypt password
 *   3. Student-parent links (sms_studentparents) to a couple of the school's students
 *
 * Idempotent — re-running skips records that already exist.
 *
 * Default credentials:
 *   email:    parent@greyacademy.edu.gh
 *   password: Parent@2025
 *
 * Run: npx ts-node --skipProject scripts/seed-parent-login.ts
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

// ── Config ────────────────────────────────────────────────────────────────────
const SCHOOL_NAME     = 'Grey Academy';
const PARENT_EMAIL    = 'parent@greyacademy.edu.gh';
const PARENT_PASSWORD = 'Parent@2025';
const PARENT_FIRST    = 'Demo';
const PARENT_LAST     = 'Parent';
const NUM_CHILDREN    = 2;   // how many of the school's students to link as wards

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function get<T = any>(token: string, url: string): Promise<T[]> {
    const res = await axios.get(url, { headers: hdrs(token), timeout: 30_000 });
    return res.data.value ?? [];
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars (.env.local)'); process.exit(1); }

    console.log('Obtaining access token…');
    const token = await getToken();

    // ── 1. Resolve the school ────────────────────────────────────────────────
    const schools = await get<{ sms_schoolid: string; sms_name: string }>(
        token, `${API}/sms_schools?$select=sms_schoolid,sms_name`,
    );
    const school = schools.find(s => s.sms_name === SCHOOL_NAME);
    if (!school) { console.error(`School not found: ${SCHOOL_NAME}`); process.exit(1); }
    const schoolId = school.sms_schoolid;
    console.log(`School: ${SCHOOL_NAME} (${schoolId})`);

    // ── 2. Pick a few students of this school as wards ───────────────────────
    const students = await get<{ sms_studentid: string; sms_firstname: string; sms_lastname: string }>(
        token,
        `${API}/sms_students?$select=sms_studentid,sms_firstname,sms_lastname` +
        `&$filter=${encodeURIComponent(`_sms_school_value eq ${schoolId}`)}&$top=${NUM_CHILDREN}`,
    );
    if (!students.length) { console.error('No students found for this school'); process.exit(1); }
    console.log(`Linking ${students.length} ward(s): ${students.map(s => `${s.sms_firstname} ${s.sms_lastname}`).join(', ')}`);

    // ── 3. Parent record (matched by email) ──────────────────────────────────
    let parentId: string;
    const existingParents = await get<{ sms_parentid: string }>(
        token, `${API}/sms_parents?$select=sms_parentid&$filter=${encodeURIComponent(`sms_email eq '${PARENT_EMAIL}'`)}&$top=1`,
    );
    if (existingParents.length) {
        parentId = existingParents[0].sms_parentid;
        console.log(`Parent record already exists (${parentId})`);
    } else {
        const res = await axios.post(`${API}/sms_parents`, {
            sms_name:                `${PARENT_FIRST} ${PARENT_LAST}`,
            sms_firstname:           PARENT_FIRST,
            sms_lastname:            PARENT_LAST,
            sms_email:               PARENT_EMAIL,
            sms_phone:               '+233 24 000 0000',
            sms_relationship:        3,   // Guardian
            'sms_school@odata.bind': `/sms_schools(${schoolId})`,
        }, { headers: { ...hdrs(token), Prefer: 'return=representation' }, timeout: 30_000 });
        parentId = res.data.sms_parentid;
        console.log(`✓ Created parent record (${parentId})`);
    }

    // ── 4. Login account (sms_users, role 7) ─────────────────────────────────
    const existingUsers = await get<{ sms_userid: string }>(
        token, `${API}/sms_users?$select=sms_userid&$filter=${encodeURIComponent(`sms_email eq '${PARENT_EMAIL}'`)}&$top=1`,
    );
    if (existingUsers.length) {
        console.log('Login account already exists — leaving password unchanged');
    } else {
        const hash = await bcrypt.hash(PARENT_PASSWORD, 12);
        await axios.post(`${API}/sms_users`, {
            sms_name:                `${PARENT_FIRST} ${PARENT_LAST}`,
            sms_email:               PARENT_EMAIL,
            sms_password:            hash,
            sms_userrole:            7,    // Parent
            sms_isactive:            true,
            'sms_school@odata.bind': `/sms_schools(${schoolId})`,
        }, { headers: hdrs(token), timeout: 30_000 });
        console.log('✓ Created login account (role: Parent)');
    }

    // ── 5. Student-parent links ──────────────────────────────────────────────
    for (let i = 0; i < students.length; i++) {
        const st = students[i];
        const existing = await get(
            token,
            `${API}/sms_studentparents?$select=sms_studentparentid&$filter=` +
            encodeURIComponent(`_sms_parent_value eq ${parentId} and _sms_student_value eq ${st.sms_studentid}`),
        );
        const label = `${st.sms_firstname} ${st.sms_lastname}`;
        if (existing.length) {
            console.log(`  ⚬ Link exists: ${label}`);
            continue;
        }
        await axios.post(`${API}/sms_studentparents`, {
            'sms_student@odata.bind': `/sms_students(${st.sms_studentid})`,
            'sms_parent@odata.bind':  `/sms_parents(${parentId})`,
            sms_isprimary:            i === 0,
            'sms_school@odata.bind':  `/sms_schools(${schoolId})`,
        }, { headers: hdrs(token), timeout: 30_000 });
        console.log(`  ✓ Linked ward: ${label}${i === 0 ? ' (primary)' : ''}`);
    }

    console.log(`\n── Parent login ready ───────────────────────────`);
    console.log(`  URL:      /auth/login  →  redirects to /parent`);
    console.log(`  Email:    ${PARENT_EMAIL}`);
    console.log(`  Password: ${PARENT_PASSWORD}`);
    console.log('Done.');
}

main().catch(e => { console.error(e.response?.data ?? e.message); process.exit(1); });
