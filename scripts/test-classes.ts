/**
 * test-classes.ts
 * CRUD test for sms_classes table — verifies field names match the TypeScript layer.
 * Run: npx tsx scripts/test-classes.ts
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

// Corrected SELECT matching src/lib/dataverse/classes.ts
const SELECT = 'sms_classid,sms_name,sms_classnumber,sms_section,sms_capacity,sms_roomnumber,sms_enrolledcount,_sms_academicyear_value,_sms_gradelevel_value,_sms_teacher_value,createdon,modifiedon';

async function main() {
  // Auth
  const tokenRes = await axios.post(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, scope: `${DATAVERSE_URL}/.default`, grant_type: 'client_credentials' }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
  );
  const token: string = tokenRes.data.access_token;
  const h = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
  };
  console.log('✓ Token acquired\n');

  // ── RAW FIELD DISCOVERY ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawRes = await axios.get<any>(`${API_BASE}/sms_classes?$top=1`, {
    headers: { ...h, Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"' },
    timeout: 20000,
  });
  const rawRows: any[] = rawRes.data.value ?? [];
  console.log('── RAW FIELDS ───────────────────────────────');
  if (rawRows.length) {
    Object.keys(rawRows[0]).sort().forEach((k) => {
      const v = rawRows[0][k];
      const d = v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0, 80)}"` : String(v);
      console.log(`  ${k}: ${d}`);
    });
  } else {
    console.log('  (table is empty)');
  }
  console.log();

  // ── LIST ────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRes = await axios.get<any>(`${API_BASE}/sms_classes?$select=${SELECT}&$top=5&$orderby=sms_name asc`, {
    headers: { ...h, Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"' },
    timeout: 20000,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = listRes.data.value ?? [];
  console.log(`── LIST (${rows.length} row(s)) ──────────────────────────`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows.forEach((c: any) => {
    console.log(`  classid:          ${c.sms_classid}`);
    console.log(`  classname (name): ${c.sms_name ?? '(null)'}`);
    console.log(`  classnumber:      ${c.sms_classnumber ?? '(null)'}`);
    console.log(`  gradelevel:       ${c.sms_gradelevel ?? '(null)'}`);
    console.log(`  capacity:         ${c.sms_capacity ?? '(null)'}`);
    console.log(`  roomnumber:       ${c.sms_roomnumber ?? '(null)'}`);
    console.log(`  gradelevel:       ${c['_sms_gradelevel_value@OData.Community.Display.V1.FormattedValue'] ?? '(null)'}`);
    console.log(`  academicyearname: ${c['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '(null)'}`);
    console.log(`  teachername:      ${c['_sms_teacher_value@OData.Community.Display.V1.FormattedValue'] ?? '(null)'}`);
    console.log(`  enrolledcount:    ${c.sms_enrolledcount ?? '(null)'}`);
    console.log();
  });

  // ── CREATE ───────────────────────────────────────────────────────────
  // NOTE: sms_gradelevel is a Lookup (not integer) — omit or use odata.bind with a GUID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createRes = await axios.post<any>(`${API_BASE}/sms_classes`, {
    sms_name:        'CRUD-Test Class',
    sms_capacity:    25,
    sms_roomnumber:  'R-CRUD',
    sms_classnumber: 'CRUD-001',
  }, { headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000 });
  const newId: string = createRes.data.sms_classid;
  console.log(`── CREATE ───────────────────────────────────`);
  console.log(`  ✓ id: ${newId}`);

  // ── READ ─────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readRes = await axios.get<any>(`${API_BASE}/sms_classes(${newId})?$select=${SELECT}`, {
    headers: { ...h, Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"' },
    timeout: 20000,
  });
  const r = readRes.data;
  console.log(`\n── READ ─────────────────────────────────────`);
  console.log(`  classname:        ${r.sms_name}`);
  console.log(`  gradelevel:       ${r.sms_gradelevel}`);
  console.log(`  capacity:         ${r.sms_capacity}`);
  console.log(`  roomnumber:       ${r.sms_roomnumber}`);
  console.log(`  gradelevel:       ${r['_sms_gradelevel_value@OData.Community.Display.V1.FormattedValue'] ?? '(null)'}`);
  console.log(`  academicyearname: ${r['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '(null)'}`);
  console.log(`  teachername:      ${r['_sms_teacher_value@OData.Community.Display.V1.FormattedValue'] ?? '(null)'}`);

  // ── UPDATE ───────────────────────────────────────────────────────────
  await axios.patch(`${API_BASE}/sms_classes(${newId})`, { sms_roomnumber: 'R-UPDATED' }, {
    headers: { ...h, 'Content-Type': 'application/json', 'If-Match': '*' }, timeout: 20000,
  });
  console.log(`\n── UPDATE ───────────────────────────────────`);
  console.log(`  ✓ roomnumber patched to R-UPDATED`);

  // ── DELETE ───────────────────────────────────────────────────────────
  await axios.delete(`${API_BASE}/sms_classes(${newId})`, { headers: h, timeout: 20000 });
  console.log(`\n── DELETE ───────────────────────────────────`);
  console.log(`  ✓ test record removed`);

  console.log(`\n✅ Classes CRUD test passed!\n`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
main().catch((e: any) => {
  console.error('\n✗', e.response?.data?.error?.message ?? e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
