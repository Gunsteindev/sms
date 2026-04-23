/**
 * test-dataverse.ts
 * Full CRUD test against all Dataverse entities.
 * Creates a test record, reads it back, then deletes it.
 * Run: npm run test:dataverse
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios, { AxiosInstance } from 'axios';

const TENANT_ID     = process.env.AZURE_TENANT_ID!;
const CLIENT_ID     = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;
const DATAVERSE_URL = process.env.DATAVERSE_URL!;
const API_BASE      = `${DATAVERSE_URL}/api/data/v9.2`;

async function buildClient(): Promise<AxiosInstance> {
  const res = await axios.post(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, scope: `${DATAVERSE_URL}/.default`, grant_type: 'client_credentials' }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
  );
  const token: string = res.data.access_token;
  return axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
}

function pass(msg: string)  { console.log(`  ✓ ${msg}`); }
function fail(msg: string)  { console.error(`  ✗ ${msg}`); }

async function testStudent(api: AxiosInstance) {
  console.log('\n── Students ──────────────────────────────');
  const payload = {
    sms_firstname: 'CRUDTest',
    sms_lastname: `Student_${Date.now()}`,
    sms_emailaddress1: `crud.test.${Date.now()}@example.com`,
    sms_dateofbirth: '2010-01-01',
    sms_gender: 1,
    sms_enrollmentdate: new Date().toISOString().split('T')[0],
    sms_parentname: 'Test Parent',
    sms_parentphone: '+1000000000',
  };

  // CREATE
  const createRes = await api.post('/sms_students', payload, { headers: { Prefer: 'return=representation' } });
  const id: string = createRes.data.sms_studentid;
  pass(`Created student — id: ${id}`);

  // READ
  const readRes = await api.get(`/sms_students(${id})?$select=sms_firstname,sms_lastname`);
  pass(`Read back: ${readRes.data.sms_firstname} ${readRes.data.sms_lastname}`);

  // UPDATE
  await api.patch(`/sms_students(${id})`, { sms_telephone1: '+9999999999' });
  pass('Updated telephone');

  // DELETE
  await api.delete(`/sms_students(${id})`);
  pass('Deleted test record');
}

async function testTeacher(api: AxiosInstance) {
  console.log('\n── Teachers ──────────────────────────────');
  const payload = {
    sms_firstname: 'CRUDTest',
    sms_lastname: `Teacher_${Date.now()}`,
    sms_emailaddress1: `crud.teacher.${Date.now()}@example.com`,
    sms_employeecode: `TC${Date.now()}`,
    sms_qualification: 'M.Ed',
    sms_specialization: 'Test',
    sms_hiredate: new Date().toISOString().split('T')[0],
    sms_dateofbirth: '1985-01-01',
    sms_gender: 1,
  };

  const createRes = await api.post('/sms_teachers', payload, { headers: { Prefer: 'return=representation' } });
  const id: string = createRes.data.sms_teacherid;
  pass(`Created teacher — id: ${id}`);

  const readRes = await api.get(`/sms_teachers(${id})?$select=sms_firstname,sms_specialization`);
  pass(`Read back: ${readRes.data.sms_firstname} / ${readRes.data.sms_specialization}`);

  await api.delete(`/sms_teachers(${id})`);
  pass('Deleted test record');
}

async function testListAll(api: AxiosInstance) {
  console.log('\n── List endpoints (top 3) ────────────────');
  const tables = [
    ['sms_students',      'students'],
    ['sms_teachers',      'teachers'],
    ['sms_employees',     'employees'],
    ['sms_classes',       'classes'],
    ['sms_attendances',   'attendance'],
    ['sms_feepayments',   'fee payments'],
    ['sms_feestructures', 'fee structures'],
    ['sms_enrollments',   'enrollments'],
    ['sms_departments',   'departments'],
    ['sms_subjects',      'subjects'],
    ['sms_exams',         'exams'],
    ['sms_libraries',     'library'],
    ['sms_timetables',    'timetable'],
  ];
  for (const [table, label] of tables) {
    try {
      const res = await api.get(`/${table}?$top=3`);
      pass(`${label} — ${res.data.value.length} row(s) returned`);
    } catch (err: any) {
      fail(`${label} — [${err.response?.status}] ${err.response?.data?.error?.message ?? err.message}`);
    }
  }
}

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log('  Full Dataverse CRUD Test');
  console.log('══════════════════════════════════════════');

  let api: AxiosInstance;
  try {
    api = await buildClient();
    pass('Token acquired');
  } catch (err: any) {
    fail(`Auth failed: ${err.response?.data ?? err.message}`);
    process.exit(1);
  }

  let failed = false;

  await testListAll(api).catch(e => { fail(`List test error: ${e.message}`); failed = true; });
  await testStudent(api).catch(e => { fail(`Student CRUD error: ${e.message}`); failed = true; });
  await testTeacher(api).catch(e => { fail(`Teacher CRUD error: ${e.message}`); failed = true; });

  console.log(failed ? '\n⚠️  Some tests failed\n' : '\n✅ All CRUD tests passed!\n');
}

main();
