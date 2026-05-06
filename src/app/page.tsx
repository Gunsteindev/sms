'use client';

import { useEffect } from 'react';
import { useSession } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  Zap,
  Globe,
  ClipboardList,
  Clock,
  Library,
  FileText,
  Award,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────────────────── */

const features = [
  { icon: Users,         title: 'Student Management',    desc: 'Enrol, track, and manage every student — profiles, guardians, medical records, and full academic history.',   accent: 'from-blue-500 to-cyan-500',      soft: 'bg-blue-50   text-blue-600',   isNew: false },
  { icon: GraduationCap, title: 'Teachers & Staff',      desc: 'Manage teaching staff, employee records, departments, and class assignments in one place.',                   accent: 'from-violet-500 to-purple-500',  soft: 'bg-violet-50 text-violet-600', isNew: false },
  { icon: Calendar,      title: 'Attendance Tracking',   desc: 'Mark daily attendance, view visual calendars, and monitor trends — with automatic duplicate prevention.',      accent: 'from-emerald-500 to-teal-500',   soft: 'bg-emerald-50 text-emerald-600', isNew: false },
  { icon: ClipboardList, title: 'Gradebook & GES Grades',desc: 'Enter classwork, homework, mid-term, and end-of-term scores. Auto-calculates Ghana GES grades (A1–F9).',      accent: 'from-indigo-500 to-blue-500',   soft: 'bg-indigo-50 text-indigo-600', isNew: true },
  { icon: FileText,      title: 'Report Cards',          desc: 'Generate terminal report cards per student. Select year, term, and class — ready in seconds.',                 accent: 'from-sky-500 to-cyan-500',      soft: 'bg-sky-50    text-sky-600',    isNew: true },
  { icon: Award,         title: 'Student Promotions',    desc: 'Promote, retain, transfer, or graduate students at end of year with capacity checks built in.',               accent: 'from-pink-500 to-rose-500',     soft: 'bg-pink-50   text-pink-600',   isNew: true },
  { icon: DollarSign,    title: 'Fee Management',        desc: 'Define fee structures, record payments, manage scholarships, and generate revenue summaries.',                 accent: 'from-orange-500 to-amber-500',  soft: 'bg-orange-50 text-orange-600', isNew: false },
  { icon: Clock,         title: 'Timetable Scheduling',  desc: 'Build weekly class schedules, assign teachers to periods, and keep the full school calendar organised.',       accent: 'from-teal-500 to-emerald-500',  soft: 'bg-teal-50   text-teal-600',   isNew: false },
  { icon: Library,       title: 'Library Management',    desc: 'Track book inventory, manage loans and returns, and monitor library usage across the school.',                 accent: 'from-rose-500 to-pink-500',     soft: 'bg-rose-50   text-rose-600',   isNew: false },
  { icon: BookOpen,      title: 'Class Organisation',    desc: 'Create grade-based classes, assign teachers, and track enrolment capacity in real time.',                     accent: 'from-amber-500 to-orange-500',  soft: 'bg-amber-50  text-amber-600',  isNew: false },
  { icon: BarChart3,     title: 'Reports & Analytics',   desc: 'Actionable insights with attendance trends, performance charts, fee collection summaries, and KPI dashboards.', accent: 'from-purple-500 to-violet-500', soft: 'bg-purple-50 text-purple-600', isNew: false },
  { icon: Users,         title: 'Exam Management',       desc: 'Schedule exams, record results by student, and track performance across subjects and terms.',                  accent: 'from-cyan-500 to-sky-500',      soft: 'bg-cyan-50   text-cyan-600',   isNew: false },
];

const stats = [
  { value: '5 000+', label: 'Students Managed' },
  { value: '200+',   label: 'Staff Members' },
  { value: '99.9%',  label: 'Uptime SLA' },
  { value: '12',     label: 'Core Modules' },
];

const trust = [
  { icon: ShieldCheck, label: 'Enterprise-grade security' },
  { icon: Zap,         label: 'Real-time data sync' },
  { icon: Globe,       label: 'Microsoft Dataverse backend' },
  { icon: UserCheck,   label: 'Role-based access control' },
];

/* ─── Mock dashboard visual ─────────────────────────────────────────── */
const BAR_HEIGHTS = [55, 72, 88, 65, 80, 95, 78];

