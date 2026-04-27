'use client';

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Monitor, Bell, BellOff, Globe, Info, Shield, Database, Palette, MapPin, Lock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { LOCALES, type Locale } from '@/lib/i18n';

type Theme = 'light' | 'dark' | 'system';

interface NotifPrefs {
  attendanceAlerts: boolean;
  feeReminders:     boolean;
  systemUpdates:    boolean;
}

const NOTIF_KEY = 'sms-notif-prefs';
const DEFAULT_NOTIF: NotifPrefs = { attendanceAlerts: true, feeReminders: true, systemUpdates: false };

const NAV_ITEMS = [
  { id: 'appearance',    labelKey: 'appearance',    icon: Palette  },
  { id: 'notifications', labelKey: 'notifications', icon: Bell     },
  { id: 'regional',      labelKey: 'regional',      icon: MapPin   },
  { id: 'security',      labelKey: 'security',      icon: Shield   },
  { id: 'about',         labelKey: 'about',         icon: Info     },
] as const;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  );
}

function Card({ id, title, description, children }: {
  id: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden scroll-mt-6">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ icon: Icon, label, value, accent = false }: {
  icon: React.ElementType; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${accent ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
        <Icon className={`h-4 w-4 ${accent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const [active, setActive] = useState('appearance');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTIF_KEY);
      if (saved) setNotif({ ...DEFAULT_NOTIF, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { for (const e of entries) { if (e.isIntersecting) setActive(e.target.id); } },
      { root: null, rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const sec = document.getElementById(id);
      if (sec) observer.observe(sec);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);
  };

  const updateNotif = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...notif, [key]: value };
    setNotif(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    toast.success(t.settings.prefsSaved);
  };

  const handleSetLocale = (next: Locale) => {
    setLocale(next);
    toast.success(`Language set to ${LOCALES.find(l => l.value === next)?.label}`);
  };

  const THEMES: { value: Theme; label: string; icon: React.ElementType; desc: string }[] = [
    { value: 'light',  label: t.settings.light,  icon: Sun,     desc: t.settings.lightDesc  },
    { value: 'dark',   label: t.settings.dark,   icon: Moon,    desc: t.settings.darkDesc   },
    { value: 'system', label: t.settings.system, icon: Monitor, desc: t.settings.systemDesc },
  ];

  const NOTIF_ROWS: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: 'attendanceAlerts', label: t.settings.attendanceAlerts,  desc: t.settings.attendanceAlertsDesc },
    { key: 'feeReminders',     label: t.settings.feeReminders,      desc: t.settings.feeRemindersDesc     },
    { key: 'systemUpdates',    label: t.settings.systemUpdates,     desc: t.settings.systemUpdatesDesc    },
  ];

  const navLabels: Record<string, string> = {
    appearance:    t.settings.appearance,
    notifications: t.settings.notifications,
    regional:      t.settings.regional,
    security:      t.settings.security,
    about:         t.settings.about,
  };

  return (
    <div className="max-w-5xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.settings.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.settings.subtitle}</p>
      </div>

      <div className="flex gap-6 items-start">

        {/* Sticky sidebar nav */}
        <aside className="hidden lg:block w-48 flex-shrink-0 sticky top-6">
          <nav className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {NAV_ITEMS.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                  active === id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium border-r-2 border-blue-500'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {navLabels[labelKey]}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div ref={contentRef} className="flex-1 min-w-0 space-y-5">

          {/* Appearance */}
          <Card id="appearance" title={t.settings.appearance} description={t.settings.appearanceDesc}>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    onClick={() => { setTheme(value); toast.success(`${t.settings.themeSet} ${label}`); }}
                    className={`relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-5 transition-all ${
                      theme === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {theme === value && (
                      <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-[9px] text-white font-bold">✓</span>
                      </span>
                    )}
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      theme === value ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${theme === value ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card id="notifications" title={t.settings.notifications} description={t.settings.notificationsDesc}>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {NOTIF_ROWS.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${notif[key] ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                      {notif[key]
                        ? <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        : <BellOff className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <Toggle checked={notif[key]} onChange={v => updateNotif(key, v)} />
                </div>
              ))}
            </div>
          </Card>

          {/* Regional + Security side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <Card id="regional" title={t.settings.regional} description={t.settings.regionalDesc}>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {/* Language switcher */}
                <div className="px-6 py-4">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">{t.settings.language}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LOCALES.map(loc => (
                      <button
                        key={loc.value}
                        onClick={() => handleSetLocale(loc.value)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium border transition-all ${
                          locale === loc.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-base leading-none">{loc.flag}</span>
                        <span className="truncate">{loc.label}</span>
                        {locale === loc.value && <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
                <InfoRow icon={Globe} label={t.settings.currency}    value="GHS — Ghana Cedi"        />
                <InfoRow icon={Globe} label={t.settings.dateFormat}  value="DD / MM / YYYY"          />
                <InfoRow icon={Globe} label={t.settings.timezone}    value="GMT+0 · Ghana"           />
              </div>
            </Card>

            <Card id="security" title={t.settings.security} description={t.settings.securityDesc}>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                <InfoRow icon={Shield} label={t.settings.authentication}  value={t.settings.localCreds}    accent />
                <InfoRow icon={Shield} label={t.settings.sessionTimeout}  value={t.settings.hours24}               />
                <InfoRow icon={Shield} label={t.settings.accessLevel}     value={t.settings.administrator} accent />
              </div>
            </Card>

          </div>

          {/* About */}
          <Card id="about" title={t.settings.about} description={t.settings.aboutDesc}>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-50 dark:divide-slate-800">
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                <InfoRow icon={Info}     label={t.settings.application} value="School Management System"           />
                <InfoRow icon={Info}     label={t.settings.version}     value="1.0.0"                              />
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                <InfoRow icon={Database} label={t.settings.dataSource}  value="Microsoft Dataverse"                />
                <InfoRow icon={Info}     label={t.settings.framework}   value="Next.js · React · TypeScript"       />
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
