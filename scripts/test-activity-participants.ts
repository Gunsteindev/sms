import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!, C = process.env.AZURE_CLIENT_ID!, S = process.env.AZURE_CLIENT_SECRET!, D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;
const TABLE = 'sms_activityparticipants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tok: string; let h: any;

async function getToken() {
    tok = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
    h = {
        Authorization: `Bearer ${tok}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };
}

function pass(msg: string) { console.log(`  ✓ ${msg}`); }
function fail(msg: string) { console.log(`  ✗ ${msg}`); }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errMsg(e: unknown) { return (e as any).response?.data?.error?.message ?? (e as Error).message; }

async function main() {
    await getToken();
    console.log('Token OK\n');

    // ── 0. Get a school ID ────────────────────────────────────────────────────
    console.log('0. Fetch a school');
    let schoolId: string | null = null;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/sms_schools?$select=sms_schoolid,sms_name&$top=1`, { headers: h, timeout: 20000 });
        const s = r.data.value?.[0];
        if (s) { schoolId = s.sms_schoolid; pass(`School: "${s.sms_name}" (${schoolId})`); }
        else   { fail('No schools found — skipping write tests'); }
    } catch (e) { fail(`Fetch schools failed: ${errMsg(e)}`); }

    // ── 1. Get a real activity ────────────────────────────────────────────────
    console.log('\n1. Fetch an activity');
    let activityId: string | null = null;
    let activityName = '';
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/sms_activities?$select=sms_activityid,sms_name,sms_enrolled&$top=1`,
            { headers: h, timeout: 20000 }
        );
        const a = r.data.value?.[0];
        if (a) {
            activityId   = a.sms_activityid;
            activityName = a.sms_name ?? '';
            pass(`Activity: "${activityName}"  enrolled=${a.sms_enrolled ?? 0}  id=${activityId}`);
        } else {
            fail('No activities found'); activityId = null;
        }
    } catch (e) { fail(`Fetch activities failed: ${errMsg(e)}`); }

    // ── 2. Get a real student ─────────────────────────────────────────────────
    console.log('\n2. Fetch a student');
    let studentId: string | null = null;
    let studentName = '';
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/sms_students?$select=sms_studentid,sms_name&$top=1`,
            { headers: h, timeout: 20000 }
        );
        const s = r.data.value?.[0];
        if (s) {
            studentId   = s.sms_studentid;
            studentName = s.sms_name ?? '';
            pass(`Student: "${studentName}"  id=${studentId}`);
        } else { fail('No students found'); }
    } catch (e) { fail(`Fetch students failed: ${errMsg(e)}`); }

    // ── 3. List existing participants (proves table exists) ───────────────────
    console.log('\n3. List participants (top 5)');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=sms_activityparticipantid,sms_name,sms_activityname,_sms_student_value,sms_enrollmentdate,sms_activityparticipantstatus&$top=5&$orderby=createdon desc`,
            { headers: h, timeout: 20000 }
        );
        const rows = r.data.value ?? [];
        pass(`Table reachable — ${rows.length} recent participant(s) returned`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.forEach((p: any) => {
            const statusLabel = p.sms_activityparticipantstatus === 1 ? 'Active' : 'Withdrawn';
            const sName = p['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? p._sms_student_value ?? '—';
            console.log(`     "${sName}"  activity="${p.sms_activityname}"  status=${statusLabel}  id=${p.sms_activityparticipantid}`);
        });
    } catch (e) { fail(`List failed: ${errMsg(e)}`); return; }

    if (!schoolId || !activityId || !studentId) {
        console.log('\nMissing school/activity/student — skipping create/read/filter/delete tests.');
        return;
    }

    // ── 4. Create a participant record ────────────────────────────────────────
    console.log('\n4. Create a test participant (lookup binding)');
    let createdId: string | null = null;
    try {
        const today = new Date().toISOString().slice(0, 10);
        const payload: Record<string, unknown> = {
            sms_name:           `${studentName} – ${activityName}`,
            sms_activityid:     activityId,
            sms_activityname:   activityName,
            'sms_student@odata.bind': `/sms_students(${studentId})`,
            sms_enrollmentdate: today,
            sms_activityparticipantstatus: 1,
            'sms_school@odata.bind': `/sms_schools(${schoolId})`,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.post<any>(`${API}/${TABLE}`, payload, {
            headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
            timeout: 20000,
        });
        createdId = r.data?.sms_activityparticipantid;
        pass(`Created  id=${createdId}`);
        console.log(`     sms_name="${r.data?.sms_name}"  status=${r.data?.sms_activityparticipantstatus}  date=${r.data?.sms_enrollmentdate}`);
    } catch (e) { fail(`Create failed: ${errMsg(e)}`); }

    if (!createdId) { console.log('\nSkipping read/filter/delete — no record created.'); return; }

    // ── 5. Read it back ───────────────────────────────────────────────────────
    console.log('\n5. Read participant by ID');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}(${createdId})?$select=sms_activityparticipantid,sms_name,sms_activityid,sms_activityname,_sms_student_value,sms_enrollmentdate,sms_activityparticipantstatus`,
            { headers: h, timeout: 20000 }
        );
        pass('Read OK');
        const sName = r.data['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? r.data._sms_student_value ?? '—';
        console.log(`     student="${sName}"  studentid=${r.data._sms_student_value}`);
        console.log(`     activity="${r.data.sms_activityname}"  status=${r.data.sms_activityparticipantstatus}  date=${r.data.sms_enrollmentdate}`);
    } catch (e) { fail(`Read failed: ${errMsg(e)}`); }

    // ── 6. Filter by activity ─────────────────────────────────────────────────
    console.log('\n6. Filter participants by activityid');
    try {
        const filter = encodeURIComponent(`sms_activityid eq '${activityId}'`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=sms_activityparticipantid,_sms_student_value,sms_activityparticipantstatus&$filter=${filter}&$top=20`,
            { headers: h, timeout: 20000 }
        );
        pass(`Filter by activityid returned ${r.data.value?.length ?? 0} row(s)`);
    } catch (e) { fail(`Filter failed: ${errMsg(e)}`); }

    // ── 7. Delete test record ─────────────────────────────────────────────────
    console.log('\n7. Delete test participant');
    try {
        await axios.delete(`${API}/${TABLE}(${createdId})`, { headers: h, timeout: 20000 });
        pass(`Deleted ${createdId}`);
    } catch (e) { fail(`Delete failed: ${errMsg(e)}`); }

    console.log('\nDone.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
