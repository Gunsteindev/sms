'use client';

import { useEffect } from 'react';
import { useSession } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School, Users, Calendar, DollarSign, BookOpen, BarChart3,
  ArrowRight, CheckCircle2, GraduationCap, UserCheck, TrendingUp,
  ShieldCheck, Zap, Globe, ClipboardList, Clock, Library,
  FileText, Award, Package, ShoppingCart, CalendarOff,
  Megaphone, Bus, Trophy, HeartPulse, ShieldAlert, UserPlus,
  Waves, BookMarked, Building2, Settings, Star, ChevronRight,
} from 'lucide-react';

/* ─── Module categories ─────────────────────────────────────────────── */

const CATEGORIES = [
  {
    label: 'Academic',
    accent: 'from-blue-500 to-cyan-500',
    pill:   'bg-blue-50 text-blue-700 border-blue-200',
    modules: [
      { icon: Users,         title: 'Student Management',     desc: 'Full student profiles — guardians, medical records, photos, and complete academic history.' },
      { icon: BookOpen,      title: 'Class Organisation',     desc: 'Create classes, assign form teachers, track enrolment capacity per grade level.' },
      { icon: BookMarked,    title: 'Subjects & Timetable',   desc: 'Define subjects, build weekly schedules, and assign teachers to periods.' },
      { icon: Calendar,      title: 'Attendance Tracking',    desc: 'Mark daily attendance per class, view visual calendars, and monitor trends.' },
      { icon: ClipboardList, title: 'Gradebook & GES Grades', desc: 'Enter classwork, homework, mid-term, and end-of-term scores. Auto-calculates A1–F9.' },
      { icon: FileText,      title: 'Report Cards',           desc: 'Generate terminal report cards per student, per term — ready in seconds.' },
      { icon: Award,         title: 'Student Promotions',     desc: 'Promote, retain, transfer, or graduate whole classes at end of year.' },
      { icon: FileText,      title: 'Exam Management',        desc: 'Schedule exams, record results by subject, and track performance trends.' },
    ],
  },
  {
    label: 'Finance',
    accent: 'from-emerald-500 to-teal-500',
    pill:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    modules: [
      { icon: DollarSign,  title: 'Fee Structures',      desc: 'Define term-based or one-off fees per grade level or class, with optional scholarships.' },
      { icon: DollarSign,  title: 'Fee Payments',        desc: 'Record payments, generate receipts, and track outstanding balances per student.' },
      { icon: Award,       title: 'Scholarships',        desc: 'Manage full and partial bursaries — automatically discount from student invoices.' },
      { icon: ShoppingCart,title: 'Procurement',         desc: 'Raise purchase orders, track supplier deliveries, and maintain procurement history.' },
    ],
  },
  {
    label: 'People & Welfare',
    accent: 'from-violet-500 to-purple-500',
    pill:   'bg-violet-50 text-violet-700 border-violet-200',
    modules: [
      { icon: GraduationCap, title: 'Teachers',           desc: 'Staff profiles, subject assignments, class responsibilities, and performance records.' },
      { icon: Users,         title: 'Employees',          desc: 'Non-teaching staff records, contracts, roles, and employment history.' },
      { icon: UserPlus,      title: 'Parents & Guardians',desc: 'Link guardians to students, manage contact details, and share updates via portal.' },
      { icon: CalendarOff,   title: 'Staff Leave',        desc: 'Submit, approve, and track staff leave requests — annual, sick, emergency, and more.' },
      { icon: HeartPulse,    title: 'Health Records',     desc: 'Log student medical visits, conditions, allergies, and nurse consultations.' },
      { icon: ShieldAlert,   title: 'Disciplinary',       desc: 'Record incidents, sanctions, and follow-ups — full audit trail per student.' },
    ],
  },
  {
    label: 'Operations',
    accent: 'from-orange-500 to-amber-500',
    pill:   'bg-orange-50 text-orange-700 border-orange-200',
    modules: [
      { icon: Library,     title: 'Library',             desc: 'Manage book inventory, loans, returns, overdue tracking, and library usage reports.' },
      { icon: Package,     title: 'Inventory',           desc: 'Track school assets, stock levels, reorder alerts, and asset assignments.' },
      { icon: Bus,         title: 'Transport & Fleet',   desc: 'Register vehicles, assign drivers, manage routes, and track fleet status.' },
      { icon: Trophy,      title: 'Activities & Clubs',  desc: 'Run sports, arts, music, drama, and academic clubs — schedule sessions and track enrolment.' },
      { icon: Waves,       title: 'Swimming Pool',       desc: 'Manage pool sessions, equipment rentals, entry fees, and poolside transactions.' },
      { icon: Megaphone,   title: 'Announcements',       desc: 'Publish school-wide notices — target students, teachers, parents, or all audiences.' },
    ],
  },
  {
    label: 'Reports & Setup',
    accent: 'from-pink-500 to-rose-500',
    pill:   'bg-pink-50 text-pink-700 border-pink-200',
    modules: [
      { icon: BarChart3,   title: 'Reports & Analytics', desc: 'Attendance trends, fee collection charts, performance dashboards, and KPI summaries.' },
      { icon: FileText,    title: 'National Exams',      desc: 'Track BECE and WASSCE candidates, centres, and predicted outcomes.' },
      { icon: Building2,   title: 'Departments',         desc: 'Organise staff into academic and administrative departments.' },
      { icon: Settings,    title: 'School Setup',        desc: 'Configure academic years, terms, grade levels, houses, programme tracks, and fee types.' },
      { icon: UserCheck,   title: 'User Management',     desc: 'Role-based access control — Admin, Teacher, Finance, Inventory, Transport, Pool, Parent.' },
    ],
  },
];

