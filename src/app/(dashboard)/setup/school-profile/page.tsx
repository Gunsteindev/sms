'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Save, School, Phone, Mail, Globe, MapPin, Hash, Building2,
  Plus, Pencil, Trash2, Star, GitBranch, Loader2, X, ImageIcon, Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select';
import { schoolAPI } from '@/lib/api-client';
import { useBrand } from '@/contexts/BrandContext';
import type { SchoolProfile, SchoolBranch, SchoolType, SchoolLevel } from '@/lib/dataverse/school';

const ST = 'w-full h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100';

const SCHOOL_TYPES: { value: SchoolType; label: string; desc: string; flag: string }[] = [
  { value: 'ges',       flag: '🇬🇭', label: 'Ghana GES',       desc: 'GES curriculum'            },
  { value: 'cambridge', flag: '🇬🇧', label: 'Cambridge',        desc: 'IGCSE / A-Level'           },
  { value: 'ib',        flag: '🌐',  label: 'IB',               desc: 'PYP / MYP / DP'            },
  { value: 'american',  flag: '🇺🇸', label: 'American',         desc: 'K-12 curriculum'           },
  { value: 'french',    flag: '🇫🇷', label: 'French',           desc: 'Lycée français'            },
  { value: 'mixed',     flag: '🏫',  label: 'Mixed / Other',    desc: 'Multiple curricula'        },
];

const SCHOOL_LEVELS: { value: SchoolLevel; label: string }[] = [
  { value: 'primary',       label: 'Primary (Basic 1–6)'    },
  { value: 'jhs',           label: 'JHS (1–3)'              },
  { value: 'shs',           label: 'SHS (1–3)'              },
  { value: 'international', label: 'International'          },
  { value: 'all',           label: 'All Levels'             },
];

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo',
  'Western North', 'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East',
];

const CURRENCIES = [
  { value: 'GHS', label: 'GHS — Ghana Cedi (₵)'      },
  { value: 'USD', label: 'USD — US Dollar ($)'         },
  { value: 'GBP', label: 'GBP — British Pound (£)'    },
  { value: 'EUR', label: 'EUR — Euro (€)'              },
  { value: 'XOF', label: 'XOF — West African CFA'     },
];

const DEFAULT_DRAFT: Omit<SchoolProfile, 'schoolid'> = {
  name: '', motto: '', type: 'ges', level: 'all',
  address: '', phone: '', email: '', currency: 'GHS',
  website: '', emiscode: '', district: '', region: '', logo: '',
  primarycolor: '#2563eb', sidebarcolor: '#0f172a',
  enabledmodules: [],
  rolemoduleaccess: {},
};

const COLOR_PRESETS: { name: string; primary: string; sidebar: string }[] = [
  { name: 'Ocean Blue',    primary: '#2563eb', sidebar: '#0f172a' },
  { name: 'Forest Green',  primary: '#16a34a', sidebar: '#14532d' },
  { name: 'Crimson',       primary: '#dc2626', sidebar: '#450a0a' },
  { name: 'Purple',        primary: '#7c3aed', sidebar: '#2e1065' },
  { name: 'Amber',         primary: '#d97706', sidebar: '#451a03' },
  { name: 'Teal',          primary: '#0891b2', sidebar: '#083344' },
  { name: 'Rose',          primary: '#e11d48', sidebar: '#4c0519' },
  { name: 'Slate',         primary: '#475569', sidebar: '#0f172a' },
];

type BranchDraft = Omit<SchoolBranch, 'branchid' | 'schoolid'>;
const EMPTY_BRANCH: BranchDraft = {
  name: '', address: '', district: '', region: '', phone: '', email: '', ismain: false,
};

/* ── Micro-components ───────────────────────────────────────────────────── */

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function Card({ title, icon: Icon, children, action, noPad }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
  action?: React.ReactNode; noPad?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
        </div>
        {action}
      </div>
      <div className={noPad ? '' : 'p-5 space-y-4'}>{children}</div>
    </div>
  );
}

