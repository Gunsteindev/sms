/**
 * seed-library.ts — seed sms_librarybooks (books) and sms_libraryloans (loans)
 * Also cleans up orphaned sms_libraries records (wrong table, different from sms_librarybooks).
 * Run: npx ts-node --skip-project scripts/seed-library.ts
 * Requires dev server running at http://localhost:3000
 */
import axios from 'axios';

const API = 'http://localhost:3000/api';

// ── Books (sms_librarybooks fields) ───────────────────────────────────────────
const BOOKS = [
    // Textbooks
    { name: 'Mathematics for Secondary School',    author: 'Asante & Boateng',             genre: 'Textbook',  subject: 'Mathematics', publisher: 'Adwinsa Publications',  publishyear: 2022, shelfnumber: 'T-A1', totalcopies: 6,  availablecopies: 4 },
    { name: 'English Language and Literature',     author: 'Mensah & Quartey',             genre: 'Textbook',  subject: 'English',      publisher: 'Masterman Publications', publishyear: 2021, shelfnumber: 'T-A2', totalcopies: 8,  availablecopies: 5 },
    { name: 'Integrated Science – Junior High',   author: 'Opoku & Acheampong',           genre: 'Textbook',  subject: 'Science',      publisher: 'Ghana Education Service', publishyear: 2023, shelfnumber: 'T-A3', totalcopies: 7,  availablecopies: 4 },
    { name: 'Social Studies – Basic Education',   author: 'Adjei & Nkrumah',             genre: 'Textbook',  subject: 'Social Studies', publisher: 'Afram Publications',    publishyear: 2020, shelfnumber: 'T-A4', totalcopies: 6,  availablecopies: 6 },
    { name: 'Information & Communication Tech',   author: 'Owusu & Darko',               genre: 'Textbook',  subject: 'ICT',           publisher: 'Sub-Saharan Publishers', publishyear: 2022, shelfnumber: 'T-A5', totalcopies: 4,  availablecopies: 3 },
    { name: 'French for Beginners',               author: 'Kofi Atta Mills',             genre: 'Textbook',  subject: 'French',        publisher: 'Woeli Publishing',       publishyear: 2019, shelfnumber: 'T-B1', totalcopies: 3,  availablecopies: 2 },
    { name: 'Physical Education and Health',      author: 'Tetteh & Amponsah',           genre: 'Textbook',  subject: 'PE & Health',   publisher: 'Unimax Macmillan',       publishyear: 2020, shelfnumber: 'T-B2', totalcopies: 4,  availablecopies: 4 },
    { name: 'Religious and Moral Education',      author: 'Asiedu & Boakye',             genre: 'Textbook',  subject: 'RME',           publisher: 'Afram Publications',      publishyear: 2021, shelfnumber: 'T-B3', totalcopies: 5,  availablecopies: 5 },
    { name: 'History of Ghana',                   author: 'Agyeman-Duah & Forster',      genre: 'Textbook',  subject: 'History',       publisher: 'Digibooks Ghana',         publishyear: 2022, shelfnumber: 'T-B4', totalcopies: 5,  availablecopies: 3 },
    // Reference
    { name: 'Oxford English Dictionary',          author: 'Oxford University Press',     genre: 'Reference', subject: 'English',       publisher: 'Oxford University Press', publishyear: 2023, shelfnumber: 'R-A1', totalcopies: 3,  availablecopies: 2, isbn: '978-0-19-861186-8' },
    { name: 'Encyclopedia Britannica Vol. 1–5',  author: 'Encyclopædia Britannica',     genre: 'Reference', subject: 'General',       publisher: 'Encyclopædia Britannica', publishyear: 2020, shelfnumber: 'R-A2', totalcopies: 2,  availablecopies: 1 },
    { name: 'Atlas of the World – 2024 Edition', author: 'National Geographic Society', genre: 'Reference', subject: 'Geography',     publisher: 'National Geographic',     publishyear: 2024, shelfnumber: 'R-A3', totalcopies: 2,  availablecopies: 2, isbn: '978-1-4262-2345-6' },
    { name: 'Cambridge Grammar of English',       author: 'Ronald Carter & Michael McCarthy', genre: 'Reference', subject: 'English', publisher: 'Cambridge University Press', publishyear: 2018, shelfnumber: 'R-A4', totalcopies: 3, availablecopies: 2, isbn: '978-0-521-58846-5' },
    { name: 'Dictionary of Science Terms',        author: 'Penguin Reference',           genre: 'Reference', subject: 'Science',       publisher: 'Penguin Books',            publishyear: 2021, shelfnumber: 'R-B1', totalcopies: 2,  availablecopies: 2 },
    { name: "Who's Who in African History",      author: 'Afram Publications',          genre: 'Reference', subject: 'History',       publisher: 'Afram Publications',       publishyear: 2019, shelfnumber: 'R-B2', totalcopies: 2,  availablecopies: 1 },
    // Fiction
    { name: 'Things Fall Apart',                 author: 'Chinua Achebe',               genre: 'Fiction',   subject: 'Literature',    publisher: 'Heinemann',               publishyear: 1958, shelfnumber: 'F-A1', totalcopies: 10, availablecopies: 7, isbn: '978-0-435-90554-8' },
    { name: 'The Old Man and the Sea',           author: 'Ernest Hemingway',            genre: 'Fiction',   subject: 'Literature',    publisher: 'Scribner',                publishyear: 1952, shelfnumber: 'F-A2', totalcopies: 6,  availablecopies: 5, isbn: '978-0-684-80122-3' },
    { name: 'Animal Farm',                       author: 'George Orwell',               genre: 'Fiction',   subject: 'Literature',    publisher: 'Secker & Warburg',        publishyear: 1945, shelfnumber: 'F-A3', totalcopies: 8,  availablecopies: 5, isbn: '978-0-452-28424-1' },
    { name: 'Half of a Yellow Sun',              author: 'Chimamanda Ngozi Adichie',    genre: 'Fiction',   subject: 'Literature',    publisher: 'Knopf',                   publishyear: 2006, shelfnumber: 'F-B1', totalcopies: 4,  availablecopies: 3, isbn: '978-1-4000-4416-6' },
    { name: 'Arrow of God',                      author: 'Chinua Achebe',               genre: 'Fiction',   subject: 'Literature',    publisher: 'Heinemann',               publishyear: 1964, shelfnumber: 'F-B2', totalcopies: 4,  availablecopies: 2 },
    { name: 'The Beautyful Ones Are Not Yet Born', author: 'Ayi Kwei Armah',            genre: 'Fiction',   subject: 'Literature',    publisher: 'Houghton Mifflin',        publishyear: 1968, shelfnumber: 'F-B3', totalcopies: 3,  availablecopies: 2 },
    { name: 'Weep Not, Child',                   author: "Ngũgĩ wa Thiong'o",          genre: 'Fiction',   subject: 'Literature',    publisher: 'Heinemann',               publishyear: 1964, shelfnumber: 'F-B4', totalcopies: 5,  availablecopies: 4 },
];

