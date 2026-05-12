'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  GraduationCap, School, Phone, Palette, ChevronRight, ChevronLeft,
  Loader2, X, ImageIcon, Check, Plus, Building2, ArrowLeft, Search, LayoutGrid, Settings,
} from 'lucide-react';
import { MODULE_GROUPS, ALL_MODULE_KEYS } from '@/lib/modules'; // used in modules mode (existing schools)
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/switch';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import type { SchoolType, SchoolLevel, SchoolProfile } from '@/lib/dataverse/school';
import { BRAND_SCHOOL_KEY, MODULES_KEY } from '@/contexts/BrandContext';

/* ── Constants ─────────────────────────────────────────────────────────────── */

const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const SCHOOL_TYPES = [
  { value: 'ges'       as SchoolType, flag: '🇬🇭', label: 'Ghana GES',    desc: 'GES curriculum'    },
  { value: 'cambridge' as SchoolType, flag: '🇬🇧', label: 'Cambridge',     desc: 'IGCSE / A-Level'   },
  { value: 'ib'        as SchoolType, flag: '🌐',  label: 'IB',            desc: 'PYP / MYP / DP'    },
  { value: 'american'  as SchoolType, flag: '🇺🇸', label: 'American',      desc: 'K-12 curriculum'   },
  { value: 'french'    as SchoolType, flag: '🇫🇷', label: 'French',        desc: 'Lycée français'    },
  { value: 'mixed'     as SchoolType, flag: '🏫',  label: 'Mixed / Other', desc: 'Multiple curricula' },
];

const SCHOOL_LEVELS = [
  { value: 'primary'       as SchoolLevel, label: 'Primary (Basic 1–6)' },
  { value: 'jhs'           as SchoolLevel, label: 'JHS (1–3)'           },
  { value: 'shs'           as SchoolLevel, label: 'SHS (1–3)'           },
  { value: 'international' as SchoolLevel, label: 'International'       },
  { value: 'all'           as SchoolLevel, label: 'All Levels'          },
];

const REGIONS = [
  'Greater Accra','Ashanti','Western','Eastern','Central','Volta',
  'Northern','Upper East','Upper West','Brong-Ahafo','Western North',
  'Ahafo','Bono','Bono East','Oti','Savannah','North East',
];

const CURRENCIES = [
  { value: 'GHS', label: 'GHS — Ghana Cedi (₵)'   },
  { value: 'USD', label: 'USD — US Dollar ($)'      },
  { value: 'GBP', label: 'GBP — British Pound (£)' },
  { value: 'EUR', label: 'EUR — Euro (€)'           },
  { value: 'XOF', label: 'XOF — West African CFA'  },
];

const COLOR_PRESETS = [
  { name: 'Ocean Blue',   primary: '#2563eb', sidebar: '#0f172a' },
  { name: 'Forest Green', primary: '#16a34a', sidebar: '#14532d' },
  { name: 'Crimson',      primary: '#dc2626', sidebar: '#450a0a' },
  { name: 'Purple',       primary: '#7c3aed', sidebar: '#2e1065' },
  { name: 'Amber',        primary: '#d97706', sidebar: '#451a03' },
  { name: 'Teal',         primary: '#0891b2', sidebar: '#083344' },
  { name: 'Rose',         primary: '#e11d48', sidebar: '#4c0519' },
  { name: 'Slate',        primary: '#475569', sidebar: '#0f172a' },
];

const WIZARD_STEPS = [
  { icon: School,  label: 'School Identity', desc: 'Name, type & curriculum' },
  { icon: Phone,   label: 'Contact Details', desc: 'Location & contact info' },
  { icon: Palette, label: 'Branding',        desc: 'Logo & brand colours'    },
];

const DEFAULT_DRAFT = {
  name: '', motto: '', type: 'ges' as SchoolType, level: 'all' as SchoolLevel,
  emiscode: '', currency: 'GHS',
  address: '', district: '', region: '', phone: '', email: '', website: '',
  logo: '', primarycolor: '#2563eb', sidebarcolor: '#0f172a',
};

const TYPE_LABEL: Record<string, string> = {
  ges: 'GES', cambridge: 'Cambridge', ib: 'IB',
  american: 'American', french: 'French', mixed: 'Mixed',
};


