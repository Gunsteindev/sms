'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCircle, Briefcase, Calendar,
  DollarSign, BookOpen, BarChart3, BookMarked,
  ClipboardList, Building2, FileText, Library, CalendarDays,
  GraduationCap, CalendarRange, Layers, Award,
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const sections = [
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
        { href: '/enrollments', label: t.nav.enrollments, icon: ClipboardList },
        { href: '/attendance',  label: t.nav.attendance,  icon: Calendar      },
        { href: '/exams',       label: t.nav.exams,       icon: FileText      },
      ],
    },
    {
      label: t.nav.administration,
      items: [
        { href: '/departments', label: t.nav.departments, icon: Building2 },
        { href: '/library',     label: t.nav.library,     icon: Library   },
        { href: '/reports',     label: t.nav.reports,     icon: BarChart3 },
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
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-slate-900">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/40">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none tracking-tight">SchoolMS</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-none">Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-5' : ''}>
            {section.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 select-none">
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
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                    }`} />
                    <span className="truncate">{item.label}</span>
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
