'use client';

import { useState } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AU';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      {/* Search */}
      <div className="hidden w-80 md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students, classes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* User */}
        <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="hidden text-left md:block">
            <p className="font-medium text-gray-900 leading-none">{user?.name ?? 'Admin User'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email ?? 'Administrator'}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden md:block" />
        </button>
      </div>
    </header>
  );
}
