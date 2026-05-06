'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell, Search, ChevronDown, Users, UserCircle, X,
    User, Settings, LogOut, Pin, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useI18n } from '@/contexts/I18nContext';
import type { Announcement } from '@/lib/dataverse/announcements';

const READ_KEY = 'sms-read-notifications';

const AUDIENCE_BADGE: Record<number, { label: string; cls: string }> = {
    1: { label: 'All',      cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
    2: { label: 'Students', cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    3: { label: 'Teachers', cls: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
    4: { label: 'Parents',  cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
};

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' });
}

interface SearchResult {
    id: string; label: string; sub: string;
    type: 'student' | 'teacher'; href: string;
}

const TYPE_ICON: Record<string, React.ElementType> = { student: Users, teacher: UserCircle };
const TYPE_LABEL: Record<string, string> = { student: 'Student', teacher: 'Teacher' };

export function Header() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { t } = useI18n();

    // Search
    const [query,   setQuery]   = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [open,    setOpen]    = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef     = useRef<HTMLInputElement>(null);
    const abortRef     = useRef<AbortController | null>(null);

    // Notifications
    const [notifOpen,      setNotifOpen]      = useState(false);
    const [notifications,  setNotifications]  = useState<Announcement[]>([]);
    const [notifLoading,   setNotifLoading]   = useState(false);
    const [readIds,        setReadIds]        = useState<Set<string>>(new Set());
    const notifRef = useRef<HTMLDivElement>(null);

    // User menu
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'AU';

    useEffect(() => {
        try {
            const raw = localStorage.getItem(READ_KEY);
            if (raw) setReadIds(new Set(JSON.parse(raw)));
        } catch { /* ignore */ }
    }, []);

    const loadNotifications = useCallback(async () => {
        setNotifLoading(true);
        try {
            const res = await fetch('/api/announcements?limit=20');
            const json = await res.json();
            if (json.success) setNotifications(json.data ?? []);
        } catch { /* silent */ }
        finally { setNotifLoading(false); }
    }, []);

    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    const unreadCount = notifications.filter(n => !readIds.has(n.announcementid)).length;

    const markRead = (id: string) => {
        const next = new Set(readIds).add(id);
        setReadIds(next);
        localStorage.setItem(READ_KEY, JSON.stringify([...next]));
    };

    const markAllRead = () => {
        const next = new Set(notifications.map(n => n.announcementid));
        setReadIds(next);
        localStorage.setItem(READ_KEY, JSON.stringify([...next]));
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
            if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setNotifOpen(false);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); }
            if (e.key === 'Escape') { setOpen(false); setNotifOpen(false); setUserMenuOpen(false); inputRef.current?.blur(); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); setOpen(false); return; }
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true); setOpen(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: abortRef.current.signal });
            if (!res.ok) throw new Error();
            const json = await res.json();
            if (json.success) setResults(json.data);
        } catch (err: unknown) {
            if ((err as Error).name === 'AbortError') return;
            setResults([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (query.length < 2) { setResults([]); setOpen(false); return; }
        const t = setTimeout(() => doSearch(query), 300);
        return () => clearTimeout(t);
    }, [query, doSearch]);

    const handleSelect = (r: SearchResult) => { router.push(r.href); setQuery(''); setOpen(false); };
    const clearSearch  = () => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-6 gap-4">

            {/* ── Search ──────────────────────────────────────────────────────── */}
            <div ref={containerRef} className="relative w-72 hidden md:block">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={t.header.searchPlaceholder}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => { if (query.length >= 2 && results.length > 0) setOpen(true); }}
                    className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2 pl-8 pr-14 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query
                        ? <button onClick={clearSearch} className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors"><X className="h-3.5 w-3.5" /></button>
                        : <kbd className="hidden sm:inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 shadow-sm">⌘K</kbd>
                    }
                </div>

                {open && (
                    <div className="absolute top-full mt-2 left-0 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-[100]">
                        {loading && (
                            <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent flex-shrink-0" />
                                Searching…
                            </div>
                        )}
                        {!loading && results.length === 0 && (
                            <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No results for &ldquo;{query}&rdquo;</p>
                        )}
                        {!loading && results.length > 0 && (
                            <ul>
                                {results.map(r => {
                                    const Icon = TYPE_ICON[r.type];
                                    return (
                                        <li key={`${r.type}-${r.id}`}>
                                            <button onMouseDown={() => handleSelect(r)}
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
                                                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.label}</p>
                                                    {r.sub && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.sub}</p>}
                                                </div>
                                                <span className="flex-shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                    {TYPE_LABEL[r.type]}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* ── Right side ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 ml-auto">

                <ThemeToggle />

                {/* Notification bell */}
                <div ref={notifRef} className="relative">
                    <button
                        onClick={() => { setNotifOpen(v => !v); if (!notifOpen) loadNotifications(); }}
                        className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                            notifOpen
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <Bell className="h-4.5 w-4.5" />
                        {unreadCount > 0 && (
                            <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/50 z-[100] overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.header.notifications}</span>
                                    {unreadCount > 0 && (
                                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead}
                                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            {t.header.markAllRead}
                                        </button>
                                    )}
                                    <button onClick={loadNotifications}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <RefreshCw className={`h-3.5 w-3.5 ${notifLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/80">
                                {notifLoading && notifications.length === 0 && (
                                    <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                        <span className="text-sm">Loading…</span>
                                    </div>
                                )}
                                {!notifLoading && notifications.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                                        <Bell className="h-8 w-8 opacity-20" />
                                        <p className="text-sm">{t.header.noAnnouncements}</p>
                                    </div>
                                )}
                                {notifications.map(n => {
                                    const isUnread = !readIds.has(n.announcementid);
                                    const aud = AUDIENCE_BADGE[n.audience] ?? AUDIENCE_BADGE[1];
                                    return (
                                        <button
                                            key={n.announcementid}
                                            onClick={() => markRead(n.announcementid)}
                                            className={`w-full text-left flex gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <div className="mt-2 flex-shrink-0">
                                                <span className={`block h-1.5 w-1.5 rounded-full ${isUnread ? 'bg-blue-500' : 'bg-transparent'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm leading-snug truncate ${isUnread ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                                                        {n.ispinned && <Pin className="inline h-3 w-3 mr-1 text-amber-500 flex-shrink-0" />}
                                                        {n.name}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5 whitespace-nowrap">
                                                        {timeAgo(n.publishdate || n.createdon)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                                    {n.message}
                                                </p>
                                                <span className={`inline-block mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${aud.cls}`}>
                                                    {aud.label}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30">
                                    <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                                        {notifications.length} {notifications.length !== 1 ? t.header.announcements : t.header.announcement} · {unreadCount} {t.header.unread}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* User menu */}
                <div ref={userMenuRef} className="relative">
                    <button
                        onClick={() => setUserMenuOpen(v => !v)}
                        className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors ${
                            userMenuOpen
                                ? 'bg-slate-100 dark:bg-slate-800'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white flex-shrink-0 ring-2 ring-white dark:ring-slate-950 shadow-sm">
                            {initials}
                        </div>
                        <div className="hidden text-left md:block">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">{user?.name ?? 'Admin User'}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">{user?.role ?? 'Administrator'}</p>
                        </div>
                        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 hidden md:block transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/50 z-[100] overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name ?? 'Admin User'}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{user?.email}</p>
                                {user?.role && (
                                    <span className="mt-1.5 inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                        {user.role}
                                    </span>
                                )}
                            </div>
                            <div className="p-1.5 space-y-0.5">
                                <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    {t.header.profile}
                                </Link>
                                <Link href="/settings" onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <Settings className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    {t.header.settings}
                                </Link>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800 p-1.5">
                                <button
                                    onClick={() => { setUserMenuOpen(false); signOut(); }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t.header.logOut}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
