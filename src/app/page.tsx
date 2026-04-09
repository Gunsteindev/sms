'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────────────────── */

const features = [
  { icon: Users,         title: 'Student Management',   desc: 'Enrol, track, and manage every student — from personal profiles to academic history.',          accent: 'from-blue-500 to-cyan-500',    soft: 'bg-blue-50   text-blue-600' },
  { icon: GraduationCap, title: 'Teachers & Staff',     desc: 'Manage teaching staff, employee records, departments, and class assignments.',                   accent: 'from-violet-500 to-purple-500', soft: 'bg-violet-50 text-violet-600' },
  { icon: Calendar,      title: 'Attendance Tracking',  desc: 'Mark daily attendance, view visual calendars, and monitor trends with one click.',               accent: 'from-emerald-500 to-teal-500', soft: 'bg-emerald-50 text-emerald-600' },
  { icon: DollarSign,    title: 'Fee Management',       desc: 'Define fee structures, record payments, and generate monthly revenue summaries.',                accent: 'from-orange-500 to-amber-500', soft: 'bg-orange-50 text-orange-600' },
  { icon: BookOpen,      title: 'Class Organisation',   desc: 'Create grade-based classes, assign teachers, and track enrolment capacity in real time.',        accent: 'from-sky-500 to-blue-500',     soft: 'bg-sky-50    text-sky-600' },
  { icon: BarChart3,     title: 'Reports & Analytics',  desc: 'Get actionable insights with attendance trends, performance charts, and KPI dashboards.',        accent: 'from-pink-500 to-rose-500',    soft: 'bg-pink-50   text-pink-600' },
];

const stats = [
  { value: '10 000+', label: 'Students Managed' },
  { value: '500+',    label: 'Staff Members' },
  { value: '99.9%',   label: 'Uptime SLA' },
  { value: '24 / 7',  label: 'Real-time Sync' },
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
            { n: '1 248', l: 'Students',  c: 'from-blue-500/30 to-cyan-500/20' },
            { n: '94.2%', l: 'Attendance',c: 'from-emerald-500/30 to-teal-500/20' },
            { n: '42',    l: 'Classes',   c: 'from-violet-500/30 to-purple-500/20' },
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
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>
      </div>

      {/* Floating fee card */}
      <div className="absolute -right-4 -top-5 rounded-xl border border-white/15 bg-gradient-to-br from-orange-500/20 to-amber-500/10 p-3 shadow-xl backdrop-blur-md w-40">
        <p className="text-[10px] text-white/50">Fee Collection</p>
        <p className="text-base font-bold text-white mt-0.5">$48 250</p>
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium">+12% this month</span>
        </div>
      </div>

      {/* Floating student card */}
      <div className="absolute -left-4 -bottom-5 rounded-xl border border-white/15 bg-gradient-to-br from-violet-500/20 to-purple-500/10 p-3 shadow-xl backdrop-blur-md w-40">
        <p className="text-[10px] text-white/50">New Enrolments</p>
        <p className="text-base font-bold text-white mt-0.5">38 Students</p>
        <div className="flex items-center gap-1 mt-1">
          <Users className="h-3 w-3 text-violet-300" />
          <span className="text-[10px] text-violet-300 font-medium">This semester</span>
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
            {['Features', 'About', 'Contact'].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="transition-colors hover:text-white">{l}</a>
            ))}
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
          {/* Mesh dots pattern */}
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
                School Administration Platform
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
                An all-in-one platform for students, teachers, attendance, fees, and
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
                  href="#about"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-7 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700/60 hover:text-white"
                >
                  Learn more
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

        {/* ── Features ───────────────────────────────────────────────────── */}
        <section
          id="about"
          className="relative overflow-hidden bg-white py-28"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.04) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
        >
          {/* Soft top gradient glow */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60"
            style={{ background: 'linear-gradient(to bottom, rgba(238,242,255,0.8), transparent)' }}
          />

          <div className="relative mx-auto max-w-7xl px-6">
            {/* Section header */}
            <div className="mb-16 text-center">
              <span className="mb-4 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Platform Features
              </span>
              <h2 className="text-4xl font-black text-gray-900">
                Everything you need<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)' }}
                >
                  to run your school
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-gray-500">
                From student enrolment to financial reporting — all modules are
                connected and always in sync.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc, accent, soft }) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl"
                >
                  {/* Top gradient accent bar */}
                  <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${soft}`}>
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>

                  {/* Hover bottom arrow */}
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-300 transition-colors group-hover:text-indigo-500">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <section
          id="contact"
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
                { step: '01', title: 'Sign in',         desc: 'Use your administrator credentials to access the secure portal.',         color: 'from-blue-600 to-cyan-600' },
                { step: '02', title: 'Configure',       desc: 'Set up classes, fee structures, and add your staff and student records.',  color: 'from-indigo-600 to-violet-600' },
                { step: '03', title: 'Manage & report', desc: 'Track attendance, collect fees, and view live analytics from anywhere.',   color: 'from-violet-600 to-pink-600' },
              ].map(({ step, title, desc, color }, i) => (
                <div key={step} className="relative flex flex-col items-center text-center">
                  {/* Connector line */}
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
          {/* Full bleed gradient */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 40%, #0c4a6e 100%)' }}
          />
          {/* Orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4  top-0    h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-cyan-500/20  blur-3xl" />
          </div>
          {/* Dots */}
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
              unified platform makes.
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
              {['No credit card required', 'Secure & encrypted', 'Microsoft Dataverse powered'].map((t) => (
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
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <School className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">SchoolManager</span>
          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} SchoolManager. All rights reserved.
          </p>

          <Link
            href="/auth/login"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Admin Sign in →
          </Link>
        </div>
      </footer>

    </div>
  );
}
