'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { portalAPI } from '@/lib/api-client';

// Standalone parent-facing shell — deliberately separate from the admin dashboard
// (no admin sidebar/header). Parents land here after login. Wrapped in its own
// ThemeProvider so the portal's light/dark choice is independent of the admin theme.
export default function ParentLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider storageKey="sms-parent-theme">
            <ParentShell>{children}</ParentShell>
        </ThemeProvider>
    );
}

function ParentShell({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, signOut } = useAuth();
    const { school } = useBrand();
    const router = useRouter();
    const [parentName, setParentName] = useState('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/auth/login');
    }, [isLoading, isAuthenticated, router]);

    // Prefer the real parent name (from the parent record) over the login account name
    useEffect(() => {
        if (!isAuthenticated) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        portalAPI.getChildren().then((res: any) => {
            if (res?.parentName) setParentName(res.parentName);
        }).catch(() => {/* fall back to account name */});
    }, [isAuthenticated]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
            </div>
        );
    }

    const schoolName = school?.name || 'Parent Portal';
    const displayName = parentName || user?.name || 'Parent';
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
            {/* Fixed, frosted top bar — sits above the scrollable content area */}
            <header className="flex-shrink-0 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {school?.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={school.logo} alt={schoolName} className="h-9 w-9 rounded-xl object-cover flex-shrink-0 ring-1 ring-slate-200 dark:ring-slate-700" />
                        ) : (
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate leading-tight">{schoolName}</p>
                            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 leading-tight tracking-wide uppercase">Parent Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <ThemeToggle />
                        <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 py-1 pl-1 pr-3">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {initial}
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{displayName}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={signOut} className="border-slate-200 dark:border-slate-700">
                            <LogOut className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
