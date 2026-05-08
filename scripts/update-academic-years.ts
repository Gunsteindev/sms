/**
 * update-academic-years.ts
 *
 * Ensures the sms_academicyears table has well-formed records:
 *   - 2023-2024  (past)
 *   - 2024-2025  (past)
 *   - 2025-2026  (current — Ghana school year runs Sep–Jul)
 *   - 2026-2027  (upcoming)
 *
 * Strategy:
 *   1. Fetch all existing records.
 *   2. PATCH records that already exist (matched by sms_name).
 *   3. POST records that are missing.
 *   4. Ensure exactly one record has sms_iscurrent = true (2025-2026).
 *
 * Run: npx ts-node --skipProject scripts/update-academic-years.ts
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

const TABLE = 'sms_academicyears';

interface YearDef {
    name:        string;
    startdate:   string;
    enddate:     string;
    iscurrent:   boolean;
    description: string;
}

// Ghana school calendar: Sep 1 – Jul 31
const DESIRED: YearDef[] = [
    {
        name:        '2023-2024',
        startdate:   '2023-09-01',
        enddate:     '2024-07-31',
        iscurrent:   false,
        description: 'Academic year September 2023 – July 2024',
    },
    {
        name:        '2024-2025',
        startdate:   '2024-09-01',
        enddate:     '2025-07-31',
        iscurrent:   false,
        description: 'Academic year September 2024 – July 2025',
    },
    {
        name:        '2025-2026',
        startdate:   '2025-09-01',
        enddate:     '2026-07-31',
        iscurrent:   true,
        description: 'Academic year September 2025 – July 2026 (current)',
    },
    {
        name:        '2026-2027',
        startdate:   '2026-09-01',
        enddate:     '2027-07-31',
        iscurrent:   false,
        description: 'Academic year September 2026 – July 2027',
    },
];

async function getToken(): Promise<string> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20_000 },
    );
    return res.data.access_token;
}

function headers(token: string) {
    return {
        Authorization:      `Bearer ${token}`,
        'Content-Type':     'application/json',
        Accept:             'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version':    '4.0',
    };
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars'); process.exit(1); }

    console.log('Obtaining access token…');
    const token = await getToken();
    const h = headers(token);

    // Fetch existing records
    const existing = (await axios.get(
        `${API}/${TABLE}?$select=sms_academicyearid,sms_name,sms_iscurrent`,
        { headers: h, timeout: 30_000 },
    )).data.value as { sms_academicyearid: string; sms_name: string; sms_iscurrent: boolean }[];

    console.log(`\nFound ${existing.length} existing record(s):`);
    existing.forEach(y => console.log(`  ${y.sms_name}  [id: ${y.sms_academicyearid}]  current=${y.sms_iscurrent}`));

    const byName = new Map(existing.map(y => [y.sms_name, y.sms_academicyearid]));

    console.log('\nApplying updates…\n');

    for (const def of DESIRED) {
        const payload = {
            sms_name:        def.name,
            sms_startdate:   def.startdate,
            sms_enddate:     def.enddate,
            sms_iscurrent:   def.iscurrent,
            sms_description: def.description,
            sms_yearname:    null,   // clear stale "Fall" etc.
        };

        const existingId = byName.get(def.name);

        if (existingId) {
            // PATCH existing record
            await axios.patch(
                `${API}/${TABLE}(${existingId})`,
                payload,
                { headers: { ...h, 'If-Match': '*' }, timeout: 30_000 },
            );
            console.log(`  ✓ PATCH  ${def.name}  (${existingId})${def.iscurrent ? '  ← current' : ''}`);
        } else {
            // POST new record
            const res = await axios.post(
                `${API}/${TABLE}`,
                payload,
                { headers: h, timeout: 30_000 },
            );
            const newId = (res.headers['odata-entityid'] as string ?? '').match(/\(([^)]+)\)/)?.[1] ?? 'unknown';
            console.log(`  ✓ POST   ${def.name}  (${newId})${def.iscurrent ? '  ← current' : ''}`);
        }
    }

    // Clear iscurrent on any remaining records not in DESIRED that are still marked current
    const desiredNames = new Set(DESIRED.map(d => d.name));
    const staleCurrents = existing.filter(y => y.sms_iscurrent && !desiredNames.has(y.sms_name));
    for (const y of staleCurrents) {
        await axios.patch(
            `${API}/${TABLE}(${y.sms_academicyearid})`,
            { sms_iscurrent: false },
            { headers: { ...h, 'If-Match': '*' }, timeout: 30_000 },
        );
        console.log(`  ✓ Cleared iscurrent on stale record: ${y.sms_name}`);
    }

    console.log('\nDone.');
}

main().catch(e => { console.error(e.response?.data ?? e.message); process.exit(1); });
