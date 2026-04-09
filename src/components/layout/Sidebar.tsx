'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Briefcase,
  Calendar,
  DollarSign,
  BookOpen,
  BarChart3,
  LogOut,
  School,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students',   label: 'Students',  icon: Users },
  { href: '/teachers',   label: 'Teachers',  icon: UserCircle },
  { href: '/employees',  label: 'Employees', icon: Briefcase },
  { href: '/attendance', label: 'Attendance',icon: Calendar },
  { href: '/fees',       label: 'Fees',      icon: DollarSign },
  { href: '/classes',    label: 'Classes',   icon: BookOpen },
  { href: '/reports',    label: 'Reports',   icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-blue-950 to-blue-900 text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
          <School className="h-5 w-5 text-blue-300" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">SchoolManager</p>
          <p className="text-xs text-blue-400 mt-0.5">Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-500/20 text-white border border-blue-500/30'
                  : 'text-blue-200/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-blue-300' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-blue-800 p-3">
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-200/80 transition-all hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
