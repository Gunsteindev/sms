/**
 * seed-academic-years.ts
 *
 * 1. Deletes existing unassociated (orphaned) academic year records.
 * 2. Creates 4 academic years for each of the 8 schools:
 *      2023-2024 (past), 2024-2025 (past), 2025-2026 (current), 2026-2027 (upcoming)
 *    Ghana calendar: Sep 1 – Jul 31.
 *
 * Run: npx ts-node --skipProject scripts/seed-academic-years.ts
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

interface YearTemplate {
    name:        string;
    startdate:   string;
    enddate:     string;
    iscurrent:   boolean;
    description: string;
}

const YEAR_TEMPLATES: YearTemplate[] = [
    { name: '2023-2024', startdate: '2023-09-01', enddate: '2024-07-31', iscurrent: false, description: 'Academic year September 2023 – July 2024' },
    { name: '2024-2025', startdate: '2024-09-01', enddate: '2025-07-31', iscurrent: false, description: 'Academic year September 2024 – July 2025' },
    { name: '2025-2026', startdate: '2025-09-01', enddate: '2026-07-31', iscurrent: true,  description: 'Academic year September 2025 – July 2026 (current)' },
    { name: '2026-2027', startdate: '2026-09-01', enddate: '2027-07-31', iscurrent: false, description: 'Academic year September 2026 – July 2027' },
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
        const res: { data: { value: T[]; '@odata.nextLink'?: string } } = await axios.get(next, { headers: hdrs(token), timeout: 30_000 });
        rows.push(...res.data.value);
        next = res.data['@odata.nextLink'];
    }
    return rows;
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars'); process.exit(1); }

    console.log('Obtaining access token…');
    const token = await getToken();

    // ── Fetch all schools ──────────────────────────────────────────────────────
    const schools = await getAll<{ sms_schoolid: string; sms_name: string }>(
        token, `${API}/sms_schools?$select=sms_schoolid,sms_name&$orderby=sms_name asc`,
    );
    console.log(`\nFound ${schools.length} school(s):\n`);
    schools.forEach(s => console.log(`  ${s.sms_name}  (${s.sms_schoolid})`));

    // ── Delete orphaned (no school) records ────────────────────────────────────
    const orphans = await getAll<{ sms_academicyearid: string; sms_name: string }>(
        token, `${API}/sms_academicyears?$select=sms_academicyearid,sms_name&$filter=_sms_school_value eq null`,
    );

    if (orphans.length > 0) {
        console.log(`\nDeleting ${orphans.length} orphaned record(s)…`);
        for (const o of orphans) {
            await axios.delete(`${API}/sms_academicyears(${o.sms_academicyearid})`, { headers: hdrs(token), timeout: 30_000 });
            console.log(`  ✓ Deleted  ${o.sms_name}  (${o.sms_academicyearid})`);
        }
    } else {
        console.log('\nNo orphaned records found.');
    }

    // ── Seed per-school academic years ─────────────────────────────────────────
    console.log('\nSeeding academic years per school…\n');

    for (const school of schools) {
        console.log(`  ── ${school.sms_name} ──`);

        // Fetch existing years for this school
        const existing = await getAll<{ sms_academicyearid: string; sms_name: string; sms_iscurrent: boolean }>(
            token,
            `${API}/sms_academicyears?$select=sms_academicyearid,sms_name,sms_iscurrent&$filter=_sms_school_value eq ${school.sms_schoolid}`,
        );
        const byName = new Map(existing.map(y => [y.sms_name, y.sms_academicyearid]));

        for (const tpl of YEAR_TEMPLATES) {
            const payload: Record<string, unknown> = {
                sms_name:        tpl.name,
                sms_startdate:   tpl.startdate,
                sms_enddate:     tpl.enddate,
                sms_iscurrent:   tpl.iscurrent,
                sms_description: tpl.description,
                sms_yearname:    null,
                'sms_school@odata.bind': `/sms_schools(${school.sms_schoolid})`,
            };

            const existingId = byName.get(tpl.name);
            if (existingId) {
                await axios.patch(
                    `${API}/sms_academicyears(${existingId})`,
                    payload,
                    { headers: { ...hdrs(token), 'If-Match': '*' }, timeout: 30_000 },
                );
                console.log(`    ✓ PATCH  ${tpl.name}${tpl.iscurrent ? '  ← current' : ''}`);
            } else {
                await axios.post(`${API}/sms_academicyears`, payload, { headers: hdrs(token), timeout: 30_000 });
                console.log(`    ✓ POST   ${tpl.name}${tpl.iscurrent ? '  ← current' : ''}`);
            }
        }
    }

    console.log('\nDone.');
}

main().catch(e => { console.error(e.response?.data ?? e.message); process.exit(1); });
