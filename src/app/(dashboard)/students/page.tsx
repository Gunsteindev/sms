// Server Component: fetches the first page of students server-side (tenant-scoped)
// and seeds the client list, so the default view paints with data and skips the
// mount fetch. Search, status filtering, and pagination still refetch client-side.
// PAGE_SIZE must match the client's constant (10).
import { getStudents } from '@/lib/dataverse/students';
import { loadForSchool } from '@/lib/server-data';
import StudentsClient from './StudentsClient';

const PAGE_SIZE = 10;

export default async function StudentsPage() {
    const initial = await loadForSchool(async () => {
        const res = await getStudents({ page: 1, pageSize: PAGE_SIZE });
        return { items: res.items, totalCount: res.totalCount };
    });

    return <StudentsClient initial={initial} />;
}
