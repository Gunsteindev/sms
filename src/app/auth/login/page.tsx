'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Eye, EyeOff, Users, BookOpen, BarChart3, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: Users,      text: 'Manage students, teachers & staff'     },
  { icon: BookOpen,   text: 'Track classes, exams & attendance'      },
  { icon: BarChart3,  text: 'Real-time reports and analytics'        },
  { icon: ShieldCheck,text: 'Secure, role-based access control'      },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) setError('Invalid email or password. Please try again.');
    else window.location.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col bg-slate-900 relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3 px-10 pt-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/50">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-none tracking-tight">SchoolMS</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-none">Admin Portal</p>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative flex-1 flex flex-col justify-center px-12 pb-16">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Smarter school<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                management
              </span>
            </h1>
            <p className="mt-4 text-base text-slate-400 leading-relaxed">
              Everything you need to run your school — students, staff, attendance, fees, and reports — in one place.
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                    <Icon className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-300">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative px-10 pb-8">
          <div className="flex items-center gap-6">
            {[
              { value: '500+', label: 'Students' },
              { value: '40+',  label: 'Teachers'  },
              { value: '98%',  label: 'Uptime'    },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[oklch(0.10_0_0)] px-6 py-12">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <GraduationCap className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">SchoolMS</span>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your admin account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@school.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 px-4 py-3">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                : 'Sign in'
              }
            </button>

          </form>

          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
            Ghana Basic School · Admin Portal
          </p>
        </div>
      </div>

    </div>
  );
}