function DashboardMock() {
  return (
    <div className="relative mx-auto w-full max-w-sm select-none lg:mx-0">
      {/* Glow rings */}
      <div className="absolute inset-0 -m-8 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-violet-500/20 blur-3xl" />

      {/* Main card */}
      <div className="relative rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-medium text-white/50 uppercase tracking-widest">Live Overview</p>
            <p className="text-sm font-semibold text-white mt-0.5">Today — Dashboard</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { n: '1 248', l: 'Students',   c: 'from-blue-500/30 to-cyan-500/20' },
            { n: '94.2%', l: 'Attendance', c: 'from-emerald-500/30 to-teal-500/20' },
            { n: '42',    l: 'Classes',    c: 'from-violet-500/30 to-purple-500/20' },
          ].map(({ n, l, c }) => (
            <div key={l} className={`rounded-xl bg-gradient-to-br ${c} p-3 border border-white/10`}>
              <p className="text-lg font-bold text-white leading-none">{n}</p>
              <p className="text-[10px] text-white/50 mt-1">{l}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-xl bg-white/5 p-3 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-white/60">Attendance this week</p>
            <span className="text-xs text-emerald-400 font-semibold">+4.2%</span>
          </div>
          <div className="flex items-end gap-1.5 h-14">
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500/70 to-cyan-400/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/30">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>
      </div>

      {/* Floating fee card */}
      <div className="absolute -right-4 -top-5 rounded-xl border border-white/15 bg-gradient-to-br from-orange-500/20 to-amber-500/10 p-3 shadow-xl backdrop-blur-md w-40">
        <p className="text-[10px] text-white/50">Fee Collection</p>
        <p className="text-base font-bold text-white mt-0.5">GH₵ 48 250</p>
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium">+12% this month</span>
        </div>
      </div>

      {/* Floating grade card */}
      <div className="absolute -left-4 -bottom-5 rounded-xl border border-white/15 bg-gradient-to-br from-violet-500/20 to-purple-500/10 p-3 shadow-xl backdrop-blur-md w-40">
        <p className="text-[10px] text-white/50">GES Grade Average</p>
        <p className="text-base font-bold text-white mt-0.5">B2 — 72.4%</p>
        <div className="flex items-center gap-1 mt-1">
          <GraduationCap className="h-3 w-3 text-violet-300" />
          <span className="text-[10px] text-violet-300 font-medium">Term 1 results</span>
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
    <div className="flex min-h-screen flex-col bg-white antialiased">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
              <School className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold text-white">SchoolManager</span>
          </div>

          {/* Nav links */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#modules"  className="transition-colors hover:text-white">Modules</a>
            <a href="#start"    className="transition-colors hover:text-white">Get Started</a>
          </nav>

          {/* CTA */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/40"
          >
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section
          id="features"
          className="relative min-h-screen overflow-hidden bg-slate-950 pt-24"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 100% 50%, rgba(6,182,212,0.12) 0%, transparent 60%), radial-gradient(ellipse 70% 60% at 0% 80%, rgba(124,58,237,0.10) 0%, transparent 60%), #020617',
          }}
        >
          {/* Mesh dots */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Floating orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
            <div className="absolute bottom-1/4 left-1/3  h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
            <div className="absolute top-1/3  left-1/4  h-64 w-64 rounded-full bg-cyan-500/8  blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 pb-32 pt-20 lg:flex-row lg:gap-12 lg:pt-28">

            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Ghana GES-Aligned · 12 Modules
              </div>

              <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
                The smarter way<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #67e8f9 0%, #818cf8 45%, #c084fc 100%)' }}
                >
                  to run your school
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-slate-400 lg:mx-0">
                An all-in-one platform for students, teachers, attendance, grades, fees, and
                reports — built on Microsoft Dataverse for enterprise-grade reliability.
              </p>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2.5 lg:justify-start">
                {trust.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-2 text-sm text-slate-400">
                    <Icon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    {label}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)' }}
                >
                  Sign in to the system
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#modules"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-7 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700/60 hover:text-white"
                >
                  Explore modules
                </a>
              </div>
            </div>

            {/* Right: dashboard mockup */}
            <div className="w-full flex-1 flex items-center justify-center lg:justify-end">
              <DashboardMock />
            </div>
          </div>

          {/* Wave divider to white */}
          <div className="absolute bottom-0 inset-x-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 80L60 69.3C120 59 240 37 360 32C480 27 600 37 720 42.7C840 48 960 48 1080 42.7C1200 37 1320 27 1380 21.3L1440 16V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section className="bg-white py-6">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-sm sm:grid-cols-4">
              {stats.map(({ value, label }) => (
                <div key={label} className="bg-white px-8 py-8 text-center">
                  <p
                    className="text-3xl font-black bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #2563eb, #0891b2)' }}
                  >
                    {value}
                  </p>
                  <p className="mt-1.5 text-sm text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GES Callout Banner ─────────────────────────────────────────── */}
        <section className="bg-white py-4 pb-0">
          <div className="mx-auto max-w-5xl px-6">
            <div
              className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl px-6 py-5 text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 60%, #0e7490 100%)' }}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <p className="text-sm font-bold">Ghana GES Grading Built In</p>
                <p className="text-xs text-blue-100 mt-0.5">
                  Classwork + Homework + Mid-Term (30%) · End of Term (70%) · Grades A1–F9 auto-calculated
                </p>
              </div>
              <a href="#modules" className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 text-xs font-semibold text-white">
                See Gradebook <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* ── Modules grid ───────────────────────────────────────────────── */}
        <section
          id="modules"
          className="relative overflow-hidden bg-white py-28"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.04) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60"
            style={{ background: 'linear-gradient(to bottom, rgba(238,242,255,0.8), transparent)' }}
          />

          <div className="relative mx-auto max-w-7xl px-6">
            {/* Section header */}
            <div className="mb-16 text-center">
              <span className="mb-4 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
                12 Integrated Modules
              </span>
              <h2 className="text-4xl font-black text-gray-900">
                Everything your school needs<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)' }}
                >
                  in one connected platform
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
                From student enrolment to GES report cards — all modules talk to each other
                and stay in sync automatically.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map(({ icon: Icon, title, desc, accent, soft, isNew }) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl"
                >
                  {/* Top gradient accent bar */}
                  <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${soft}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isNew && (
                      <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        New
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <section
          id="start"
          className="relative overflow-hidden py-28"
          style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #faf5ff 100%)' }}
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <span className="mb-4 inline-block rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-600">
                Getting Started
              </span>
              <h2 className="text-4xl font-black text-gray-900">Up and running in minutes</h2>
              <p className="mx-auto mt-4 max-w-md text-gray-500">
                Three simple steps to transform how your school is managed.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {[
                { step: '01', title: 'Sign in',         desc: 'Use your administrator credentials to access the secure portal from any device, anywhere.',    color: 'from-blue-600 to-cyan-600' },
                { step: '02', title: 'Configure',       desc: 'Set up classes, grade levels, fee structures, and add your staff and student records.',         color: 'from-indigo-600 to-violet-600' },
                { step: '03', title: 'Manage & report', desc: 'Track attendance, enter grades, collect fees, and generate GES report cards in real time.',     color: 'from-violet-600 to-pink-600' },
              ].map(({ step, title, desc, color }, i) => (
                <div key={step} className="relative flex flex-col items-center text-center">
                  {i < 2 && (
                    <div className="absolute left-[calc(50%+2.5rem)] top-7 hidden h-px w-[calc(100%-5rem)] bg-gradient-to-r from-gray-300 to-transparent sm:block" />
                  )}
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-lg font-black text-white shadow-lg`}>
                    {step}
                  </div>
                  <h3 className="mt-5 text-base font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-28">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 40%, #0c4a6e 100%)' }}
          />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4  top-0    h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-cyan-500/20  blur-3xl" />
          </div>
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/70">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
              Ready when you are
            </div>

            <h2 className="text-4xl font-black text-white sm:text-5xl">
              Take control of your<br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #67e8f9 0%, #a78bfa 100%)' }}
              >
                school operations
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-md text-lg text-blue-200/80">
              Sign in to your administrator account and experience the difference a
              unified, GES-aligned platform makes.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-sm font-bold text-blue-800 shadow-xl shadow-black/30 transition-all hover:bg-blue-50 hover:scale-[1.02]"
              >
                Sign in to SchoolManager
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/50">
              {['Ghana GES-aligned grading', 'Secure & encrypted', 'Microsoft Dataverse powered'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400/70" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
            {/* Brand */}
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <School className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">SchoolManager</span>
              </div>
              <p className="text-xs text-slate-500 max-w-xs text-center sm:text-left">
                Ghana GES-aligned school administration platform. Built for real schools.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12 text-sm">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Platform</p>
                <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
                <a href="#modules"  className="text-slate-400 hover:text-white transition-colors">Modules</a>
                <a href="#start"    className="text-slate-400 hover:text-white transition-colors">Get Started</a>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Account</p>
                <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors">Admin Sign in</Link>
                <Link href="/dashboard"  className="text-slate-400 hover:text-white transition-colors">Dashboard</Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} SchoolManager. All rights reserved.
            </p>
            <p className="text-xs text-slate-600">
              Powered by Microsoft Dataverse · Next.js 16
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
