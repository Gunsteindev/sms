'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { type Locale, type Translations, LOCALE_KEY, getTranslations } from '@/lib/i18n';

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
    locale: 'en',
    setLocale: () => {},
    t: getTranslations('en'),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window === 'undefined') return 'en';
        try {
            const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
            const valid: Locale[] = ['en', 'fr', 'es', 'pt', 'de'];
            if (saved && valid.includes(saved)) return saved;
        } catch { /* ignore */ }
        return 'en';
    });

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        try { localStorage.setItem(LOCALE_KEY, next); } catch { /* ignore */ }
    }, []);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t: getTranslations(locale) }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
