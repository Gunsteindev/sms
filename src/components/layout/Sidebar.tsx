'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCircle, Briefcase, Calendar,
  DollarSign, BookOpen, BarChart3, LogOut, BookMarked,
  ClipboardList, Building2, FileText, Library, CalendarDays,
  GraduationCap, CalendarRange, Layers, CreditCard, Award,
} from 'lucide-react';

const sections = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/students',  label: 'Students',  icon: Users },
      { href: '/teachers',  label: 'Teachers',  icon: UserCircle },
      { href: '/employees', label: 'Employees', icon: Briefcase },
    ],
  },
  {
    label: 'Academic',
    items: [
      { href: '/classes',     label: 'Classes',     icon: BookOpen },
      { href: '/subjects',    label: 'Subjects',    icon: BookMarked },
      { href: '/timetable',   label: 'Timetable',   icon: CalendarDays },
      { href: '/enrollments', label: 'Enrollments', icon: ClipboardList },
      { href: '/attendance',  label: 'Attendance',  icon: Calendar },
      { href: '/exams',       label: 'Exams',       icon: FileText },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/departments', label: 'Departments', icon: Building2 },
      { href: '/library',     label: 'Library',     icon: Library },
      { href: '/reports',     label: 'Reports',     icon: BarChart3 },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/fees',                 label: 'Fees',         icon: DollarSign },
      { href: '/finance/fees',         label: 'Fee Invoices', icon: FileText },
      { href: '/finance/fee-payments',   label: 'Fee Payments',   icon: CreditCard },
      { href: '/finance/scholarships',   label: 'Scholarships',   icon: Award },
    ],
  },
  {
    label: 'Setup',
    items: [
      { href: '/setup/academic-years', label: 'Academic Years', icon: CalendarRange },
      { href: '/setup/terms',          label: 'Terms',          icon: CalendarDays },
      { href: '/setup/grade-levels',   label: 'Grade Levels',   icon: Layers },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/auth/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
          <GraduationCap className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">SchoolMS</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-5' : ''}>
            {section.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 transition-colors ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      }`}
                    />
                    {item.label}
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 p-3">
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4 flex-shrink-0 transition-colors group-hover:text-red-500 dark:group-hover:text-red-400" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
