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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'system';
        return (localStorage.getItem('sms-theme') as Theme) ?? 'system';
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

    // Apply the theme class to <html> whenever resolvedTheme changes
    useEffect(() => {
        document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
        localStorage.setItem('sms-theme', theme);
    }, [theme, resolvedTheme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
