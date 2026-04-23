/**
 * quick-test.ts
 * Smoke test: fetch top-1 record from each entity table.
 * Run: npm run test:quick
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const TENANT_ID     = process.env.AZURE_TENANT_ID!;
const CLIENT_ID     = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;
const DATAVERSE_URL = process.env.DATAVERSE_URL!;
const API_BASE      = `${DATAVERSE_URL}/api/data/v9.2`;

async function getToken(): Promise<string> {
  const res = await axios.post(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, scope: `${DATAVERSE_URL}/.default`, grant_type: 'client_credentials' }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
  );
  return res.data.access_token;
}

async function fetchTop1(token: string, table: string): Promise<{ count: number; sample?: Record<string, unknown> }> {
  const res = await axios.get(`${API_BASE}/${table}?$top=1`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' },
    timeout: 20000,
  });
  const rows: unknown[] = res.data.value ?? [];
  return { count: rows.length, sample: rows[0] as Record<string, unknown> };
}

const TABLES: Record<string, string> = {
  'Students      ': 'sms_students',
  'Teachers      ': 'sms_teachers',
  'Classes       ': 'sms_classes',
  'Attendance    ': 'sms_attendances',
  'Fee Payments  ': 'sms_feepayments',
  'Fee Structures': 'sms_feestructures',
  'Enrollments   ': 'sms_enrollments',
  'Departments   ': 'sms_departments',
  'Academic Years': 'sms_academicyears',
  'Subjects      ': 'sms_subjects',
  'Exams         ': 'sms_exams',
};

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log('  Quick Smoke Test — Dataverse tables');
  console.log('══════════════════════════════════════════\n');

  let token: string;
  try {
    token = await getToken();
    console.log('✓ Token acquired\n');
  } catch (err: any) {
    console.error('✗ Auth failed:', err.response?.data ?? err.message);
    process.exit(1);
  }

  let allOk = true;
  for (const [label, table] of Object.entries(TABLES)) {
    try {
      const { count, sample } = await fetchTop1(token, table);
      const id = sample ? Object.values(sample)[0] : '—';
      console.log(`  ✓ ${label} — table OK${count ? `, first id: ${String(id).slice(0, 36)}` : ' (empty)'}`);
    } catch (err: any) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error?.message ?? err.message;
      console.error(`  ✗ ${label} — [${status}] ${msg}`);
      allOk = false;
    }
  }

  console.log(allOk ? '\n✅ All tables accessible\n' : '\n⚠️  Some tables failed — check table names above\n');
}

main();
