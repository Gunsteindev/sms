'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Library, BookOpen, User, BookMarked, Clock, CheckCircle2, AlertCircle, CalendarDays, Hash, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/date-picker';
import { AISummary } from '@/components/ui/AISummary';
import { Pagination } from '@/components/ui/Pagination';
import { libraryAPI, libraryLoansAPI, studentsAPI, teachersAPI } from '@/lib/api-client';
import type { LibraryBook } from '@/lib/dataverse/library';
import type { LibraryLoan } from '@/lib/dataverse/libraryloans';
import { LOAN_STATUS, BORROWER_TYPE } from '@/lib/dataverse/libraryloans';

const PAGE_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarColor(name: string) {
    const colors = ['bg-violet-500','bg-sky-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-indigo-500','bg-teal-500','bg-orange-500'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
}

function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(d: string) {
    if (!d) return '—';
    const [y, m, day] = d.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isOverdue(duedate: string, returndate: string, status: number) {
    if (status === 2) return false; // returned
    if (!duedate) return false;
    const [y, m, d] = duedate.split('-').map(Number);
    return new Date(y, m - 1, d) < new Date();
}

const LOAN_STATUS_CONFIG: Record<number, { label: string; variant: 'success' | 'warning' | 'default'; icon: typeof CheckCircle2 }> = {
    1: { label: 'Issued',   variant: 'default',  icon: Clock },
    2: { label: 'Returned', variant: 'success',  icon: CheckCircle2 },
    3: { label: 'Overdue',  variant: 'warning',  icon: AlertCircle },
};

// ─── Form helpers ─────────────────────────────────────────────────────────────

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-slate-700 dark:text-slate-300 text-sm font-medium">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ─── Book Form ────────────────────────────────────────────────────────────────

const bookSchema = z.object({
    name:            z.string().min(1, 'Required'),
    author:          z.string().optional(),
    isbn:            z.string().optional(),
    genre:           z.string().optional(),
    publisher:       z.string().optional(),
    publishyear:     z.coerce.number().int().min(1000).max(2100).optional().or(z.literal('')),
    shelfnumber:     z.string().optional(),
    subject:         z.string().optional(),
    totalcopies:     z.coerce.number().int().min(0).optional().or(z.literal('')),
    availablecopies: z.coerce.number().int().min(0).optional().or(z.literal('')),
});
type BookFormData = z.infer<typeof bookSchema>;

const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

function BookForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<BookFormData>;
    onSubmit: (d: BookFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BookFormData>({
        resolver: zodResolver(bookSchema) as never,
        defaultValues: defaultValues ?? {},
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

            {/* ── Book Details ── */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Book Details</p>
                <div className="space-y-4">
                    <F id="name" label="Title *" error={errors.name?.message}>
                        <Input id="name" {...register('name')} placeholder="Book title" />
                    </F>
                    <div className="grid grid-cols-2 gap-4">
                        <F id="author" label="Author" error={errors.author?.message}>
                            <Input id="author" {...register('author')} placeholder="Author name" />
                        </F>
                        <F id="isbn" label="ISBN" error={errors.isbn?.message}>
                            <Input id="isbn" {...register('isbn')} placeholder="e.g. 978-3-16-148410-0" />
                        </F>
                        <F id="genre" label="Genre / Type" error={errors.genre?.message}>
                            <Input id="genre" {...register('genre')} placeholder="e.g. Textbook, Fiction" />
                        </F>
                        <F id="subject" label="Subject" error={errors.subject?.message}>
                            <Input id="subject" {...register('subject')} placeholder="e.g. Mathematics" />
                        </F>
                        <F id="publisher" label="Publisher" error={errors.publisher?.message}>
                            <Input id="publisher" {...register('publisher')} placeholder="Publisher name" />
                        </F>
                        <F id="publishyear" label="Publish Year" error={errors.publishyear?.message}>
                            <Input id="publishyear" {...register('publishyear')} type="number" placeholder="e.g. 2023" />
                        </F>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* ── Library Info ── */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Library Info</p>
                <F id="shelfnumber" label="Shelf No." error={errors.shelfnumber?.message}>
                    <Input id="shelfnumber" {...register('shelfnumber')} placeholder="e.g. A-12" />
                </F>
                <div className="grid grid-cols-2 gap-4">
                    <F id="totalcopies" label="Total Copies" error={errors.totalcopies?.message}>
                        <Input id="totalcopies" {...register('totalcopies')} type="number" min={0} />
                    </F>
                    <F id="availablecopies" label="Available Copies" error={errors.availablecopies?.message}>
                        <Input id="availablecopies" {...register('availablecopies')} type="number" min={0} />
                    </F>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Book'}</Button>
            </div>
        </form>
    );
}

// ─── Loan Form ────────────────────────────────────────────────────────────────

const loanSchema = z.object({
    bookid:       z.string().min(1, 'Select a book'),
    borrowertype: z.coerce.number().default(1),
    studentid:    z.string().optional(),
    teacherid:    z.string().optional(),
    issuedate:    z.string().min(1, 'Required'),
    duedate:      z.string().min(1, 'Required'),
    returndate:   z.string().optional(),
    loanstatus:   z.coerce.number().default(1),
    fineamount:   z.coerce.number().min(0).optional().or(z.literal('')),
    note:         z.string().optional(),
});
type LoanFormData = z.infer<typeof loanSchema>;

function LoanForm({ defaultValues, books, students, teachers, onSubmit, onCancel }: {
    defaultValues?: Partial<LoanFormData>;
    books: LibraryBook[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    students: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teachers: any[];
    onSubmit: (d: LoanFormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<LoanFormData>({
        resolver: zodResolver(loanSchema) as never,
        defaultValues: { borrowertype: 1, loanstatus: 1, ...defaultValues },
    });
    const borrowerType = watch('borrowertype');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

            {/* ── Book ── */}
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Book</p>
                <F id="bookid" label="Book *" error={errors.bookid?.message}>
                    <Controller name="bookid" control={control} render={({ field }) => (
                        <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                            <SelectTrigger id="bookid" className={ST}>
                                <SelectValue>
                                    {field.value
                                        ? (() => { const b = books.find(b => b.bookid === field.value); return b ? `${b.name}${b.author ? ` — ${b.author}` : ''}` : '— Select Book —'; })()
                                        : '— Select Book —'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {books.map(b => (
                                    <SelectItem key={b.bookid} value={b.bookid}>
                                        {b.name}{b.author ? ` — ${b.author}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    )} />
                </F>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* ── Borrower ── */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Borrower</p>
                <div className="grid grid-cols-2 gap-4">
                    <F id="borrowertype" label="Borrower Type" error={errors.borrowertype?.message}>
                        <Controller name="borrowertype" control={control} render={({ field }) => (
                            <SelectRoot value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                                <SelectTrigger id="borrowertype" className={ST}>
                                    <SelectValue>{Number(field.value) === 1 ? 'Student' : 'Teacher'}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Student</SelectItem>
                                    <SelectItem value="2">Teacher</SelectItem>
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>

                    {Number(borrowerType) === 1 ? (
                        <F id="studentid" label="Student" error={errors.studentid?.message}>
                            <Controller name="studentid" control={control} render={({ field }) => (
                                <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                                    <SelectTrigger id="studentid" className={ST}>
                                        <SelectValue>
                                            {field.value
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                ? (() => { const s = students.find((s: any) => s.studentid === field.value); return s ? `${s.firstname} ${s.lastname}` : '— Select Student —'; })()
                                                : '— Select Student —'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {students.map((s: any) => (
                                            <SelectItem key={s.studentid} value={s.studentid}>{s.firstname} {s.lastname}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectRoot>
                            )} />
                        </F>
                    ) : (
                        <F id="teacherid" label="Teacher" error={errors.teacherid?.message}>
                            <Controller name="teacherid" control={control} render={({ field }) => (
                                <SelectRoot value={field.value ?? ''} onValueChange={field.onChange}>
                                    <SelectTrigger id="teacherid" className={ST}>
                                        <SelectValue>
                                            {field.value
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                ? (() => { const t = teachers.find((t: any) => t.teacherid === field.value); return t ? `${t.firstname} ${t.lastname}` : '— Select Teacher —'; })()
                                                : '— Select Teacher —'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {teachers.map((t: any) => (
                                            <SelectItem key={t.teacherid} value={t.teacherid}>{t.firstname} {t.lastname}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectRoot>
                            )} />
                        </F>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* ── Loan Details ── */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Loan Details</p>
                <div className="grid grid-cols-2 gap-4">
                    <F id="issuedate" label="Issue Date *" error={errors.issuedate?.message}>
                        <Controller control={control} name="issuedate" render={({ field }) => (
                            <DatePicker id="issuedate" value={field.value} onChange={field.onChange} placeholder="Select date" />
                        )} />
                    </F>
                    <F id="duedate" label="Due Date *" error={errors.duedate?.message}>
                        <Controller control={control} name="duedate" render={({ field }) => (
                            <DatePicker id="duedate" value={field.value} onChange={field.onChange} placeholder="Select date" />
                        )} />
                    </F>
                    <F id="loanstatus" label="Status" error={errors.loanstatus?.message}>
                        <Controller name="loanstatus" control={control} render={({ field }) => (
                            <SelectRoot value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                                <SelectTrigger id="loanstatus" className={ST}>
                                    <SelectValue>{LOAN_STATUS[Number(field.value)] ?? '— Select —'}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(LOAN_STATUS).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        )} />
                    </F>
                    <F id="returndate" label="Return Date" error={errors.returndate?.message}>
                        <Controller control={control} name="returndate" render={({ field }) => (
                            <DatePicker id="returndate" value={field.value} onChange={field.onChange} placeholder="Select date" />
                        )} />
                    </F>
                    <F id="fineamount" label="Fine Amount" error={errors.fineamount?.message}>
                        <Input id="fineamount" type="number" step="0.01" min={0} {...register('fineamount')} placeholder="0.00" />
                    </F>
                </div>
                <F id="note" label="Notes" error={errors.note?.message}>
                    <Input id="note" {...register('note')} placeholder="Any notes about this loan…" />
                </F>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Loan'}</Button>
            </div>
        </form>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
    const [tab, setTab] = useState<'books' | 'loans'>('books');

    // ── Books state ───────────────────────────────────────────────────────────
    const [books, setBooks]           = useState<LibraryBook[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<LibraryBook[]>([]);
    const [booksLoading, setBooksLoading]   = useState(true);
    const [bookSearch, setBookSearch]       = useState('');
    const [genreFilter, setGenreFilter]     = useState('');
    const [pageBooks, setPageBooks]         = useState(1);
    const [bookModal, setBookModal]         = useState(false);
    const [editingBook, setEditingBook]     = useState<LibraryBook | null>(null);
    const [toDeleteBook, setToDeleteBook]   = useState<string | null>(null);

    // ── Loans state ───────────────────────────────────────────────────────────
    const [loans, setLoans]                 = useState<LibraryLoan[]>([]);
    const [filteredLoans, setFilteredLoans] = useState<LibraryLoan[]>([]);
    const [loansLoading, setLoansLoading]   = useState(true);
    const [loanSearch, setLoanSearch]       = useState('');
    const [statusFilter, setStatusFilter]   = useState<number | 'all'>('all');
    const [pageLoans, setPageLoans]         = useState(1);
    const [loanModal, setLoanModal]         = useState(false);
    const [editingLoan, setEditingLoan]     = useState<LibraryLoan | null>(null);
    const [toDeleteLoan, setToDeleteLoan]   = useState<string | null>(null);

    // ── Dropdowns ─────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [students, setStudents] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [teachers, setTeachers] = useState<any[]>([]);

    // ── Load ──────────────────────────────────────────────────────────────────
    const loadBooks = async () => {
        setBooksLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await libraryAPI.getAll();
            setBooks(res.data ?? []);
        } catch { toast.error('Failed to load books'); }
        finally { setBooksLoading(false); }
    };

    const loadLoans = async () => {
        setLoansLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await libraryLoansAPI.getAll();
            setLoans(res.data ?? []);
        } catch { toast.error('Failed to load loans'); }
        finally { setLoansLoading(false); }
    };

    const loadDropdowns = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [sRes, tRes]: [any, any] = await Promise.all([studentsAPI.getAll(), teachersAPI.getAll()]);
            setStudents(sRes.data ?? []);
            setTeachers(tRes.data ?? []);
        } catch {}
    };

    useEffect(() => { loadBooks(); loadLoans(); loadDropdowns(); }, []);

    // ── Filter books ──────────────────────────────────────────────────────────
    useEffect(() => {
        let list = books;
        if (bookSearch) list = list.filter(b => `${b.name} ${b.author} ${b.isbn}`.toLowerCase().includes(bookSearch.toLowerCase()));
        if (genreFilter) list = list.filter(b => b.genre === genreFilter);
        setFilteredBooks(list);
        setPageBooks(1);
    }, [bookSearch, genreFilter, books]);

    // ── Filter loans ──────────────────────────────────────────────────────────
    useEffect(() => {
        let list = loans;
        if (loanSearch) list = list.filter(l =>
            `${l.name} ${l.bookname} ${l.studentname} ${l.teachername} ${l.note}`.toLowerCase().includes(loanSearch.toLowerCase())
        );
        if (statusFilter !== 'all') list = list.filter(l => l.loanstatus === statusFilter);
        setFilteredLoans(list);
        setPageLoans(1);
    }, [loanSearch, statusFilter, loans]);

    const totalPagesBooks = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
    const paginatedBooks  = filteredBooks.slice((pageBooks - 1) * PAGE_SIZE, pageBooks * PAGE_SIZE);
    const totalPagesLoans = Math.max(1, Math.ceil(filteredLoans.length / PAGE_SIZE));
    const paginatedLoans  = filteredLoans.slice((pageLoans - 1) * PAGE_SIZE, pageLoans * PAGE_SIZE);

    // ── Book handlers ─────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBookSubmit = async (data: any) => {
        try {
            const payload: any = { ...data };
            if (payload.publishyear === '' || payload.publishyear === null) delete payload.publishyear;
            if (payload.totalcopies === '' || payload.totalcopies === null) delete payload.totalcopies;
            if (payload.availablecopies === '' || payload.availablecopies === null) delete payload.availablecopies;
            if (editingBook) {
                await libraryAPI.update(editingBook.bookid, payload);
                toast.success('Book updated');
            } else {
                await libraryAPI.create(payload);
                toast.success('Book added');
            }
            setBookModal(false); setEditingBook(null); loadBooks();
        } catch { toast.error('Failed to save book'); }
    };

    const handleBookDelete = async (id: string) => {
        try { await libraryAPI.delete(id); toast.success('Book removed'); loadBooks(); }
        catch { toast.error('Failed to delete'); }
    };

    // ── Loan handlers ─────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleLoanSubmit = async (data: any) => {
        try {
            const payload: any = { ...data };
            if (!payload.returndate) delete payload.returndate;
            if (payload.fineamount === '' || payload.fineamount === null) delete payload.fineamount;
            if (Number(data.borrowertype) === 1) delete payload.teacherid;
            else delete payload.studentid;
            if (editingLoan) {
                await libraryLoansAPI.update(editingLoan.loanid, payload);
                toast.success('Loan updated');
            } else {
                await libraryLoansAPI.create(payload);
                toast.success('Loan created');
            }
            setLoanModal(false); setEditingLoan(null); loadLoans();
        } catch { toast.error('Failed to save loan'); }
    };

    const handleLoanDelete = async (id: string) => {
        try { await libraryLoansAPI.delete(id); toast.success('Loan deleted'); loadLoans(); }
        catch { toast.error('Failed to delete'); }
    };

    const markReturned = async (loan: LibraryLoan) => {
        try {
            await libraryLoansAPI.update(loan.loanid, { loanstatus: 2, returndate: new Date().toISOString().slice(0, 10) });
            toast.success('Marked as returned');
            loadLoans();
        } catch { toast.error('Failed to update'); }
    };

    // ── Computed stats ────────────────────────────────────────────────────────
    const totalCopies    = books.reduce((s, b) => s + (b.totalcopies ?? 0), 0);
    const availableCopies = books.reduce((s, b) => s + (b.availablecopies ?? 0), 0);
    const issuedLoans    = loans.filter(l => l.loanstatus === 1).length;
    const overdueLoans   = loans.filter(l => l.loanstatus === 3).length;
    const returnedLoans  = loans.filter(l => l.loanstatus === 2).length;

    const genres = Array.from(new Set(books.map(b => b.genre).filter(Boolean)));

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Library</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {books.length} title{books.length !== 1 ? 's' : ''} · {totalCopies} copies · {availableCopies} available
                        {' · '}{issuedLoans} issued · {overdueLoans} overdue
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { loadBooks(); loadLoans(); loadDropdowns(); }} disabled={booksLoading || loansLoading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5${(booksLoading || loansLoading) ? ' animate-spin' : ''}`} /> Refresh
                    </Button>
                    <Button onClick={() => {
                        if (tab === 'books') { setEditingBook(null); setBookModal(true); }
                        else { setEditingLoan(null); setLoanModal(true); }
                    }}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        {tab === 'books' ? 'Add Book' : 'Issue Loan'}
                    </Button>
                </div>
            </div>

            {/* AI Summary */}
            <AISummary
                type="library"
                getData={() => ({
                    totalTitles: books.length, totalCopies, availableCopies,
                    issuedLoans, overdueLoans, returnedLoans,
                    books: books.slice(0, 20),
                })}
            />

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                {(['books', 'loans'] as const).map(t => (
                    <button key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 capitalize ${
                            tab === t
                                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}>
                        {t === 'books' ? <><BookOpen className="inline h-4 w-4 mr-1.5 -mt-0.5" />Books ({books.length})</> : <><BookMarked className="inline h-4 w-4 mr-1.5 -mt-0.5" />Loans ({loans.length})</>}
                    </button>
                ))}
            </div>

            {/* ── BOOKS TAB ── */}
            {tab === 'books' && (
                <div className="space-y-4">
                    {/* Search + genre filter */}
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-48 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input placeholder="Search by title, author, ISBN…" className="pl-9"
                                value={bookSearch} onChange={e => setBookSearch(e.target.value)} />
                        </div>
                        {genres.length > 0 && (
                            <SelectRoot value={genreFilter} onValueChange={v => setGenreFilter(v ?? '')}>
                                <SelectTrigger className="w-44 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                                    <SelectValue>
                                        {genreFilter ? (genres.find(g => g === genreFilter) ?? 'All genres') : 'All genres'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All genres</SelectItem>
                                    {genres.map(g => <SelectItem key={g} value={g!}>{g}</SelectItem>)}
                                </SelectContent>
                            </SelectRoot>
                        )}
                    </div>

                    {booksLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-600" />
                        </div>
                    ) : !filteredBooks.length ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <Library className="h-10 w-10 mb-3 opacity-40" />
                            <p className="text-sm">{bookSearch || genreFilter ? 'No books match your filter' : 'No books yet'}</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {['Title', 'Author', 'Genre', 'Subject', 'ISBN', 'Shelf', 'Copies', 'Available', 'Actions'].map(h => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedBooks.map(b => (
                                        <TableRow key={b.bookid}>
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`${avatarColor(b.name)} h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                        {initials(b.name)}
                                                    </div>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{b.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {b.author ? (
                                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                        <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                        <span className="truncate max-w-[160px]">{b.author}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-600">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {b.genre ? <Badge variant="default">{b.genre}</Badge> : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                {b.subject
                                                    ? <span className="text-slate-600 dark:text-slate-300">{b.subject}</span>
                                                    : <span className="text-slate-400 dark:text-slate-600">—</span>}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">{b.isbn || '—'}</TableCell>
                                            <TableCell>
                                                {b.shelfnumber ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                        <Hash className="h-3 w-3" />{b.shelfnumber}
                                                    </span>
                                                ) : <span className="text-slate-400">—</span>}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-700 dark:text-slate-300 font-medium">
                                                {b.totalcopies ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={(b.availablecopies ?? 0) > 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                                                    {b.availablecopies ?? '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingBook(b); setBookModal(true); }}>
                                                        <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setToDeleteBook(b.bookid)}>
                                                        <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination page={pageBooks} totalPages={totalPagesBooks} total={filteredBooks.length} pageSize={PAGE_SIZE} label="book" onChange={setPageBooks} />
                        </div>
                    )}
                </div>
            )}

            {/* ── LOANS TAB ── */}
            {tab === 'loans' && (
                <div className="space-y-4">
                    {/* Status pills */}
                    <div className="flex gap-2 flex-wrap">
                        {([['all', 'All', loans.length], [1, 'Issued', issuedLoans], [2, 'Returned', returnedLoans], [3, 'Overdue', overdueLoans]] as const).map(([val, label, count]) => (
                            <button key={String(val)}
                                onClick={() => setStatusFilter(val as number | 'all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    statusFilter === val
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}>
                                {label} <span className="ml-1 opacity-70">{count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input placeholder="Search by name, book, borrower…" className="pl-9"
                            value={loanSearch} onChange={e => setLoanSearch(e.target.value)} />
                    </div>

                    {loansLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-600" />
                        </div>
                    ) : !filteredLoans.length ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <BookMarked className="h-10 w-10 mb-3 opacity-40" />
                            <p className="text-sm">{loanSearch || statusFilter !== 'all' ? 'No loans match your filter' : 'No loans yet'}</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {['Loan Ref', 'Book', 'Borrower', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Fine', 'Actions'].map(h => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedLoans.map(l => {
                                        const cfg = LOAN_STATUS_CONFIG[l.loanstatus] ?? LOAN_STATUS_CONFIG[1];
                                        const StatusIcon = cfg.icon;
                                        const overdue = isOverdue(l.duedate, l.returndate, l.loanstatus);
                                        const borrowerName = l.studentname || l.teachername || (l.note?.match(/^(?:Student|Teacher): ([^|]+)/)?.[1]?.trim()) || l.name;
                                        return (
                                            <TableRow key={l.loanid}>
                                                <TableCell className="font-mono text-xs text-slate-500">{l.name}</TableCell>
                                                <TableCell>
                                                    {l.bookname ? (
                                                        <span className="font-medium text-slate-800 dark:text-slate-200">{l.bookname}</span>
                                                    ) : <span className="text-slate-400">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        <div>
                                                            <div className="text-slate-800 dark:text-slate-200">{borrowerName || '—'}</div>
                                                            <div className="text-xs text-slate-400">{BORROWER_TYPE[l.borrowertype] ?? ''}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500">
                                                    <div className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-slate-400" />{formatDate(l.issuedate)}</div>
                                                </TableCell>
                                                <TableCell className={`font-medium ${overdue ? 'text-red-500' : 'text-slate-500'}`}>
                                                    {formatDate(l.duedate)}
                                                </TableCell>
                                                <TableCell className="text-slate-500">
                                                    {l.returndate ? formatDate(l.returndate) : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${
                                                            l.loanstatus === 2 ? 'text-emerald-500' :
                                                            l.loanstatus === 3 ? 'text-amber-500' : 'text-blue-500'
                                                        }`} />
                                                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600 dark:text-slate-400">
                                                    {l.fineamount != null ? `$${Number(l.fineamount).toFixed(2)}` : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {l.loanstatus === 1 && (
                                                            <Button variant="ghost" size="icon" title="Mark returned"
                                                                onClick={() => markReturned(l)}>
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingLoan(l); setLoanModal(true); }}>
                                                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => setToDeleteLoan(l.loanid)}>
                                                            <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <Pagination page={pageLoans} totalPages={totalPagesLoans} total={filteredLoans.length} pageSize={PAGE_SIZE} label="loan" onChange={setPageLoans} />
                        </div>
                    )}
                </div>
            )}

            {/* Book Modal */}
            <Dialog open={bookModal} onOpenChange={(o) => { if (!o) { setBookModal(false); setEditingBook(null); } }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingBook ? 'Edit Book' : 'Add Book'}</DialogTitle>
                </DialogHeader>
                <BookForm
                    defaultValues={editingBook ? {
                        name: editingBook.name, author: editingBook.author || undefined,
                        isbn: editingBook.isbn || undefined, genre: editingBook.genre || undefined,
                        publisher: editingBook.publisher || undefined,
                        publishyear: editingBook.publishyear ?? undefined,
                        shelfnumber: editingBook.shelfnumber || undefined,
                        subject: editingBook.subject || undefined,
                        totalcopies: editingBook.totalcopies ?? undefined,
                        availablecopies: editingBook.availablecopies ?? undefined,
                    } : undefined}
                    onSubmit={handleBookSubmit}
                    onCancel={() => { setBookModal(false); setEditingBook(null); }}
                />
                          </DialogContent>
            </Dialog>

            {/* Loan Modal */}
            <Dialog open={loanModal} onOpenChange={(o) => { if (!o) { setLoanModal(false); setEditingLoan(null); } }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingLoan ? 'Edit Loan' : 'Issue Loan'}</DialogTitle>
                </DialogHeader>
                <LoanForm
                    books={books}
                    students={students}
                    teachers={teachers}
                    defaultValues={editingLoan ? {
                        bookid: editingLoan.bookid || undefined,
                        borrowertype: editingLoan.borrowertype,
                        studentid: editingLoan.studentid || undefined,
                        teacherid: editingLoan.teacherid || undefined,
                        issuedate: editingLoan.issuedate || undefined,
                        duedate: editingLoan.duedate || undefined,
                        returndate: editingLoan.returndate || undefined,
                        loanstatus: editingLoan.loanstatus,
                        fineamount: editingLoan.fineamount ?? undefined,
                        note: editingLoan.note || undefined,
                    } : undefined}
                    onSubmit={handleLoanSubmit}
                    onCancel={() => { setLoanModal(false); setEditingLoan(null); }}
                />
                          </DialogContent>
            </Dialog>

            {/* Confirm Dialogs */}
            <ConfirmDialog open={!!toDeleteBook} onOpenChange={o => !o && setToDeleteBook(null)}
                title="Remove book?" description="This permanently deletes the book record."
                onConfirm={() => { if (toDeleteBook) { handleBookDelete(toDeleteBook); setToDeleteBook(null); } }} />
            <ConfirmDialog open={!!toDeleteLoan} onOpenChange={o => !o && setToDeleteLoan(null)}
                title="Delete loan?" description="This permanently deletes the loan record."
                onConfirm={() => { if (toDeleteLoan) { handleLoanDelete(toDeleteLoan); setToDeleteLoan(null); } }} />
        </div>
    );
}
