'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, CalendarRange, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { academicYearsAPI } from '@/lib/api-client';
import type { AcademicYear } from '@/lib/dataverse/academicyears';

const schema = z.object({
    name:      z.string().min(1, 'Required'),
    startdate: z.string().min(1, 'Required'),
    enddate:   z.string().min(1, 'Required'),
    iscurrent: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function AcademicYearForm({ defaultValues, onSubmit, onCancel }: {
    defaultValues?: Partial<FormData>;
    onSubmit: (d: FormData) => Promise<void>;
    onCancel: () => void;
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
        defaultValues: defaultValues ?? {},
    });
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <F id="name" label="Name *" error={errors.name?.message}>
                <Input id="name" {...register('name')} placeholder="e.g. 2024-2025" />
            </F>
            <div className="grid grid-cols-2 gap-3">
                <F id="startdate" label="Start Date *" error={errors.startdate?.message}>
                    <Input id="startdate" type="date" {...register('startdate')} />
                </F>
                <F id="enddate" label="End Date *" error={errors.enddate?.message}>
                    <Input id="enddate" type="date" {...register('enddate')} />
                </F>
            </div>
            <F id="iscurrent" label="Current Year">
                <div className="flex items-center gap-2 h-9">
                    <input id="iscurrent" type="checkbox" {...register('iscurrent')} className="h-4 w-4 rounded border-input" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Mark as current academic year</span>
                </div>
            </F>
            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
            </div>
        </form>
    );
}

export default function AcademicYearsPage() {
    const [rows, setRows]           = useState<AcademicYear[]>([]);
    const [filtered, setFiltered]   = useState<AcademicYear[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<AcademicYear | null>(null);
    const [toDelete, setToDelete]   = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await academicYearsAPI.getAll();
            setRows(res.data ?? []); setFiltered(res.data ?? []);
        } catch { toast.error('Failed to load academic years'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows);
    }, [search, rows]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (data: any) => {
        try {
            if (editing) {
                await academicYearsAPI.update(editing.academicyearid, data);
                toast.success('Academic year updated');
            } else {
                await academicYearsAPI.create(data);
                toast.success('Academic year created');
            }
            setModalOpen(false); setEditing(null); load();
        } catch { toast.error('Failed to save'); }
    };

    const handleDelete = async (id: string) => {
        try { await academicYearsAPI.delete(id); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Academic Years</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
                </div>
                <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1.5" /> Add Academic Year
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : !filtered.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <CalendarRange className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No academic years found</p>
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-left">
                                {['Name', 'Start Date', 'End Date', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filtered.map(r => {
                                return (
                                    <tr key={r.academicyearid} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                                            <div className="flex items-center gap-2">
                                                <CalendarRange className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                {r.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{formatDate(r.startdate)}</td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{formatDate(r.enddate)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {r.iscurrent
                                                    ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /><Badge variant="success">Current</Badge></>
                                                    : <><XCircle className="h-3.5 w-3.5 text-gray-400" /><Badge variant="default">Past</Badge></>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}>
                                                    <Pencil className="h-3.5 w-3.5 text-gray-400" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setToDelete(r.academicyearid)}>
                                                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
                title={editing ? 'Edit Academic Year' : 'Add Academic Year'}>
                <AcademicYearForm
                    defaultValues={editing ? {
                        name:      editing.name,
                        startdate: editing.startdate?.slice(0, 10),
                        enddate:   editing.enddate?.slice(0, 10),
                        iscurrent: editing.iscurrent,
                    } : undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => { setModalOpen(false); setEditing(null); }}
                />
            </Modal>

            <ConfirmDialog
                open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
                title="Delete academic year?" description="This will permanently remove the academic year."
                onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
            />
        </div>
    );
}
