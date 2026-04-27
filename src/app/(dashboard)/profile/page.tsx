'use client';

import { useState, useEffect } from 'react';
import {
    User, Mail, Shield, Calendar, Edit2, Check, X, LogOut,
    BookOpen, Users, GraduationCap, CheckCircle2, Clock,
    BadgeCheck, UserCog, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { usersAPI, dashboardAPI } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import type { SmsUser } from '@/lib/dataverse/users';

const DISPLAY_NAME_KEY = 'sms-profile-displayname';

interface QuickStats { totalStudents: number; totalTeachers: number; totalClasses: number; }
interface UserStats  { total: number; admins: number; teachers: number; parents: number; active: number; }

const ROLE_COLORS: Record<number, string> = {
    1: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
    2: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    3: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
    4: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
};

export default function ProfilePage() {
    const { user, signOut } = useAuth();

    const [editingName, setEditingName] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [draftName,   setDraftName]   = useState('');

    const [dvUser,     setDvUser]     = useState<SmsUser | null>(null);
    const [dvLoading,  setDvLoading]  = useState(true);
    const [stats,      setStats]      = useState<QuickStats | null>(null);
    const [userStats,  setUserStats]  = useState<UserStats | null>(null);

    // Load display name from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(DISPLAY_NAME_KEY);
        const name  = saved || user?.name || 'Admin User';
        setDisplayName(name);
        setDraftName(name);
    }, [user?.name]);

    // Load Dataverse data
    useEffect(() => {
        if (!user?.email) return;
        setDvLoading(true);
        Promise.allSettled([
            usersAPI.getByEmail(user.email),
            dashboardAPI.getStats(),
            usersAPI.getStats(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ]).then(([uRes, sRes, usRes]: any[]) => {
            if (uRes.status === 'fulfilled') setDvUser(uRes.value?.data ?? null);
            if (sRes.status === 'fulfilled') setStats(sRes.value?.data ?? null);
            if (usRes.status === 'fulfilled') setUserStats(usRes.value?.data ?? null);
        }).finally(() => setDvLoading(false));
    }, [user?.email]);

    const saveName = () => {
        const trimmed = draftName.trim();
        if (!trimmed) { toast.error('Name cannot be empty'); return; }
        localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
        setDisplayName(trimmed);
        setEditingName(false);
        toast.success('Display name updated');
    };

    const cancelEdit = () => { setDraftName(displayName); setEditingName(false); };

    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const roleLabel = dvUser?.userrolename ?? (user?.role === 'admin' ? 'Admin' : 'User');
    const roleNum   = dvUser?.userrole ?? 1;

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your account and institution overview</p>
            </div>

            {/* Avatar card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="h-28 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                <div className="px-6 pb-6">
                    <div className="flex items-end justify-between -mt-12 mb-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white ring-4 ring-white dark:ring-slate-900 shadow-lg">
                            {initials}
                        </div>
                        <Button
                            variant="outline" size="sm" onClick={signOut}
                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <LogOut className="h-3.5 w-3.5 mr-1.5" />Sign out
                        </Button>
                    </div>

                    {/* Display name */}
                    <div className="space-y-2">
                        {editingName ? (
                            <div className="flex items-center gap-2">
                                <Input value={draftName} onChange={e => setDraftName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit(); }}
                                    className="h-8 text-lg font-bold w-60" autoFocus />
                                <button onClick={saveName}   className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-colors"><Check className="h-4 w-4" /></button>
                                <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors"><X className="h-4 w-4" /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{displayName}</h2>
                                <button onClick={() => { setDraftName(displayName); setEditingName(true); }}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <Edit2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[roleNum]}`}>
                                <Shield className="h-3 w-3" />{roleLabel}
                            </span>
                            {dvUser && (
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${dvUser.isactive ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
                                    {dvUser.isactive ? <><CheckCircle2 className="h-3 w-3" />Active</> : <><Clock className="h-3 w-3" />Inactive</>}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Account details */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Account Details</h3>
                    {dvLoading && <p className="text-xs text-slate-400 mt-0.5">Loading from Dataverse…</p>}
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {[
                        {
                            icon: Mail,      label: 'Email address',
                            value: user?.email ?? '—',
                            sub:   dvUser ? 'Verified in Dataverse' : 'Session only',
                        },
                        {
                            icon: UserCog,   label: 'Display name',
                            value: dvUser?.name ?? displayName,
                            sub:   'Name stored in user record',
                        },
                        {
                            icon: Shield,    label: 'Role',
                            value: roleLabel,
                            sub:   'Dataverse sms_userrole',
                        },
                        {
                            icon: BadgeCheck, label: 'Account status',
                            value: dvUser ? (dvUser.isactive ? 'Active' : 'Inactive') : '—',
                            sub:   dvUser ? 'Live from sms_users' : 'Not yet loaded',
                        },
                        {
                            icon: Hash,      label: 'User ID',
                            value: dvUser?.userid ? dvUser.userid.slice(0, 8).toUpperCase() + '…' : '—',
                            sub:   'Dataverse record ID',
                        },
                        {
                            icon: Calendar,  label: 'Account created',
                            value: dvUser?.createdon
                                ? new Date(dvUser.createdon).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })
                                : '—',
                            sub:   'Dataverse createdon timestamp',
                        },
                    ].map(({ icon: Icon, label, value, sub }) => (
                        <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
                                <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate">{value}</p>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 hidden sm:block">{sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* User stats from Dataverse */}
            {userStats && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Platform Users</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Registered accounts in Dataverse</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                        {[
                            { label: 'Total',    value: userStats.total,    icon: Users,         color: 'text-slate-600 dark:text-slate-300',   bg: 'bg-slate-50 dark:bg-slate-800' },
                            { label: 'Admins',   value: userStats.admins,   icon: Shield,        color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                            { label: 'Teachers', value: userStats.teachers, icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { label: 'Parents',  value: userStats.parents,  icon: User,          color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        ].map(({ label, value, icon: Icon, color, bg }) => (
                            <div key={label} className="flex flex-col items-center gap-2 py-5">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* School overview */}
            {stats && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">School Overview</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live data from your institution</p>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
                        {[
                            { icon: Users,         label: 'Students',  value: stats.totalStudents,  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { icon: GraduationCap, label: 'Teachers',  value: stats.totalTeachers,  color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                            { icon: BookOpen,      label: 'Classes',   value: stats.totalClasses,   color: 'text-sky-600 dark:text-sky-400',     bg: 'bg-sky-50 dark:bg-sky-900/20' },
                        ].map(({ icon: Icon, label, value, color, bg }) => (
                            <div key={label} className="flex flex-col items-center gap-2 py-6">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
