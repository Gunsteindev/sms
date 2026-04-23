/**
 * test-grade-levels.ts — integration tests for /api/grade-levels endpoints.
 * Requires the dev server running at http://localhost:3000.
 * Run: npx tsx scripts/test-grade-levels.ts
 */
import axios from 'axios';

const BASE = 'http://localhost:3000/api/grade-levels';

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
    console.log('  Grade Levels API Tests  (localhost:3000)');
    console.log('══════════════════════════════════════════════════\n');

    let createdId: string | null = null;
    const testName = `Test_GradeLevel_${Date.now()}`;

    // ── GET list ─────────────────────────────────────────────────────────────
    await run('GET /api/grade-levels', async () => {
        const res  = await axios.get(BASE, { timeout: 30000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        if (!Array.isArray(body.data)) throw new Error('data is not an array');
        console.log(`\n     └─ ${body.data.length} grade level(s) in Dataverse`);
        if (body.data.length > 0) {
            const g = body.data[0];
            console.log(`     └─ Sample: "${g.name}" | level: ${g.level} | desc: ${g.description || '—'}`);
        }
    });

    // ── GET with search ───────────────────────────────────────────────────────
    await run('GET ?search=Grade', async () => {
        const res  = await axios.get(BASE, { params: { search: 'Grade' }, timeout: 30000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        console.log(`\n     └─ ${body.data.length} match(es) for "Grade"`);
    });

    // ── POST create ───────────────────────────────────────────────────────────
    await run('POST create grade level', async () => {
        const res  = await axios.post(BASE, {
            name:        testName,
            ordernumber: 99,
            description: 'Created by test script — safe to delete',
        }, { timeout: 30000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        const id = body.data?.sms_gradelevelid ?? body.data?.gradelevelid;
        if (!id) throw new Error('No ID in response');
        createdId = id;
        console.log(`\n     └─ Created ID: ${createdId}`);
    });

    // ── POST validation — missing required fields ─────────────────────────────
    await run('POST missing name → 400', async () => {
        try {
            await axios.post(BASE, { level: 1 }, { timeout: 30000 });
            throw new Error('Expected 400 but got 2xx');
        } catch (err: any) {
            if (err.response?.status === 400) return;
            throw err;
        }
    });

    await run('POST missing ordernumber → 400', async () => {
        try {
            await axios.post(BASE, { name: 'X' }, { timeout: 30000 });
            throw new Error('Expected 400 but got 2xx');
        } catch (err: any) {
            if (err.response?.status === 400) return;
            throw err;
        }
    });

    // ── GET by ID ─────────────────────────────────────────────────────────────
    if (createdId) {
        const id    = createdId as string;
        const short = id.slice(0, 8);

        await run(`GET ${short}… by ID`, async () => {
            const res  = await axios.get(`${BASE}/${id}`, { timeout: 30000 });
            const body = res.data;
            if (!body.success) throw new Error(`success=false: ${body.error}`);
            const g = body.data;
            if (g.name !== testName) throw new Error(`Name mismatch: "${g.name}"`);
            console.log(`\n     └─ name="${g.name}" ordernumber=${g.ordernumber}`);
        });

        // ── PUT update ────────────────────────────────────────────────────────
        await run(`PUT ${short}… update`, async () => {
            const res  = await axios.put(`${BASE}/${id}`, {
                name:        `${testName}_Updated`,
                ordernumber: 98,
            }, { timeout: 60000 });
            const body = res.data;
            if (!body.success) throw new Error(`success=false: ${body.error}`);
            const g = body.data;
            console.log(`\n     └─ Updated name="${g.name}" ordernumber=${g.ordernumber}`);
        });

        // ── DELETE cleanup ────────────────────────────────────────────────────
        await run(`DELETE ${short}… cleanup`, async () => {
            const res = await axios.delete(`${BASE}/${id}`, { timeout: 60000 });
            if (!res.data.success) throw new Error(`success=false: ${res.data.error}`);
        });
    }

    // ── GET non-existent ID ───────────────────────────────────────────────────
    await run('GET 00000000… (not found → error)', async () => {
        try {
            await axios.get(`${BASE}/00000000-0000-0000-0000-000000000000`, { timeout: 30000 });
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
