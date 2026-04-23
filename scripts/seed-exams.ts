/**
 * seed-exams.ts — populate sms_exams with realistic school data.
 * Run: npx ts-node --skip-project scripts/seed-exams.ts
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
    const ph = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    // ── fetch existing deps ──────────────────────────────────────────────────
    console.log('\nFetching existing data…');
    const [classRes, subRes, termRes, ayRes] = await Promise.all([
        axios.get(`${API}/sms_classes?$select=sms_classid,sms_name&$orderby=sms_name asc`, { headers: h, timeout: 20000 }),
        axios.get(`${API}/sms_subjects?$select=sms_subjectid,sms_name&$orderby=sms_name asc`, { headers: h, timeout: 20000 }),
        axios.get(`${API}/sms_terms?$select=sms_termid,sms_name&$orderby=sms_name asc`, { headers: h, timeout: 20000 }),
        axios.get(`${API}/sms_academicyears?$select=sms_academicyearid,sms_name&$orderby=sms_name desc&$top=1`, { headers: h, timeout: 20000 }),
    ]);

    const classes      = classRes.data.value ?? [];
    const subjects     = subRes.data.value   ?? [];
    const terms        = termRes.data.value  ?? [];
    const academicYear = ayRes.data.value?.[0];

    console.log(`  classes: ${classes.length}, subjects: ${subjects.length}, terms: ${terms.length}, academicYear: ${academicYear?.sms_name ?? 'none'}`);
    if (classes.length)  console.log('  Classes:',  classes.map((c: any) => c.sms_name).join(', '));
    if (subjects.length) console.log('  Subjects:', subjects.map((s: any) => s.sms_name).join(', '));
    if (terms.length)    console.log('  Terms:',    terms.map((t: any) => t.sms_name).join(', '));

    // helpers to pick by index (cycling)
    const cls  = (i: number) => classes[i  % classes.length];
    const subj = (i: number) => subjects[i % subjects.length];
    const term = (i: number) => terms[i    % terms.length];
    const ay   = academicYear;

    // ── exam definitions ─────────────────────────────────────────────────────
    // examtype: 1=Quiz, 2=Midterm, 3=Final, 4=Practical
    interface ExamDef {
        name: string; code: string; type: number;
        start: string; end: string;
        totalmarks: number; passmarks: number; weight: number;
        venue: string;
        classIdx: number; subjectIdx: number; termIdx: number;
    }

    const exams: ExamDef[] = [
        // Term 1
        { name: 'Term 1 Mathematics Quiz',         code: 'T1-MATH-Q1',  type: 1, start: '2026-01-20', end: '2026-01-20', totalmarks: 20,  passmarks: 10, weight: 10, venue: 'Classroom A', classIdx: 0, subjectIdx: 0, termIdx: 0 },
        { name: 'Term 1 English Quiz',             code: 'T1-ENG-Q1',   type: 1, start: '2026-01-22', end: '2026-01-22', totalmarks: 20,  passmarks: 10, weight: 10, venue: 'Classroom B', classIdx: 1, subjectIdx: 1, termIdx: 0 },
        { name: 'Term 1 Science Quiz',             code: 'T1-SCI-Q1',   type: 1, start: '2026-01-24', end: '2026-01-24', totalmarks: 20,  passmarks: 10, weight: 10, venue: 'Classroom C', classIdx: 2, subjectIdx: 2, termIdx: 0 },
        { name: 'Term 1 Mid-Term Examinations',    code: 'T1-MTE-2026',  type: 2, start: '2026-02-10', end: '2026-02-14', totalmarks: 100, passmarks: 50, weight: 30, venue: 'Main Hall',   classIdx: 0, subjectIdx: 0, termIdx: 0 },
        { name: 'Term 1 Science Lab Practical',    code: 'T1-SCI-PRAC',  type: 4, start: '2026-02-20', end: '2026-02-21', totalmarks: 50,  passmarks: 25, weight: 20, venue: 'Science Lab', classIdx: 2, subjectIdx: 2, termIdx: 0 },
        { name: 'Term 1 Final Examinations',       code: 'T1-FINAL-2026',type: 3, start: '2026-03-10', end: '2026-03-20', totalmarks: 100, passmarks: 50, weight: 60, venue: 'Exam Hall',   classIdx: 0, subjectIdx: 0, termIdx: 0 },

        // Term 2
        { name: 'Term 2 Mathematics Quiz',         code: 'T2-MATH-Q1',  type: 1, start: '2026-04-14', end: '2026-04-14', totalmarks: 20,  passmarks: 10, weight: 10, venue: 'Classroom A', classIdx: 0, subjectIdx: 0, termIdx: 1 },
        { name: 'Term 2 English Quiz',             code: 'T2-ENG-Q1',   type: 1, start: '2026-04-16', end: '2026-04-16', totalmarks: 20,  passmarks: 10, weight: 10, venue: 'Classroom B', classIdx: 1, subjectIdx: 1, termIdx: 1 },
        { name: 'Term 2 Mid-Term Examinations',    code: 'T2-MTE-2026',  type: 2, start: '2026-05-11', end: '2026-05-15', totalmarks: 100, passmarks: 50, weight: 30, venue: 'Main Hall',   classIdx: 1, subjectIdx: 1, termIdx: 1 },
        { name: 'Term 2 ICT Practical Test',       code: 'T2-ICT-PRAC',  type: 4, start: '2026-05-22', end: '2026-05-22', totalmarks: 50,  passmarks: 25, weight: 20, venue: 'Computer Lab',classIdx: 3, subjectIdx: 3, termIdx: 1 },
        { name: 'Term 2 Final Examinations',       code: 'T2-FINAL-2026',type: 3, start: '2026-06-15', end: '2026-06-25', totalmarks: 100, passmarks: 50, weight: 60, venue: 'Exam Hall',   classIdx: 1, subjectIdx: 1, termIdx: 1 },

        // Term 3
        { name: 'Term 3 Mathematics Quiz',         code: 'T3-MATH-Q1',  type: 1, start: '2026-08-18', end: '2026-08-18', totalmarks: 20,  passmarks: 10, weight: 10, venue: 'Classroom A', classIdx: 2, subjectIdx: 0, termIdx: 2 },
        { name: 'Term 3 Social Studies Quiz',      code: 'T3-SOC-Q1',   type: 1, start: '2026-08-20', end: '2026-08-20', totalmarks: 20,  passmarks: 10, weight: 10, venue: 'Classroom D', classIdx: 3, subjectIdx: 4, termIdx: 2 },
        { name: 'Term 3 Mid-Term Examinations',    code: 'T3-MTE-2026',  type: 2, start: '2026-09-14', end: '2026-09-18', totalmarks: 100, passmarks: 50, weight: 30, venue: 'Main Hall',   classIdx: 2, subjectIdx: 0, termIdx: 2 },
        { name: 'Term 3 Art & Design Practical',   code: 'T3-ART-PRAC',  type: 4, start: '2026-09-25', end: '2026-09-25', totalmarks: 50,  passmarks: 25, weight: 20, venue: 'Art Room',    classIdx: 4, subjectIdx: 5, termIdx: 2 },
        { name: 'End-of-Year Final Examinations',  code: 'EY-FINAL-2026',type: 3, start: '2026-11-16', end: '2026-11-27', totalmarks: 100, passmarks: 50, weight: 60, venue: 'Exam Hall',   classIdx: 0, subjectIdx: 0, termIdx: 2 },
        { name: 'Mock Examinations',               code: 'MOCK-2026',    type: 3, start: '2026-10-05', end: '2026-10-09', totalmarks: 100, passmarks: 50, weight: 0,  venue: 'Exam Hall',   classIdx: 0, subjectIdx: 0, termIdx: 2 },
    ];

    // ── check how many already exist ────────────────────────────────────────
    const existingRes = await axios.get(`${API}/sms_exams?$select=sms_name&$top=50`, { headers: h, timeout: 20000 });
    const existingNames = new Set((existingRes.data.value ?? []).map((r: any) => r.sms_name as string));
    console.log(`\nExisting exams: ${existingNames.size}`);
    if (existingNames.size > 0) console.log(' ', [...existingNames].join(', '));

    // ── create missing exams ─────────────────────────────────────────────────
    console.log('\nSeeding exams…\n');
    let created = 0, skipped = 0;

    for (const e of exams) {
        if (existingNames.has(e.name)) {
            console.log(`  ⊘ skip  "${e.name}"`);
            skipped++;
            continue;
        }

        const payload: any = {
            sms_name:         e.name,
            sms_examcode:     e.code,
            sms_examtype:     e.type,
            sms_startdate:    `${e.start}T00:00:00Z`,
            sms_enddate:      `${e.end}T00:00:00Z`,
            sms_totalmarks:   e.totalmarks,
            sms_passmarks:    e.passmarks,
            sms_weightpercent: e.weight,
            sms_venue:        e.venue,
        };

        const c = cls(e.classIdx);
        const s = subj(e.subjectIdx);
        const t = term(e.termIdx);

        if (c) payload['sms_class@odata.bind']   = `/sms_classes(${c.sms_classid})`;
        if (s) payload['sms_subject@odata.bind'] = `/sms_subjects(${s.sms_subjectid})`;
        if (t) payload['sms_term@odata.bind']    = `/sms_terms(${t.sms_termid})`;
        if (ay) payload['sms_academicyear@odata.bind'] = `/sms_academicyears(${ay.sms_academicyearid})`;

        try {
            const r = await axios.post(`${API}/sms_exams`, payload, { headers: ph, timeout: 20000 });
            console.log(`  ✓ created "${e.name}" (${r.data.sms_examid})`);
            created++;
        } catch (err: any) {
            console.error(`  ✗ failed  "${e.name}":`, err.response?.data?.error?.message ?? err.message);
        }
    }

    console.log(`\n✅ Done — ${created} created, ${skipped} skipped.\n`);
}

main().catch((e: any) => { console.error(e.response?.data?.error?.message ?? e.message); process.exit(1); });
