// Server Component: fetches the initial teachers list server-side (tenant-scoped)
// and hands it to the client for filtering/CRUD. Mirrors the route's default
// query (getTeachers() with no args) so first paint matches a Refresh.
import { getTeachers } from '@/lib/dataverse/teachers';
import { loadForSchool } from '@/lib/server-data';
import TeachersClient from './TeachersClient';

export default async function TeachersPage() {
    const initialTeachers = await loadForSchool(async () => {
        const res = await getTeachers({});
        return res.items;
    });

    return <TeachersClient initialTeachers={initialTeachers} />;
}
