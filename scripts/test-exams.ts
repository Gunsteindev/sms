/**
 * test-exams.ts — raw field discovery + SELECT validation + CRUD for sms_exams and sms_examresults.
 * Run: npx ts-node --skip-project scripts/test-exams.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

const EXAM_SELECT   = 'sms_examid,sms_name,sms_examcode,sms_examtype,sms_startdate,sms_enddate,_sms_academicyear_value,createdon,modifiedon';
const RESULT_SELECT = 'sms_examresultid,sms_name,sms_score,sms_maxscore,sms_grade,sms_remarks,_sms_exam_value,_sms_student_value,_sms_subject_value,createdon,modifiedon';

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

async function main() {
    console.log('\n══════════════════════════════════════════');
    console.log('  Exams & Exam Results API Test');
    console.log('══════════════════════════════════════════\n');

    const token = await getToken();
    console.log('✓ Token acquired\n');
    const h = {
        Authorization: `Bearer ${token}`, Accept: 'application/json',
        'OData-MaxVersion': '4.0', 'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    // ════════════════════════════════════════════
    //  EXAMS
    // ════════════════════════════════════════════
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  sms_exams');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Raw discovery
    console.log('① Raw record (no $select):');
    try {
        const res = await axios.get(`${API}/sms_exams?$top=1`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        if (!rows.length) { console.log('  ⚠ Table is empty\n'); }
        else {
            Object.keys(rows[0]).filter(k => !k.startsWith('@')).sort().forEach(k => {
                const v = rows[0][k];
                const d = v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0, 80)}"` : String(v);
                console.log(`  ${k}: ${d}`);
            });
            console.log();
        }
    } catch (err: any) { console.error('  ✗', err.response?.data?.error?.message ?? err.message); }

    // 2. App SELECT
    console.log('② App SELECT:');
    try {
        const res = await axios.get(`${API}/sms_exams?$select=${EXAM_SELECT}&$orderby=sms_startdate desc&$top=5`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        console.log(`  ✓ ${rows.length} record(s)\n`);
        rows.forEach((r, i) => {
            console.log(`  [${i+1}] ${r.sms_name}`);
            console.log(`      ID:      ${r.sms_examid}`);
            console.log(`      Code:    ${r.sms_examcode ?? '—'}`);
            console.log(`      Type:    ${r.sms_examtype} (${r['sms_examtype@OData.Community.Display.V1.FormattedValue'] ?? '?'})`);
            console.log(`      Start:   ${r.sms_startdate ?? '—'}`);
            console.log(`      End:     ${r.sms_enddate ?? '—'}`);
            console.log(`      AcadYr:  ${r['_sms_academicyear_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
        });
        console.log();
    } catch (err: any) {
        console.error('  ✗ SELECT failed:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2), '\n');
    }

    // 3. CRUD — exams
    console.log('③ CRUD test (sms_exams):');
    let examId = '';
    try {
        const cr = await axios.post(`${API}/sms_exams`,
            { sms_name: 'Test Exam CRUD', sms_examtype: 1, sms_startdate: '2026-04-22', sms_enddate: '2026-04-22' },
            { headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000 });
        examId = cr.data.sms_examid;
        console.log(`  ✓ CREATE id=${examId}`);

        await axios.patch(`${API}/sms_exams(${examId})`, { sms_examcode: 'TEST-001', sms_examtype: 2 },
            { headers: { ...h, 'Content-Type': 'application/json', 'If-Match': '*' }, timeout: 20000 });
        console.log('  ✓ UPDATE code→TEST-001, type→2');

        await axios.delete(`${API}/sms_exams(${examId})`, { headers: h, timeout: 20000 });
        console.log('  ✓ DELETE\n');
    } catch (err: any) {
        console.error('  ✗ CRUD:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
        if (examId) await axios.delete(`${API}/sms_exams(${examId})`, { headers: h, timeout: 20000 }).catch(() => {});
        console.log();
    }

    // ════════════════════════════════════════════
    //  EXAM RESULTS
    // ════════════════════════════════════════════
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  sms_examresults');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 4. Raw discovery
    console.log('④ Raw record (no $select):');
    try {
        const res = await axios.get(`${API}/sms_examresults?$top=1`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        if (!rows.length) { console.log('  ⚠ Table is empty\n'); }
        else {
            Object.keys(rows[0]).filter(k => !k.startsWith('@')).sort().forEach(k => {
                const v = rows[0][k];
                const d = v === null ? 'null' : typeof v === 'string' ? `"${String(v).slice(0, 80)}"` : String(v);
                console.log(`  ${k}: ${d}`);
            });
            console.log();
        }
    } catch (err: any) { console.error('  ✗', err.response?.data?.error?.message ?? err.message); }

    // 5. App SELECT
    console.log('⑤ App SELECT:');
    try {
        const res = await axios.get(`${API}/sms_examresults?$select=${RESULT_SELECT}&$orderby=createdon desc&$top=5`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        console.log(`  ✓ ${rows.length} record(s)\n`);
        rows.forEach((r, i) => {
            console.log(`  [${i+1}] ${r.sms_name ?? '?'}`);
            console.log(`      ID:      ${r.sms_examresultid}`);
            console.log(`      Score:   ${r.sms_score} / ${r.sms_maxscore}`);
            console.log(`      Grade:   ${r.sms_grade ?? '—'}`);
            console.log(`      Remarks: ${r.sms_remarks ?? '—'}`);
            console.log(`      Exam:    ${r['_sms_exam_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Student: ${r['_sms_student_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
            console.log(`      Subject: ${r['_sms_subject_value@OData.Community.Display.V1.FormattedValue'] ?? '—'}`);
        });
        console.log();
    } catch (err: any) {
        console.error('  ✗ SELECT failed:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2), '\n');
    }

    // 6. Fetch deps for result CRUD
    console.log('⑥ Fetching deps for result CRUD…');
    let depExamId = '', depStudentId = '';
    try {
        const [er, sr] = await Promise.all([
            axios.get(`${API}/sms_exams?$select=sms_examid,sms_name&$top=1`, { headers: h, timeout: 20000 }),
            axios.get(`${API}/sms_students?$select=sms_studentid,sms_firstname,sms_lastname&$top=1`, { headers: h, timeout: 20000 }),
        ]);
        const exam = er.data.value?.[0]; const student = sr.data.value?.[0];
        if (exam)    { depExamId    = exam.sms_examid;    console.log(`  Exam:    ${exam.sms_name}`); }
        if (student) { depStudentId = student.sms_studentid; console.log(`  Student: ${student.sms_firstname} ${student.sms_lastname}`); }
        console.log();
    } catch (err: any) { console.error('  ✗', err.message, '\n'); }

    // 7. CRUD — exam results
    if (depExamId && depStudentId) {
        console.log('⑦ CRUD test (sms_examresults):');
        let resultId = '';
        try {
            const payload: any = {
                'sms_exam@odata.bind':    `/sms_exams(${depExamId})`,
                'sms_student@odata.bind': `/sms_students(${depStudentId})`,
                sms_score:    72,
                sms_maxscore: 100,
                sms_grade:    'B',
                sms_remarks:  'CRUD test',
            };
            const cr = await axios.post(`${API}/sms_examresults`, payload,
                { headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }, timeout: 20000 });
            resultId = cr.data.sms_examresultid;
            console.log(`  ✓ CREATE id=${resultId}`);

            await axios.patch(`${API}/sms_examresults(${resultId})`, { sms_score: 85, sms_grade: 'A', sms_remarks: 'updated' },
                { headers: { ...h, 'Content-Type': 'application/json', 'If-Match': '*' }, timeout: 20000 });
            console.log('  ✓ UPDATE score→85, grade→A');

            await axios.delete(`${API}/sms_examresults(${resultId})`, { headers: h, timeout: 20000 });
            console.log('  ✓ DELETE\n');
        } catch (err: any) {
            console.error('  ✗ CRUD:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
            if (resultId) await axios.delete(`${API}/sms_examresults(${resultId})`, { headers: h, timeout: 20000 }).catch(() => {});
        }
    } else {
        console.log('⑦ Skipping result CRUD — missing exam or student\n');
    }

    console.log('✅ Exams API test complete.\n');
}

main().catch((e: any) => {
    console.error('\n✗', e.response?.data?.error?.message ?? e.message);
    process.exit(1);
});
