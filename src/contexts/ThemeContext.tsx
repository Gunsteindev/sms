'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'system',
    resolvedTheme: 'light',
    setTheme: () => {},
});

const GLOBAL_KEY = 'sms-theme';

// The parent portal (route group "(parent)" → /parent) runs its own scoped ThemeProvider.
const onParentRoute = () =>
    typeof window !== 'undefined' &&
    (window.location.pathname === '/parent' || window.location.pathname.startsWith('/parent/'));

// `storageKey` lets a sub-tree (e.g. the parent portal) keep a theme that is
// independent of the global/admin theme. A scoped provider (storageKey !== GLOBAL_KEY)
// restores the global theme on unmount so leaving the scoped area doesn't strand its class.
export function ThemeProvider({ children, storageKey = GLOBAL_KEY }: { children: React.ReactNode; storageKey?: string }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'system';
        return (localStorage.getItem(storageKey) as Theme) ?? 'system';
    });

    const [systemDark, setSystemDark] = useState<boolean>(() =>
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    // Derived — no extra state needed
    const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

    // Subscribe to OS preference changes — setState is in the event callback, not the effect body
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Apply the theme class to <html> whenever resolvedTheme changes.
    // On a full load of a parent route, effects fire child-first, so the scoped provider
    // applies first and the global one would otherwise clobber it — the global provider
    // defers the class toggle on parent routes and lets the scoped provider own it.
    useEffect(() => {
        if (!(storageKey === GLOBAL_KEY && onParentRoute())) {
            document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
        }
        localStorage.setItem(storageKey, theme);
    }, [theme, resolvedTheme, storageKey]);

    // Scoped providers restore the global (admin) theme when they unmount, so navigating
    // away from the scoped area (e.g. parent portal → login) doesn't leave a stale class.
    useEffect(() => {
        if (storageKey === GLOBAL_KEY) return;
        return () => {
            const t = (localStorage.getItem(GLOBAL_KEY) as Theme) ?? 'system';
            const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', dark);
        };
    }, [storageKey]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
