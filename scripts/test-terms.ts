/**
 * test-terms.ts — integration tests for /api/terms endpoints.
 * Requires the dev server running at http://localhost:3000.
 * Run: npx tsx scripts/test-terms.ts
 */
import axios from 'axios';

const BASE = 'http://localhost:3000/api/terms';

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
    console.log('  Terms API Tests  (localhost:3000)');
    console.log('══════════════════════════════════════════════════\n');

    let createdId: string | null = null;
    const testName  = `Test_Term_${Date.now()}`;
    const startDate = '2025-09-01';
    const endDate   = '2025-12-15';

    // ── GET list ─────────────────────────────────────────────────────────────
    await run('GET /api/terms', async () => {
        const res  = await axios.get(BASE, { timeout: 30000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        if (!Array.isArray(body.data)) throw new Error('data is not an array');
        console.log(`\n     └─ ${body.data.length} term(s) in Dataverse`);
        if (body.data.length > 0) {
            const t = body.data[0];
            console.log(`     └─ Sample: "${t.name}" | AY: ${t.academicyearname || '—'} | ${t.startdate} → ${t.enddate}`);
        }
    });

    // ── GET with search ───────────────────────────────────────────────────────
    await run('GET ?search=Term', async () => {
        const res  = await axios.get(BASE, { params: { search: 'Term' }, timeout: 15000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        console.log(`\n     └─ ${body.data.length} match(es) for "Term"`);
    });

    // ── GET with academicyearid filter (uses a fake GUID — expects 0 results, not error) ───
    await run('GET ?academicyearid=<fake> (0 results)', async () => {
        const res  = await axios.get(BASE, {
            params: { academicyearid: '00000000-0000-0000-0000-000000000001' },
            timeout: 15000,
        });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        console.log(`\n     └─ ${body.data.length} term(s) for non-existent year`);
    });

    // ── POST create ───────────────────────────────────────────────────────────
    await run('POST create term', async () => {
        const res  = await axios.post(BASE, {
            name:      testName,
            startdate: startDate,
            enddate:   endDate,
        }, { timeout: 30000 });
        const body = res.data;
        if (!body.success) throw new Error(`success=false: ${body.error}`);
        const id = body.data?.sms_termid ?? body.data?.termid;
        if (!id) throw new Error('No ID in response');
        createdId = id;
        console.log(`\n     └─ Created ID: ${createdId}`);
    });

    // ── POST validation — missing required fields ─────────────────────────────
    await run('POST missing name → 400', async () => {
        try {
            await axios.post(BASE, { startdate: startDate, enddate: endDate }, { timeout: 30000 });
            throw new Error('Expected 400 but got 2xx');
        } catch (err: any) {
            if (err.response?.status === 400) return;
            throw err;
        }
    });

    await run('POST missing startdate → 400', async () => {
        try {
            await axios.post(BASE, { name: 'X', enddate: endDate }, { timeout: 30000 });
            throw new Error('Expected 400 but got 2xx');
        } catch (err: any) {
            if (err.response?.status === 400) return;
            throw err;
        }
    });

    await run('POST missing enddate → 400', async () => {
        try {
            await axios.post(BASE, { name: 'X', startdate: startDate }, { timeout: 30000 });
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
            const t = body.data;
            if (t.name !== testName) throw new Error(`Name mismatch: "${t.name}"`);
            console.log(`\n     └─ name="${t.name}" | ${t.startdate} → ${t.enddate}`);
        });

        // ── PUT update ────────────────────────────────────────────────────────
        await run(`PUT ${short}… update`, async () => {
            const res  = await axios.put(`${BASE}/${id}`, {
                name:    `${testName}_Updated`,
                enddate: '2026-01-15',
            }, { timeout: 60000 });
            const body = res.data;
            if (!body.success) throw new Error(`success=false: ${body.error}`);
            const t = body.data;
            console.log(`\n     └─ Updated name="${t.name}" enddate=${t.enddate}`);
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