/* ── Sub-components ──────────────────────────────────────────────────────── */

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function LogoUpload({ value, onChange }: { value: string; onChange: (b64: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 320;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} />
      {value ? (
        <div className="relative group inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="logo"
            className="h-24 w-24 rounded-xl object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 cursor-pointer shadow-sm"
            onClick={() => inputRef.current?.click()} />
          <button type="button" onClick={() => onChange('')}
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
          className={`h-24 w-24 flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-colors ${
            dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}>
          <ImageIcon className="h-6 w-6 text-slate-300 dark:text-slate-600" />
          <span className="text-[9px] font-medium text-slate-400 text-center leading-tight">Drop or<br/>click</span>
        </button>
      )}
    </>
  );
}

function ColorSwatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hex, setHex] = useState(value);
  useEffect(() => { setHex(value); }, [value]);
  const handleHex = (v: string) => {
    setHex(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
  };
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="h-10 w-10 flex-shrink-0 rounded-lg border-2 border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600 cursor-pointer transition-transform hover:scale-105"
          style={{ backgroundColor: value }} />
        <input ref={inputRef} type="color" value={value}
          onChange={e => { onChange(e.target.value); setHex(e.target.value); }} className="sr-only" />
        <Input value={hex} onChange={e => handleHex(e.target.value)}
          placeholder="#2563eb" className="font-mono text-sm" maxLength={7} />
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

type Mode = 'select' | 'create' | 'modules';

export default function OnboardingPage() {
  const [mode, setMode]               = useState<Mode>('select');
  const [schools, setSchools]         = useState<SchoolProfile[]>([]);
  const [loadingSchools, setLoading]  = useState(true);
  const [selecting, setSelecting]     = useState<string | null>(null);
  const [search, setSearch]           = useState('');

  // Module editor (select mode)
  const [moduleSchool, setModuleSchool] = useState<SchoolProfile | null>(null);
  const [schoolMods, setSchoolMods]     = useState<string[]>(ALL_MODULE_KEYS);
  const [savingMods, setSavingMods]     = useState(false);
  const [modsError, setModsError]       = useState('');

  // Wizard
  const [step, setStep]   = useState(1);
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.region.toLowerCase().includes(q) ||
      s.district.toLowerCase().includes(q) ||
      (s.type && TYPE_LABEL[s.type]?.toLowerCase().includes(q))
    );
  }, [schools, search]);

  const loadSchools = useCallback(async () => {
    try {
      const res = await fetch('/api/school/list');
      const j   = await res.json();
      const list: SchoolProfile[] = j?.data ?? [];
      setSchools(list);
      if (list.length === 0) setMode('create');
    } catch {
      setMode('create');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  /* ── School selection ───────────────────────────────────── */
  const selectSchool = async (id: string) => {
    setSelecting(id);
    try {
      const res = await fetch('/api/school/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: id }),
      });
      if (!res.ok) throw new Error();
      // Clear stale sidebar cache so BrandContext fetches fresh data for the selected school
      localStorage.removeItem(BRAND_SCHOOL_KEY);
      window.location.replace('/dashboard');
    } catch {
      setSelecting(null);
    }
  };

  /* ── Module management (existing schools) ───────────────── */
  const enterModules = (s: SchoolProfile) => {
    setModuleSchool(s);
    setSchoolMods(s.enabledmodules?.length ? s.enabledmodules : ALL_MODULE_KEYS);
    setModsError('');
    setMode('modules');
  };

  const saveModules = async () => {
    if (!moduleSchool) return;
    setSavingMods(true);
    setModsError('');
    try {
      const res = await fetch(`/api/school/${moduleSchool.schoolid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledmodules: schoolMods }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Failed to save');
      }
      // Switch the active school session to the one whose modules were just updated,
      // then clear both caches so BrandContext re-fetches the correct data on remount.
      await fetch('/api/school/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: moduleSchool.schoolid }),
      });
      localStorage.removeItem(MODULES_KEY);
      localStorage.removeItem(BRAND_SCHOOL_KEY);
      window.location.replace('/dashboard');
    } catch (e) {
      setModsError(e instanceof Error ? e.message : 'Failed to save modules');
      setSavingMods(false);
    }
  };

  /* ── Wizard ─────────────────────────────────────────────── */
  const set = (k: keyof typeof DEFAULT_DRAFT, v: string) => setDraft(p => ({ ...p, [k]: v }));

  const next = () => {
    if (step === 1 && !draft.name.trim()) { setError('School name is required.'); return; }
    setError('');
    setStep(s => Math.min(3, s + 1));
  };

  const back = () => { setError(''); setStep(s => Math.max(1, s - 1)); };

  const complete = async () => {
    if (!draft.name.trim()) { setError('School name is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? 'Setup failed'); }
      // Clear both brand caches so BrandContext fetches the new school's data, not the old one's.
      localStorage.removeItem(BRAND_SCHOOL_KEY);
      localStorage.removeItem(MODULES_KEY);
      window.location.replace('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Setup failed. Please try again.');
      setSaving(false);
    }
  };

  const enterCreate = () => { setStep(1); setDraft(DEFAULT_DRAFT); setError(''); setMode('create'); };
  const backToSelect = () => { setError(''); setStep(1); setMode('select'); };

  const stepTitles = ['Tell us about your school', 'Where can we reach you?', 'Make it yours'];
  const stepSubs   = [
    "Start with your school's basic identity and curriculum.",
    'Add your location and contact information.',
    'Upload a logo and choose your brand colours. You can skip this for now.',
  ];

  /* ─────────────────────────── Render ────────────────────────────────────── */

  return (
    <div className={`${mode === 'modules' ? 'h-screen overflow-hidden' : 'min-h-screen'} flex`}>

      {/* ── Left panel ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col flex-1 px-10 py-10">

          {/* Brand */}
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-white leading-none">SchoolMS</p>
              <p className="text-[11px] text-slate-500 mt-0.5">School Setup</p>
            </div>
          </div>

          {mode === 'select' ? (
            /* Select-mode left panel */
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                  Welcome.<br />Pick your<br />school.
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Select an existing school to manage, or register a new one to get started.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3.5 rounded-xl bg-white/10 p-3.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Choose a school</p>
                    <p className="text-[11px] text-slate-500">Select from the list to activate it</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 rounded-xl p-3.5 opacity-50">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-400">Manage modules</p>
                    <p className="text-[11px] text-slate-500">Click the ⚙ icon next to a school</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 rounded-xl p-3.5 opacity-50">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-400">Register new school</p>
                    <p className="text-[11px] text-slate-500">4-step guided setup</p>
                  </div>
                </div>
              </div>
            </>
          ) : mode === 'modules' && moduleSchool ? (
            /* Modules-mode left panel */
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                  Module<br />Access.
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Control which features are available to <span className="text-white font-medium">{moduleSchool.name}</span>. Changes take effect immediately.
                </p>
              </div>
              <div className="flex items-center gap-3.5 rounded-xl bg-white/10 p-3.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500">
                  <LayoutGrid className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{moduleSchool.name}</p>
                  <p className="text-[11px] text-slate-500">{schoolMods.length} of {ALL_MODULE_KEYS.length} modules active</p>
                </div>
              </div>
            </>
          ) : (
            /* Create-mode left panel */
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                  Let&apos;s set up<br />your school.
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Complete these three steps to get your school management system ready.
                </p>
              </div>

              <div className="space-y-2.5">
                {WIZARD_STEPS.map((s, i) => {
                  const n       = i + 1;
                  const done    = step > n;
                  const current = step === n;
                  const Icon    = s.icon;
                  return (
                    <div key={n} className={`flex items-center gap-3.5 rounded-xl p-3 transition-all ${current ? 'bg-white/10' : 'opacity-50'}`}>
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${done ? 'bg-emerald-500' : current ? 'bg-blue-500' : 'bg-white/10'}`}>
                        {done ? <Check className="h-3.5 w-3.5 text-white" /> : <Icon className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${current ? 'text-white' : 'text-slate-400'}`}>{s.label}</p>
                        <p className="text-[11px] text-slate-500">{s.desc}</p>
                      </div>
                      {current && <ChevronRight className="h-4 w-4 text-slate-500 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-auto pt-8">
            <p className="text-xs text-slate-600">Your data is encrypted and stored securely in Microsoft Dataverse.</p>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col ${mode === 'modules' ? 'overflow-hidden' : 'overflow-y-auto'} bg-white dark:bg-slate-950`}>
        <div className={`${mode === 'modules' ? 'w-full overflow-hidden' : 'max-w-lg'} mx-auto px-8 py-8 flex-1 flex flex-col min-h-0`}>

          {/* Mobile brand */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">SchoolMS Setup</p>
          </div>

          {/* ──────────── SELECT MODE ──────────── */}
          {mode === 'select' && (
            <div className="flex flex-col flex-1 min-h-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">School Management</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Choose your school</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Select a school to manage, or register a new one.
              </p>

              {loadingSchools ? (
                <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading schools…</span>
                </div>
              ) : (
                <>
                  {/* Search bar */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by name, region or type…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2.5 pl-9 pr-9 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    />
                    {search && (
                      <button onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Count */}
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2 px-0.5">
                    {search
                      ? `${filtered.length} of ${schools.length} school${schools.length !== 1 ? 's' : ''}`
                      : `${schools.length} school${schools.length !== 1 ? 's' : ''}`}
                  </p>

                  {/* Scrollable list */}
                  <div className="overflow-y-auto flex-1 min-h-0 max-h-[340px] rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-sm">

                    {filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                        <Search className="h-8 w-8 opacity-20" />
                        <p className="text-sm font-medium">No schools match &ldquo;{search}&rdquo;</p>
                        <button onClick={() => setSearch('')}
                          className="text-xs text-blue-500 hover:text-blue-600 font-medium mt-1 transition-colors">
                          Clear search
                        </button>
                      </div>
                    ) : (
                      filtered.map(s => {
                        const isSelecting = selecting === s.schoolid;
                        return (
                          <div key={s.schoolid} className="flex items-center group">
                            <button
                              onClick={() => selectSchool(s.schoolid)}
                              disabled={!!selecting}
                              className="flex-1 flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-900/10 disabled:opacity-60"
                            >
                              {/* Avatar */}
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                                {s.name.charAt(0).toUpperCase()}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                                  {s.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {s.type && (
                                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-1.5 py-px text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                      {TYPE_LABEL[s.type] ?? s.type}
                                    </span>
                                  )}
                                  {s.level && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{s.level}</span>
                                  )}
                                  {s.region && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{s.region}</span>
                                  )}
                                </div>
                              </div>

                              {/* Action */}
                              {isSelecting ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                              )}
                            </button>

                            {/* Manage modules button */}
                            <button
                              onClick={() => enterModules(s)}
                              disabled={!!selecting}
                              title="Manage modules"
                              className="flex-shrink-0 h-full px-3 py-3.5 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-900/10 disabled:opacity-40 transition-colors border-l border-slate-100 dark:border-slate-800"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Register new school — pinned below scroll area */}
                  <button
                    onClick={enterCreate}
                    disabled={!!selecting}
                    className="mt-3 w-full flex items-center gap-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 px-4 py-3.5 text-left transition-all hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 disabled:opacity-60 group"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-500 transition-colors">
                      <Plus className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        Register new school
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">4-step guided setup · takes a few minutes</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-400 flex-shrink-0 transition-colors" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* ──────────── MODULES MODE ──────────── */}
          {mode === 'modules' && moduleSchool && (
            <div className="flex flex-col flex-1 min-h-0 w-full">

              {/* Back + header row — fixed height */}
              <div className="flex-shrink-0 flex items-center gap-4 mb-3">
                <button
                  onClick={() => setMode('select')}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                    {moduleSchool.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                      {moduleSchool.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${(schoolMods.length / ALL_MODULE_KEYS.length) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {schoolMods.length}/{ALL_MODULE_KEYS.length} active
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button type="button" onClick={() => setSchoolMods(ALL_MODULE_KEYS)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Enable all
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <button type="button" onClick={() => setSchoolMods([])}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:underline">
                    Disable all
                  </button>
                  <Button onClick={saveModules} disabled={savingMods} className="h-8 text-xs px-3">
                    {savingMods
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Saving…</>
                      : <><Check className="h-3.5 w-3.5 mr-1" /> Save</>}
                  </Button>
                </div>
              </div>

              {/* Error — fixed height, only shown on error */}
              {modsError && (
                <div className="flex-shrink-0 mb-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 px-4 py-2 text-sm text-red-700 dark:text-red-400">
                  {modsError}
                </div>
              )}

              {/* Card grid — fills all remaining height, 3×2 at xl */}
              <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 xl:grid-rows-2 gap-3">
                {MODULE_GROUPS.map(group => {
                  const groupKeys   = group.modules.map(m => m.key);
                  const activeCount = groupKeys.filter(k => schoolMods.includes(k)).length;
                  const allOn       = activeCount === groupKeys.length;
                  const someOn      = activeCount > 0 && !allOn;
                  const toggleGroup = () => {
                    if (allOn) setSchoolMods(schoolMods.filter(k => !groupKeys.includes(k)));
                    else       setSchoolMods([...new Set([...schoolMods, ...groupKeys])]);
                  };
                  return (
                    <div key={group.group} className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-h-0">
                      {/* Group header — fixed */}
                      <div className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60">
                        <Switch
                          checked={allOn}
                          onCheckedChange={toggleGroup}
                          className={someOn ? 'data-[state=unchecked]:bg-blue-200 dark:data-[state=unchecked]:bg-blue-900' : ''}
                        />
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 flex-1 truncate">
                          {group.group}
                        </p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          allOn
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                            : someOn
                              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {activeCount}/{groupKeys.length}
                        </span>
                      </div>
                      {/* Module rows — scrollable if group has many items */}
                      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                        {group.modules.map(mod => {
                          const on = schoolMods.includes(mod.key);
                          return (
                            <div key={mod.key} className="flex items-center gap-3 px-3.5 py-2">
                              <Switch
                                checked={on}
                                onCheckedChange={checked => setSchoolMods(checked
                                  ? [...schoolMods, mod.key]
                                  : schoolMods.filter(k => k !== mod.key)
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-medium leading-tight ${on ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {mod.label}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">{mod.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer — fixed height */}
              <div className="flex-shrink-0 flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={() => setMode('select')} disabled={savingMods}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button onClick={saveModules} disabled={savingMods}>
                  {savingMods
                    ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…</>
                    : <><Check className="h-4 w-4 mr-1.5" /> Save Modules</>}
                </Button>
              </div>
            </div>
          )}

          {/* ──────────── CREATE MODE ──────────── */}
          {mode === 'create' && (
            <>
              {/* Back link (only when schools exist) */}
              {schools.length > 0 && (
                <button onClick={backToSelect}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6 transition-colors self-start">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to school list
                </button>
              )}

              {/* Progress bar */}
              <div className="flex gap-1.5 mb-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= n ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                ))}
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                Step {step} of 3
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{stepTitles[step - 1]}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">{stepSubs[step - 1]}</p>

              {/* Step content */}
              <div className="flex-1 space-y-4">

                {step === 1 && (
                  <>
                    <F label="School Name *">
                      <Input value={draft.name} onChange={e => set('name', e.target.value)}
                        placeholder="e.g. Accra Academy" autoFocus />
                    </F>
                    <F label="Motto / Tagline">
                      <Input value={draft.motto} onChange={e => set('motto', e.target.value)}
                        placeholder="e.g. Excellence in Education" />
                    </F>

                    <F label="School Type">
                      <div className="grid grid-cols-3 gap-2">
                        {SCHOOL_TYPES.map(t => (
                          <button key={t.value} type="button" onClick={() => set('type', t.value)}
                            className={`flex items-center gap-2 rounded-lg border-2 px-2.5 py-2 text-left transition-all ${
                              draft.type === t.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}>
                            <span className="text-lg leading-none">{t.flag}</span>
                            <div className="min-w-0">
                              <p className={`text-[11px] font-semibold truncate ${draft.type === t.value ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{t.label}</p>
                              <p className="text-[9px] text-slate-400 truncate">{t.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </F>

                    <F label="School Level">
                      <div className="flex flex-wrap gap-1.5">
                        {SCHOOL_LEVELS.map(l => (
                          <button key={l.value} type="button" onClick={() => set('level', l.value)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border-2 transition-all ${
                              draft.level === l.value
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}>
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </F>

                    <div className="grid grid-cols-2 gap-3">
                      <F label="EMIS Code">
                        <Input value={draft.emiscode} onChange={e => set('emiscode', e.target.value)} placeholder="e.g. G1234567" />
                      </F>
                      <F label="Currency">
                        <SelectRoot value={draft.currency} onValueChange={v => set('currency', v ?? draft.currency)}>
                          <SelectTrigger className={ST}>
                            <SelectValue>{CURRENCIES.find(c => c.value === draft.currency)?.label ?? draft.currency}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </SelectRoot>
                      </F>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <F label="Address">
                      <Input value={draft.address} onChange={e => set('address', e.target.value)}
                        placeholder="e.g. Ring Road Central, Accra" autoFocus />
                    </F>
                    <div className="grid grid-cols-2 gap-3">
                      <F label="District">
                        <Input value={draft.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Accra Metro" />
                      </F>
                      <F label="Region">
                        <SelectRoot value={draft.region} onValueChange={v => set('region', v ?? draft.region)}>
                          <SelectTrigger className={ST}>
                            <SelectValue>{draft.region || '— Select —'}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">— Select —</SelectItem>
                            {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </SelectRoot>
                      </F>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <F label="Phone">
                        <Input value={draft.phone} onChange={e => set('phone', e.target.value)} placeholder="+233 30 000 0000" />
                      </F>
                      <F label="Email">
                        <Input value={draft.email} onChange={e => set('email', e.target.value)} type="email" placeholder="info@school.edu.gh" />
                      </F>
                    </div>
                    <F label="Website">
                      <Input value={draft.website} onChange={e => set('website', e.target.value)} placeholder="www.school.edu.gh" />
                    </F>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
                      All branding fields are optional. You can update them anytime from Setup → School Profile.
                    </div>

                    <F label="School Logo">
                      <LogoUpload value={draft.logo} onChange={v => set('logo', v)} />
                    </F>

                    <div className="grid grid-cols-2 gap-4">
                      <ColorSwatch label="Primary Colour" value={draft.primarycolor} onChange={v => set('primarycolor', v)} />
                      <ColorSwatch label="Sidebar Colour" value={draft.sidebarcolor} onChange={v => set('sidebarcolor', v)} />
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Presets</p>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map(p => (
                          <button key={p.name} type="button" title={p.name}
                            onClick={() => { set('primarycolor', p.primary); set('sidebarcolor', p.sidebar); }}
                            className="relative h-9 w-9 rounded-lg border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-blue-400 transition-all overflow-hidden">
                            <div className="absolute inset-0 right-1/2" style={{ backgroundColor: p.sidebar }} />
                            <div className="absolute inset-0 left-1/2" style={{ backgroundColor: p.primary }} />
                            <span className="sr-only">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Preview</p>
                      <div className="flex rounded-xl overflow-hidden shadow border border-slate-200 dark:border-slate-700 h-20">
                        <div className="w-16 flex flex-col gap-1 p-2" style={{ backgroundColor: draft.sidebarcolor }}>
                          <div className="h-2 rounded-md" style={{ backgroundColor: draft.primarycolor }} />
                          <div className="h-1 rounded bg-white/20" />
                          <div className="h-1 rounded bg-white/20" />
                          <div className="h-1 rounded bg-white/15" />
                        </div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-2 flex flex-col gap-1.5">
                          <div className="h-1.5 w-2/3 rounded bg-slate-300 dark:bg-slate-600" />
                          <div className="flex gap-1">
                            <div className="h-8 flex-1 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600"
                              style={{ borderTopColor: draft.primarycolor, borderTopWidth: 2 }} />
                            <div className="h-8 flex-1 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                {step > 1 ? (
                  <Button variant="outline" onClick={back} disabled={saving}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                ) : schools.length > 0 ? (
                  <Button variant="outline" onClick={backToSelect} disabled={saving}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> School list
                  </Button>
                ) : <div />}

                {step < 3 ? (
                  <Button onClick={next}>
                    Continue <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={complete} disabled={saving}>
                    {saving
                      ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Setting up…</>
                      : <><Check className="h-4 w-4 mr-1.5" /> Complete Setup</>}
                  </Button>
                )}
              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
