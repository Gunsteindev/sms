'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Pin, Users, GraduationCap, UserCircle, UserPlus, RefreshCw, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { announcementsAPI } from '@/lib/api-client';
import { useSession } from '@/contexts/AuthContext';
import type { Announcement } from '@/lib/dataverse/announcements';

const AUDIENCE_ICON: Record<number, React.ElementType> = { 1: Users, 2: GraduationCap, 3: UserCircle, 4: UserPlus };
const AUDIENCE_COLOR: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    2: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    3: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    4: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};
const AUDIENCE_LABEL: Record<number, string> = { 1: 'All', 2: 'Students', 3: 'Teachers', 4: 'Parents' };

function AnnouncementCard({ a }: { a: Announcement }) {
    const AudIcon = AUDIENCE_ICON[a.audience] ?? Users;
    const isExpired = a.expirydate && new Date(a.expirydate) < new Date();
    return (
        <div className={`relative rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-sm ${a.ispinned ? 'border-amber-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-700'}`}>
            {a.ispinned && <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-amber-400" />}
            <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2.5 mt-0.5 flex-shrink-0 ${a.ispinned ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <Megaphone className={`h-4 w-4 ${a.ispinned ? 'text-amber-500' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {a.ispinned && <Pin className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug">{a.name}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${AUDIENCE_COLOR[a.audience]}`}>
                            <AudIcon className="h-3 w-3" />{AUDIENCE_LABEL[a.audience]}
                        </span>
                        {isExpired && <Badge variant="destructive">Expired</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{a.message}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                        <span>Posted {a.publishdate ? new Date(a.publishdate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                        {a.expirydate && <span>· Expires {new Date(a.expirydate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PortalPage() {
    const { data: session } = useSession();
    const [items, setItems]     = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res: any = await announcementsAPI.getAll();
            const all: Announcement[] = res.data ?? [];
            // Show announcements for All (1) or Parents (4)
            setItems(all.filter(a => a.audience === 1 || a.audience === 4));
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const pinned   = items.filter(a => a.ispinned && !(a.expirydate && new Date(a.expirydate) < new Date()));
    const regular  = items.filter(a => !a.ispinned && !(a.expirydate && new Date(a.expirydate) < new Date()));
    const expired  = items.filter(a => a.expirydate && new Date(a.expirydate) < new Date());

    const name = session?.user?.name || 'Parent';

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Welcome */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-400 p-3">
                        <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-amber-900 dark:text-amber-100">Welcome, {name}</h1>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                            {items.length} announcement{items.length !== 1 ? 's' : ''} for you · {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="ml-auto">
                        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-amber-300 text-amber-700 hover:bg-amber-100">
                            <RefreshCw className={`h-4 w-4 mr-1.5${loading ? ' animate-spin' : ''}`} /> Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
            ) : !items.length ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <Megaphone className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No announcements at the moment</p>
                    <p className="text-xs mt-1 text-gray-300">Check back later for updates from the school</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {pinned.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                                <Pin className="h-3.5 w-3.5" /> Important Notices
                            </p>
                            {pinned.map(a => <AnnouncementCard key={a.announcementid} a={a} />)}
                        </div>
                    )}
                    {regular.length > 0 && (
                        <div className="space-y-3">
                            {pinned.length > 0 && (
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">General Announcements</p>
                            )}
                            {regular.map(a => <AnnouncementCard key={a.announcementid} a={a} />)}
                        </div>
                    )}
                    {expired.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-300">Past Notices</p>
                            {expired.map(a => <AnnouncementCard key={a.announcementid} a={a} />)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
