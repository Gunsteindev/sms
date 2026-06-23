// Server Component: builds the report card on the server from the route param
// (studentId) and query param (termId) — both awaited per Next.js 16 — and
// renders the printable view directly. The client part only handles local
// remark editing + print. Validates the [id] + searchParams server pattern.
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { buildReportCard } from '@/lib/reportcard';
import { loadForSchool } from '@/lib/server-data';
import ReportCardClient from './ReportCardClient';

export default async function ReportCardPage({ params, searchParams }: {
    params: Promise<{ studentId: string }>;
    searchParams: Promise<{ termId?: string }>;
}) {
    const { studentId } = await params;
    const { termId }    = await searchParams;

    let data: Awaited<ReturnType<typeof buildReportCard>> | null = null;
    let error = '';
    try {
        data = await loadForSchool(user => buildReportCard(studentId, termId || undefined, user.schoolId));
    } catch {
        error = 'Failed to load report card';
    }

    if (error || !data) {
        return (
            <div className="space-y-4">
                <Link href="/reports/report-card" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-4 w-4" /> Back to selector
                </Link>
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error || 'Report card not found'}</span>
                </div>
            </div>
        );
    }

    return <ReportCardClient data={data} />;
}
