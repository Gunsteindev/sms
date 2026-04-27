import en from './locales/en';
import fr from './locales/fr';
import es from './locales/es';
import pt from './locales/pt';
import de from './locales/de';
import type { Translations } from './locales/en';

export type Locale = 'en' | 'fr' | 'es' | 'pt' | 'de';

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'en', label: 'English',    flag: '🇬🇭' },
  { value: 'fr', label: 'Français',   flag: '🇫🇷' },
  { value: 'es', label: 'Español',    flag: '🇪🇸' },
  { value: 'pt', label: 'Português',  flag: '🇵🇹' },
  { value: 'de', label: 'Deutsch',    flag: '🇩🇪' },
];

export const LOCALE_KEY = 'sms-locale';

const TRANSLATIONS: Record<Locale, Translations> = { en, fr, es, pt, de };

export function getTranslations(locale: Locale): Translations {
  return TRANSLATIONS[locale] ?? TRANSLATIONS.en;
}

export type { Translations };
