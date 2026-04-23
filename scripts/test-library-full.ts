/**
 * test-library-full.ts — discover real fields for sms_libraries and sms_libraryloans,
 * validate SELECTs, run CRUD smoke tests.
 * Run: npx ts-node --skip-project scripts/test-library-full.ts
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

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

type Headers = Record<string, string>;

async function rawDiscover(h: Headers, table: string) {
    console.log(`\n── ${table} raw fields ──`);
    try {
        const res = await axios.get(`${API}/${table}?$top=1`, { headers: h, timeout: 20000 });
        const rows: any[] = res.data.value ?? [];
        if (!rows.length) {
            console.log('  (empty — fetching metadata)');
            try {
                const meta = await axios.get(
                    `${API}/EntityDefinitions(LogicalName='${table.replace(/s$/, '')}')/Attributes?$select=LogicalName,AttributeType&$filter=AttributeType ne 'Virtual'&$top=60`,
                    { headers: { ...h, Accept: 'application/json' }, timeout: 20000 }
                );
                const attrs: any[] = meta.data.value ?? [];
                attrs.filter(a => a.LogicalName.startsWith('sms_') || ['createdon','modifiedon','statecode','statuscode'].includes(a.LogicalName))
                     .sort((a, b) => a.LogicalName.localeCompare(b.LogicalName))
                     .forEach(a => console.log(`  ${a.LogicalName}  [${a.AttributeType}]`));
            } catch (me: any) {
                console.log('  metadata failed:', me.response?.data?.error?.message ?? me.message);
            }
        } else {
            Object.keys(rows[0]).filter(k => !k.startsWith('@')).sort().forEach(k => {
                const v = rows[0][k];
                const d = v === null ? 'null' : `"${String(v).slice(0, 80)}"`;
                console.log(`  ${k}: ${d}`);
            });
        }
    } catch (e: any) {
        console.error('  ✗ raw failed:', e.response?.data?.error?.message ?? e.message);
    }
}

async function validateSelect(h: Headers, table: string, sel: string, label: string) {
    console.log(`\n── ${label} SELECT validation ──`);
    try {
        const res = await axios.get(`${API}/${table}?$select=${sel}&$top=5`, { headers: h, timeout: 20000 });
        console.log(`  ✓ OK — ${res.data.value?.length ?? 0} record(s)`);
        (res.data.value ?? []).slice(0, 3).forEach((r: any, i: number) => {
            const name = r.sms_name ?? r.sms_title ?? r.sms_bookid ?? '?';
            console.log(`  [${i + 1}] ${name}`);
        });
        return res.data.value ?? [];
    } catch (e: any) {
        console.error('  ✗ SELECT failed:', e.response?.data?.error?.message ?? e.message);
        return [];
    }
}

async function testLibraryBookCRUD(h: Headers) {
    console.log('\n══════════════════════════════════════════');
    console.log('  sms_libraries — CRUD test');
    console.log('══════════════════════════════════════════');

    const BOOKS_SELECT = 'sms_libraryid,sms_name,sms_bookcode,sms_isbn,sms_author,sms_category,sms_quantity,sms_available,createdon,modifiedon';

    // CREATE
    let createdId: string | null = null;
    console.log('\n① CREATE book');
    try {
        const res = await axios.post(`${API}/sms_libraries`, {
            sms_name: '__TEST_BOOK__',
            sms_bookcode: 'TEST-001',
            sms_author: 'Test Author',
            sms_category: 1,
            sms_quantity: 10,
            sms_available: 8,
        }, {
            headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
            timeout: 20000,
        });
        createdId = res.data?.sms_libraryid ?? res.headers['odata-entityid']?.match(/\(([^)]+)\)/)?.[1];
        console.log(`  ✓ Created id=${createdId}`);
    } catch (e: any) {
        console.error('  ✗ CREATE failed:', e.response?.data?.error?.message ?? e.message);
    }

    if (!createdId) {
        // Try to find from GET
        try {
            const r = await axios.get(`${API}/sms_libraries?$filter=sms_name eq '__TEST_BOOK__'&$select=sms_libraryid&$top=1`, { headers: h, timeout: 15000 });
            createdId = r.data.value?.[0]?.sms_libraryid ?? null;
            if (createdId) console.log(`  found via GET: ${createdId}`);
        } catch {}
    }

    // READ
    if (createdId) {
        console.log('\n② READ by id');
        try {
            const r = await axios.get(`${API}/sms_libraries(${createdId})?$select=${BOOKS_SELECT}`, { headers: h, timeout: 15000 });
            console.log(`  ✓ name="${r.data.sms_name}" qty=${r.data.sms_quantity} avail=${r.data.sms_available}`);
        } catch (e: any) {
            console.error('  ✗ READ failed:', e.response?.data?.error?.message ?? e.message);
        }

        // UPDATE
        console.log('\n③ UPDATE (available→5)');
        try {
            await axios.patch(`${API}/sms_libraries(${createdId})`,
                { sms_available: 5, sms_name: '__TEST_BOOK__ (updated)' },
                { headers: { ...h, 'Content-Type': 'application/json', 'If-Match': '*' }, timeout: 15000 });
            console.log('  ✓ PATCH OK');
        } catch (e: any) {
            console.error('  ✗ UPDATE failed:', e.response?.data?.error?.message ?? e.message);
        }

        // DELETE
        console.log('\n④ DELETE');
        try {
            await axios.delete(`${API}/sms_libraries(${createdId})`, { headers: h, timeout: 15000 });
            console.log('  ✓ Deleted');
        } catch (e: any) {
            console.error('  ✗ DELETE failed:', e.response?.data?.error?.message ?? e.message);
        }
    }
}

async function testLoanTable(h: Headers) {
    console.log('\n══════════════════════════════════════════');
    console.log('  Probing loan table candidates');
    console.log('══════════════════════════════════════════');

    const candidates = ['sms_libraryloans', 'sms_loans', 'sms_bookloans', 'sms_bookloan', 'sms_libraryloan'];
    let loanTable: string | null = null;

    for (const t of candidates) {
        try {
            const res = await axios.get(`${API}/${t}?$top=1`, { headers: h, timeout: 15000 });
            console.log(`\n✓ Found: ${t} — ${res.data.value?.length ?? 0} record(s)`);
            loanTable = t;
            // Print raw fields
            const rows: any[] = res.data.value ?? [];
            if (rows.length) {
                Object.keys(rows[0]).filter(k => !k.startsWith('@')).sort().forEach(k => {
                    const v = rows[0][k];
                    console.log(`  ${k}: ${v === null ? 'null' : `"${String(v).slice(0, 80)}"`}`);
                });
            } else {
                console.log('  (empty — fetching metadata)');
                try {
                    // strip trailing 's' for entity name
                    const entityName = t.replace(/s$/, '');
                    const meta = await axios.get(
                        `${API}/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=LogicalName,AttributeType&$filter=AttributeType ne 'Virtual'&$top=80`,
                        { headers: { ...h, Accept: 'application/json' }, timeout: 20000 }
                    );
                    const attrs: any[] = meta.data.value ?? [];
                    attrs.filter(a => a.LogicalName.startsWith('sms_') || ['createdon','modifiedon','statecode','statuscode'].includes(a.LogicalName))
                         .sort((a, b) => a.LogicalName.localeCompare(b.LogicalName))
                         .forEach(a => console.log(`  ${a.LogicalName}  [${a.AttributeType}]`));
                } catch (me: any) {
                    // try alternate entity name (no strip)
                    try {
                        const meta = await axios.get(
                            `${API}/EntityDefinitions(LogicalName='${t}')/Attributes?$select=LogicalName,AttributeType&$filter=AttributeType ne 'Virtual'&$top=80`,
                            { headers: { ...h, Accept: 'application/json' }, timeout: 20000 }
                        );
                        const attrs: any[] = meta.data.value ?? [];
                        attrs.filter(a => a.LogicalName.startsWith('sms_') || ['createdon','modifiedon'].includes(a.LogicalName))
                             .sort((a, b) => a.LogicalName.localeCompare(b.LogicalName))
                             .forEach(a => console.log(`  ${a.LogicalName}  [${a.AttributeType}]`));
                    } catch {}
                }
            }
            break;
        } catch (e: any) {
            const msg = e.response?.data?.error?.message ?? e.message;
            if (msg.includes('Could not find') || msg.includes('does not exist') || e.response?.status === 404) {
                console.log(`  ✗ ${t}: not found`);
            } else {
                console.log(`  ✗ ${t}: ${msg}`);
            }
        }
    }

    if (loanTable) {
        // Validate a reasonable SELECT based on discovered fields
        console.log(`\n── ${loanTable} — testing CRUD ──`);
        await testLoanCRUD(h, loanTable);
    }

    return loanTable;
}

async function testLoanCRUD(h: Headers, table: string) {
    // First get a real book id to link
    let bookId: string | null = null;
    try {
        const r = await axios.get(`${API}/sms_libraries?$select=sms_libraryid,sms_name&$top=1`, { headers: h, timeout: 15000 });
        bookId = r.data.value?.[0]?.sms_libraryid ?? null;
        console.log(`  Using book: ${r.data.value?.[0]?.sms_name} (${bookId})`);
    } catch {}

    // CREATE loan
    let loanId: string | null = null;
    console.log('\n① CREATE loan');
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const payload: any = {
        sms_name: '__TEST_LOAN__',
        sms_issuedate: today,
        sms_duedate: due,
        sms_status: 1,
    };
    if (bookId) payload[`sms_book@odata.bind`] = `/sms_libraries(${bookId})`;

    try {
        const res = await axios.post(`${API}/${table}`, payload, {
            headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
            timeout: 20000,
        });
        loanId = res.data?.[`${table.replace(/s$/, '')}id`.replace('sms_libraryloan', 'sms_libraryloanid').replace('sms_loan', 'sms_loanid').replace('sms_bookloan', 'sms_bookloanid')]
                  ?? res.headers['odata-entityid']?.match(/\(([^)]+)\)/)?.[1];
        console.log(`  ✓ Created id=${loanId}`);
    } catch (e: any) {
        const msg = e.response?.data?.error?.message ?? e.message;
        console.error('  ✗ CREATE failed:', msg);
        // Maybe status field is wrong — retry without it
        if (msg.includes('sms_status')) {
            try {
                delete payload.sms_status;
                const res2 = await axios.post(`${API}/${table}`, payload, {
                    headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
                    timeout: 20000,
                });
                loanId = res2.headers['odata-entityid']?.match(/\(([^)]+)\)/)?.[1];
                console.log(`  ✓ Created (no status) id=${loanId}`);
            } catch (e2: any) {
                console.error('  ✗ retry also failed:', e2.response?.data?.error?.message ?? e2.message);
            }
        }
    }

    if (loanId) {
        console.log('\n② DELETE (cleanup)');
        try {
            await axios.delete(`${API}/${table}(${loanId})`, { headers: h, timeout: 15000 });
            console.log('  ✓ Deleted');
        } catch (e: any) {
            console.error('  ✗ DELETE failed:', e.response?.data?.error?.message ?? e.message);
        }
    }
}

async function main() {
    console.log('Acquiring token…');
    const token = await getToken();
    console.log('✓ Token acquired\n');

    const h: Headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
    };

    // 1. Discover & validate sms_libraries
    console.log('\n══════════════════════════════════════════');
    console.log('  sms_libraries — field discovery');
    console.log('══════════════════════════════════════════');
    await rawDiscover(h, 'sms_libraries');

    const BOOKS_SELECT = 'sms_libraryid,sms_name,sms_bookcode,sms_isbn,sms_author,sms_category,sms_quantity,sms_available,createdon,modifiedon';
    await validateSelect(h, 'sms_libraries', BOOKS_SELECT, 'sms_libraries current SELECT');

    // 2. CRUD test on books
    await testLibraryBookCRUD(h);

    // 3. Discover & test loan table
    await testLoanTable(h);

    console.log('\n✅ Done.\n');
}

main().catch((e: any) => {
    console.error('\n✗ Fatal:', e.response?.data?.error?.message ?? e.message);
    process.exit(1);
});
