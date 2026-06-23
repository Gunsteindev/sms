// Server Component: fetches all dashboard data on the server in parallel
// (tenant-scoped) and derives the view model with the same shared builder the
// client uses for Refresh — replacing ~10 client API calls + a mount spinner.
// Each source is independently fault-tolerant so a single broken table degrades
// gracefully instead of blanking the dashboard.
import { getDashboardData } from '@/lib/dataverse/dashboard';
import { getAcademicYears } from '@/lib/dataverse/academicyears';
import { getTerms } from '@/lib/dataverse/terms';
import { getDepartments } from '@/lib/dataverse/departments';
import { getGradeLevels } from '@/lib/dataverse/gradelevels';
import { getScholarships } from '@/lib/dataverse/scholarships';
import { getSessions } from '@/lib/dataverse/poolsessions';
import { getVehicles } from '@/lib/dataverse/transport';
import { getActivities } from '@/lib/dataverse/activities';
import { getAnnouncements } from '@/lib/dataverse/announcements';
import { loadForSchool } from '@/lib/server-data';
import { buildDashboardModel } from '@/lib/dashboard-model';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
    const model = await loadForSchool(async () => {
        const [full, years, terms, departments, gradeLevels, scholarships, sessions, vehicles, activities, announcements] =
            await Promise.all([
                getDashboardData().catch(() => null),
                getAcademicYears().catch(() => []),
                getTerms().catch(() => []),
                getDepartments().catch(() => []),
                getGradeLevels().catch(() => []),
                getScholarships().catch(() => []),
                getSessions().catch(() => []),
                getVehicles().catch(() => []),
                getActivities().catch(() => []),
                getAnnouncements().catch(() => []),
            ]);

        return buildDashboardModel({
            full, years, terms, departments, gradeLevels,
            scholarships, sessions, vehicles, activities, announcements,
        });
    });

    return <DashboardClient initial={model} />;
}
