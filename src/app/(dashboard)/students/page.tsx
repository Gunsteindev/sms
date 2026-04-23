'use client';

import { useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StudentTable } from '@/components/students/StudentTable';
import { StudentForm } from '@/components/students/StudentForm';
import { useStudents } from '@/hooks/useStudents';
import { studentsAPI } from '@/lib/api-client';
import { AISummary } from '@/components/ui/AISummary';
import type { Student } from '@/lib/dataverse/students';

const STATUS_OPTIONS = [
  { value: '',  label: 'All Statuses' },
  { value: '1', label: 'Active' },
  { value: '2', label: 'Graduated' },
  { value: '3', label: 'Transferred' },
  { value: '4', label: 'Suspended' },
];

const PAGE_SIZE = 15;

export default function StudentsPage() {
  const router = useRouter();

  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<Student | null>(null);
  const [toDelete, setToDelete]       = useState<string | null>(null);

  const { students, loading, error, pagination, refetch } = useStudents(
    page, PAGE_SIZE, debouncedSearch || undefined, statusFilter
  );

  // Debounce search
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>)._sTimer);
    (window as unknown as Record<string, ReturnType<typeof setTimeout>>)._sTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400);
  };

  const handleStatusChange = (v: string) => {
    setStatusFilter(v ? Number(v) : undefined);
    setPage(1);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      if (editing) {
        await studentsAPI.update(editing.studentid, data);
        toast.success('Student updated');
      } else {
        await studentsAPI.create(data);
        toast.success('Student added');
      }
      setModalOpen(false);
      setEditing(null);
      refetch();
    } catch {
      toast.error('Failed to save student');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await studentsAPI.delete(id);
      toast.success('Student deleted');
      refetch();
    } catch {
      toast.error('Failed to delete student');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Students</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${pagination.totalCount} student${pagination.totalCount !== 1 ? 's' : ''} enrolled`}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Student
        </Button>
      </div>

      <AISummary type="students" getData={() => ({ total: pagination.totalCount, students: students.slice(0, 30) })} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or roll number…"
            className="pl-9"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter ?? ''}
          onChange={e => handleStatusChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={refetch} className="ml-auto text-red-600">Retry</Button>
        </div>
      )}

      {/* Table */}
      <StudentTable
        students={students}
        loading={loading}
        onView={id => router.push(`/students/${id}`)}
        onEdit={s => { setEditing(s); setModalOpen(true); }}
        onDelete={id => setToDelete(id)}
      />

      {/* Pagination */}
      {!loading && pagination.totalCount > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            Page {page} of {Math.ceil(pagination.totalCount / PAGE_SIZE)} · {pagination.totalCount} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Student' : 'Add New Student'}>
        <StudentForm
          defaultValues={editing ? {
            firstname:      editing.firstname,
            lastname:       editing.lastname,
            dateofbirth:    editing.dateofbirth?.slice(0, 10),
            gender:         editing.gender,
            email:          editing.email || undefined,
            phone:          editing.phone || undefined,
            address:        editing.address || undefined,
            enrollmentdate: editing.enrollmentdate?.slice(0, 10),
            rollnumber:     editing.rollnumber || undefined,
            classid:        editing.classid || undefined,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!toDelete} onOpenChange={o => !o && setToDelete(null)}
        title="Delete student?" description="This will permanently remove the student record."
        onConfirm={() => { if (toDelete) { handleDelete(toDelete); setToDelete(null); } }}
      />
    </div>
  );
}