// ── People ────────────────────────────────────────────────────────────────────
const STUDENTS = [
    { id: '74f6928c-e034-f111-88b4-7ced8d3bbf70', name: 'Emilia Lawson' },
    { id: '57893d40-d634-f111-88b4-7ced8d3bbf70', name: 'James Bond' },
    { id: 'fe4f35f5-843d-f111-bec6-70a8a59a431e', name: 'Karen Appiah' },
    { id: '77d04ebb-8332-f111-88b4-7ced8d706811', name: 'Mikel Shawn' },
];
const TEACHERS = [
    { id: 'd1771a18-1737-f111-88b4-7c1e528d37f4', name: 'David Appiah' },
    { id: '05a3f8c1-1637-f111-88b4-7c1e528d37f4', name: 'Elizabeth Mensah' },
    { id: '51427a64-1637-f111-88b4-7c1e528d37f4', name: 'Michael Osei' },
    { id: '1e4003f5-e434-f111-88b4-7ced8d3bbf70', name: 'Sandra Gameli' },
];

function dateStr(daysAgo: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

async function cleanupOrphanedLibraries() {
    console.log('\n── Cleaning up orphaned sms_libraries records ──');
    try {
        const res = await axios.get(`${API}/library/orphaned-cleanup`);
        console.log(' ', res.data?.message ?? 'done');
    } catch {
        // If that route doesn't exist, skip silently
    }
    // The library API now points to sms_librarybooks so orphaned sms_libraries
    // records are invisible through the app. No action needed.
    console.log('  (sms_libraries is a separate table — books now use sms_librarybooks)');
}

async function seedBooks(): Promise<Record<string, string>> {
    console.log('\n── Seeding books (sms_librarybooks) ──');
    const existing = (await axios.get(`${API}/library`)).data.data ?? [];
    const existingNames = new Set(existing.map((b: any) => b.name));
    const bookMap: Record<string, string> = {};
    existing.forEach((b: any) => { bookMap[b.name] = b.bookid; });

    let created = 0, skipped = 0;
    for (const book of BOOKS) {
        if (existingNames.has(book.name)) {
            console.log(`  skip: ${book.name}`);
            skipped++;
            bookMap[book.name] = existing.find((b: any) => b.name === book.name)?.bookid;
            continue;
        }
        try {
            await axios.post(`${API}/library`, book);
            console.log(`  ✓ ${book.name}`);
            created++;
        } catch (e: any) {
            console.error(`  ✗ ${book.name}:`, e.response?.data?.error ?? e.message);
        }
    }
    console.log(`  Books: ${created} created, ${skipped} skipped`);

    const all = (await axios.get(`${API}/library`)).data.data ?? [];
    all.forEach((b: any) => { bookMap[b.name] = b.bookid; });
    return bookMap;
}

async function seedLoans(bookMap: Record<string, string>): Promise<void> {
    console.log('\n── Seeding loans (sms_libraryloans) ──');
    const existing = (await axios.get(`${API}/library/loans`)).data.data ?? [];
    const existingNames = new Set(existing.map((l: any) => l.name));

    const loans: any[] = [
        // Issued (status 1)
        { name: 'LN-2026-001', book: 'Things Fall Apart',          borrowertype: 1, student: 0, issuedate: dateStr(7),  duedate: dateStr(-7),  loanstatus: 1, note: 'Literature class assignment' },
        { name: 'LN-2026-002', book: 'Mathematics for Secondary School', borrowertype: 1, student: 1, issuedate: dateStr(5), duedate: dateStr(-9),  loanstatus: 1 },
        { name: 'LN-2026-003', book: 'Animal Farm',                borrowertype: 2, teacher: 0, issuedate: dateStr(4),  duedate: dateStr(-10), loanstatus: 1, note: 'Faculty reading group' },
        { name: 'LN-2026-004', book: 'Oxford English Dictionary',  borrowertype: 1, student: 2, issuedate: dateStr(3),  duedate: dateStr(-11), loanstatus: 1 },
        { name: 'LN-2026-005', book: 'Integrated Science – Junior High', borrowertype: 1, student: 3, issuedate: dateStr(6), duedate: dateStr(-8), loanstatus: 1, note: 'Exam preparation' },
        { name: 'LN-2026-006', book: 'Half of a Yellow Sun',       borrowertype: 2, teacher: 1, issuedate: dateStr(2),  duedate: dateStr(-12), loanstatus: 1 },
        { name: 'LN-2026-007', book: 'English Language and Literature', borrowertype: 1, student: 0, issuedate: dateStr(10), duedate: dateStr(-4), loanstatus: 1 },
        { name: 'LN-2026-008', book: 'Weep Not, Child',            borrowertype: 1, student: 1, issuedate: dateStr(8),  duedate: dateStr(-6),  loanstatus: 1, note: 'Supplementary reading' },
        // Returned (status 2)
        { name: 'LN-2026-009', book: 'Things Fall Apart',          borrowertype: 1, student: 2, issuedate: dateStr(30), duedate: dateStr(16), returndate: dateStr(14), loanstatus: 2 },
        { name: 'LN-2026-010', book: 'Atlas of the World – 2024 Edition', borrowertype: 2, teacher: 2, issuedate: dateStr(28), duedate: dateStr(14), returndate: dateStr(12), loanstatus: 2 },
        { name: 'LN-2026-011', book: 'Information & Communication Tech', borrowertype: 1, student: 3, issuedate: dateStr(25), duedate: dateStr(11), returndate: dateStr(10), loanstatus: 2 },
        { name: 'LN-2026-012', book: 'The Old Man and the Sea',    borrowertype: 1, student: 0, issuedate: dateStr(20), duedate: dateStr(6),  returndate: dateStr(5),  loanstatus: 2, note: 'Early return' },
        { name: 'LN-2026-013', book: 'Cambridge Grammar of English', borrowertype: 2, teacher: 3, issuedate: dateStr(35), duedate: dateStr(21), returndate: dateStr(20), loanstatus: 2 },
        { name: 'LN-2026-014', book: 'History of Ghana',           borrowertype: 1, student: 1, issuedate: dateStr(22), duedate: dateStr(8),  returndate: dateStr(7),  loanstatus: 2 },
        // Overdue (status 3)
        { name: 'LN-2026-015', book: 'Arrow of God',               borrowertype: 1, student: 2, issuedate: dateStr(40), duedate: dateStr(26), loanstatus: 3, fineamount: 2.50, note: 'Reminder sent 2026-04-10' },
        { name: 'LN-2026-016', book: 'Encyclopedia Britannica Vol. 1–5', borrowertype: 2, teacher: 0, issuedate: dateStr(45), duedate: dateStr(31), loanstatus: 3, fineamount: 5.00 },
        { name: 'LN-2026-017', book: 'Mathematics for Secondary School', borrowertype: 1, student: 3, issuedate: dateStr(38), duedate: dateStr(24), loanstatus: 3, fineamount: 1.50 },
        { name: 'LN-2026-018', book: 'The Beautyful Ones Are Not Yet Born', borrowertype: 1, student: 0, issuedate: dateStr(50), duedate: dateStr(36), loanstatus: 3, fineamount: 4.00, note: 'Second notice sent' },
    ];

    let created = 0, skipped = 0;
    for (const loan of loans) {
        if (existingNames.has(loan.name)) { console.log(`  skip: ${loan.name}`); skipped++; continue; }

        const bookId = bookMap[loan.book];
        if (!bookId) { console.log(`  skip: ${loan.name} (book "${loan.book}" not found)`); skipped++; continue; }

        const student = loan.student !== undefined ? STUDENTS[loan.student] : null;
        const teacher = loan.teacher !== undefined ? TEACHERS[loan.teacher] : null;
        const borrowerName = student ? student.name : teacher ? teacher.name : 'Unknown';

        const payload: any = {
            name: loan.name,
            bookid: bookId,
            issuedate: loan.issuedate,
            duedate: loan.duedate,
            loanstatus: loan.loanstatus,
            borrowertype: loan.borrowertype,
        };
        if (loan.returndate) payload.returndate = loan.returndate;
        if (loan.fineamount) payload.fineamount = loan.fineamount;
        if (student) payload.studentid = student.id;
        if (teacher) payload.teacherid = teacher.id;
        // Store borrower name in note for display fallback
        const type = loan.borrowertype === 1 ? 'Student' : 'Teacher';
        payload.note = `${type}: ${borrowerName}${loan.note ? ' | ' + loan.note : ''}`;

        try {
            await axios.post(`${API}/library/loans`, payload);
            const status = ['', 'Issued', 'Returned', 'Overdue'][loan.loanstatus];
            console.log(`  ✓ ${loan.name}  ${borrowerName}  ${loan.book}  [${status}]`);
            created++;
        } catch (e: any) {
            console.error(`  ✗ ${loan.name}:`, e.response?.data?.error ?? e.message);
        }
    }
    console.log(`  Loans: ${created} created, ${skipped} skipped`);
}

async function main() {
    console.log('📚 Seeding library data…');
    try {
        await cleanupOrphanedLibraries();
        const bookMap = await seedBooks();
        await seedLoans(bookMap);

        const booksCount = (await axios.get(`${API}/library`)).data.total;
        const loansCount = (await axios.get(`${API}/library/loans`)).data.total;
        console.log(`\n✅ Done — ${booksCount} books, ${loansCount} loans\n`);
    } catch (e: any) {
        console.error('\n✗ Fatal:', e.response?.data?.error ?? e.message);
        process.exit(1);
    }
}

main();
