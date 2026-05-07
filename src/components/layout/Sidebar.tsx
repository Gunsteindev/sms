'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCircle, Briefcase, Calendar,
  DollarSign, BookOpen, BarChart3, BookMarked,
  ClipboardList, Building2, FileText, Library, CalendarDays,
  GraduationCap, CalendarRange, Layers, Award, BookOpenCheck, TrendingUp,
  ChevronLeft, ChevronRight, HeartPulse, ShieldAlert, UserPlus, Medal,
  School, Home, UserCog, Package, ShoppingCart, CalendarOff,
  Megaphone, Bus, Trophy, Bell, Waves,
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useSession } from '@/contexts/AuthContext';

// Role constants — must match src/lib/dataverse/users.ts
const ADMIN     = 1;
const TEACHER   = 2;
const FINANCE   = 3;
const INVENTORY = 4;
const TRANSPORT = 5;
const POOL      = 6;
const PARENT    = 7;
const KITCHEN   = 8;

export function Sidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { data: session } = useSession();
  const role = session?.user?.userrole ?? ADMIN;

  type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean; roles?: number[] };
  type Section = { label: string | null; items: NavItem[]; roles?: number[] };

  const sections: Section[] = [
    {
      label: null,
      items: [
        { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
      ],
    },
    {
      label: t.nav.setup,
      roles: [ADMIN],
      items: [
        { href: '/setup/school-profile',   label: t.nav.schoolProfile   ?? 'School Profile',    icon: School        },
        { href: '/setup/academic-years',   label: t.nav.academicYears,                          icon: CalendarRange  },
        { href: '/setup/terms',            label: t.nav.terms,                                  icon: CalendarDays   },
        { href: '/setup/grade-levels',     label: t.nav.gradeLevels,                            icon: Layers         },
        { href: '/setup/promotions',       label: t.nav.promotions      ?? 'Promotions',        icon: TrendingUp     },
        { href: '/setup/programme-tracks', label: t.nav.programmeTracks ?? 'Programme Tracks',  icon: BookMarked     },
        { href: '/setup/houses',           label: t.nav.houses          ?? 'Houses & Streams',  icon: Home           },
        { href: '/setup/fee-types',        label: t.nav.feeTypes        ?? 'Fee Types',         icon: DollarSign     },
        { href: '/setup/users',            label: 'User Management',                            icon: UserCog        },
      ],
    },
    {
      label: t.nav.people,
      items: [
        { href: '/students',  label: t.nav.students,              icon: Users,     roles: [ADMIN, TEACHER, FINANCE, INVENTORY] },
        { href: '/teachers',  label: t.nav.teachers,              icon: UserCircle,roles: [ADMIN] },
        { href: '/employees', label: t.nav.employees,             icon: Briefcase, roles: [ADMIN] },
        { href: '/parents',   label: t.nav.parents ?? 'Parents',  icon: UserPlus,  roles: [ADMIN, TEACHER, FINANCE] },
      ],
    },
    {
      label: t.nav.academic,
      items: [
        { href: '/classes',     label: t.nav.classes,     icon: BookOpen,      roles: [ADMIN, TEACHER] },
        { href: '/subjects',    label: t.nav.subjects,    icon: BookMarked,    roles: [ADMIN, TEACHER] },
        { href: '/timetable',   label: t.nav.timetable,   icon: CalendarDays,  roles: [ADMIN, TEACHER] },
        { href: '/enrollments', label: t.nav.enrollments, icon: ClipboardList, roles: [ADMIN, TEACHER, FINANCE] },
        { href: '/attendance',  label: t.nav.attendance,  icon: Calendar,      roles: [ADMIN, TEACHER] },
        { href: '/exams',       label: t.nav.exams,       icon: FileText,      roles: [ADMIN, TEACHER] },
        { href: '/gradebook',   label: 'Gradebook',       icon: BookOpenCheck, roles: [ADMIN, TEACHER] },
      ],
    },
    {
      label: t.nav.welfare ?? 'Welfare',
      items: [
        { href: '/health',       label: t.nav.health       ?? 'Health Records', icon: HeartPulse,  roles: [ADMIN, TEACHER] },
        { href: '/disciplinary', label: t.nav.disciplinary ?? 'Disciplinary',   icon: ShieldAlert, roles: [ADMIN, TEACHER] },
      ],
    },
    {
      label: t.nav.administration,
      items: [
        { href: '/departments',            label: t.nav.departments,                  icon: Building2,    roles: [ADMIN] },
        { href: '/library',                label: t.nav.library,                      icon: Library,      roles: [ADMIN, INVENTORY] },
        { href: '/inventory',              label: 'Inventory',                        icon: Package,      roles: [ADMIN, INVENTORY] },
        { href: '/procurement',            label: 'Procurement',                      icon: ShoppingCart, roles: [ADMIN, FINANCE] },
        { href: '/staff-leave',            label: 'Staff Leave',                      icon: CalendarOff,  roles: [ADMIN] },
        { href: '/announcements',          label: 'Announcements',                    icon: Megaphone,    roles: [ADMIN, TEACHER, FINANCE] },
        { href: '/transport',              label: 'Transport & Fleet',                icon: Bus,          roles: [ADMIN, TRANSPORT] },
        { href: '/activities',             label: 'Activities',                       icon: Trophy,       roles: [ADMIN, TEACHER] },
        { href: '/reports',                label: t.nav.reports,                      icon: BarChart3, exact: true, roles: [ADMIN, TEACHER, FINANCE] },
        { href: '/reports/report-card',    label: t.nav.reportCards ?? 'Report Cards',    icon: FileText,  roles: [ADMIN, TEACHER, FINANCE] },
        { href: '/reports/national-exams', label: t.nav.nationalExams ?? 'National Exams', icon: Medal,    roles: [ADMIN, TEACHER] },
      ],
    },
    {
      label: t.nav.finance,
      roles: [ADMIN, FINANCE],
      items: [
        { href: '/fees',                 label: t.nav.fees,         icon: DollarSign },
        { href: '/finance/scholarships', label: t.nav.scholarships, icon: Award      },
      ],
    },
    {
      label: 'Pool Management',
      roles: [ADMIN, POOL, KITCHEN],
      items: [
        { href: '/pool', label: 'Swimming Pool', icon: Waves, roles: [ADMIN, POOL, KITCHEN] },
      ],
    },
    {
      label: 'Parent Portal',
      roles: [PARENT],
      items: [
        { href: '/portal', label: 'Notices & Updates', icon: Bell, roles: [PARENT] },
      ],
    },
  ];

  const canSeeSection = (section: Section) =>
    !section.roles || section.roles.includes(role);

  const canSeeItem = (item: NavItem) =>
    !item.roles || item.roles.includes(role);

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen flex flex-col bg-slate-900 dark:bg-slate-950 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>

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
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-slate-100 transition-colors ${collapsed ? 'absolute right-0 translate-x-1/2 top-4 bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 shadow-md' : ''}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-none">
        {sections.map((section, si) => {
          if (!canSeeSection(section)) return null;
          const visibleItems = section.items.filter(canSeeItem);
          if (!visibleItems.length) return null;

          return (
            <div key={si} className={si > 0 ? 'mt-5' : ''}>
              {section.label && !collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 select-none">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && <div className="mx-2 mb-1.5 h-px bg-slate-800 dark:bg-slate-800/60" />}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
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
          );
        })}
      </nav>

    </aside>
  );
}
