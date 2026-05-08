/**
 * seed-schools.ts — create two additional schools in Dataverse for testing multi-tenancy.
 * Run: npx ts-node -r dotenv/config scripts/seed-schools.ts dotenv_config_path=.env.local
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

async function getToken(): Promise<string> {
    const res = await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({
            client_id:     C,
            client_secret: S,
            scope:         `${D}/.default`,
            grant_type:    'client_credentials',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20_000 },
    );
    return res.data.access_token;
}

// Type picklist:  1=GES  2=Cambridge  3=IB  4=American  5=French  6=Mixed
// Level picklist: 1=Primary  2=JHS  3=SHS  4=International  5=All
const SCHOOLS = [
    {
        sms_name:     'Takoradi Harbour Primary School',
        sms_motto:    'Building Bright Futures',
        sms_type:     1,   // GES
        sms_level:    1,   // Primary
        sms_address:  '3 Harbour Road, Takoradi',
        sms_district: 'Sekondi-Takoradi Metro',
        sms_region:   'Western',
        sms_phone:    '+233 31 202 3344',
        sms_email:    'info@thps.edu.gh',
        sms_currency: 'GHS',
        sms_website:  'www.thps.edu.gh',
        sms_emiscode: 'W2000011',
    },
    {
        sms_name:     'Cape Coast Academy',
        sms_motto:    'Knowledge is Power',
        sms_type:     1,   // GES
        sms_level:    5,   // All
        sms_address:  '22 Victoria Road, Cape Coast',
        sms_district: 'Cape Coast Metro',
        sms_region:   'Central',
        sms_phone:    '+233 33 213 0088',
        sms_email:    'admin@capecoastacademy.edu.gh',
        sms_currency: 'GHS',
        sms_website:  'www.capecoastacademy.edu.gh',
        sms_emiscode: 'C3000055',
    },
    {
        sms_name:     'Ho International Baccalaureate School',
        sms_motto:    'Inquire. Think. Act.',
        sms_type:     3,   // IB
        sms_level:    4,   // International
        sms_address:  '5 Akosombo Street, Ho',
        sms_district: 'Ho Municipal',
        sms_region:   'Volta',
        sms_phone:    '+233 36 202 7700',
        sms_email:    'info@hoibs.edu.gh',
        sms_currency: 'GHS',
        sms_website:  'www.hoibs.edu.gh',
        sms_emiscode: 'V5000033',
    },
    {
        sms_name:     'Tamale American School',
        sms_motto:    'Empowering Tomorrow\'s Leaders',
        sms_type:     4,   // American
        sms_level:    5,   // All
        sms_address:  '11 Hospital Road, Tamale',
        sms_district: 'Tamale Metro',
        sms_region:   'Northern',
        sms_phone:    '+233 37 202 4455',
        sms_email:    'admin@tamaleamerican.edu.gh',
        sms_currency: 'GHS',
        sms_website:  'www.tamaleamerican.edu.gh',
        sms_emiscode: 'N7000077',
    },
    {
        sms_name:     'Bolgatanga STEM Academy',
        sms_motto:    'Science Drives Progress',
        sms_type:     6,   // Mixed
        sms_level:    3,   // SHS
        sms_address:  '8 Bolga-Navrongo Road, Bolgatanga',
        sms_district: 'Bolgatanga Municipal',
        sms_region:   'Upper East',
        sms_phone:    '+233 38 202 1122',
        sms_email:    'info@bolgstem.edu.gh',
        sms_currency: 'GHS',
        sms_website:  'www.bolgstem.edu.gh',
        sms_emiscode: 'UE8000044',
    },
];

async function main() {
    if (!T || !C || !S || !D) {
        console.error('Missing env vars: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, DATAVERSE_URL');
        process.exit(1);
    }

    console.log('Obtaining access token…');
    const token = await getToken();
    const headers = {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version':    '4.0',
        Prefer:         'return=representation',
    };

    for (const school of SCHOOLS) {
        console.log(`\nCreating: ${school.sms_name}`);
        try {
            const res = await axios.post(`${API}/sms_schools`, school, { headers, timeout: 30_000 });
            const id  = res.data?.sms_schoolid ?? res.headers['odata-entityid']?.match(/\(([^)]+)\)/)?.[1] ?? '(unknown)';
            console.log(`  ✓ Created — id: ${id}`);
        } catch (err: unknown) {
            const e = err as { response?: { data?: unknown }; message?: string };
            console.error(`  ✗ Failed:`, e.response?.data ?? e.message);
        }
    }

    console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
