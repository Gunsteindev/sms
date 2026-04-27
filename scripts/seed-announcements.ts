/**
 * seed-announcements.ts — Populates sms_announcements with realistic school notifications.
 * audience: 1=All  2=Students  3=Teachers  4=Parents
 * Safe to re-run (skips by name).
 * Run: npm run seed:announcements
 */
import dotenv from 'dotenv'; import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T=process.env.AZURE_TENANT_ID!, C=process.env.AZURE_CLIENT_ID!, S=process.env.AZURE_CLIENT_SECRET!, D=process.env.DATAVERSE_URL!;
const API=`${D}/api/data/v9.2`;

async function getToken(){
    return (await axios.post(`https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({client_id:C,client_secret:S,scope:`${D}/.default`,grant_type:'client_credentials'}).toString(),
        {headers:{'Content-Type':'application/x-www-form-urlencoded'},timeout:20000})).data.access_token;
}
const hdr=(tok:string)=>({Authorization:`Bearer ${tok}`,Accept:'application/json','OData-MaxVersion':'4.0','OData-Version':'4.0'});
const phdr=(tok:string)=>({...hdr(tok),'Content-Type':'application/json',Prefer:'return=representation'});

function d(offset: number){ // days from today
    const dt=new Date(); dt.setDate(dt.getDate()+offset); return dt.toISOString().split('T')[0];
}

interface ASpec { name:string; message:string; audience:number; ispinned:boolean; publishdate:string; expirydate?:string; }

const ANNOUNCEMENTS: ASpec[] = [
    // ── Pinned / high-priority ─────────────────────────────────────────────────
    {
        name: 'Term 2 Resumption Notice',
        message: 'Dear Parents and Guardians,\n\nThis is to inform you that Term 2 of the 2024/2025 academic year will commence on Monday, 6th January 2025. All students are expected to report to school by 7:30 AM in full school uniform.\n\nPlease ensure all outstanding Term 1 fees are settled before resumption. Contact the Finance Office for any payment queries.\n\nThank you.\nManagement',
        audience: 1, ispinned: true,
        publishdate: d(-5), expirydate: d(30),
    },
    {
        name: 'End-of-Term Examination Timetable Released',
        message: 'The end-of-term examination timetable for all classes (Primary 1 – JHS 3) has been released. Students can collect printed copies from their class teachers.\n\nExaminations run from 20th November to 29th November 2024. Students should come prepared with the required stationery.\n\nGood luck to all students!',
        audience: 2, ispinned: true,
        publishdate: d(-10), expirydate: d(20),
    },

    // ── Academic ───────────────────────────────────────────────────────────────
    {
        name: 'Mid-Term Progress Reports Available',
        message: 'Mid-term progress reports for Term 2 are now available for collection at the school\'s administrative office.\n\nParents are encouraged to review the reports and schedule a meeting with the class teacher if they have any concerns regarding their child\'s academic performance.\n\nOffice hours: Monday – Friday, 8:00 AM – 3:00 PM.',
        audience: 4, ispinned: false,
        publishdate: d(-3),
    },
    {
        name: 'Inter-School Science Quiz – Team Selection',
        message: 'We are pleased to announce that Ghana Basic School will be participating in the Regional Inter-School Science Quiz scheduled for 15th February 2025.\n\nAll interested JHS 2 and JHS 3 students should register with their Science teacher by Friday. Selection trials will be held in the school science lab on Saturday, 11th January 2025 at 9:00 AM.',
        audience: 2, ispinned: false,
        publishdate: d(-7),
    },
    {
        name: 'Staff Professional Development Workshop',
        message: 'A mandatory professional development workshop for all teaching staff will be held on Saturday, 18th January 2025 from 8:00 AM to 1:00 PM in the school assembly hall.\n\nThe workshop will cover updated curriculum guidelines and new assessment strategies for the 2025 academic year. Attendance is compulsory. Please confirm your attendance with the HR office by Wednesday.\n\nRefreshments will be provided.',
        audience: 3, ispinned: false,
        publishdate: d(-2),
    },

    // ── Finance ────────────────────────────────────────────────────────────────
    {
        name: 'Term 2 Fee Payment Reminder',
        message: 'This is a reminder that Term 2 school fees are due by 15th January 2025. Fees may be paid via:\n\n• Mobile Money (MTN/Vodafone/AirtelTigo)\n• Bank transfer to our school account\n• Cash at the Finance Office (8:00 AM – 2:00 PM)\n\nStudents with outstanding fees may not be allowed to sit end-of-term examinations. Kindly prioritise payment to avoid inconvenience.',
        audience: 4, ispinned: false,
        publishdate: d(-1),
    },
    {
        name: 'Scholarship Applications Now Open',
        message: 'Applications for the 2024/2025 Academic Excellence Scholarship are now open. Eligible students must:\n\n• Have achieved aggregate 6 or better in last term\'s examinations\n• Be currently enrolled in JHS 1, JHS 2, or JHS 3\n• Submit a recommendation letter from their class teacher\n\nCompleted applications should be submitted to the Administrative Office by 31st January 2025. Forms are available at the school reception.',
        audience: 1, ispinned: false,
        publishdate: d(-14),
    },

    // ── Events ─────────────────────────────────────────────────────────────────
    {
        name: 'Annual Sports Day – Save the Date',
        message: 'Ghana Basic School\'s Annual Sports Day will be held on Friday, 28th February 2025 at the school\'s sports grounds.\n\nAll students are expected to participate in at least one event. Track events, field events, and team sports will be held. Parents and guardians are warmly invited to attend and cheer on their children.\n\nMore details on event schedules and house colours will be shared shortly.',
        audience: 1, ispinned: false,
        publishdate: d(-6),
    },
    {
        name: 'Parent-Teacher Association Meeting',
        message: 'The next Parent-Teacher Association (PTA) meeting will be held on Saturday, 25th January 2025 at 10:00 AM in the school assembly hall.\n\nAgenda items include:\n1. Academic performance review – Term 1\n2. Infrastructure development update\n3. School feeding programme feedback\n4. Any other business\n\nAll parents and guardians are strongly encouraged to attend.',
        audience: 4, ispinned: false,
        publishdate: d(-4),
    },

    // ── Administrative ─────────────────────────────────────────────────────────
    {
        name: 'School Uniform Compliance Notice',
        message: 'Management wishes to remind all students that wearing the correct school uniform is compulsory every school day. Students found in non-regulation attire will be sent home to change.\n\nAcceptable uniform:\n• White shirt/blouse and khaki shorts/skirt\n• Black shoes and white socks\n• School tie on formal days\n\nParents are urged to ensure compliance. Thank you.',
        audience: 2, ispinned: false,
        publishdate: d(-8),
    },
    {
        name: 'Updated School Calendar 2024/2025',
        message: 'The updated academic calendar for the 2024/2025 school year has been approved and is now available. Key dates:\n\n• Term 2 Start: 6th January 2025\n• Mid-Term Break: 14th–16th February 2025\n• End-of-Term Exams: 17th–28th March 2025\n• Term 2 End: 28th March 2025\n• Term 3 Start: 28th April 2025\n\nPrinted copies are available at the school office.',
        audience: 1, ispinned: false,
        publishdate: d(-12),
    },
    {
        name: 'New Lesson Note Submission Deadline',
        message: 'All teaching staff are reminded that weekly lesson notes must be submitted to the Vice Principal\'s office every Friday by 3:00 PM.\n\nStaff who have not been consistent with submissions are advised to regularise their records immediately. Lesson notes are key for inspection readiness.\n\nThank you for your cooperation.',
        audience: 3, ispinned: false,
        publishdate: d(-9),
    },
];

async function main(){
    console.log('=== Seed Announcements ===\n');
    const tok = await getToken();
    console.log('Token OK.\n');

    const existing = await axios.get<any>(`${API}/sms_announcements?$select=sms_announcementid,sms_name`,{headers:hdr(tok),timeout:30000});
    const existingNames = new Set<string>((existing.data.value??[]).map((a:any)=>(a.sms_name??'').toLowerCase()));
    console.log(`  ${existingNames.size} existing announcement(s) — skipping duplicates\n`);

    const AUD:{[k:number]:string}={1:'All',2:'Students',3:'Teachers',4:'Parents'};
    let created=0, skipped=0;

    for(const a of ANNOUNCEMENTS){
        if(existingNames.has(a.name.toLowerCase())){skipped++;continue;}
        const payload:Record<string,unknown>={
            sms_name:        a.name,
            sms_message:     a.message,
            sms_audience:    a.audience,
            sms_ispinned:    a.ispinned,
            sms_publishdate: new Date(a.publishdate).toISOString(),
        };
        if(a.expirydate) payload.sms_expirydate=new Date(a.expirydate).toISOString();
        await axios.post(`${API}/sms_announcements`,payload,{headers:phdr(tok),timeout:30000});
        created++;
        console.log(`  ✓ [${AUD[a.audience].padEnd(8)}] ${a.ispinned?'📌 ':'   '}${a.name}`);
    }
    console.log(`\n✓ Done: ${created} created, ${skipped} already existed\n`);
}

main().catch((e:unknown)=>{console.error((e as any).response?.data?.error?.message??(e as Error).message);process.exit(1);});
