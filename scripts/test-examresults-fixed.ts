import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

// Corrected SELECT — no sms_maxscore, no _sms_subject_value
const SELECT = 'sms_examresultid,sms_name,sms_score,sms_percentage,sms_gradeletter,sms_gradepointvalue,sms_ispassed,sms_remarks,_sms_exam_value,_sms_student_value,createdon,modifiedon';

async function main() {
    const token = (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;

    const h = {
        Authorization: `Bearer ${token}`, Accept: 'application/json',
        'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    console.log('\n① Corrected SELECT validation…');
    try {
        const res = await axios.get(`${API}/sms_examresults?$select=${SELECT}&$top=3`, { headers: h, timeout: 20000 });
        console.log(`  ✓ SELECT OK — ${res.data.value?.length ?? 0} record(s)`);
    } catch (err: any) {
        console.error('  ✗', err.response?.data?.error?.message ?? err.message);
        return;
    }

    // Fetch deps
    const [er, sr] = await Promise.all([
        axios.get(`${API}/sms_exams?$select=sms_examid,sms_name&$top=1`, { headers: h, timeout: 20000 }),
        axios.get(`${API}/sms_students?$select=sms_studentid,sms_firstname,sms_lastname&$top=1`, { headers: h, timeout: 20000 }),
    ]);
    const exam = er.data.value?.[0]; const student = sr.data.value?.[0];
    if (!exam || !student) { console.log('  ⚠ Missing deps'); return; }
    console.log(`\n② Deps: exam=${exam.sms_name}, student=${student.sms_firstname} ${student.sms_lastname}`);

    console.log('\n③ CRUD test (corrected fields)…');
    let id = '';
    try {
        const payload: any = {
            'sms_exam@odata.bind':    `/sms_exams(${exam.sms_examid})`,
            'sms_student@odata.bind': `/sms_students(${student.sms_studentid})`,
            sms_score:       78,
            sms_percentage:  78,
            sms_gradeletter: 'B+',
            sms_ispassed:    true,
            sms_remarks:     'CRUD test',
        };
        const cr = await axios.post(`${API}/sms_examresults`, payload,
            { headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000 });
        id = cr.data.sms_examresultid;
        console.log(`  ✓ CREATE id=${id}`);
        console.log(`    score=${cr.data.sms_score}  pct=${cr.data.sms_percentage}  grade=${cr.data.sms_gradeletter}  passed=${cr.data.sms_ispassed}`);

        await axios.patch(`${API}/sms_examresults(${id})`,
            { sms_score: 91, sms_percentage: 91, sms_gradeletter: 'A', sms_ispassed: true },
            { headers: { ...h, 'Content-Type': 'application/json', 'If-Match': '*' }, timeout: 20000 });
        console.log('  ✓ UPDATE score→91, grade→A');

        // Read back
        const rb = await axios.get(`${API}/sms_examresults(${id})?$select=${SELECT}`, { headers: h, timeout: 20000 });
        console.log(`  ✓ READ   score=${rb.data.sms_score}  pct=${rb.data.sms_percentage}  grade=${rb.data.sms_gradeletter}`);
        console.log(`           student=${rb.data.sms_studentname}  exam=${rb.data.sms_examname}`);

        await axios.delete(`${API}/sms_examresults(${id})`, { headers: h, timeout: 20000 });
        console.log('  ✓ DELETE');
    } catch (err: any) {
        console.error('  ✗', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
        if (id) await axios.delete(`${API}/sms_examresults(${id})`, { headers: h, timeout: 20000 }).catch(() => {});
    }
    console.log('\n✅ Done.\n');
}

main().catch((e: any) => { console.error(e.response?.data?.error?.message ?? e.message); process.exit(1); });
