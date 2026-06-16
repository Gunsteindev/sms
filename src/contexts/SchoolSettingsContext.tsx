'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { type GradingSystemId, type GradingSystem, getGradingSystem } from '@/lib/grading-systems';

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface ReportTemplate {
  principalName:         string;
  vicePrincipalName:     string;
  showClassPosition:     boolean;
  showTermAverage:       boolean;
  showAttendancePercent: boolean;
  showRemarks:           boolean;
  footerText:            string;
  signatureLabel:        string;
  emisCode:              string;
  district:              string;
  region:                string;
  website:               string;
}

/* ── Defaults ───────────────────────────────────────────────────────────── */

const DEFAULT_REPORT_TEMPLATE: ReportTemplate = {
  principalName:         '',
  vicePrincipalName:     '',
  showClassPosition:     true,
  showTermAverage:       true,
  showAttendancePercent: true,
  showRemarks:           true,
  footerText:            'This report card is computer generated and valid without signature.',
  signatureLabel:        "Head Teacher's Signature",
  emisCode:              '',
  district:              '',
  region:                '',
  website:               '',
};

/* ── Storage keys ───────────────────────────────────────────────────────── */
const GRADING_KEY   = 'sms-grading-system';
const TEMPLATE_KEY  = 'sms-report-template';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

/* ── Context ─────────────────────────────────────────────────────────────── */

interface SchoolSettingsContextValue {
  gradingSystemId:    GradingSystemId;
  gradingSystem:      GradingSystem;
  setGradingSystem:   (id: GradingSystemId) => void;
  reportTemplate:     ReportTemplate;
  setReportTemplate:  (t: Partial<ReportTemplate>) => void;
}

const SchoolSettingsContext = createContext<SchoolSettingsContextValue | null>(null);

export function SchoolSettingsProvider({ children }: { children: ReactNode }) {
  const [gradingSystemId, setId] = useState<GradingSystemId>(() => {
    if (typeof window === 'undefined') return 'ges';
    try {
      const saved = localStorage.getItem(GRADING_KEY) as GradingSystemId | null;
      const valid: GradingSystemId[] = ['ges', 'cambridge', 'ib', 'american', 'french'];
      if (saved && valid.includes(saved)) return saved;
    } catch { /* ignore */ }
    return 'ges';
  });

  const [reportTemplate, setTemplateState] = useState<ReportTemplate>(() => loadFromStorage(TEMPLATE_KEY, DEFAULT_REPORT_TEMPLATE));

  const setGradingSystem = (id: GradingSystemId) => {
    setId(id);
    try { localStorage.setItem(GRADING_KEY, id); } catch { /* ignore */ }
  };

  const setReportTemplate = (t: Partial<ReportTemplate>) => {
    setTemplateState(prev => { const next = { ...prev, ...t }; saveToStorage(TEMPLATE_KEY, next); return next; });
  };

  return (
    <SchoolSettingsContext.Provider value={{
      gradingSystemId, gradingSystem: getGradingSystem(gradingSystemId), setGradingSystem,
      reportTemplate, setReportTemplate,
    }}>
      {children}
    </SchoolSettingsContext.Provider>
  );
}

export function useSchoolSettings() {
  const ctx = useContext(SchoolSettingsContext);
  if (!ctx) throw new Error('useSchoolSettings must be used inside SchoolSettingsProvider');
  return ctx;
}
