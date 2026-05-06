export type GradingSystemId = 'ges' | 'cambridge' | 'ib' | 'american' | 'french';

export interface GradeLevel {
    min:   number;
    label: string;
    color: string;
}

export interface AssessmentComponent {
    key:            string;
    label:          string;
    assessmentType: number;   // slot stored in Dataverse: 1 | 2 | 4 | 5
    displayWeight:  string;
}

export interface GradingSystem {
    id:           GradingSystemId;
    name:         string;
    shortName:    string;
    flag:         string;
    components:   AssessmentComponent[];
    calcFinal:    (scores: Record<string, number | null>) => number | null;
    getGrade:     (score: number) => GradeLevel;
    displayScore: (score: number) => string;
    gradeLabel:   string;
    formulaLines: string[];
    scaleLabel:   string;
}

/* ── Helper ──────────────────────────────────────────────────────────── */
function pick(scale: GradeLevel[], score: number): GradeLevel {
    return scale.find(g => score >= g.min) ?? scale[scale.length - 1];
}

/* ── Systems ─────────────────────────────────────────────────────────── */

const GES: GradingSystem = {
    id:        'ges',
    name:      'Ghana GES',
    shortName: 'GES',
    flag:      '🇬🇭',
    components: [
        { key: 'classwork', label: 'Classwork',   assessmentType: 1, displayWeight: '10%' },
        { key: 'homework',  label: 'Homework',    assessmentType: 2, displayWeight: '10%' },
        { key: 'midterm',   label: 'Mid-Term',    assessmentType: 4, displayWeight: '10%' },
        { key: 'endofterm', label: 'End of Term', assessmentType: 5, displayWeight: '70%' },
    ],
    calcFinal(scores) {
        const classVals = ['classwork', 'homework', 'midterm']
        .map(k => scores[k])
        .filter((v): v is number => v !== null);
        const classScore = classVals.length
        ? classVals.reduce((a, b) => a + b, 0) / classVals.length
        : null;
        const eot = scores['endofterm'] ?? null;
        if (classScore === null && eot === null) return null;
        return parseFloat(((classScore ?? 0) * 0.30 + (eot ?? 0) * 0.70).toFixed(1));
    },
    getGrade(score) {
        return pick([
        { min: 80, label: 'A1', color: 'text-emerald-700 bg-emerald-50' },
        { min: 70, label: 'B2', color: 'text-green-700   bg-green-50'   },
        { min: 60, label: 'B3', color: 'text-lime-700    bg-lime-50'    },
        { min: 55, label: 'C4', color: 'text-yellow-700  bg-yellow-50'  },
        { min: 50, label: 'C5', color: 'text-amber-700   bg-amber-50'   },
        { min: 45, label: 'C6', color: 'text-orange-700  bg-orange-50'  },
        { min: 40, label: 'D7', color: 'text-red-500     bg-red-50'     },
        { min: 35, label: 'E8', color: 'text-red-600     bg-red-50'     },
        { min: 0,  label: 'F9', color: 'text-red-700     bg-red-100'    },
        ], score);
    },
    displayScore: score => `${score}%`,
    gradeLabel:   'GES Grade',
    formulaLines: [
        'Ghana GES Formula:',
        'Class Score (Classwork + Homework + Mid-Term avg) × 30%',
        '+ End of Term × 70%',
        '= Final Score',
    ],
    scaleLabel: 'Grades: A1 ≥80 · B2 ≥70 · B3 ≥60 · C4 ≥55 · C5 ≥50 · C6 ≥45 · D7 ≥40 · E8 ≥35 · F9 <35',
};

