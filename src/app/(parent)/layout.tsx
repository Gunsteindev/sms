'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/contexts/BrandContext';
import { Button } from '@/components/ui/Button';
import { portalAPI } from '@/lib/api-client';

// Standalone parent-facing shell — deliberately separate from the admin dashboard
// (no admin sidebar/header). Parents land here after login.
export default function ParentLayout({ children }: { children: React.ReactNode }) {
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

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
            {/* Top bar */}
            <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {school?.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={school.logo} alt={schoolName} className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                            <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="h-4 w-4 text-white" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate leading-tight">{schoolName}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">Parent Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-300 truncate max-w-[160px]">{parentName || user?.name}</span>
                        <Button variant="outline" size="sm" onClick={signOut}>
                            <LogOut className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
