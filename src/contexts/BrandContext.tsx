'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { schoolAPI } from '@/lib/api-client';

const COLORS_KEY = 'sms-brand-colors';
export const BRAND_SCHOOL_KEY = 'sms-brand-school';
const DEFAULT: BrandColors = { primary: '#2563eb', sidebar: '#0f172a' };

export interface BrandColors { primary: string; sidebar: string; }
export interface BrandSchool { name: string; motto: string; logo: string; }

interface BrandContextValue {
  colors:     BrandColors;
  school:     BrandSchool;
  setColors:  (c: BrandColors) => void;
  setSchool:  (s: BrandSchool) => void;
}

const DEFAULT_SCHOOL: BrandSchool = { name: '', motto: '', logo: '' };

const BrandContext = createContext<BrandContextValue>({
  colors: DEFAULT, school: DEFAULT_SCHOOL, setColors: () => {}, setSchool: () => {},
});

function applyColors(c: BrandColors) {
  const el = document.documentElement;
  el.style.setProperty('--school-primary', c.primary);
  el.style.setProperty('--school-sidebar', c.sidebar);
  el.style.setProperty('--primary',        c.primary);
  el.style.setProperty('--ring',           c.primary);
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [colors, setColorsState] = useState<BrandColors>(() => {
    if (typeof window === 'undefined') return DEFAULT;
    try {
      const saved = localStorage.getItem(COLORS_KEY);
      if (saved) return JSON.parse(saved) as BrandColors;
    } catch { /* ignore */ }
    return DEFAULT;
  });

  const [school, setSchoolState] = useState<BrandSchool>(() => {
    if (typeof window === 'undefined') return DEFAULT_SCHOOL;
    try {
      const saved = localStorage.getItem(BRAND_SCHOOL_KEY);
      if (saved) return JSON.parse(saved) as BrandSchool;
    } catch { /* ignore */ }
    return DEFAULT_SCHOOL;
  });

  // Apply cached colors immediately on mount
  useEffect(() => { applyColors(colors); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync brand data from Dataverse on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (schoolAPI.getProfile() as Promise<any>).then((res: any) => {
      const p = res?.data;
      if (!p) return;

      if (p.primarycolor || p.sidebarcolor) {
        const c: BrandColors = {
          primary: p.primarycolor || DEFAULT.primary,
          sidebar: p.sidebarcolor || DEFAULT.sidebar,
        };
        setColorsState(c); applyColors(c);
        localStorage.setItem(COLORS_KEY, JSON.stringify(c));
      }

      const s: BrandSchool = {
        name:  p.name  ?? '',
        motto: p.motto ?? '',
        logo:  p.logo  ?? '',
      };
      setSchoolState(s);
      localStorage.setItem(BRAND_SCHOOL_KEY, JSON.stringify(s));
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setColors = (c: BrandColors) => {
    setColorsState(c); applyColors(c);
    localStorage.setItem(COLORS_KEY, JSON.stringify(c));
  };

  const setSchool = (s: BrandSchool) => {
    setSchoolState(s);
    localStorage.setItem(BRAND_SCHOOL_KEY, JSON.stringify(s));
  };

  return (
    <BrandContext.Provider value={{ colors, school, setColors, setSchool }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);
