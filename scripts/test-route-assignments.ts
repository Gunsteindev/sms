import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API   = `${D}/api/data/v9.2`;
const TABLE = 'sms_routeassignments';

// _sms_student_value / _sms_vehicle_value = Lookup GUIDs
// sms_studentname / sms_vehiclename = auto-populated companion strings
// sms_routestatus = Picklist (1=Active, 2=Inactive)
// Names come from FormattedValue annotations — NOT separate fields in $select
const SELECT = 'sms_routeassignmentid,sms_name,_sms_student_value,_sms_vehicle_value,sms_routename,sms_pickuppoint,sms_pickuptime,sms_routestatus';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let h: any;

async function getToken() {
    const tok = (await axios.post(
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
    console.log('Getting Azure AD token…');
    await getToken();
    console.log('Token OK\n');

    // ── 0. Fetch a school ─────────────────────────────────────────────────────
    console.log('0. Fetch a school');
    let schoolId: string | null = null;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/sms_schools?$select=sms_schoolid,sms_name&$top=1`, { headers: h, timeout: 20000 });
        const s = r.data.value?.[0];
        if (s) { schoolId = s.sms_schoolid; pass(`School: "${s.sms_name}"  id=${schoolId}`); }
        else   { fail('No schools found'); }
    } catch (e) { fail(`Schools: ${errMsg(e)}`); }

    // ── 1. Fetch a vehicle ────────────────────────────────────────────────────
    console.log('\n1. Fetch a vehicle');
    let vehicleId: string | null = null;
    let vehicleName = 'Test Vehicle';
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/sms_vehicles?$select=sms_vehicleid,sms_name&$top=1`,
            { headers: h, timeout: 20000 }
        );
        const v = r.data.value?.[0];
        if (v) {
            vehicleId   = v.sms_vehicleid;
            vehicleName = v.sms_name ?? 'Vehicle';
            pass(`Vehicle: "${vehicleName}"  id=${vehicleId}`);
        } else {
            fail('No vehicles found — write tests require a real vehicle record');
        }
    } catch (e) { fail(`Vehicles: ${errMsg(e)}`); }

    // ── 2. Fetch a student ────────────────────────────────────────────────────
    console.log('\n2. Fetch a student');
    let studentId: string | null = null;
    let studentName = 'Test Student';
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/sms_students?$select=sms_studentid,sms_name&$top=1`,
            { headers: h, timeout: 20000 }
        );
        const s = r.data.value?.[0];
        if (s) {
            studentId   = s.sms_studentid;
            studentName = s.sms_name ?? 'Student';
            pass(`Student: "${studentName}"  id=${studentId}`);
        } else {
            fail('No students found — write tests require a real student record');
        }
    } catch (e) { fail(`Students: ${errMsg(e)} — using placeholders`); }

    // ── 3. List existing assignments ──────────────────────────────────────────
    console.log('\n3. List route assignments (top 5)');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=${SELECT}&$top=5&$orderby=sms_name asc`,
            { headers: h, timeout: 20000 }
        );
        const rows = r.data.value ?? [];
        pass(`Table reachable — ${rows.length} assignment(s) returned`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.forEach((a: any) => {
            const status = a.sms_routestatus === 1 ? 'Active' : a.sms_routestatus === 2 ? 'Inactive' : `status=${a.sms_routestatus}`;
            const sName = a['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? a._sms_student_value ?? '—';
            const vName = a['_sms_vehicle_value@OData.Community.Display.V1.FormattedValue'] ?? a._sms_vehicle_value ?? '—';
            console.log(`     "${sName}" → "${vName}"  route="${a.sms_routename ?? '—'}"  pickup="${a.sms_pickuppoint ?? '—'}"  [${status}]`);
        });
    } catch (e) { fail(`List failed: ${errMsg(e)}`); return; }

    if (!schoolId || !vehicleId || !studentId) {
        console.log('\nMissing school, vehicle, or student ID — skipping write tests.');
        return;
    }

    // ── 4. Create a test assignment ───────────────────────────────────────────
    console.log('\n4. Create test assignment');
    let createdId: string | null = null;
    try {
        const payload: Record<string, unknown> = {
            'sms_student@odata.bind': `/sms_students(${studentId})`,
            'sms_vehicle@odata.bind': `/sms_vehicles(${vehicleId})`,
            sms_routename:   'Route A (Test)',
            sms_pickuppoint: '123 Test Street',
            sms_pickuptime:  '07:30',
            sms_routestatus: 1,
            'sms_school@odata.bind': `/sms_schools(${schoolId})`,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.post<any>(`${API}/${TABLE}`, payload, {
            headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
            timeout: 20000,
        });
        createdId = r.data?.sms_routeassignmentid;
        pass(`Created  id=${createdId}`);
        const sName = r.data?.['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? r.data?._sms_student_value ?? studentId;
        const vName = r.data?.['_sms_vehicle_value@OData.Community.Display.V1.FormattedValue'] ?? r.data?._sms_vehicle_value ?? vehicleId;
        console.log(`     student="${sName}"  vehicle="${vName}"  route="${r.data?.sms_routename}"  status=${r.data?.sms_routestatus}`);
    } catch (e) { fail(`Create failed: ${errMsg(e)}`); }

    if (!createdId) { console.log('\nSkipping read/update/filter/delete — create failed.'); return; }

    // ── 5. Read it back ───────────────────────────────────────────────────────
    console.log('\n5. Read by ID');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}(${createdId})?$select=${SELECT}`,
            { headers: h, timeout: 20000 }
        );
        pass('Read OK');
        const sn = r.data['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? r.data._sms_student_value ?? '—';
        const vn = r.data['_sms_vehicle_value@OData.Community.Display.V1.FormattedValue'] ?? r.data._sms_vehicle_value ?? '—';
        console.log(`     student="${sn}"  vehicle="${vn}"  time="${r.data.sms_pickuptime}"  status=${r.data.sms_routestatus}`);
    } catch (e) { fail(`Read failed: ${errMsg(e)}`); }

    // ── 6. Update pickup time + status ────────────────────────────────────────
    console.log('\n6. Update pickup time and status');
    try {
        await axios.patch(
            `${API}/${TABLE}(${createdId})`,
            { sms_pickuptime: '08:00', sms_routestatus: 2 },
            { headers: { ...h, 'Content-Type': 'application/json' }, timeout: 20000 }
        );
        pass('PATCH OK');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(`${API}/${TABLE}(${createdId})?$select=sms_pickuptime,sms_routestatus`, { headers: h, timeout: 20000 });
        console.log(`     pickuptime="${r.data.sms_pickuptime}"  status=${r.data.sms_routestatus}  (expected 08:00, 2)`);
    } catch (e) { fail(`Update failed: ${errMsg(e)}`); }

    // ── 7. Filter by vehicle Lookup ───────────────────────────────────────────
    console.log('\n7. Filter by vehicle id');
    try {
        const filter = encodeURIComponent(`_sms_vehicle_value eq ${vehicleId}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=sms_routeassignmentid,_sms_student_value&$filter=${filter}&$top=20`,
            { headers: h, timeout: 20000 }
        );
        pass(`Filter returned ${r.data.value?.length ?? 0} row(s) for vehicleid="${vehicleId}"`);
    } catch (e) { fail(`Filter failed: ${errMsg(e)}`); }

    // ── 8. Delete test record ─────────────────────────────────────────────────
    console.log('\n8. Delete test record');
    try {
        await axios.delete(`${API}/${TABLE}(${createdId})`, { headers: h, timeout: 20000 });
        pass(`Deleted ${createdId}`);
    } catch (e) { fail(`Delete failed: ${errMsg(e)}`); }

    console.log('\nAll tests done.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
