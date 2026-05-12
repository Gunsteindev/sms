'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Search, ChevronDown, X,
  School, CalendarRange, CalendarDays, Layers, TrendingUp,
  BookMarked, Home, DollarSign, UserCog,
  Users, UserCircle, Briefcase, UserPlus,
  BookOpen, FileText, ClipboardList, Calendar, BookOpenCheck,
  HeartPulse, ShieldAlert,
  Building2, Library, Package, ShoppingCart, CalendarOff,
  Megaphone, Bus, Trophy, BarChart3, Medal,
  Award, Waves, Bell, Lightbulb, SwitchCamera, Settings, UserRound,
  LayoutGrid, ArrowRight, CheckCircle2,
} from 'lucide-react';

/* ── Role badge colours ────────────────────────────────────────────────────── */
const roleBadge: Record<string, string> = {
  Admin:     'bg-blue-100   dark:bg-blue-900/40   text-blue-700   dark:text-blue-300   border border-blue-200   dark:border-blue-800/50',
  Teacher:   'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50',
  Finance:   'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
  Inventory: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50',
  Transport: 'bg-sky-100    dark:bg-sky-900/40    text-sky-700    dark:text-sky-300    border border-sky-200    dark:border-sky-800/50',
  Pool:      'bg-cyan-100   dark:bg-cyan-900/40   text-cyan-700   dark:text-cyan-300   border border-cyan-200   dark:border-cyan-800/50',
  Parent:    'bg-amber-100  dark:bg-amber-900/40  text-amber-700  dark:text-amber-300  border border-amber-200  dark:border-amber-800/50',
  Kitchen:   'bg-pink-100   dark:bg-pink-900/40   text-pink-700   dark:text-pink-300   border border-pink-200   dark:border-pink-800/50',
  All:       'bg-slate-100  dark:bg-slate-800      text-slate-600  dark:text-slate-300  border border-slate-200  dark:border-slate-700',
};

