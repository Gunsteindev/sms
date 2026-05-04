'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCircle, Briefcase, Calendar,
  DollarSign, BookOpen, BarChart3, BookMarked,
  ClipboardList, Building2, FileText, Library, CalendarDays,
  GraduationCap, CalendarRange, Layers, Award, BookOpenCheck, TrendingUp,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export function Sidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean };
  const sections: { label: string | null; items: NavItem[] }[] = [
    {
      label: null,
      items: [
        { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
      ],
    },
    {
      label: t.nav.people,
      items: [
        { href: '/students',  label: t.nav.students,  icon: Users       },
        { href: '/teachers',  label: t.nav.teachers,  icon: UserCircle  },
        { href: '/employees', label: t.nav.employees, icon: Briefcase   },
      ],
    },
    {
      label: t.nav.academic,
      items: [
        { href: '/classes',     label: t.nav.classes,     icon: BookOpen      },
        { href: '/subjects',    label: t.nav.subjects,    icon: BookMarked    },
        { href: '/timetable',   label: t.nav.timetable,   icon: CalendarDays  },
        { href: '/enrollments', label: t.nav.enrollments, icon: ClipboardList  },
        { href: '/attendance',  label: t.nav.attendance,  icon: Calendar       },
        { href: '/exams',       label: t.nav.exams,       icon: FileText       },
        { href: '/gradebook',   label: 'Gradebook',       icon: BookOpenCheck  },
      ],
    },
    {
      label: t.nav.administration,
      items: [
        { href: '/departments',          label: t.nav.departments, icon: Building2    },
        { href: '/library',              label: t.nav.library,     icon: Library      },
        { href: '/reports',              label: t.nav.reports,     icon: BarChart3,   exact: true },
        { href: '/reports/report-card',  label: 'Report Cards',    icon: FileText     },
      ],
    },
    {
      label: t.nav.finance,
      items: [
        { href: '/fees',                 label: t.nav.fees,         icon: DollarSign },
        { href: '/finance/scholarships', label: t.nav.scholarships, icon: Award      },
      ],
    },
    {
      label: t.nav.setup,
      items: [
        { href: '/setup/academic-years', label: t.nav.academicYears, icon: CalendarRange },
        { href: '/setup/terms',          label: t.nav.terms,         icon: CalendarDays  },
        { href: '/setup/grade-levels',   label: t.nav.gradeLevels,   icon: Layers        },
        { href: '/setup/promotions',     label: 'Promotions',        icon: TrendingUp    },
      ],
    },
  ];

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen flex flex-col bg-slate-900 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>

      {/* Logo + toggle */}
      <div className={`flex items-center h-16 border-b border-slate-800 flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/40">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none tracking-tight">SchoolMS</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-none">Admin Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/40">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors ${collapsed ? 'absolute right-0 translate-x-1/2 top-4 bg-slate-800 border border-slate-700 shadow-md' : ''}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-none">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-5' : ''}>
            {section.label && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 select-none">
                {section.label}
              </p>
            )}
            {section.label && collapsed && <div className="mx-2 mb-1.5 h-px bg-slate-800" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center rounded-lg py-2 text-sm font-medium transition-all duration-150 ${
                      collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                    }`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

    </aside>
  );
}
