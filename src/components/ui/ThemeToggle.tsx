'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

type Theme = 'light' | 'dark' | 'system';

const OPTIONS: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: 'light',  icon: Sun,     label: 'Light'  },
  { value: 'dark',   icon: Moon,    label: 'Dark'   },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 p-1 gap-0.5">
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            aria-label={`Switch to ${label} mode`}
            className={[
              'flex h-7 items-center justify-center rounded-full transition-all duration-200',
              isActive
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm shadow-slate-300/60 dark:shadow-slate-900/60 px-2.5 gap-1.5'
                : 'w-7 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            {isActive && (
              <span className="text-[11px] font-semibold leading-none whitespace-nowrap">
                {label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
