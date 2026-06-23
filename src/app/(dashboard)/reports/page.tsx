// Server Component: fetches all report datasets for the default 30-day range
// in parallel (tenant-scoped) and seeds the client, replacing ~8 client API
// calls + a mount spinner. The client refetches only when the range changes
// or Refresh is pressed. Each source is independently fault-tolerant.
import { getDashboardStats } from '@/lib/dataverse/dashboard';
import { getAttendanceTrends } from '@/lib/dataverse/attendance';
import { getStudents } from '@/lib/dataverse/students';
import { getClasses } from '@/lib/dataverse/classes';
import { getFeePayments } from '@/lib/dataverse/fees';
import { getSessions } from '@/lib/dataverse/poolsessions';
import { getVehicles } from '@/lib/dataverse/transport';
import { getActivities } from '@/lib/dataverse/activities';
import { loadForSchool } from '@/lib/server-data';
import ReportsClient, { type ReportsInitial } from './ReportsClient';

export default async function ReportsPage() {
    const initial = await loadForSchool(async (): Promise<ReportsInitial> => {
        const [stats, trends, studentsRes, classes, feeRes, poolSessions, vehicles, activities] =
            await Promise.all([
                getDashboardStats().catch(() => null),
                getAttendanceTrends(30).catch(() => []),
                getStudents({ pageSize: 2000 }).catch(() => ({ items: [] })),
                getClasses().catch(() => []),
                getFeePayments({ pageSize: 5000 }).catch(() => ({ items: [] })),
                getSessions().catch(() => []),
                getVehicles().catch(() => []),
                getActivities().catch(() => []),
            ]);

        return {
            stats,
            trends,
            students:     studentsRes.items,
            classes,
            feePayments:  feeRes.items,
            poolSessions,
            vehicles,
            activities,
        };
    });

    return <ReportsClient initial={initial} />;
}
