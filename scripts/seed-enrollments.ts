/**
 * seed-enrollments.ts — Create an sms_enrollment record for every student
 * found in sms_students, linking them to their assigned class and the most
 * recent academic year. Skips students that already have an enrollment.
 * Run: npx tsx scripts/seed-enrollments.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T  = process.env.AZURE_TENANT_ID!;
const C  = process.env.AZURE_CLIENT_ID!;
const S  = process.env.AZURE_CLIENT_SECRET!;
const D  = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed: sms_enrollments');
    console.log('══════════════════════════════════════════════════\n');

    console.log('Acquiring token…');
    const token = await getToken();
    const h  = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
                  Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"' };
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };
    console.log('✓ Token acquired\n');

    // ── 1. Fetch academic year ──────────────────────────────────────────────────
    console.log('Fetching most recent academic year…');
    const ayRes = await axios.get(
        `${API}/sms_academicyears?$select=sms_academicyearid,sms_name&$orderby=sms_startdate desc&$top=1`,
        { headers: h, timeout: 20000 }
    );
    const ay = (ayRes.data.value ?? [])[0];
    if (!ay) { console.error('✗ No academic year found. Seed one first.'); process.exit(1); }
    const academicYearId = ay.sms_academicyearid as string;
    console.log(`  ✓ Academic year: ${ay.sms_name} (${String(academicYearId).slice(0, 8)}…)\n`);

    // ── 2. Fetch all students ───────────────────────────────────────────────────
    console.log('Fetching students…');
    const stuRes = await axios.get(
        `${API}/sms_students?$select=sms_studentid,sms_firstname,sms_lastname,sms_studentnumber,_sms_class_value&$orderby=sms_studentnumber asc&$top=200`,
        { headers: h, timeout: 30000 }
    );
    const students: Array<{ id: string; firstname: string; lastname: string; num: string; classid: string; classname: string }> =
        (stuRes.data.value ?? []).map((s: any) => ({
            id:        s.sms_studentid,
            firstname: s.sms_firstname ?? '',
            lastname:  s.sms_lastname  ?? '',
            num:       s.sms_studentnumber ?? '',
            classid:   s._sms_class_value ?? '',
            classname: s['_sms_class_value@OData.Community.Display.V1.FormattedValue'] ?? '',
        }));
    console.log(`  ✓ Found ${students.length} student(s)\n`);

    if (!students.length) { console.error('No students found. Run seed:people first.'); process.exit(1); }

    // ── 3. Fetch existing enrollments (by student ID) to avoid duplicates ───────
    console.log('Fetching existing enrollments…');
    const enrRes = await axios.get(
        `${API}/sms_enrollments?$select=sms_enrollmentid,_sms_student_value&$top=500`,
        { headers: h, timeout: 30000 }
    );
    const enrolledStudentIds = new Set<string>(
        (enrRes.data.value ?? []).map((e: any) => e._sms_student_value as string).filter(Boolean)
    );
    console.log(`  ✓ ${enrolledStudentIds.size} student(s) already enrolled\n`);

    // ── 4. Create enrollments ───────────────────────────────────────────────────
    console.log('Creating enrollments…\n');
    let created = 0, skipped = 0, noClass = 0, failed = 0;

    for (const stu of students) {
        const name = `${stu.firstname} ${stu.lastname}`;

        if (enrolledStudentIds.has(stu.id)) {
            console.log(`  ⏭  Skip  ${name} (${stu.num}) — already enrolled`);
            skipped++;
            continue;
        }

        if (!stu.classid) {
            console.log(`  ⚠  Skip  ${name} (${stu.num}) — no class assigned`);
            noClass++;
            continue;
        }

        const payload: Record<string, unknown> = {
            'sms_student@odata.bind':      `/sms_students(${stu.id})`,
            'sms_class@odata.bind':        `/sms_classes(${stu.classid})`,
            'sms_academicyear@odata.bind': `/sms_academicyears(${academicYearId})`,
            sms_enrollmentdate:            '2024-09-02',
            sms_enrollmentstatus:          1,
        };
        if (stu.num) payload.sms_rollnumber = stu.num;

        try {
            const res = await axios.post(`${API}/sms_enrollments`, payload, { headers: ph, timeout: 30000 });
            const id  = res.data?.sms_enrollmentid ?? res.headers['odata-entityid'] ?? '?';
            console.log(`  ✓ ${name} (${stu.num}) → ${stu.classname || stu.classid.slice(0, 8)} — ${String(id).slice(0, 8)}…`);
            created++;
        } catch (err: any) {
            const msg = err.response?.data?.error?.message?.slice(0, 120) ?? err.message;
            console.error(`  ✗ ${name}: ${msg}`);
            failed++;
        }
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log(`  Done: ${created} created, ${skipped} skipped, ${noClass} no-class, ${failed} failed`);
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
