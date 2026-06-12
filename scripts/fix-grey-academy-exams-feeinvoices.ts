/**
 * fix-grey-academy-exams-feeinvoices.ts
 *
 * Task #4 — link Grey Academy's Exams and Fee Invoices to the current
 * 2025-2026 academic year (and the appropriate term where applicable).
 *
 * Exam -> term mapping is derived from each exam's name/type:
 *   - "Term 1 ..." exams                -> Term 1
 *   - "Mid-Term Examinations"           -> Term 2
 *   - "Term 3 ..." / "Final Term ..." / "Mock Examinations" -> Term 3
 *
 * Fee invoices: all 160 share due date 2024-09-15 (2024/25 names).
 *   - "Tuition Fee" + "Transport Levy" (named "... (Term 1 2024/25)")
 *     -> academic year 2025-2026 + Term 1
 *   - "Books & Stationery" + "School Uniform" (annual fees, no term in name)
 *     -> academic year 2025-2026, no term (annual charge)
 *
 * Reads scripts/.grey-academy-data.json (produced by dump-grey-academy.ts).
 *
 * Run: npx ts-node --skipProject scripts/fix-grey-academy-exams-feeinvoices.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';
import { readFileSync } from 'fs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AxiosInstance = any;

const T = process.env.AZURE_TENANT_ID!;
const C = process.env.AZURE_CLIENT_ID!;
const S = process.env.AZURE_CLIENT_SECRET!;
const D = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

const CURRENT_AY_ID = 'ba93c81c-2e4b-f111-bec6-7ced8d6e6816'; // 2025-2026 (iscurrent=true)
const TERM1_ID = '311b36c4-4d66-f111-ab0c-0022480a56e3'; // Term 1: 2025-09-01 .. 2025-12-19
const TERM2_ID = '321b36c4-4d66-f111-ab0c-0022480a56e3'; // Term 2: 2026-01-05 .. 2026-04-03
const TERM3_ID = '331b36c4-4d66-f111-ab0c-0022480a56e3'; // Term 3: 2026-04-20 .. 2026-07-31

// Exam -> term mapping by sms_examid
const EXAM_TERM: Record<string, string> = {
    '9c328b77-2a3e-f111-bec6-70a8a59a431e': TERM1_ID, // Term 1 Science Quiz
    '9e328b77-2a3e-f111-bec6-70a8a59a431e': TERM1_ID, // Term 1 Science Lab Practical
    'a9328b77-2a3e-f111-bec6-70a8a59a431e': TERM3_ID, // Term 3 Art & Design Practical
    'b7c1c342-6d37-f111-88b4-7c1e528d37f4': TERM2_ID, // Mid-Term Examinations
    '4b2525a4-6d37-f111-88b4-7c1e528d37f4': TERM3_ID, // Final Term Examinations
    '0f3a23c5-6d37-f111-88b4-7c1e528d37f4': TERM3_ID, // Mock Examinations
};

async function getToken(): Promise<string> {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20_000 },
    )).data.access_token;
}

function makeClient(token: string): AxiosInstance {
    return axios.create({
        baseURL: API,
        timeout: 30_000,
        headers: {
            Authorization:      `Bearer ${token}`,
            'Content-Type':     'application/json',
            Accept:             'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version':    '4.0',
        },
    });
}

async function runBatched<T>(
    items: T[],
    concurrency: number,
    fn: (item: T, index: number) => Promise<void>,
): Promise<{ success: number; failed: number }> {
    let idx = 0;
    let success = 0, failed = 0;

    async function worker() {
        while (idx < items.length) {
            const i = idx++;
            try {
                await fn(items[i], i);
                success++;
            } catch (err: any) {
                failed++;
                console.error(`     ✗ ${err.response?.data?.error?.message?.slice(0, 150) ?? err.message}`);
            }
        }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return { success, failed };
}

async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Fix: Grey Academy exams + fee invoices linking');
    console.log('══════════════════════════════════════════════════\n');

    const token  = await getToken();
    const client = makeClient(token);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = JSON.parse(readFileSync(resolve(process.cwd(), 'scripts/.grey-academy-data.json'), 'utf-8'));

    // ── 1. Link Exams -> 2025-2026 academic year + term ──
    console.log('1. Linking Exams -> 2025-2026 academic year + term');
    {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exams: any[] = data.exams;
        const r = await runBatched(exams, 3, async (e) => {
            const termId = EXAM_TERM[e.sms_examid];
            await client.patch(`sms_exams(${e.sms_examid})`, {
                'sms_academicyear@odata.bind': `/sms_academicyears(${CURRENT_AY_ID})`,
                'sms_term@odata.bind':         `/sms_terms(${termId})`,
            });
        });
        console.log(`   ${r.success} ok, ${r.failed} failed (of ${exams.length})`);
    }

    // ── 2. Link Fee Invoices -> 2025-2026 academic year (+ Term 1 for term-specific fees) ──
    console.log('2. Linking Fee Invoices -> 2025-2026 academic year (+ Term 1 where applicable)');
    {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoices: any[] = data.feeinvoices;
        let withTerm = 0, withoutTerm = 0;
        const r = await runBatched(invoices, 5, async (f) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: Record<string, unknown> = {
                'sms_academicyear@odata.bind': `/sms_academicyears(${CURRENT_AY_ID})`,
            };
            if (/\(Term \d+ /.test(f.sms_name)) {
                payload['sms_term@odata.bind'] = `/sms_terms(${TERM1_ID})`;
                withTerm++;
            } else {
                withoutTerm++;
            }
            await client.patch(`sms_fees(${f.sms_feeid})`, payload);
        });
        console.log(`   ${r.success} ok, ${r.failed} failed (of ${invoices.length})`);
        console.log(`   (${withTerm} linked to Term 1, ${withoutTerm} annual / no term)`);
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Done.');
    console.log('══════════════════════════════════════════════════\n');
}

main().catch((err: any) => {
    console.error('\nFatal:', err.response?.data?.error?.message ?? err.message);
    process.exit(1);
});
