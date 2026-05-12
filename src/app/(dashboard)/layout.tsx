'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useBrand } from '@/contexts/BrandContext';
import { moduleForPath } from '@/lib/modules';
import { LayoutGrid, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ModuleDisabled({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
        <LayoutGrid className="h-7 w-7 text-slate-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
        Module not available
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
        The <span className="font-medium text-slate-700 dark:text-slate-300">{moduleName}</span> module
        has not been enabled for your school. Contact your administrator to activate it.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: sessionData, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();
  const { enabledModules } = useBrand();
  const isSuperAdmin = sessionData?.user?.userid === 'bootstrap';

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  // Resolve which module (if any) this path belongs to.
  // Super admin bypasses the guard — they need full access to manage all schools.
  const requiredModule = moduleForPath(pathname);
  const moduleBlocked  = !isSuperAdmin && requiredModule !== null && !enabledModules.includes(requiredModule);

  // Find a friendly display name for the blocked module
  const blockedLabel = requiredModule
    ? requiredModule.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${collapsed ? 'pl-16' : 'pl-64'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {moduleBlocked
            ? <ModuleDisabled moduleName={blockedLabel} />
            : <ErrorBoundary>{children}</ErrorBoundary>
          }
        </main>
      </div>
    </div>
  );
}
