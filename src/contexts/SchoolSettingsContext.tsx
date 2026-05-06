'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { type GradingSystemId, type GradingSystem, getGradingSystem } from '@/lib/grading-systems';

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface ProgrammeTrack {
  id:           string;
  name:         string;
  abbreviation: string;
  description:  string;
  color:        string;
}

export interface House {
  id:          string;
  name:        string;
  color:       string;
  type:        'boarding' | 'day' | 'stream';
  description: string;
}

export interface FeeType {
  id:          string;
  name:        string;
  description: string;
  category:    'academic' | 'residential' | 'extracurricular' | 'administrative';
  mandatory:   boolean;
  color:       string;
}

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

const DEFAULT_TRACKS: ProgrammeTrack[] = [
  { id: 'general-arts',    name: 'General Arts',    abbreviation: 'Arts',      description: 'Literature, History, Geography, Government, Economics',   color: 'blue'    },
  { id: 'general-science', name: 'General Science', abbreviation: 'Science',   description: 'Physics, Chemistry, Biology, Elective Mathematics',        color: 'emerald' },
  { id: 'business',        name: 'Business',        abbreviation: 'Business',  description: 'Accounting, Business Management, Economics',               color: 'amber'   },
  { id: 'technical',       name: 'Technical',       abbreviation: 'Technical', description: 'Technical Drawing, Workshop Technology, Auto Mechanics',   color: 'orange'  },
  { id: 'visual-arts',     name: 'Visual Arts',     abbreviation: 'Visual',    description: 'Graphic Design, Picture Making, Ceramics, Textiles',       color: 'purple'  },
  { id: 'agriculture',     name: 'Agriculture',     abbreviation: 'Agric',     description: 'Crop Production, Animal Husbandry, Agribusiness',          color: 'green'   },
  { id: 'home-economics',  name: 'Home Economics',  abbreviation: 'Home Eco',  description: 'Food & Nutrition, Textiles, Management in Living',         color: 'rose'    },
];

const DEFAULT_HOUSES: House[] = [
  { id: 'aggrey',   name: 'Aggrey House',    color: 'blue',    type: 'boarding', description: 'Named after Rev. Dr. James Emman Kwegyir Aggrey' },
  { id: 'busia',    name: 'Busia House',     color: 'green',   type: 'boarding', description: 'Named after Dr. Kofi Abrefa Busia'               },
  { id: 'danquah',  name: 'Danquah House',   color: 'amber',   type: 'boarding', description: 'Named after Dr. Joseph Boakye Danquah'           },
  { id: 'nkrumah',  name: 'Nkrumah House',   color: 'red',     type: 'boarding', description: 'Named after Dr. Kwame Nkrumah'                   },
  { id: 'ofori',    name: 'Ofori-Atta House', color: 'purple',  type: 'boarding', description: 'Named after Okyenhene Ofori Atta I'              },
];

const DEFAULT_FEE_TYPES: FeeType[] = [
  { id: 'tuition',     name: 'Tuition Fee',       description: 'Core academic instruction fee',                  category: 'academic',        mandatory: true,  color: 'blue'    },
  { id: 'boarding',    name: 'Boarding Fee',       description: 'Accommodation and meals for boarding students',  category: 'residential',     mandatory: false, color: 'emerald' },
  { id: 'pta',         name: 'PTA Levy',           description: 'Parent-Teacher Association contribution',        category: 'administrative',  mandatory: true,  color: 'amber'   },
  { id: 'sports',      name: 'Sports & Games',     description: 'Physical education and sports equipment',        category: 'extracurricular', mandatory: true,  color: 'orange'  },
  { id: 'examination', name: 'Examination Fee',    description: 'Internal examination administration',            category: 'academic',        mandatory: true,  color: 'violet'  },
  { id: 'library',     name: 'Library Fee',        description: 'Library resources and maintenance',              category: 'academic',        mandatory: true,  color: 'cyan'    },
  { id: 'ict',         name: 'ICT / Computer Lab', description: 'Computer lab access and technology resources',   category: 'academic',        mandatory: true,  color: 'indigo'  },
  { id: 'bece-reg',    name: 'BECE Registration',  description: 'West African Examinations Council BECE fee',    category: 'academic',        mandatory: false, color: 'rose'    },
  { id: 'wassce-reg',  name: 'WASSCE Registration',description: 'West African Examinations Council WASSCE fee',  category: 'academic',        mandatory: false, color: 'red'     },
];

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
const TRACKS_KEY    = 'sms-programme-tracks';
const HOUSES_KEY    = 'sms-houses';
const FEE_TYPES_KEY = 'sms-fee-types';
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
  programmeTracks:    ProgrammeTrack[];
  setProgrammeTracks: (tracks: ProgrammeTrack[]) => void;
  houses:             House[];
  setHouses:          (houses: House[]) => void;
  feeTypes:           FeeType[];
  setFeeTypes:        (types: FeeType[]) => void;
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

  const [programmeTracks, setTracksState]  = useState<ProgrammeTrack[]>(() => loadFromStorage(TRACKS_KEY, DEFAULT_TRACKS));
  const [houses, setHousesState]           = useState<House[]>(() => loadFromStorage(HOUSES_KEY, DEFAULT_HOUSES));
  const [feeTypes, setFeeTypesState]       = useState<FeeType[]>(() => loadFromStorage(FEE_TYPES_KEY, DEFAULT_FEE_TYPES));
  const [reportTemplate, setTemplateState] = useState<ReportTemplate>(() => loadFromStorage(TEMPLATE_KEY, DEFAULT_REPORT_TEMPLATE));

  const setGradingSystem = (id: GradingSystemId) => {
    setId(id);
    try { localStorage.setItem(GRADING_KEY, id); } catch { /* ignore */ }
  };

  const setProgrammeTracks = (tracks: ProgrammeTrack[]) => {
    setTracksState(tracks); saveToStorage(TRACKS_KEY, tracks);
  };

  const setHouses = (h: House[]) => {
    setHousesState(h); saveToStorage(HOUSES_KEY, h);
  };

  const setFeeTypes = (ft: FeeType[]) => {
    setFeeTypesState(ft); saveToStorage(FEE_TYPES_KEY, ft);
  };

  const setReportTemplate = (t: Partial<ReportTemplate>) => {
    setTemplateState(prev => { const next = { ...prev, ...t }; saveToStorage(TEMPLATE_KEY, next); return next; });
  };

  return (
    <SchoolSettingsContext.Provider value={{
      gradingSystemId, gradingSystem: getGradingSystem(gradingSystemId), setGradingSystem,
      programmeTracks, setProgrammeTracks,
      houses, setHouses,
      feeTypes, setFeeTypes,
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
