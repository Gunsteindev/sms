// Server Component: fetches the initial departments + teacher options on the
// server (tenant-scoped, in parallel) so the page renders with data on first
// paint — no client mount spinner, no request waterfall. Interactivity lives
// in DepartmentsClient. This is the reference pattern for migrating other
// read-heavy pages off client-only data fetching.
import { getDepartments } from '@/lib/dataverse/departments';
import { getTeachers } from '@/lib/dataverse/teachers';
import { loadForSchool } from '@/lib/server-data';
import DepartmentsClient from './DepartmentsClient';

export default async function DepartmentsPage() {
    const { departments, teachers } = await loadForSchool(async () => {
        const [departments, teacherRes] = await Promise.all([
            getDepartments(),
            getTeachers({ pageSize: 200 }),
        ]);
        return {
            departments,
            teachers: teacherRes.items.map(t => ({
                id: t.teacherid,
                name: `${t.firstname} ${t.lastname}`.trim(),
            })),
        };
    });

    return <DepartmentsClient initialDepartments={departments} initialTeachers={teachers} />;
}