function LogoUpload({ value, onChange }: { value: string; onChange: (b64: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
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
      <input
        ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }}
      />
      {value ? (
        <div className="relative group flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value} alt="School logo"
            className="h-20 w-20 rounded-xl object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 cursor-pointer shadow-sm"
            onClick={() => inputRef.current?.click()}
          />
          <button
            type="button" onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove logo"
          >
            <X className="h-3 w-3" />
          </button>
          <button
            type="button" onClick={() => inputRef.current?.click()}
            className="absolute inset-0 rounded-xl flex items-end justify-center pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
          >
            <span className="text-[9px] text-white font-semibold bg-black/50 rounded px-1.5 py-0.5">Change</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
          className={`h-20 w-20 flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors ${
            dragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ImageIcon className="h-5 w-5 text-slate-300 dark:text-slate-600" />
          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 text-center leading-tight px-1">Add<br/>Logo</span>
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
      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-10 w-10 flex-shrink-0 rounded-lg border-2 border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600 cursor-pointer transition-transform hover:scale-105"
          style={{ backgroundColor: value }}
          title="Click to open color picker"
        />
        <input
          ref={inputRef} type="color" value={value}
          onChange={e => { onChange(e.target.value); setHex(e.target.value); }}
          className="sr-only"
        />
        <Input
          value={hex}
          onChange={e => handleHex(e.target.value)}
          placeholder="#2563eb"
          className="font-mono text-sm"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function BranchForm({ value, onChange }: { value: BranchDraft; onChange: (b: BranchDraft) => void }) {
  const set = (k: keyof BranchDraft, v: string | boolean) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <F label="Branch Name *">
        <Input value={value.name} onChange={e => set('name', e.target.value)} placeholder="e.g. North Campus" />
      </F>
      <F label="Address">
        <Input value={value.address} onChange={e => set('address', e.target.value)} placeholder="e.g. Liberation Road, Accra" />
      </F>
      <div className="grid grid-cols-2 gap-3">
        <F label="District">
          <Input value={value.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Accra Metro" />
        </F>
        <F label="Region">
          <SelectRoot value={value.region} onValueChange={v => set('region', v ?? value.region)}>
            <SelectTrigger className={ST}><SelectValue>{value.region || '— Select —'}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Select —</SelectItem>
              {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </SelectRoot>
        </F>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F label="Phone">
          <Input value={value.phone} onChange={e => set('phone', e.target.value)} placeholder="+233 30 000 0000" />
        </F>
        <F label="Email">
          <Input value={value.email} onChange={e => set('email', e.target.value)} type="email" placeholder="branch@school.edu.gh" />
        </F>
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox" checked={value.ismain}
          onChange={e => set('ismain', e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">Mark as headquarters / main campus</span>
      </label>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function SchoolProfilePage() {
  const { colors, setColors, setSchool } = useBrand();
  const [loading, setLoading]   = useState(true);
  const [schoolId, setSchoolId] = useState('');
  const [draft, setDraft]       = useState<Omit<SchoolProfile, 'schoolid'>>(() => ({
    ...DEFAULT_DRAFT,
    primarycolor: colors.primary,
    sidebarcolor: colors.sidebar,
  }));
  const [branches, setBranches] = useState<SchoolBranch[]>([]);
  const [saving, setSaving]             = useState(false);
  const [savedAt, setSavedAt]           = useState<Date | null>(null);

  const [modalOpen, setModalOpen]       = useState(false);
  const [editingBranch, setEditing]     = useState<SchoolBranch | null>(null);
  const [branchDraft, setBranchDraft]   = useState<BranchDraft>(EMPTY_BRANCH);
  const [toDelete, setToDelete]         = useState<string | null>(null);
  const [branchSaving, setBranchSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [profileRes, branchRes] = await Promise.all([
          schoolAPI.getProfile(),
          schoolAPI.getBranches(),
        ]) as any[];
        if (profileRes?.data) {
          const p: SchoolProfile = profileRes.data;
          setSchoolId(p.schoolid);
          setDraft({ name: p.name, motto: p.motto, type: p.type, level: p.level, address: p.address, phone: p.phone, email: p.email, currency: p.currency, website: p.website, emiscode: p.emiscode, district: p.district, region: p.region, logo: p.logo ?? '', primarycolor: p.primarycolor || colors.primary, sidebarcolor: p.sidebarcolor || colors.sidebar, enabledmodules: p.enabledmodules, rolemoduleaccess: p.rolemoduleaccess ?? {} });
        }
        if (branchRes?.data) setBranches(branchRes.data as SchoolBranch[]);
      } catch {
        toast.error('Failed to load school profile');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: keyof typeof draft, value: string) => setDraft(p => ({ ...p, [key]: value }));

  const save = async () => {
    if (!draft.name.trim()) { toast.error('School name is required'); return; }
    setSaving(true);
    try {
      await schoolAPI.saveProfile(draft);
      setColors({ primary: draft.primarycolor, sidebar: draft.sidebarcolor });
      setSchool({ name: draft.name, motto: draft.motto, logo: draft.logo });
      setSavedAt(new Date());
      toast.success('School profile saved');
    } catch {
      toast.error('Failed to save school profile');
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { setEditing(null); setBranchDraft(EMPTY_BRANCH); setModalOpen(true); };
  const openEdit = (b: SchoolBranch) => {
    setEditing(b);
    setBranchDraft({ name: b.name, address: b.address, district: b.district, region: b.region, phone: b.phone, email: b.email, ismain: b.ismain });
    setModalOpen(true);
  };

  const saveBranch = async () => {
    if (!branchDraft.name.trim()) { toast.error('Branch name is required'); return; }
    setBranchSaving(true);
    try {
      if (editingBranch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await schoolAPI.updateBranch(editingBranch.branchid, branchDraft) as any;
        setBranches(prev => prev.map(b => b.branchid === editingBranch.branchid ? res.data : b));
        toast.success('Branch updated');
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await schoolAPI.createBranch({ ...branchDraft, schoolid: schoolId }) as any;
        setBranches(prev => [...prev, res.data]);
        toast.success('Branch added');
      }
      setModalOpen(false);
    } catch {
      toast.error('Failed to save branch');
    } finally {
      setBranchSaving(false);
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      await schoolAPI.deleteBranch(id);
      setBranches(prev => prev.filter(b => b.branchid !== id));
      toast.success('Branch removed');
    } catch {
      toast.error('Failed to delete branch');
    } finally {
      setToDelete(null);
    }
  };

  const setMain = async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await schoolAPI.setMainBranch(id) as any;
      setBranches(prev => prev.map(b => ({ ...b, ismain: b.branchid === id })));
      toast.success('Main campus updated');
    } catch {
      toast.error('Failed to update main campus');
    }
  };

  const selectedType  = SCHOOL_TYPES.find(t => t.value === draft.type);
  const selectedLevel = SCHOOL_LEVELS.find(l => l.value === draft.level);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">School Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your school&apos;s identity, curriculum, contact details and branches
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {savedAt && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6 items-start">

        {/* ── Left: form ────────────────────────────────────────────── */}
        <div className="space-y-5 min-w-0">

          {/* Identity */}
          <Card title="School Identity" icon={School}>
            {/* Logo + name/motto side by side */}
            <div className="flex gap-4 items-start">
              <LogoUpload value={draft.logo} onChange={v => set('logo', v)} />
              <div className="flex-1 space-y-3">
                <F label="School Name *">
                  <Input value={draft.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Accra Academy" />
                </F>
                <F label="Motto / Tagline">
                  <Input value={draft.motto} onChange={e => set('motto', e.target.value)} placeholder="e.g. Excellence in Education" />
                </F>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="EMIS Code">
                <Input value={draft.emiscode} onChange={e => set('emiscode', e.target.value)} placeholder="e.g. G1234567" />
              </F>
              <F label="Currency">
                <SelectRoot value={draft.currency} onValueChange={v => set('currency', v ?? draft.currency)}>
                  <SelectTrigger className={ST}><SelectValue>{CURRENCIES.find(c => c.value === draft.currency)?.label ?? draft.currency}</SelectValue></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </SelectRoot>
              </F>
            </div>
          </Card>

          {/* Curriculum & Level */}
          <Card title="Curriculum & Level" icon={Building2}>
            <F label="School Type">
              <div className="grid grid-cols-3 gap-2">
                {SCHOOL_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => set('type', t.value)}
                    className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all ${
                      draft.type === t.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}>
                    <span className="text-xl leading-none">{t.flag}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${draft.type === t.value ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{t.label}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </F>
            <F label="School Level">
              <div className="flex flex-wrap gap-2">
                {SCHOOL_LEVELS.map(l => (
                  <button key={l.value} type="button" onClick={() => set('level', l.value)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium border-2 transition-all ${
                      draft.level === l.value
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </F>
          </Card>

          {/* Headquarters Contact */}
          <Card title="Headquarters Contact" icon={Phone}>
            <F label="Address">
              <Input value={draft.address} onChange={e => set('address', e.target.value)} placeholder="e.g. Ring Road Central, Accra" />
            </F>
            <div className="grid grid-cols-2 gap-4">
              <F label="District">
                <Input value={draft.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Accra Metro" />
              </F>
              <F label="Region">
                <SelectRoot value={draft.region} onValueChange={v => set('region', v ?? draft.region)}>
                  <SelectTrigger className={ST}><SelectValue>{draft.region || '— Select —'}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Select —</SelectItem>
                    {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </SelectRoot>
              </F>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <F label="Phone">
                <Input value={draft.phone} onChange={e => set('phone', e.target.value)} placeholder="+233 30 000 0000" />
              </F>
              <F label="Email">
                <Input value={draft.email} onChange={e => set('email', e.target.value)} type="email" placeholder="info@school.edu.gh" />
              </F>
              <F label="Website">
                <Input value={draft.website} onChange={e => set('website', e.target.value)} placeholder="www.school.edu.gh" />
              </F>
            </div>
          </Card>

          {/* Brand Colors */}
          <Card title="Brand Colors" icon={Palette}>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize your school&apos;s primary and sidebar colors. Changes apply immediately across the app after saving.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ColorSwatch label="Primary Color" value={draft.primarycolor} onChange={v => set('primarycolor', v)} />
              <ColorSwatch label="Sidebar Color" value={draft.sidebarcolor} onChange={v => set('sidebarcolor', v)} />
            </div>

            {/* Presets */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Presets</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    onClick={() => { set('primarycolor', p.primary); set('sidebarcolor', p.sidebar); }}
                    className="group relative h-9 w-9 rounded-lg border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-blue-400 dark:hover:ring-blue-500 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 right-1/2" style={{ backgroundColor: p.sidebar }} />
                    <div className="absolute inset-0 left-1/2" style={{ backgroundColor: p.primary }} />
                    <span className="sr-only">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mini preview */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Preview</p>
              <div className="flex rounded-xl overflow-hidden shadow border border-slate-200 dark:border-slate-700 h-28">
                <div className="w-20 flex flex-col gap-1.5 p-2.5" style={{ backgroundColor: draft.sidebarcolor }}>
                  <div className="h-2.5 rounded-md" style={{ backgroundColor: draft.primarycolor }} />
                  <div className="h-1.5 rounded bg-white/20" />
                  <div className="h-1.5 rounded bg-white/20" />
                  <div className="h-1.5 rounded bg-white/15" />
                  <div className="h-1.5 rounded bg-white/15" />
                </div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-2.5 flex flex-col gap-2">
                  <div className="h-2 w-2/3 rounded bg-slate-300 dark:bg-slate-600" />
                  <div className="flex gap-1.5">
                    <div className="h-10 flex-1 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600" style={{ borderTopColor: draft.primarycolor, borderTopWidth: 2 }} />
                    <div className="h-10 flex-1 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Branches */}
          <Card
            title={`Branches${branches.length > 0 ? ` (${branches.length})` : ''}`}
            icon={GitBranch}
            noPad
            action={
              <Button size="sm" onClick={openAdd} className="h-7 text-xs px-2.5">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Branch
              </Button>
            }
          >
            {branches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-2.5">
                  <GitBranch className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No branches yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-3">Add campuses or satellite locations</p>
                <Button size="sm" variant="outline" onClick={openAdd}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add First Branch
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {branches.map(b => (
                  <div key={b.branchid} className="group flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${b.ismain ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      {b.ismain
                        ? <Star className="h-4 w-4 text-amber-500" />
                        : <GitBranch className="h-4 w-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{b.name}</p>
                        {b.ismain && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[10px] font-semibold flex-shrink-0">
                            Main
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {b.address && <span className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3 flex-shrink-0" />{b.address}{b.region ? `, ${b.region}` : ''}</span>}
                        {b.phone   && <span className="flex items-center gap-1 text-xs text-slate-400"><Phone className="h-3 w-3 flex-shrink-0" />{b.phone}</span>}
                        {b.email   && <span className="flex items-center gap-1 text-xs text-slate-400"><Mail className="h-3 w-3 flex-shrink-0" />{b.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!b.ismain && (
                        <button onClick={() => setMain(b.branchid)} title="Set as main campus"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => openEdit(b)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setToDelete(b.branchid)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

        {/* ── Right: sticky preview panel ───────────────────────────── */}
        <div className="hidden lg:block">
        <div className="sticky top-6 space-y-3">

          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Live Preview</p>

          {/* Identity card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            {/* Gradient banner */}
            <div className="px-5 pt-6 pb-12 flex flex-col items-center text-center" style={{ background: `linear-gradient(135deg, ${draft.primarycolor}, ${draft.sidebarcolor})` }}>
              {draft.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.logo} alt="logo"
                  className="h-16 w-16 rounded-xl object-contain bg-white/95 p-1 shadow-md mb-3" />
              ) : (
                <div className="h-16 w-16 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mb-3 shadow-md">
                  <span className="text-3xl leading-none">{selectedType?.flag ?? '🏫'}</span>
                </div>
              )}
              <h3 className="text-white font-bold text-base leading-tight">
                {draft.name || <span className="text-white/50 italic">School Name</span>}
              </h3>
              {draft.motto && (
                <p className="text-white/70 text-xs italic mt-1 leading-snug">&ldquo;{draft.motto}&rdquo;</p>
              )}
            </div>

            {/* Info pills */}
            <div className="-mt-5 mx-3 mb-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-50 dark:divide-slate-800">

                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <Building2 className="h-3 w-3 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Type</p>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{selectedType?.label ?? '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-violet-50 dark:bg-violet-900/20">
                    <School className="h-3 w-3 text-violet-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Level</p>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{selectedLevel?.label ?? '—'}</p>
                  </div>
                </div>

                {draft.region && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-900/20">
                      <MapPin className="h-3 w-3 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Region</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{draft.region}</p>
                    </div>
                  </div>
                )}

                {draft.phone && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                      <Phone className="h-3 w-3 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Phone</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{draft.phone}</p>
                    </div>
                  </div>
                )}

                {draft.email && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                      <Mail className="h-3 w-3 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{draft.email}</p>
                    </div>
                  </div>
                )}

                {draft.website && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                      <Globe className="h-3 w-3 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Website</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{draft.website}</p>
                    </div>
                  </div>
                )}

                {draft.emiscode && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                      <Hash className="h-3 w-3 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">EMIS Code</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{draft.emiscode}</p>
                    </div>
                  </div>
                )}

                {branches.length > 0 && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-violet-50 dark:bg-violet-900/20">
                      <GitBranch className="h-3 w-3 text-violet-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Branches</p>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {branches.length} campus{branches.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
        </div>

      </div>

      {/* Branch modal */}
      <Dialog open={modalOpen} onOpenChange={o => { if (!o) setModalOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBranch ? `Edit — ${editingBranch.name}` : 'Add Branch'}</DialogTitle>
          </DialogHeader>
          <BranchForm value={branchDraft} onChange={setBranchDraft} />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveBranch} disabled={branchSaving}>
              {branchSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Save Branch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={o => !o && setToDelete(null)}
        title="Remove branch?"
        description="This removes the branch from your profile. No student or class data is affected."
        onConfirm={() => { if (toDelete) deleteBranch(toDelete); }}
      />
    </div>
  );
}
