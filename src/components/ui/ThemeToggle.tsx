'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const CYCLE: Record<string, 'dark' | 'system' | 'light'> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const ICONS = { light: Sun, dark: Moon, system: Monitor };
const LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme] ?? Sun;

  return (
    <button
      onClick={() => setTheme(CYCLE[theme])}
      title={`Theme: ${LABELS[theme]} — click to change`}
      className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