const ALL_MODULES = CATEGORIES.flatMap(c => c.modules);

/* ─── Stats ─────────────────────────────────────────────────────────── */
const STATS = [
  { value: '20+',   label: 'Integrated Modules', icon: Zap       },
  { value: '7',     label: 'Role-based Access Levels', icon: ShieldCheck },
  { value: '99.9%', label: 'Uptime SLA',          icon: TrendingUp },
  { value: '100%',  label: 'GES-Aligned Grading', icon: GraduationCap },
];

/* ─── Trust strip ───────────────────────────────────────────────────── */
const TRUST = [
  { icon: ShieldCheck, label: 'Enterprise-grade security'   },
  { icon: Zap,         label: 'Real-time data sync'         },
  { icon: Globe,       label: 'Microsoft Dataverse backend' },
  { icon: UserCheck,   label: 'Role-based access control'   },
];

/* ─── Dashboard mock ────────────────────────────────────────────────── */
const BAR_HEIGHTS = [55, 72, 88, 65, 80, 95, 78];

function DashboardMock() {
  return (
    <div className="relative mx-auto w-full max-w-sm select-none lg:mx-0">
      {/* Ambient glow */}
      <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-violet-500/20 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative rounded-2xl border border-white/12 bg-white/8 p-5 shadow-2xl backdrop-blur-md">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Live Overview</p>
            <p className="text-sm font-bold text-white mt-0.5">Dashboard · Today</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { n: '1 248', l: 'Students',   c: 'from-blue-500/25 to-cyan-500/15'    },
            { n: '94.2%', l: 'Attendance', c: 'from-emerald-500/25 to-teal-500/15' },
            { n: '42',    l: 'Classes',    c: 'from-violet-500/25 to-purple-500/15' },
          ].map(({ n, l, c }) => (
            <div key={l} className={`rounded-xl bg-gradient-to-br ${c} p-2.5 border border-white/8`}>
              <p className="text-base font-black text-white leading-none">{n}</p>
              <p className="text-[9px] text-white/45 mt-1 leading-none">{l}</p>
            </div>
          ))}
        </div>

        {/* Attendance chart */}
        <div className="rounded-xl bg-white/5 p-3 border border-white/8 mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-medium text-white/55">Attendance — this week</p>
            <span className="text-[10px] text-emerald-400 font-bold">+4.2%</span>
          </div>
          <div className="flex items-end gap-1 h-12">
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-blue-500/65 to-cyan-400/65"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] text-white/25">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* Bottom row — fee + pool */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 p-2.5 border border-white/8">
            <p className="text-[9px] text-white/40">Fee Collection</p>
            <p className="text-sm font-black text-white mt-0.5">GH₵ 48 250</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-semibold">+12% month</span>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/10 p-2.5 border border-white/8">
            <p className="text-[9px] text-white/40">Pool Revenue</p>
            <p className="text-sm font-black text-white mt-0.5">GH₵ 6 800</p>
            <div className="flex items-center gap-1 mt-1">
              <Waves className="h-2.5 w-2.5 text-cyan-400" />
              <span className="text-[9px] text-cyan-400 font-semibold">20 sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating grade card */}
      <div className="absolute -right-4 -top-5 rounded-xl border border-white/12 bg-gradient-to-br from-violet-500/25 to-purple-500/12 p-3 shadow-xl backdrop-blur-md w-40">
        <p className="text-[9px] text-white/45">GES Grade Average</p>
        <p className="text-sm font-black text-white mt-0.5">B2 — 72.4%</p>
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-2.5 w-2.5 text-violet-300" />
          <span className="text-[9px] text-violet-300 font-semibold">Term 1 results</span>
        </div>
      </div>

      {/* Floating transport card */}
      <div className="absolute -left-4 -bottom-5 rounded-xl border border-white/12 bg-gradient-to-br from-emerald-500/20 to-teal-500/12 p-3 shadow-xl backdrop-blur-md w-40">
        <p className="text-[9px] text-white/45">Fleet Status</p>
        <p className="text-sm font-black text-white mt-0.5">8 / 10 Active</p>
        <div className="flex items-center gap-1 mt-1">
          <Bus className="h-2.5 w-2.5 text-emerald-300" />
          <span className="text-[9px] text-emerald-300 font-semibold">2 in maintenance</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 antialiased">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/6 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
              <School className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">SchoolMS</span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-400 md:flex">
            <a href="#modules"  className="transition-colors hover:text-white">Modules</a>
            <a href="#ghana"    className="transition-colors hover:text-white">Ghana GES</a>
            <a href="#start"    className="transition-colors hover:text-white">Get Started</a>
          </nav>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-blue-500/35"
          >
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section
          className="relative min-h-screen overflow-hidden pt-24"
          style={{
            background: `
              radial-gradient(ellipse 80% 55% at 50% -5%, rgba(99,102,241,0.28) 0%, transparent 70%),
              radial-gradient(ellipse 55% 45% at 95% 45%, rgba(6,182,212,0.14) 0%, transparent 55%),
              radial-gradient(ellipse 65% 55% at 5%  80%, rgba(124,58,237,0.12) 0%, transparent 55%),
              #020617
            `,
          }}
        >
          {/* Dot mesh */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: 'radial-gradient(rgba(148,163,184,0.5) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />

          {/* Ambient orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/8  blur-3xl" />
            <div className="absolute bottom-1/3 left-1/3  h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 pb-36 pt-20 lg:flex-row lg:gap-10 lg:pt-28">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/22 bg-indigo-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Ghana GES-Aligned · 20+ Modules
              </div>

              <h1 className="text-5xl font-black leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
                The smarter way<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #67e8f9 0%, #818cf8 45%, #c084fc 100%)' }}
                >
                  to run your school
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-slate-400 lg:mx-0">
                One connected platform for students, staff, attendance, grades, fees, fleet,
                pool, and more — built on Microsoft Dataverse for enterprise reliability.
              </p>

              {/* Trust strip */}
              <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2.5 lg:justify-start">
                {TRUST.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-2 text-sm text-slate-400">
                    <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
                    {label}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/45 hover:scale-[1.02] active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)' }}
                >
                  Sign in to the system
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#modules"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-7 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:border-white/18 hover:bg-white/10 hover:text-white"
                >
                  Explore 20+ modules
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </a>
              </div>

              {/* Counts */}
              <div className="mt-10 flex items-center justify-center gap-6 lg:justify-start">
                {['Students', 'Teachers', 'Finance', 'Operations'].map((m, i) => (
                  <div key={m} className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-600">{m}</p>
                    <div className="mt-1 flex gap-0.5">
                      {Array.from({ length: 5 - i }).map((_, j) => (
                        <div key={j} className="h-1 w-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-70" />
                      ))}
                      {Array.from({ length: i }).map((_, j) => (
                        <div key={j} className="h-1 w-3 rounded-full bg-white/10" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: mockup */}
            <div className="w-full flex-1 flex items-center justify-center lg:justify-end">
              <DashboardMock />
            </div>
          </div>

          {/* Gradient fade to next section */}
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
        </section>

        {/* ── Stats bar ──────────────────────────────────────────────────── */}
        <section className="bg-slate-900 py-12 border-y border-white/6">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center text-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 border border-white/8">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <p
                    className="text-3xl font-black bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #67e8f9, #818cf8)' }}
                  >
                    {value}
                  </p>
                  <p className="text-xs text-slate-500 leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ghana GES callout ──────────────────────────────────────────── */}
        <section id="ghana" className="bg-slate-900 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div
              className="relative overflow-hidden rounded-2xl px-8 py-10 text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 50%, #0e7490 100%)' }}
            >
              {/* Background pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

              <div className="relative flex flex-col items-center gap-8 sm:flex-row">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-white/20">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="text-xl font-black">Built for Ghana's Schools</p>
                  <p className="text-sm text-blue-100 mt-2 leading-relaxed max-w-xl">
                    GES grading formula baked in — Classwork + Homework + Mid-Term (30%) added
                    to End-of-Term (70%) automatically. Grades A1–F9 with GES remarks. BECE and
                    WASSCE candidate tracking. Report cards formatted to national standards.
                  </p>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2">
                  {['A1–F9 Auto-graded', 'BECE / WASSCE Ready', 'GES Report Cards'].map(t => (
                    <div key={t} className="flex items-center gap-2 text-sm text-blue-100">
                      <CheckCircle2 className="h-4 w-4 text-cyan-300 flex-shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Module categories ──────────────────────────────────────────── */}
        <section
          id="modules"
          className="bg-slate-950 py-28"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.05) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
        >
          <div className="mx-auto max-w-7xl px-6">

            {/* Section header */}
            <div className="mb-20 text-center">
              <span className="mb-4 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-indigo-400">
                20+ Integrated Modules
              </span>
              <h2 className="text-4xl font-black text-white">
                Everything your school needs,<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #67e8f9 0%, #818cf8 100%)' }}
                >
                  in one connected platform
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
                From student enrolment to swimming pool revenue — every module shares one
                database so data never gets out of sync.
              </p>
            </div>

            {/* Each category */}
            <div className="space-y-20">
              {CATEGORIES.map(({ label, accent, pill, modules }) => (
                <div key={label}>
                  {/* Category label */}
                  <div className="flex items-center gap-4 mb-8">
                    <span className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-widest ${pill}`}>
                      {label}
                    </span>
                    <div className={`flex-1 h-px bg-gradient-to-r ${accent} opacity-20`} />
                  </div>

                  {/* Module cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {modules.map(({ icon: Icon, title, desc }) => (
                      <div
                        key={title}
                        className="group relative overflow-hidden rounded-2xl border border-white/7 bg-white/4 p-5 transition-all duration-300 hover:border-white/14 hover:bg-white/7 hover:-translate-y-0.5"
                      >
                        {/* Top accent bar */}
                        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} opacity-0 transition-opacity duration-300 group-hover:opacity-60`} />

                        <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} bg-opacity-15 text-white/80`}
                          style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))`, border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>

                        <h3 className="text-sm font-bold text-white">{title}</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Total count */}
            <div className="mt-16 text-center">
              <p className="text-sm text-slate-600">
                {ALL_MODULES.length} modules · all connected · one login
              </p>
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <section
          id="start"
          className="relative overflow-hidden py-28 bg-slate-900 border-y border-white/6"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-0    h-80 w-80 rounded-full bg-indigo-600/8 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-cyan-600/8  blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <span className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-cyan-400">
                Getting Started
              </span>
              <h2 className="text-4xl font-black text-white">Up and running in minutes</h2>
              <p className="mx-auto mt-4 max-w-md text-slate-400">
                Three simple steps to transform how your school is managed.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: '01', title: 'Sign in',
                  desc: 'Use your administrator credentials to access the secure portal from any device, anywhere.',
                  color: 'from-blue-600 to-cyan-600',
                  glow: 'shadow-blue-500/30',
                },
                {
                  step: '02', title: 'Configure',
                  desc: 'Set up classes, grade levels, fee structures, and add your staff and student records.',
                  color: 'from-indigo-600 to-violet-600',
                  glow: 'shadow-violet-500/30',
                },
                {
                  step: '03', title: 'Manage & Report',
                  desc: 'Track attendance, enter grades, collect fees, and generate GES report cards instantly.',
                  color: 'from-violet-600 to-pink-600',
                  glow: 'shadow-pink-500/30',
                },
              ].map(({ step, title, desc, color, glow }, i) => (
                <div key={step} className="relative flex flex-col items-center text-center">
                  {i < 2 && (
                    <div className="absolute left-[calc(50%+2.5rem)] top-7 hidden h-px w-[calc(100%-5rem)] bg-gradient-to-r from-white/15 to-transparent sm:block" />
                  )}
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-lg font-black text-white shadow-xl ${glow}`}>
                    {step}
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-32 bg-slate-950">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4  top-0    h-96 w-96 rounded-full bg-indigo-500/12 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-cyan-500/12  blur-3xl" />
          </div>
          <div
            className="pointer-events-none absolute inset-0 opacity-8"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/60">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
              Ready when you are
            </div>

            <h2 className="text-4xl font-black text-white sm:text-5xl leading-tight">
              Take control of your<br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #67e8f9 0%, #a78bfa 100%)' }}
              >
                school operations
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-md text-lg text-slate-400">
              Sign in to your administrator account and experience the difference a
              unified, GES-aligned platform makes.
            </p>

            <div className="mt-10">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-9 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.99]"
              >
                Sign in to SchoolMS
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-600">
              {['Ghana GES-aligned grading', 'Microsoft Dataverse powered', 'Role-based access control'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-600/50" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 bg-slate-950 px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-10 sm:flex-row">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <School className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">SchoolMS</span>
              </div>
              <p className="text-xs text-slate-600 max-w-56 leading-relaxed">
                Ghana GES-aligned school administration platform. Built for real schools.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12 text-sm">
              <div className="flex flex-col gap-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Platform</p>
                <a href="#modules" className="text-slate-500 hover:text-white transition-colors text-xs">Modules</a>
                <a href="#ghana"   className="text-slate-500 hover:text-white transition-colors text-xs">Ghana GES</a>
                <a href="#start"   className="text-slate-500 hover:text-white transition-colors text-xs">Get Started</a>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Account</p>
                <Link href="/auth/login"  className="text-slate-500 hover:text-white transition-colors text-xs">Admin Sign in</Link>
                <Link href="/dashboard"   className="text-slate-500 hover:text-white transition-colors text-xs">Dashboard</Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-700">
              © {new Date().getFullYear()} SchoolMS. All rights reserved.
            </p>
            <p className="text-xs text-slate-700">
              Powered by Microsoft Dataverse · Next.js 16
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