const sectionColor: Record<string, string> = {
  Setup:          'bg-blue-500',
  People:         'bg-violet-500',
  Academic:       'bg-indigo-500',
  Welfare:        'bg-rose-500',
  Administration: 'bg-amber-500',
  Finance:        'bg-emerald-500',
  Platform:       'bg-slate-500',
  Other:          'bg-cyan-500',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadge[role] ?? roleBadge.All}`}>
      {role}
    </span>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 p-3 flex gap-2.5">
      <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 dark:text-amber-300">{children}</p>
    </div>
  );
}

/* ── Module definition ───────────────────────────────────────────────────────── */
interface Module {
  href: string;
  icon: React.ElementType;
  name: string;
  roles: string[];
  description: string;
  actions: string[];
  tips: string[];
}

interface Section {
  label: string;
  modules: Module[];
}

const sections: Section[] = [
  {
    label: 'Setup',
    modules: [
      {
        href: '/onboarding',
        icon: SwitchCamera,
        name: 'School Switcher & Onboarding',
        roles: ['Admin'],
        description: 'The system supports multiple schools in a single installation. Use the onboarding page to register a new school, switch your active session, or manage module access for any school. Each school is a fully isolated tenant — data, users, and configuration do not cross school boundaries.',
        actions: [
          'Select an existing school from the list to switch your active session',
          'Search schools by name, region, or district',
          'Click the ⚙ gear icon next to any school to manage its module access',
          'Register a brand-new school using the 4-step guided setup wizard',
          'Choose which features (modules) to activate in the wizard\'s final step',
          'Return to this page at any time to switch between schools',
        ],
        tips: [
          'The 4-step wizard covers: School Identity → Contact Details → Branding → Modules. You can change branding and modules anytime after setup.',
          'Super admins can edit module access for any school by clicking the gear icon (⚙) next to its name. Module changes take effect immediately when you are redirected to the dashboard.',
        ],
      },
      {
        href: '/setup/school-profile',
        icon: School,
        name: 'School Profile',
        roles: ['Admin'],
        description: 'Configure the active school\'s name, logo, brand colours, curriculum type, contact info, EMIS code, and campus branches. Changes apply immediately across the sidebar and all pages.',
        actions: [
          'Set school name, motto, and contact details',
          'Upload or change the school logo',
          'Pick primary and sidebar brand colours using presets or custom hex codes',
          'Select curriculum type (GES, Cambridge, IB, American, French, Mixed)',
          'Add multiple campus branches',
          'Switch to a different school via the school selector dropdown',
        ],
        tips: [
          'After changing brand colours, the sidebar updates immediately. Use the colour presets to quickly apply professionally matched palettes.',
        ],
      },
      {
        href: '/setup/academic-years',
        icon: CalendarRange,
        name: 'Academic Years',
        roles: ['Admin'],
        description: 'Create and manage school years (e.g. 2024/2025). Each year can have multiple terms. Mark one year as active — the active year is used as the default throughout the app.',
        actions: [
          'Create a new academic year with start and end dates',
          'Set a year as the active/current year',
          'Archive past years',
          'View all years and their associated terms',
        ],
        tips: [
          'Always create the new academic year before the school year begins so attendance, enrolments, and exams can reference it from day one.',
        ],
      },
      {
        href: '/setup/terms',
        icon: CalendarDays,
        name: 'Terms',
        roles: ['Admin'],
        description: 'Divide each academic year into terms or semesters. Term dates drive the attendance calendar and determine which assessment periods are active.',
        actions: [
          'Add terms (e.g. Term 1, Term 2, Term 3) under an academic year',
          'Set start and end dates for each term',
          'Mark a term as the current/active term',
        ],
        tips: [
          'Attendance records are scoped to a term. Ensure the correct term is active before recording daily attendance.',
        ],
      },
      {
        href: '/setup/grade-levels',
        icon: Layers,
        name: 'Grade Levels',
        roles: ['Admin'],
        description: 'Define the class levels available in your school (e.g. Grade 1, JHS 1, Form 1). Grade levels are used when creating classes and during student promotions.',
        actions: [
          'Add grade levels with a display name and order',
          'Edit or reorder existing levels',
          'Delete unused grade levels',
        ],
        tips: [
          'Set the order field carefully — it is used to determine which level is "next" during student promotions.',
        ],
      },
      {
        href: '/setup/promotions',
        icon: TrendingUp,
        name: 'Promotions',
        roles: ['Admin'],
        description: 'Promote student cohorts from one grade level to the next at the end of an academic year. You can promote, retain, transfer, or graduate each student individually.',
        actions: [
          'Select a grade level to load all students in that cohort',
          'Set each student\'s promotion decision (Promoted / Retained / Transferred / Graduated)',
          'Assign a target class for promoted students',
          'Apply promotions in bulk and review the history log',
        ],
        tips: [
          'Run promotions only after all end-of-term exams and gradebook entries are finalised.',
        ],
      },
      {
        href: '/setup/programme-tracks',
        icon: BookMarked,
        name: 'Programme Tracks',
        roles: ['Admin'],
        description: 'Set up curriculum tracks (e.g. General Science, Business, Visual Arts) for SHS or other differentiated programmes. Tracks let you group classes and students by specialisation.',
        actions: [
          'Create programme tracks with name and description',
          'Assign tracks to specific grade levels',
          'Edit or remove tracks',
        ],
        tips: [
          'Programme tracks are optional. Only configure them if your school offers differentiated curricula at the SHS level or above.',
        ],
      },
      {
        href: '/setup/houses',
        icon: Home,
        name: 'Houses & Streams',
        roles: ['Admin'],
        description: 'Organise students into houses (e.g. Aggrey, Lincoln) or streams for pastoral care, inter-house competitions, and reporting.',
        actions: [
          'Create houses or streams with name and colour',
          'Assign students to a house from the student profile',
          'Use houses in reports and event tracking',
        ],
        tips: [
          'Assign house colours so they appear consistently in reports and the portal.',
        ],
      },
      {
        href: '/setup/fee-types',
        icon: DollarSign,
        name: 'Fee Types',
        roles: ['Admin'],
        description: 'Define the categories of fees your school charges (e.g. Tuition, Boarding, PTA, Examination). Fee structures for each grade and term are built on top of these types.',
        actions: [
          'Add fee types with name and description',
          'Mark a type as mandatory or optional',
          'Edit or deactivate fee types',
        ],
        tips: [
          'Create all fee types before building fee structures — fee structures reference these types directly.',
        ],
      },
      {
        href: '/setup/users',
        icon: UserCog,
        name: 'User Management',
        roles: ['Admin'],
        description: 'Create system user accounts, assign roles, reset passwords, and manage login access for all staff. Roles control which modules each user can see and interact with.',
        actions: [
          'Create a new user account with email and temporary password',
          'Assign a role: Admin, Teacher, Finance, Inventory, Transport, Pool, Parent, or Kitchen',
          'Edit user details or change their role',
          'Deactivate accounts for departing staff',
        ],
        tips: [
          'Parent accounts should be created here and then linked to the student record from the student\'s detail page.',
        ],
      },
    ],
  },
  {
    label: 'People',
    modules: [
      {
        href: '/students',
        icon: Users,
        name: 'Students',
        roles: ['Admin', 'Teacher', 'Finance', 'Inventory'],
        description: 'Add, edit, and view student records including personal details, guardian links, class enrolments, fee accounts, and uploaded documents. Click a student\'s name to open their full profile.',
        actions: [
          'Add a new student with personal, contact, and guardian details',
          'Link a parent/guardian user account to a student',
          'Upload student documents (birth certificate, photo)',
          'View the student\'s full profile: enrolments, attendance, fees, health, and grades',
          'Search, filter, and export the student list',
        ],
        tips: [
          'Use the student detail page (click a student\'s name) to get a single view of everything about that student — from fees to health records.',
        ],
      },
      {
        href: '/teachers',
        icon: UserCircle,
        name: 'Teachers',
        roles: ['Admin'],
        description: 'Manage teaching staff profiles including personal information, qualifications, subjects taught, and class assignments.',
        actions: [
          'Add a teacher with personal and professional details',
          'Record qualifications and years of experience',
          'Assign subjects to a teacher',
          'View teacher class assignments',
        ],
        tips: [
          'Link a teacher record to a user account so they can log in and access teacher-facing modules.',
        ],
      },
      {
        href: '/employees',
        icon: Briefcase,
        name: 'Employees',
        roles: ['Admin'],
        description: 'Track non-teaching staff — administrators, janitors, cooks, security personnel — with their employment details, department, and contract information.',
        actions: [
          'Add an employee with role, department, and contract dates',
          'Record salary band and employment type',
          'Track employee leave via the Staff Leave module',
        ],
        tips: [
          'Employees who need system access should also have a user account created in User Management.',
        ],
      },
      {
        href: '/parents',
        icon: UserPlus,
        name: 'Parents',
        roles: ['Admin', 'Teacher', 'Finance'],
        description: 'Record parent and guardian profiles and link them to student records. Parents with portal access can view school notices and their child\'s updates.',
        actions: [
          'Create a parent profile with contact details',
          'Link the parent to one or more student records',
          'Grant portal access by linking to a user account',
          'View all students associated with a parent',
        ],
        tips: [
          'You can also link a parent directly from the student detail page using the "Add Guardian" action.',
        ],
      },
    ],
  },
  {
    label: 'Academic',
    modules: [
      {
        href: '/classes',
        icon: BookOpen,
        name: 'Classes',
        roles: ['Admin', 'Teacher'],
        description: 'Create class groups by grade level and academic year, assign a class teacher, and manage the students enrolled in each class.',
        actions: [
          'Create a class with name, grade level, and academic year',
          'Assign a class teacher',
          'View students enrolled in the class',
          'Manage class subjects and timetable slots',
        ],
        tips: [
          'Class names should be unique within a grade level and year (e.g. "Form 1A 2024/25").',
        ],
      },
      {
        href: '/subjects',
        icon: BookMarked,
        name: 'Subjects',
        roles: ['Admin', 'Teacher'],
        description: 'Define the subjects offered by the school. Link subjects to grade levels, assign them to classes, and connect them to teachers responsible for teaching.',
        actions: [
          'Add subjects with name and subject code',
          'Assign subjects to grade levels',
          'Link a subject to a teacher',
          'View which classes offer each subject',
        ],
        tips: [
          'Subject codes are used in report cards and the gradebook — keep them short and consistent (e.g. MATH, ENG, SCI).',
        ],
      },
      {
        href: '/timetable',
        icon: CalendarDays,
        name: 'Timetable',
        roles: ['Admin', 'Teacher'],
        description: 'Build weekly timetable schedules for each class, assigning subjects to time periods across the school week.',
        actions: [
          'Create timetable periods for a class',
          'Assign a subject and teacher to each period',
          'View the full weekly schedule for a class',
          'Print or export the timetable',
        ],
        tips: [
          'Check for teacher conflicts — a teacher should not be assigned to two classes at the same period.',
        ],
      },
      {
        href: '/enrollments',
        icon: ClipboardList,
        name: 'Enrollments',
        roles: ['Admin', 'Teacher', 'Finance'],
        description: 'Enrol students into classes for a given academic year and term. Enrolment is required before attendance and exam marks can be recorded for a student.',
        actions: [
          'Enrol a student into a class for the current term',
          'Bulk-enrol multiple students at once',
          'Transfer a student to a different class',
          'View enrolment history across years',
        ],
        tips: [
          'After promotions are applied at the end of the year, re-enrol promoted students into their new classes for the new year.',
        ],
      },
      {
        href: '/attendance',
        icon: Calendar,
        name: 'Attendance',
        roles: ['Admin', 'Teacher'],
        description: 'Record daily or period-based attendance for each class. Mark each student as Present, Absent, or Late. View attendance rates and trends over time.',
        actions: [
          'Select a class and date to open the attendance register',
          'Mark each student Present, Absent, or Late',
          'Add notes for absences',
          'View attendance rate reports per class or student',
        ],
        tips: [
          'Attendance is linked to the active term. Always confirm the correct term is set in Setup before the school year begins.',
        ],
      },
      {
        href: '/exams',
        icon: FileText,
        name: 'Exams',
        roles: ['Admin', 'Teacher'],
        description: 'Create exam sessions (e.g. Mid-Term, End of Term) and enter marks per subject per student. Marks feed directly into the Gradebook.',
        actions: [
          'Create an exam session tied to a term',
          'Enter marks for each student per subject',
          'View and edit existing mark sheets',
          'Publish results to trigger report card generation',
        ],
        tips: [
          'Marks entered here are used by the Gradebook to compute GES final scores. Ensure all marks are entered before generating report cards.',
        ],
      },
      {
        href: '/gradebook',
        icon: BookOpenCheck,
        name: 'Gradebook',
        roles: ['Admin', 'Teacher'],
        description: 'View and compute student grades using the Ghana GES formula (class score 30% + end-of-term exam 70%). See class averages and position rankings.',
        actions: [
          'Select a class and subject to open the gradebook sheet',
          'Enter classwork, homework, mid-term, and end-of-term scores',
          'Auto-compute GES final scores and grade letters',
          'Save all grades at once',
          'View class average and student position ranking',
        ],
        tips: [
          'GES Scale: A1 ≥80 · B2 ≥70 · B3 ≥60 · C4 ≥55 · C5 ≥50 · C6 ≥45 · D7 ≥40 · E8 ≥35 · F9 <35.',
        ],
      },
    ],
  },
  {
    label: 'Welfare',
    modules: [
      {
        href: '/health',
        icon: HeartPulse,
        name: 'Health Records',
        roles: ['Admin', 'Teacher'],
        description: 'Log student medical visits, known conditions, treatments administered, and vaccination history. Provides a quick health summary on each student\'s profile.',
        actions: [
          'Record a new medical visit with date, complaint, and treatment',
          'Log chronic conditions and allergies for a student',
          'Track vaccination records and due dates',
          'View full health history per student',
        ],
        tips: [
          'Mark conditions as active or resolved so the student profile always shows current health status accurately.',
        ],
      },
      {
        href: '/disciplinary',
        icon: ShieldAlert,
        name: 'Disciplinary',
        roles: ['Admin', 'Teacher'],
        description: 'Record disciplinary incidents, sanctions applied, and follow-up actions for students. Maintain a clear record for pastoral reviews.',
        actions: [
          'Log a disciplinary incident with date, description, and involved students',
          'Record the sanction or consequence applied',
          'Add follow-up notes and resolution status',
          'View disciplinary history per student',
        ],
        tips: [
          'Mark incidents as resolved once follow-up is complete to keep the active incident list manageable.',
        ],
      },
    ],
  },
  {
    label: 'Administration',
    modules: [
      {
        href: '/departments',
        icon: Building2,
        name: 'Departments',
        roles: ['Admin'],
        description: 'Organise teaching staff into academic departments (e.g. Mathematics, Sciences, Languages). Departments can have a head of department assigned.',
        actions: [
          'Create departments with name and description',
          'Assign a head of department',
          'Link teachers to a department',
        ],
        tips: [
          'Departments are used in staff reports and help organise timetable planning by subject group.',
        ],
      },
      {
        href: '/library',
        icon: Library,
        name: 'Library',
        roles: ['Admin', 'Inventory'],
        description: 'Manage the school library book catalog, borrowing records, and return tracking. Monitor overdue returns and stock levels.',
        actions: [
          'Add books to the catalog with title, author, ISBN, and quantity',
          'Record a book borrowing against a student or staff member',
          'Mark books as returned',
          'View overdue borrowings',
        ],
        tips: [
          'Set a standard loan period (e.g. 14 days) so the system can flag overdue returns automatically.',
        ],
      },
      {
        href: '/inventory',
        icon: Package,
        name: 'Inventory',
        roles: ['Admin', 'Inventory'],
        description: 'Track school assets and consumable stock levels. Record stock receipts, issues, and adjustments to maintain accurate inventory counts.',
        actions: [
          'Add inventory items with category, unit, and opening stock',
          'Record stock receipts (items coming in)',
          'Record stock issues (items going out)',
          'View current stock levels and transaction history',
        ],
        tips: [
          'Run a physical stock count periodically and use the adjustment feature to reconcile differences.',
        ],
      },
      {
        href: '/procurement',
        icon: ShoppingCart,
        name: 'Procurement',
        roles: ['Admin', 'Finance'],
        description: 'Raise and track purchase requests for supplies and assets. Link procurement to inventory so received goods update stock automatically.',
        actions: [
          'Create a purchase request with item details and quantity',
          'Approve or reject requests',
          'Mark orders as received to update inventory stock',
          'View procurement history and spending',
        ],
        tips: [
          'Finance approval is required before a purchase order is sent to suppliers — always submit requests in advance of the need date.',
        ],
      },
      {
        href: '/staff-leave',
        icon: CalendarOff,
        name: 'Staff Leave',
        roles: ['Admin'],
        description: 'Submit, approve, and track leave requests for all staff categories — teaching and non-teaching. Provides a clear record of absences for payroll purposes.',
        actions: [
          'Submit a leave request for a staff member',
          'Approve or decline leave requests',
          'View leave balances and history per staff',
          'Export leave records for payroll',
        ],
        tips: [
          'Configure leave types (Annual, Sick, Maternity, etc.) before recording any requests.',
        ],
      },
      {
        href: '/announcements',
        icon: Megaphone,
        name: 'Announcements',
        roles: ['Admin', 'Teacher', 'Finance'],
        description: 'Publish notices visible to students, teachers, or parents via the parent portal. Pin important announcements to keep them at the top.',
        actions: [
          'Create an announcement with title, body, and audience',
          'Set a publish date and expiry date',
          'Pin an announcement to the top of the portal',
          'View all active and archived announcements',
        ],
        tips: [
          'Target your audience carefully — announcements sent to "Parents" appear on the Parent Portal, not inside the staff app.',
        ],
      },
      {
        href: '/transport',
        icon: Bus,
        name: 'Transport & Fleet',
        roles: ['Admin', 'Transport'],
        description: 'Manage school vehicles, student transport routes, and bus assignments. Track vehicle maintenance schedules and driver details.',
        actions: [
          'Add vehicles with registration, capacity, and driver details',
          'Create transport routes with stops',
          'Assign students to routes',
          'Log vehicle maintenance records',
        ],
        tips: [
          'Update student route assignments at the start of each term to reflect any address changes.',
        ],
      },
      {
        href: '/activities',
        icon: Trophy,
        name: 'Activities',
        roles: ['Admin', 'Teacher'],
        description: 'Record extra-curricular clubs, sports teams, and student participation in school activities. Track meeting schedules and achievement records.',
        actions: [
          'Create an activity or club with name, type, and teacher in charge',
          'Enrol students in activities',
          'Log activity sessions and attendance',
          'Record awards and achievements',
        ],
        tips: [
          'Activities can be included on student report cards to showcase holistic development beyond academics.',
        ],
      },
      {
        href: '/reports',
        icon: BarChart3,
        name: 'Reports',
        roles: ['Admin', 'Teacher', 'Finance'],
        description: 'Generate school-wide summary reports covering attendance, academic performance, and fee collection. Export reports as PDF or spreadsheet.',
        actions: [
          'Generate attendance summary reports by class or period',
          'View academic performance summaries by term',
          'Generate fee collection and outstanding balance reports',
          'Export reports for governors or regulatory submission',
        ],
        tips: [
          'Filter reports by academic year and term for accurate period-specific data.',
        ],
      },
      {
        href: '/reports/report-card',
        icon: FileText,
        name: 'Report Cards',
        roles: ['Admin', 'Teacher', 'Finance'],
        description: 'Generate and print term report cards for individual students or an entire class. Report cards use gradebook scores and the GES grading scale.',
        actions: [
          'Select an academic year, term, class, and student',
          'Preview the formatted report card',
          'Print or download as PDF',
          'Generate cards for the entire class at once',
        ],
        tips: [
          'Ensure all gradebook entries are saved and exams are published before generating report cards.',
        ],
      },
      {
        href: '/reports/national-exams',
        icon: Medal,
        name: 'National Exams',
        roles: ['Admin', 'Teacher'],
        description: 'Track national examination entries (BECE, WASSCE) and record results. Monitor subject-level pass rates and aggregate scores.',
        actions: [
          'Register students for national exams (BECE/WASSCE)',
          'Enter candidate index numbers',
          'Record results when published by WAEC/GES',
          'View pass rates and aggregate score distribution',
        ],
        tips: [
          'Double-check candidate index numbers against the WAEC registration portal before final submission.',
        ],
      },
    ],
  },
  {
    label: 'Finance',
    modules: [
      {
        href: '/fees',
        icon: DollarSign,
        name: 'Fees',
        roles: ['Admin', 'Finance'],
        description: 'Set up fee structures per grade and term, record fee payments, track outstanding balances, and print receipts. The fee module is the central hub for school revenue.',
        actions: [
          'Create fee structures assigning amounts per fee type per grade and term',
          'Record a fee payment against a student account',
          'View outstanding balances per student or class',
          'Print a payment receipt',
          'Apply scholarships or waivers to reduce the amount due',
        ],
        tips: [
          'Set up fee structures at the beginning of each term before any payments are recorded to ensure balances are calculated correctly.',
        ],
      },
      {
        href: '/finance/scholarships',
        icon: Award,
        name: 'Scholarships',
        roles: ['Admin', 'Finance'],
        description: 'Manage scholarship awards and bursaries. Apply scholarships against student fee accounts to reduce the amount owed automatically.',
        actions: [
          'Create a scholarship type with name and award amount',
          'Assign a scholarship to a student for a specific term',
          'View all active scholarships and their impact on outstanding balances',
          'Generate scholarship reports for donors',
        ],
        tips: [
          'Scholarships reduce the fee balance shown on the student\'s account — record them before sending fee balance statements to parents.',
        ],
      },
    ],
  },
  {
    label: 'Platform',
    modules: [
      {
        href: '/profile',
        icon: UserRound,
        name: 'My Profile',
        roles: ['All'],
        description: 'View and edit your own account details — display name, email address, and password. Your profile applies to your login account only and does not affect other users.',
        actions: [
          'Update your display name',
          'Change your email address',
          'Reset your login password',
        ],
        tips: [
          'Choose a strong password of at least 8 characters mixing letters, numbers, and symbols. Contact your administrator if you are locked out.',
        ],
      },
      {
        href: '/settings',
        icon: Settings,
        name: 'Settings',
        roles: ['Admin'],
        description: 'Manage application-wide preferences including language/locale, dark mode, and notification settings. Settings are saved per user and persist across sessions.',
        actions: [
          'Switch the interface language (English, French, Spanish, German, Portuguese)',
          'Toggle dark mode or follow the system preference',
          'Configure notification preferences',
        ],
        tips: [
          'Language changes take effect immediately without a page reload. Each user can set their own preferred language independently.',
        ],
      },
    ],
  },
  {
    label: 'Other',
    modules: [
      {
        href: '/pool',
        icon: Waves,
        name: 'Swimming Pool',
        roles: ['Admin', 'Pool', 'Kitchen'],
        description: 'Manage pool sessions, student swim groups, pool usage scheduling, and safety records. Track which students are cleared for pool use.',
        actions: [
          'Create pool sessions with date, time, and swim group',
          'Assign students to swim groups',
          'Record pool usage and safety checks',
          'View pool schedule for the week',
        ],
        tips: [
          'Ensure medical clearance is documented in the Health Records module before assigning a student to any pool session.',
        ],
      },
      {
        href: '/portal',
        icon: Bell,
        name: 'Parent Portal',
        roles: ['Parent'],
        description: 'Parents with portal accounts see school notices, their child\'s attendance summary, and important updates here. The portal is a read-only view for parents.',
        actions: [
          'View pinned and recent school announcements',
          'See your child\'s attendance and academic summary',
          'Check school event notices',
        ],
        tips: [
          'Contact the school administrator if you cannot see your child\'s records — your parent account may not be linked to the student profile yet.',
        ],
      },
    ],
  },
];

/* ── Workflow cards ──────────────────────────────────────────────────────────── */
const workflows = [
  {
    icon: School,
    title: 'First-Time Setup',
    steps: ['Register your school at /onboarding', 'Set up Academic Years & Terms', 'Add Grade Levels & Fee Types', 'Create user accounts for staff'],
    color: 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10',
    iconBg: 'bg-blue-500',
  },
  {
    icon: LayoutGrid,
    title: 'Module Management',
    steps: ['Go to /onboarding', 'Click the ⚙ icon next to a school', 'Toggle modules on or off', 'Save — dashboard updates immediately'],
    color: 'border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10',
    iconBg: 'bg-violet-500',
  },
  {
    icon: DollarSign,
    title: 'Finance Setup',
    steps: ['Create Fee Types in Setup', 'Build Fee Structures per grade & term', 'Record payments against student accounts', 'Apply scholarships to reduce balances'],
    color: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10',
    iconBg: 'bg-emerald-500',
  },
  {
    icon: BookOpenCheck,
    title: 'End-of-Term Flow',
    steps: ['Enter exam marks in Exams module', 'Compute grades in Gradebook', 'Generate Report Cards', 'Run Promotions for next year'],
    color: 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10',
    iconBg: 'bg-amber-500',
  },
];

/* ── Role overview ───────────────────────────────────────────────────────────── */
const roles = [
  { name: 'Admin',     desc: 'Full access to all modules and setup',                 badge: roleBadge.Admin },
  { name: 'Teacher',   desc: 'Students, classes, attendance, exams, gradebook',      badge: roleBadge.Teacher },
  { name: 'Finance',   desc: 'Fees, scholarships, procurement, reports',             badge: roleBadge.Finance },
  { name: 'Inventory', desc: 'Library, inventory, students (read)',                  badge: roleBadge.Inventory },
  { name: 'Transport', desc: 'Transport & fleet management',                         badge: roleBadge.Transport },
  { name: 'Pool',      desc: 'Swimming pool sessions and scheduling',                badge: roleBadge.Pool },
  { name: 'Parent',    desc: 'Parent portal — notices and child updates (read only)',badge: roleBadge.Parent },
  { name: 'Kitchen',   desc: 'Pool / kitchen access (limited)',                      badge: roleBadge.Kitchen },
];

/* ── Accordion card ──────────────────────────────────────────────────────────── */
function ModuleCard({ mod, sectionLabel }: { mod: Module; sectionLabel: string }) {
  const [open, setOpen] = useState(false);
  const Icon = mod.icon;
  const accent = sectionColor[sectionLabel] ?? 'bg-slate-500';

  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-shadow ${open ? 'shadow-sm' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${accent} bg-opacity-10`}>
            <Icon className={`h-4 w-4 ${accent.replace('bg-', 'text-')}`} />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{mod.name}</span>
          <div className="hidden sm:flex items-center gap-1 flex-wrap">
            {mod.roles.map(r => <RoleBadge key={r} role={r} />)}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-4">
          <div className="flex sm:hidden items-center gap-1 flex-wrap">
            {mod.roles.map(r => <RoleBadge key={r} role={r} />)}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{mod.description}</p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Key Actions</p>
            <ul className="space-y-1.5">
              {mod.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {mod.tips.length > 0 && (
            <div className="space-y-2">
              {mod.tips.map((tip, i) => <Tip key={i}>{tip}</Tip>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function DocsPage() {
  const [query, setQuery]         = useState('');
  const [activeSection, setActive] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return sections;
    return sections
      .map(section => ({
        ...section,
        modules: section.modules.filter(
          m =>
            m.name.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.actions.some(a => a.toLowerCase().includes(q)),
        ),
      }))
      .filter(s => s.modules.length > 0);
  }, [query]);

  const scrollTo = (label: string) => {
    setActive(label);
    sectionRefs.current[label]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>
        <div className="relative px-8 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Documentation</p>
              <h1 className="text-2xl font-bold text-white mb-2">Help &amp; Docs</h1>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                Complete reference for every module — what it does, who can use it, and how to get the most out of it.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> {sections.reduce((n, s) => n + s.modules.length, 0)} modules covered</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400 inline-block" /> {sections.length} sections</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> 8 user roles</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-6 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search modules, actions, or topics…"
              value={query}
              onChange={e => { setQuery(e.target.value); setActive(null); }}
              className="w-full pl-9 pr-9 h-10 rounded-xl border border-white/10 bg-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition backdrop-blur-sm"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Section nav pills — only when not searching ─────────────────── */}
      {!query && (
        <div className="flex flex-wrap gap-2">
          {sections.map(s => {
            const accent = sectionColor[s.label] ?? 'bg-slate-500';
            const isActive = activeSection === s.label;
            return (
              <button
                key={s.label}
                onClick={() => scrollTo(s.label)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                  isActive
                    ? `${accent} text-white border-transparent`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white/60' : accent}`} />
                {s.label}
                <span className="opacity-50">{s.modules.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Workflow cards — only when not searching ─────────────────────── */}
      {!query && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Common Workflows</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {workflows.map(w => {
              const WIcon = w.icon;
              return (
                <div key={w.title} className={`rounded-xl border p-4 space-y-3 ${w.color}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${w.iconBg}`}>
                      <WIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{w.title}</p>
                  </div>
                  <ol className="space-y-1.5">
                    {w.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-white/60 dark:bg-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-px">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Role overview — only when not searching ───────────────────────── */}
      {!query && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">User Roles</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {roles.map(r => (
              <div key={r.name} className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3">
                <span className={`inline-flex mt-0.5 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${r.badge}`}>{r.name}</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Module sections ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try a different search term</p>
        </div>
      ) : (
        filtered.map(section => {
          const accent = sectionColor[section.label] ?? 'bg-slate-500';
          return (
            <div
              key={section.label}
              ref={el => { sectionRefs.current[section.label] = el; }}
              className="space-y-3 scroll-mt-6"
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-3 w-3 rounded-full ${accent}`} />
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {section.label}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-600">
                  {section.modules.length} module{section.modules.length !== 1 ? 's' : ''}
                </span>
                {!query && (
                  <button
                    onClick={() => scrollTo(section.label === activeSection ? '' : section.label)}
                    className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Jump to top <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {section.modules.map(mod => (
                  <ModuleCard key={mod.href} mod={mod} sectionLabel={section.label} />
                ))}
              </div>
            </div>
          );
        })
      )}

    </div>
  );
}
