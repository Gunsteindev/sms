/**
 * test-scholarships.ts — integration tests for /api/finance/scholarships endpoints.
 * Requires the dev server running at http://localhost:3000.
 * Run: npx tsx scripts/test-scholarships.ts
 */
import axios from 'axios';

const API = 'http://localhost:3000/api/finance/scholarships';

interface Result { name: string; passed: boolean; error?: string; duration: number; }
const results: Result[] = [];

async function run(name: string, fn: () => Promise<void>) {
    const t = Date.now();
    process.stdout.write(`  ${name}… `);
    try {
        await fn();
        results.push({ name, passed: true, duration: Date.now() - t });
        console.log(`✓ (${Date.now() - t}ms)`);
    } catch (err: any) {
        const msg = err?.response?.data?.error ?? err?.message ?? String(err);
        results.push({ name, passed: false, error: msg, duration: Date.now() - t });
        console.log(`✗`);
        console.error(`     └─ ${msg}`);
    }
}

async function main() {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  Scholarships API Tests  (localhost:3000)');
    console.log('══════════════════════════════════════════════════\n');

    let createdId: string | null = null;
    const testName = `Test_Scholarship_${Date.now()}`;
    const startDate = new Date().toISOString().slice(0, 10);

    // ── GET list ─────────────────────────────────────────────────────────────
    await run('GET /api/finance/scholarships', async () => {
        const res = await axios.get(API, { timeout: 15000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        if (!Array.isArray(body.data)) throw new Error('data is not an array');
        console.log(`\n     └─ ${body.data.length} scholarship(s) in Dataverse`);
        if (body.data.length > 0) {
            const s = body.data[0];
            console.log(`     └─ Sample: "${s.name}" | type: ${s.scholarshiptype} | status: ${s.scholarshipstatus}`);
        }
    });

    // ── GET with search filter ────────────────────────────────────────────────
    await run('GET ?search=Merit', async () => {
        const res = await axios.get(API, { params: { search: 'Merit' }, timeout: 15000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        console.log(`\n     └─ ${body.data.length} match(es) for "Merit"`);
    });

    // ── GET with status filter ────────────────────────────────────────────────
    await run('GET ?status=1 (Active only)', async () => {
        const res = await axios.get(API, { params: { status: 1 }, timeout: 15000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        console.log(`\n     └─ ${body.data.length} active scholarship(s)`);
        body.data.forEach((s: any) => {
            if (s.scholarshipstatus !== 1) throw new Error(`Non-active record returned: status=${s.scholarshipstatus}`);
        });
    });

    // ── POST create ───────────────────────────────────────────────────────────
    await run('POST create scholarship', async () => {
        const res = await axios.post(API, {
            name:              testName,
            description:       'Created by test script — safe to delete',
            scholarshiptype:   3,    // Merit
            amount:            500,
            percentage:        50,
            startdate:         startDate,
            scholarshipstatus: 1,    // Active
        }, { timeout: 15000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        const id = body.data?.sms_scholarshipid ?? body.data?.scholarshipid;
        if (!id) throw new Error('No ID in response');
        createdId = id;
        console.log(`\n     └─ Created ID: ${createdId}`);
    });

    // ── POST validation — missing required fields ─────────────────────────────
    await run('POST missing name → 400', async () => {
        try {
            await axios.post(API, { scholarshiptype: 1, startdate: startDate }, { timeout: 15000 });
            throw new Error('Expected 400 but got 2xx');
        } catch (err: any) {
            if (err.response?.status === 400) return;
            throw err;
        }
    });

    await run('POST missing scholarshiptype → 400', async () => {
        try {
            await axios.post(API, { name: 'X', startdate: startDate }, { timeout: 15000 });
            throw new Error('Expected 400 but got 2xx');
        } catch (err: any) {
            if (err.response?.status === 400) return;
            throw err;
        }
    });

    await run('POST missing startdate → 400', async () => {
        try {
            await axios.post(API, { name: 'X', scholarshiptype: 1 }, { timeout: 15000 });
            throw new Error('Expected 400 but got 2xx');
        } catch (err: any) {
            if (err.response?.status === 400) return;
            throw err;
        }
    });

    // ── GET by ID ─────────────────────────────────────────────────────────────
    if (createdId) {
        const id = createdId as string;
        const short = id.slice(0, 8);

        await run(`GET ${short}… by ID`, async () => {
            const res = await axios.get(`${API}/${id}`, { timeout: 15000 });
            const body = res.data;
            if (!body.success) throw new Error(`success=false: ${body.error}`);
            const s = body.data;
            if (s.name !== testName) throw new Error(`Name mismatch: ${s.name}`);
            console.log(`\n     └─ name="${s.name}" amount=${s.amount} type=${s.scholarshiptype}`);
        });

        // ── PUT update ────────────────────────────────────────────────────────
        await run(`PUT ${short}… update`, async () => {
            const res = await axios.put(`${API}/${id}`, {
                name:   `${testName}_Updated`,
                amount: 750,
                scholarshipstatus: 1,
            }, { timeout: 15000 });
            const body = res.data;
            if (!body.success) throw new Error(`success=false: ${body.error}`);
            const s = body.data;
            console.log(`\n     └─ Updated name="${s.name}" amount=${s.amount}`);
        });

        // ── DELETE cleanup ────────────────────────────────────────────────────
        await run(`DELETE ${short}… cleanup`, async () => {
            const res = await axios.delete(`${API}/${id}`, { timeout: 15000 });
            if (!res.data.success) throw new Error(`success=false: ${res.data.error}`);
        });
    }

    // ── GET non-existent ID ───────────────────────────────────────────────────
    await run('GET 00000000… (not found → error)', async () => {
        try {
            await axios.get(`${API}/00000000-0000-0000-0000-000000000000`, { timeout: 15000 });
            throw new Error('Expected error response but got 2xx');
        } catch (err: any) {
            if (err.response?.status && err.response.status >= 400) return;
            throw err;
        }
    });

    // ── Summary ───────────────────────────────────────────────────────────────
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const total  = results.reduce((s, r) => s + r.duration, 0);

    console.log('\n──────────────────────────────────────────────────');
    console.log(`  ${passed}/${results.length} passed | ${total}ms total`);
    if (failed > 0) {
        console.log('\n  Failed:');
        results.filter(r => !r.passed).forEach(r => console.log(`  ✗ ${r.name}: ${r.error}`));
    } else {
        console.log('  All tests passed ✓');
    }
    console.log('══════════════════════════════════════════════════\n');

    if (failed > 0) process.exit(1);
}

main().catch((err: any) => {
    console.error('\nFatal:', err.message);
    process.exit(1);
});
