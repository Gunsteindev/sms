import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API   = `${D}/api/data/v9.2`;
const TABLE = 'sms_vehiclemaintenances';

// _sms_vehicle_value = Lookup GUID; name from FormattedValue annotation
// sms_maintenancestatus = Picklist (1=Scheduled, 2=In Progress, 3=Completed, 4=Cancelled)
const SELECT = 'sms_vehiclemaintenanceid,sms_name,_sms_vehicle_value,sms_maintenancetype,sms_description,sms_scheduleddate,sms_completeddate,sms_cost,sms_technicianname,sms_maintenancestatus,sms_notes';

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

    // ── 2. List existing records ──────────────────────────────────────────────
    console.log('\n2. List maintenance records (top 5)');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=${SELECT}&$top=5&$orderby=createdon desc`,
            { headers: h, timeout: 20000 }
        );
        const rows = r.data.value ?? [];
        pass(`Table reachable — ${rows.length} record(s) returned`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.forEach((m: any) => {
            const vName = m['_sms_vehicle_value@OData.Community.Display.V1.FormattedValue'] ?? m._sms_vehicle_value ?? '—';
            const status = m['sms_maintenancestatus@OData.Community.Display.V1.FormattedValue'] ?? m.sms_maintenancestatus ?? '—';
            const type   = m['sms_maintenancetype@OData.Community.Display.V1.FormattedValue']   ?? m.sms_maintenancetype   ?? '—';
            console.log(`     "${vName}"  type="${type}"  status="${status}"  scheduled="${m.sms_scheduleddate?.slice(0,10) ?? '—'}"`);
        });
    } catch (e) { fail(`List failed: ${errMsg(e)}`); return; }

    if (!schoolId || !vehicleId) {
        console.log('\nMissing school or vehicle ID — skipping write tests.');
        return;
    }

    // ── 3. Create a test record ───────────────────────────────────────────────
    console.log('\n3. Create test maintenance record');
    let createdId: string | null = null;
    try {
        const payload: Record<string, unknown> = {
            sms_name:                    `${vehicleName} – Routine Service (Test)`,
            'sms_vehicle@odata.bind':    `/sms_vehicles(${vehicleId})`,
            sms_maintenancetype:          1,
            sms_maintenancestatus:        1,
            sms_description:             'Oil change and general check',
            sms_scheduleddate:           '2025-06-01T00:00:00Z',
            sms_cost:                    150.00,
            sms_technicianname:          'Test Technician',
            'sms_school@odata.bind':     `/sms_schools(${schoolId})`,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.post<any>(`${API}/${TABLE}`, payload, {
            headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
            timeout: 20000,
        });
        createdId = r.data?.sms_vehiclemaintenanceid;
        const vName = r.data?.['_sms_vehicle_value@OData.Community.Display.V1.FormattedValue'] ?? vehicleId;
        pass(`Created  id=${createdId}`);
        console.log(`     vehicle="${vName}"  type=${r.data?.sms_maintenancetype}  status=${r.data?.sms_maintenancestatus}  cost=${r.data?.sms_cost}`);
    } catch (e) { fail(`Create failed: ${errMsg(e)}`); }

    if (!createdId) { console.log('\nSkipping read/update/filter/delete — create failed.'); return; }

    // ── 4. Read it back ───────────────────────────────────────────────────────
    console.log('\n4. Read by ID');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}(${createdId})?$select=${SELECT}`,
            { headers: h, timeout: 20000 }
        );
        const vName = r.data['_sms_vehicle_value@OData.Community.Display.V1.FormattedValue'] ?? r.data._sms_vehicle_value ?? '—';
        pass('Read OK');
        console.log(`     vehicle="${vName}"  desc="${r.data.sms_description}"  cost=${r.data.sms_cost}  status=${r.data.sms_maintenancestatus}`);
    } catch (e) { fail(`Read failed: ${errMsg(e)}`); }

    // ── 5. Update status + completed date ─────────────────────────────────────
    console.log('\n5. Update status to Completed');
    try {
        await axios.patch(
            `${API}/${TABLE}(${createdId})`,
            { sms_maintenancestatus: 3, sms_completeddate: '2025-06-02T00:00:00Z', sms_cost: 175.50 },
            { headers: { ...h, 'Content-Type': 'application/json' }, timeout: 20000 }
        );
        pass('PATCH OK');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}(${createdId})?$select=sms_maintenancestatus,sms_completeddate,sms_cost`,
            { headers: h, timeout: 20000 }
        );
        console.log(`     status=${r.data.sms_maintenancestatus}  completed="${r.data.sms_completeddate?.slice(0,10)}"  cost=${r.data.sms_cost}  (expected 3, 2025-06-02, 175.5)`);
    } catch (e) { fail(`Update failed: ${errMsg(e)}`); }

    // ── 6. Filter by vehicle Lookup ───────────────────────────────────────────
    console.log('\n6. Filter by vehicle id');
    try {
        const filter = encodeURIComponent(`_sms_vehicle_value eq ${vehicleId}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await axios.get<any>(
            `${API}/${TABLE}?$select=sms_vehiclemaintenanceid,sms_maintenancestatus&$filter=${filter}&$top=20`,
            { headers: h, timeout: 20000 }
        );
        pass(`Filter returned ${r.data.value?.length ?? 0} row(s) for vehicleid="${vehicleId}"`);
    } catch (e) { fail(`Filter failed: ${errMsg(e)}`); }

    // ── 7. Delete test record ─────────────────────────────────────────────────
    console.log('\n7. Delete test record');
    try {
        await axios.delete(`${API}/${TABLE}(${createdId})`, { headers: h, timeout: 20000 });
        pass(`Deleted ${createdId}`);
    } catch (e) { fail(`Delete failed: ${errMsg(e)}`); }

    console.log('\nAll tests done.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
