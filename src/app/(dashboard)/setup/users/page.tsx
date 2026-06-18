'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck, Search, Eye, EyeOff, UserCog, Loader2, CheckCircle2, XCircle, Check, Save, SlidersHorizontal } from 'lucide-react';
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
import { usersAPI, schoolAPI } from '@/lib/api-client';
import { USER_ROLES } from '@/lib/dataverse/users';
import type { SmsUser } from '@/lib/dataverse/users';
import { useSession } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import {
    MODULE_GROUPS, ALL_MODULE_KEYS, ACCESS_ROLES, defaultRoleModuleAccess,
    type RoleModuleAccess,
} from '@/lib/modules';

const PAGE_SIZE = 10;
const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const createSchema = z.object({
    name:     z.string().min(1, 'Required'),
    email:    z.string().email('Invalid email'),
    password: z.string().min(8, 'Minimum 8 characters'),
    userrole: z.number().int().min(1).max(8),
});

const editSchema = z.object({
    name:     z.string().min(1, 'Required'),
    email:    z.string().email('Invalid email'),
    password: z.string().min(8, 'Minimum 8 characters').optional().or(z.literal('')),
    userrole: z.number().int().min(1).max(8),
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
    8: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
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

/* ── Module Access matrix (super admin only) ── */
function ModuleAccessPanel() {
    const { roleModuleAccess, setRoleModuleAccess } = useBrand();
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [draft,    setDraft]    = useState<RoleModuleAccess>({});
    const [loading,  setLoading]  = useState(true);
    const [saving,   setSaving]   = useState(false);

    // Ensure every access role has an array entry.
    const normalize = (a: RoleModuleAccess): RoleModuleAccess => {
        const out: RoleModuleAccess = {};
        for (const r of ACCESS_ROLES) out[r] = [...(a[r] ?? [])];
        return out;
    };

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (schoolAPI.getProfile() as Promise<any>).then((res: any) => {
            const p = res?.data;
            if (p?.schoolid) setSchoolId(p.schoolid);
            const access: RoleModuleAccess = p?.rolemoduleaccess && Object.keys(p.rolemoduleaccess).length > 0
                ? p.rolemoduleaccess
                : (Object.keys(roleModuleAccess).length ? roleModuleAccess : defaultRoleModuleAccess());
            setDraft(normalize(access));
        }).catch(() => setDraft(normalize(roleModuleAccess)))
          .finally(() => setLoading(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const has = (role: number, key: string) => (draft[role] ?? []).includes(key);

    const toggle = (role: number, key: string) => setDraft(prev => {
        const set = new Set(prev[role] ?? []);
        if (set.has(key)) set.delete(key); else set.add(key);
        return { ...prev, [role]: [...set] };
    });

    const toggleRoleAll = (role: number) => setDraft(prev => {
        const allOn = ALL_MODULE_KEYS.every(k => (prev[role] ?? []).includes(k));
        return { ...prev, [role]: allOn ? [] : [...ALL_MODULE_KEYS] };
    });

    const toggleModuleAll = (key: string) => setDraft(prev => {
        const allOn = ACCESS_ROLES.every(r => (prev[r] ?? []).includes(key));
        const next = { ...prev };
        for (const r of ACCESS_ROLES) {
            const set = new Set(next[r] ?? []);
            if (allOn) set.delete(key); else set.add(key);
            next[r] = [...set];
        }
        return next;
    });

    const resetDefaults = () => setDraft(normalize(defaultRoleModuleAccess()));

    const save = async () => {
        if (!schoolId) { toast.error('No school in context'); return; }
        setSaving(true);
        try {
            await schoolAPI.updateRoleAccess(schoolId, draft);
            setRoleModuleAccess(draft); // update live so the sidebar reflects it immediately
            toast.success('Module access saved');
        } catch { toast.error('Failed to save module access'); }
        finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Tick a module to grant that role access. Changes apply to the current school once saved.
                    <span className="block text-xs text-slate-400 mt-0.5">Admins always retain full access; the super admin bypasses these limits.</span>
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={resetDefaults} disabled={saving}>Reset to defaults</Button>
                    <Button onClick={save} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                        {saving ? 'Saving…' : 'Save Access'}
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Module
                            </th>
                            {ACCESS_ROLES.map(r => (
                                <th key={r} className="px-3 py-3 text-center align-bottom">
                                    <button
                                        type="button"
                                        onClick={() => toggleRoleAll(r)}
                                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors whitespace-nowrap"
                                        title={`Toggle all modules for ${USER_ROLES[r]}`}
                                    >
                                        {USER_ROLES[r]}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {MODULE_GROUPS.map(group => (
                            <Fragment key={group.group}>
                                <tr className="bg-slate-50 dark:bg-slate-800/40">
                                    <td colSpan={ACCESS_ROLES.length + 1} className="sticky left-0 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                        {group.group}
                                    </td>
                                </tr>
                                {group.modules.map(mod => (
                                    <tr key={mod.key} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                        <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-4 py-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleModuleAll(mod.key)}
                                                className="text-left group"
                                                title={`Toggle ${mod.label} for all roles`}
                                            >
                                                <span className="block text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600">{mod.label}</span>
                                                <span className="block text-[10px] text-slate-400 leading-tight">{mod.desc}</span>
                                            </button>
                                        </td>
                                        {ACCESS_ROLES.map(r => {
                                            const on = has(r, mod.key);
                                            return (
                                                <td key={r} className="px-3 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggle(r, mod.key)}
                                                        aria-pressed={on}
                                                        aria-label={`${on ? 'Remove' : 'Grant'} ${mod.label} for ${USER_ROLES[r]}`}
                                                        className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                                                            on
                                                                ? 'border-blue-500 bg-blue-500 text-white'
                                                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                                                        }`}
                                                    >
                                                        {on && <Check className="h-3 w-3" />}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function UsersPage() {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.userid === 'bootstrap';
    const [tab, setTab] = useState<'users' | 'access'>('users');
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
                {tab === 'users' && (
                    <Button onClick={() => { resetC({ userrole: 2 }); setCreateOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1.5" /> Add User
                    </Button>
                )}
            </div>

            {/* Tabs — Module Access is super-admin only */}
            {isSuperAdmin && (
                <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
                    {([
                        { key: 'users',  label: 'Users',         icon: UserCog },
                        { key: 'access', label: 'Module Access', icon: SlidersHorizontal },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                tab === key
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Icon className="h-4 w-4" /> {label}
                        </button>
                    ))}
                </div>
            )}

            {tab === 'access' && isSuperAdmin && <ModuleAccessPanel />}

            {tab === 'users' && (
            <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative max-w-sm w-full">
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
                                        <div className="flex items-center gap-1 justify-end">
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
            </>
            )}

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
