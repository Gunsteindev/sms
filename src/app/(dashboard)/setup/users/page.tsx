'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck, Search, Eye, EyeOff, UserCog, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/Pagination';
import { usersAPI } from '@/lib/api-client';
import { USER_ROLES } from '@/lib/dataverse/users';
import type { SmsUser } from '@/lib/dataverse/users';

const PAGE_SIZE = 10;
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const createSchema = z.object({
    name:     z.string().min(1, 'Required'),
    email:    z.string().email('Invalid email'),
    password: z.string().min(8, 'Minimum 8 characters'),
    userrole: z.number().int().min(1).max(7),
});

const editSchema = z.object({
    name:     z.string().min(1, 'Required'),
    email:    z.string().email('Invalid email'),
    password: z.string().min(8, 'Minimum 8 characters').optional().or(z.literal('')),
    userrole: z.number().int().min(1).max(7),
    isactive: z.boolean(),
});

type CreateData = z.infer<typeof createSchema>;
type EditData   = z.infer<typeof editSchema>;

const ROLE_COLORS: Record<number, string> = {
    1: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    3: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    4: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    5: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    6: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    7: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function F({ id, label, error, children }: { id?: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            {id ? <Label htmlFor={id}>{label}</Label> : <Label>{label}</Label>}
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function PasswordInput({ id, placeholder, ...props }: React.ComponentProps<'input'>) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Input id={id} type={show ? 'text' : 'password'} placeholder={placeholder} className="pr-10" {...props} />
            <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

export default function UsersPage() {
    const [users,        setUsers]        = useState<SmsUser[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [search,       setSearch]       = useState('');
    const [roleFilter,   setRoleFilter]   = useState('');
    const [page,         setPage]         = useState(1);
    const [createOpen,   setCreateOpen]   = useState(false);
    const [editingUser,  setEditingUser]  = useState<SmsUser | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SmsUser | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await usersAPI.getAll();
            setUsers(res.data ?? []);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { setPage(1); }, [search, roleFilter]);

    const filtered = useMemo(() => users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchRole   = !roleFilter || u.userrole === Number(roleFilter);
        return matchSearch && matchRole;
    }), [users, search, roleFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    /* ── Create form ── */
    const { register: regC, handleSubmit: hsC, control: ctrlC, setValue: setVC, watch: watchC,
        formState: { errors: errC, isSubmitting: submC }, reset: resetC,
    } = useForm<CreateData>({ resolver: zodResolver(createSchema) as never, defaultValues: { userrole: 2 } });

    const handleCreate = async (data: CreateData) => {
        try {
            await usersAPI.create(data);
            toast.success('User created');
            setCreateOpen(false); resetC(); load();
        } catch { toast.error('Failed to create user'); }
    };

    /* ── Edit form ── */
    const { register: regE, handleSubmit: hsE, setValue: setVE, watch: watchE,
        formState: { errors: errE, isSubmitting: submE }, reset: resetE,
    } = useForm<EditData>({ resolver: zodResolver(editSchema) as never });

    const openEdit = (u: SmsUser) => {
        setEditingUser(u);
        resetE({ name: u.name, email: u.email, password: '', userrole: u.userrole, isactive: u.isactive });
    };

    const handleEdit = async (data: EditData) => {
        if (!editingUser) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = { name: data.name, email: data.email, userrole: data.userrole, isactive: data.isactive };
            if (data.password) payload.password = data.password;
            await usersAPI.update(editingUser.userid, payload);
            toast.success('User updated');
            setEditingUser(null); load();
        } catch { toast.error('Failed to update user'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await usersAPI.delete(deleteTarget.userid);
            toast.success('User deleted');
            setDeleteTarget(null); load();
        } catch { toast.error('Failed to delete user'); }
    };

    const handleToggleActive = async (u: SmsUser) => {
        try {
            await usersAPI.update(u.userid, { isactive: !u.isactive });
            toast.success(u.isactive ? 'User deactivated' : 'User activated');
            load();
        } catch { toast.error('Failed to update user'); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage staff accounts and role-based access</p>
                </div>
                <Button onClick={() => { resetC({ userrole: 2 }); setCreateOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1.5" /> Add User
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input className="pl-9" placeholder="Search by name or email…" value={search}
                        onChange={e => setSearch(e.target.value)} />
                </div>
                <SelectRoot value={roleFilter} onValueChange={v => setRoleFilter(v ?? '')}>
                    <SelectTrigger className="w-48 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                        <SelectValue>{roleFilter ? USER_ROLES[Number(roleFilter)] : 'All Roles'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Roles</SelectItem>
                        {Object.entries(USER_ROLES).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </SelectRoot>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: 'Total Users',  value: users.length,                      color: 'text-slate-700 dark:text-slate-200' },
                    { label: 'Active',       value: users.filter(u => u.isactive).length,  color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Inactive',     value: users.filter(u => !u.isactive).length, color: 'text-red-500 dark:text-red-400' },
                    { label: 'Roles in Use', value: new Set(users.map(u => u.userrole)).size, color: 'text-blue-600 dark:text-blue-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-4 py-3 text-center">
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <UserCog className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No users found</p>
                        <p className="text-xs mt-1">Add a user to get started</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {['Name', 'Email', 'Role', 'Status', 'Created', ''].map(h => (
                                    <TableHead key={h}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginated.map(u => (
                                <TableRow key={u.userid} className="group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
                                                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{u.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 dark:text-slate-400">{u.email}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.userrole] ?? ROLE_COLORS[7]}`}>
                                            <ShieldCheck className="h-3 w-3" />
                                            {u.userrolename}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {u.isactive
                                            ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Active</span>
                                            : <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400"><XCircle className="h-3.5 w-3.5" /> Inactive</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-xs">{u.createdon ? new Date(u.createdon).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                                title={u.isactive ? 'Deactivate' : 'Activate'}
                                                onClick={() => handleToggleActive(u)}>
                                                {u.isactive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                                onClick={() => openEdit(u)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600"
                                                onClick={() => setDeleteTarget(u)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {!loading && filtered.length > PAGE_SIZE && (
                    <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} label="user" onChange={setPage} />
                )}
            </div>

            {/* ── Create modal ── */}
            <Dialog open={createOpen} onOpenChange={o => { if (!o) setCreateOpen(false); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                    <form onSubmit={hsC(handleCreate)} className="space-y-4">
                        <F id="name" label="Full Name *" error={errC.name?.message}>
                            <Input id="name" {...regC('name')} placeholder="e.g. Ama Mensah" />
                        </F>
                        <F id="email" label="Email Address *" error={errC.email?.message}>
                            <Input id="email" type="email" {...regC('email')} placeholder="ama@school.edu.gh" />
                        </F>
                        <F id="password" label="Password *" error={errC.password?.message}>
                            <PasswordInput id="password" placeholder="Minimum 8 characters" {...regC('password')} />
                        </F>
                        <F label="Role *">
                            <SelectRoot value={String(watchC('userrole') ?? 2)}
                                onValueChange={v => setVC('userrole', Number(v))}>
                                <SelectTrigger className={ST}>
                                    <SelectValue>{USER_ROLES[watchC('userrole')] ?? 'Select role…'}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(USER_ROLES).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                        </F>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submC}>
                                {submC && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                                {submC ? 'Creating…' : 'Create User'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Edit modal ── */}
            <Dialog open={!!editingUser} onOpenChange={o => { if (!o) setEditingUser(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
                    {editingUser && (
                        <form onSubmit={hsE(handleEdit)} className="space-y-4">
                            <F id="ename" label="Full Name *" error={errE.name?.message}>
                                <Input id="ename" {...regE('name')} placeholder="Full name" />
                            </F>
                            <F id="eemail" label="Email Address *" error={errE.email?.message}>
                                <Input id="eemail" type="email" {...regE('email')} />
                            </F>
                            <F id="epassword" label="New Password" error={errE.password?.message}>
                                <PasswordInput id="epassword" placeholder="Leave blank to keep current" {...regE('password')} />
                            </F>
                            <div className="grid grid-cols-2 gap-3">
                                <F label="Role *">
                                    <SelectRoot value={String(watchE('userrole') ?? 2)}
                                        onValueChange={v => setVE('userrole', Number(v))}>
                                        <SelectTrigger className={ST}>
                                            <SelectValue>{USER_ROLES[watchE('userrole')] ?? 'Select…'}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(USER_ROLES).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </F>
                                <F label="Status">
                                    <SelectRoot value={watchE('isactive') ? 'true' : 'false'}
                                        onValueChange={v => setVE('isactive', v === 'true')}>
                                        <SelectTrigger className={ST}>
                                            <SelectValue>{watchE('isactive') ? 'Active' : 'Inactive'}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Active</SelectItem>
                                            <SelectItem value="false">Inactive</SelectItem>
                                        </SelectContent>
                                    </SelectRoot>
                                </F>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                                <Button type="submit" disabled={submE}>
                                    {submE && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                                    {submE ? 'Saving…' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Delete confirm ── */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={o => !o && setDeleteTarget(null)}
                title="Delete user?"
                description={`This will permanently delete ${deleteTarget?.name}'s account. They will no longer be able to log in.`}
                onConfirm={handleDelete}
            />
        </div>
    );
}
