/**
 * test-departments.ts — integration tests for the /api/departments endpoints.
 * Requires the dev server to be running at http://localhost:3000.
 * Run: npx tsx scripts/test-departments.ts
 */
import axios from 'axios';

const API = 'http://localhost:3000/api';

interface TestResult { name: string; passed: boolean; error?: string; duration: number; }
const results: TestResult[] = [];

async function run(name: string, fn: () => Promise<void>) {
    const start = Date.now();
    process.stdout.write(`  ${name}… `);
    try {
        await fn();
        const ms = Date.now() - start;
        results.push({ name, passed: true, duration: ms });
        console.log(`✓ (${ms}ms)`);
    } catch (err: any) {
        const ms = Date.now() - start;
        const msg = err?.response?.data?.error ?? err?.message ?? String(err);
        results.push({ name, passed: false, error: msg, duration: ms });
        console.log(`✗ (${ms}ms)`);
        console.error(`     └─ ${msg}`);
    }
}

async function main() {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  Departments API Tests  (http://localhost:3000)');
    console.log('══════════════════════════════════════════════════\n');

    let createdId: string | null = null;
    const testName = `Test_Dept_${Date.now()}`;

    // ── GET /api/departments ─────────────────────────────────────────────────
    await run('GET /api/departments (list)', async () => {
        const res = await axios.get(`${API}/departments`, { timeout: 15000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        if (!Array.isArray(body.data)) throw new Error('data is not an array');
        console.log(`\n     └─ ${body.data.length} department(s) in Dataverse`);
        if (body.data.length > 0) {
            const sample = body.data[0];
            console.log(`     └─ Sample: "${sample.name}" | HoD: ${sample.hodname || '(none)'}`);
        }
    });

    // ── GET /api/departments?search= ─────────────────────────────────────────
    await run('GET /api/departments?search=Math', async () => {
        const res = await axios.get(`${API}/departments`, { params: { search: 'Math' }, timeout: 15000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        console.log(`\n     └─ ${body.data.length} match(es) for "Math"`);
    });

    // ── POST /api/departments ────────────────────────────────────────────────
    await run('POST /api/departments (create)', async () => {
        const res = await axios.post(`${API}/departments`, {
            name: testName,
            description: 'Temporary department created by test script',
        }, { timeout: 15000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        const dept = body.data;
        const id = dept?.sms_departmentid ?? dept?.departmentid;
        if (!id) throw new Error('No department ID in response');
        createdId = id;
        console.log(`\n     └─ Created ID: ${createdId}`);
    });

    // ── POST /api/departments — validation (missing name) ────────────────────
    await run('POST /api/departments (missing name → 400)', async () => {
        try {
            await axios.post(`${API}/departments`, { description: 'No name' }, { timeout: 15000 });
            throw new Error('Expected 400 but got 2xx');
        } catch (err: any) {
            if (err.response?.status === 400) return;
            throw err;
        }
    });

    // ── GET /api/departments/:id ─────────────────────────────────────────────
    if (createdId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = createdId as any as string;
        const short: string = (id as string).slice(0, 8);
        await run(`GET /api/departments/${short}… (by ID)`, async () => {
            const res = await axios.get(`${API}/departments/${id}`, { timeout: 15000 });
            const body = res.data;
            if (!body.success) throw new Error(`success=false: ${body.error}`);
            const dept = body.data;
            if (!dept?.name) throw new Error('No name in returned department');
            console.log(`\n     └─ Name: "${dept.name}"`);
        });

        // ── PUT /api/departments/:id ─────────────────────────────────────────
        await run(`PUT /api/departments/${short}… (update)`, async () => {
            const res = await axios.put(`${API}/departments/${id}`, {
                name: `${testName}_Updated`,
                description: 'Updated by test script',
            }, { timeout: 15000 });
            const body = res.data;
            if (!body.success) throw new Error(`success=false: ${body.error}`);
            const dept = body.data;
            console.log(`\n     └─ Updated name: "${dept?.name}"`);
        });

        // ── DELETE /api/departments/:id ──────────────────────────────────────
        await run(`DELETE /api/departments/${short}… (cleanup)`, async () => {
            const res = await axios.delete(`${API}/departments/${id}`, { timeout: 15000 });
            const body = res.data;
            if (!body.success) throw new Error(`success=false: ${body.error}`);
        });
    }

    // ── GET non-existent ID → 500 or 404 ────────────────────────────────────
    await run('GET /api/departments/00000000-0000-0000-0000-000000000000 (not found)', async () => {
        try {
            await axios.get(`${API}/departments/00000000-0000-0000-0000-000000000000`, { timeout: 15000 });
            throw new Error('Expected error response but got 2xx');
        } catch (err: any) {
            if (err.response?.status && err.response.status >= 400) return;
            throw err;
        }
    });

    // ── Summary ──────────────────────────────────────────────────────────────
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const total  = results.reduce((s, r) => s + r.duration, 0);

    console.log('\n──────────────────────────────────────────────────');
    console.log(`  Results: ${passed}/${results.length} passed | ${total}ms total`);
    if (failed > 0) {
        console.log('\n  Failed tests:');
        results.filter(r => !r.passed).forEach(r => console.log(`  ✗ ${r.name}: ${r.error}`));
    }
    console.log('══════════════════════════════════════════════════\n');

    if (failed > 0) process.exit(1);
}

main().catch((err: any) => {
    console.error('\nFatal:', err.message);
    process.exit(1);
});