const CAMBRIDGE: GradingSystem = {
    id:        'cambridge',
    name:      'Cambridge (IGCSE / A-Level)',
    shortName: 'Cambridge',
    flag:      '🇬🇧',
    components: [
        { key: 'coursework', label: 'Coursework',    assessmentType: 1, displayWeight: '20%' },
        { key: 'midterm',    label: 'Mid-Year Test', assessmentType: 4, displayWeight: '10%' },
        { key: 'exam',       label: 'Final Exam',    assessmentType: 5, displayWeight: '70%' },
    ],
    calcFinal(scores) {
        const cw = scores['coursework'] ?? null;
        const mt = scores['midterm']    ?? null;
        const ex = scores['exam']       ?? null;
        if (cw === null && mt === null && ex === null) return null;
        return parseFloat(((cw ?? 0) * 0.20 + (mt ?? 0) * 0.10 + (ex ?? 0) * 0.70).toFixed(1));
    },
    getGrade(score) {
        return pick([
        { min: 90, label: 'A*', color: 'text-emerald-700 bg-emerald-50' },
        { min: 80, label: 'A',  color: 'text-green-700   bg-green-50'   },
        { min: 70, label: 'B',  color: 'text-lime-700    bg-lime-50'    },
        { min: 60, label: 'C',  color: 'text-yellow-700  bg-yellow-50'  },
        { min: 50, label: 'D',  color: 'text-amber-700   bg-amber-50'   },
        { min: 40, label: 'E',  color: 'text-orange-700  bg-orange-50'  },
        { min: 30, label: 'F',  color: 'text-red-500     bg-red-50'     },
        { min: 0,  label: 'U',  color: 'text-red-700     bg-red-100'    },
        ], score);
    },
    displayScore: score => `${score}%`,
    gradeLabel:   'Grade',
    formulaLines: [
        'Cambridge Formula:',
        'Coursework × 20% + Mid-Year Test × 10%',
        '+ Final Exam × 70%',
        '= Final Score',
    ],
    scaleLabel: 'Grades: A* ≥90 · A ≥80 · B ≥70 · C ≥60 · D ≥50 · E ≥40 · F ≥30 · U <30',
};

const IB: GradingSystem = {
    id:        'ib',
    name:      'International Baccalaureate (IB)',
    shortName: 'IB',
    flag:      '🌐',
    components: [
        { key: 'ia',   label: 'Internal Assessment', assessmentType: 1, displayWeight: '20%' },
        { key: 'exam', label: 'External Exam',       assessmentType: 5, displayWeight: '80%' },
    ],
    calcFinal(scores) {
        const ia   = scores['ia']   ?? null;
        const exam = scores['exam'] ?? null;
        if (ia === null && exam === null) return null;
        return parseFloat(((ia ?? 0) * 0.20 + (exam ?? 0) * 0.80).toFixed(1));
    },
    getGrade(score) {
        return pick([
        { min: 85, label: '7', color: 'text-emerald-700 bg-emerald-50' },
        { min: 70, label: '6', color: 'text-green-700   bg-green-50'   },
        { min: 55, label: '5', color: 'text-lime-700    bg-lime-50'    },
        { min: 45, label: '4', color: 'text-yellow-700  bg-yellow-50'  },
        { min: 35, label: '3', color: 'text-amber-700   bg-amber-50'   },
        { min: 25, label: '2', color: 'text-orange-700  bg-orange-50'  },
        { min: 0,  label: '1', color: 'text-red-700     bg-red-100'    },
        ], score);
    },
    displayScore(score) {
        if (score >= 85) return '7 pts';
        if (score >= 70) return '6 pts';
        if (score >= 55) return '5 pts';
        if (score >= 45) return '4 pts';
        if (score >= 35) return '3 pts';
        if (score >= 25) return '2 pts';
        return '1 pt';
    },
    gradeLabel:   'IB Points',
    formulaLines: [
        'IB Formula:',
        'Internal Assessment × 20%',
        '+ External Exam × 80%',
        '= Final Score (mapped to 1–7)',
    ],
    scaleLabel: 'Points: 7 ≥85% · 6 ≥70% · 5 ≥55% · 4 ≥45% · 3 ≥35% · 2 ≥25% · 1 <25%',
};

const AMERICAN: GradingSystem = {
    id:        'american',
    name:      'American (K-12)',
    shortName: 'American',
    flag:      '🇺🇸',
    components: [
        { key: 'classwork', label: 'Classwork',  assessmentType: 1, displayWeight: '15%' },
        { key: 'homework',  label: 'Homework',   assessmentType: 2, displayWeight: '15%' },
        { key: 'tests',     label: 'Tests',      assessmentType: 4, displayWeight: '30%' },
        { key: 'final',     label: 'Final Exam', assessmentType: 5, displayWeight: '40%' },
    ],
    calcFinal(scores) {
        const cw  = scores['classwork'] ?? null;
        const hw  = scores['homework']  ?? null;
        const ts  = scores['tests']     ?? null;
        const fin = scores['final']     ?? null;
        if (cw === null && hw === null && ts === null && fin === null) return null;
        return parseFloat(((cw ?? 0) * 0.15 + (hw ?? 0) * 0.15 + (ts ?? 0) * 0.30 + (fin ?? 0) * 0.40).toFixed(1));
    },
    getGrade(score) {
        return pick([
            { min: 93, label: 'A',  color: 'text-emerald-700 bg-emerald-50' },
            { min: 90, label: 'A−', color: 'text-green-700   bg-green-50'   },
            { min: 87, label: 'B+', color: 'text-lime-700    bg-lime-50'    },
            { min: 83, label: 'B',  color: 'text-lime-600    bg-lime-50'    },
            { min: 80, label: 'B−', color: 'text-yellow-700  bg-yellow-50'  },
            { min: 77, label: 'C+', color: 'text-amber-700   bg-amber-50'   },
            { min: 73, label: 'C',  color: 'text-amber-600   bg-amber-50'   },
            { min: 70, label: 'C−', color: 'text-orange-600  bg-orange-50'  },
            { min: 60, label: 'D',  color: 'text-red-500     bg-red-50'     },
            { min: 0,  label: 'F',  color: 'text-red-700     bg-red-100'    },
        ], score);
    },
    displayScore: score => `${score}%`,
    gradeLabel:   'Grade / GPA',
    formulaLines: [
        'American Formula:',
        'Classwork (15%) + Homework (15%) + Tests (30%)',
        '+ Final Exam (40%)',
        '= Final Score',
    ],
    scaleLabel: 'Grades: A ≥93 · A− ≥90 · B+ ≥87 · B ≥83 · B− ≥80 · C+ ≥77 · C ≥73 · C− ≥70 · D ≥60 · F <60',
};

const FRENCH: GradingSystem = {
    id:        'french',
    name:      'French System',
    shortName: 'French',
    flag:      '🇫🇷',
    components: [
        { key: 'tp',      label: 'Travaux pratiques', assessmentType: 1, displayWeight: '25%' },
        { key: 'dm',      label: 'Devoir maison',     assessmentType: 2, displayWeight: '25%' },
        { key: 'partiel', label: 'Partiel',            assessmentType: 4, displayWeight: '10%' },
        { key: 'exam',    label: 'Examen final',       assessmentType: 5, displayWeight: '40%' },
    ],
    calcFinal(scores) {
        const tp  = scores['tp']      ?? null;
        const dm  = scores['dm']      ?? null;
        const par = scores['partiel'] ?? null;
        const ex  = scores['exam']    ?? null;
        if (tp === null && dm === null && par === null && ex === null) return null;
        return parseFloat(((tp ?? 0) * 0.25 + (dm ?? 0) * 0.25 + (par ?? 0) * 0.10 + (ex ?? 0) * 0.40).toFixed(1));
    },
    getGrade(score) {
        // Internal: 0-100; display as /20 (÷5). Thresholds: TB≥16/20=80%, B≥14/20=70%, AB≥12/20=60%, P≥10/20=50%
        return pick([
            { min: 80, label: 'TB', color: 'text-emerald-700 bg-emerald-50' },
            { min: 70, label: 'B',  color: 'text-green-700   bg-green-50'   },
            { min: 60, label: 'AB', color: 'text-lime-700    bg-lime-50'    },
            { min: 50, label: 'P',  color: 'text-yellow-700  bg-yellow-50'  },
            { min: 0,  label: 'I',  color: 'text-red-700     bg-red-100'    },
        ], score);
    },
    displayScore: score => `${(score / 5).toFixed(1)}/20`,
    gradeLabel:   'Mention',
    formulaLines: [
        'Formule française :',
        'TP (25%) + DM (25%) + Partiel (10%)',
        '+ Examen final (40%)',
        '= Note finale',
    ],
    scaleLabel: 'Mentions : TB ≥16/20 · B ≥14/20 · AB ≥12/20 · P ≥10/20 · I <10/20',
};

/* ── Registry ─────────────────────────────────────────────────────────── */
export const GRADING_SYSTEMS: GradingSystem[] = [GES, CAMBRIDGE, IB, AMERICAN, FRENCH];

export function getGradingSystem(id: GradingSystemId): GradingSystem {
    return GRADING_SYSTEMS.find(s => s.id === id) ?? GES;
}
