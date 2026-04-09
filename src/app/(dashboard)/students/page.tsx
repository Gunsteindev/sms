'use client';

import { useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StudentTable } from '@/components/students/StudentTable';
import { StudentForm } from '@/components/students/StudentForm';
import { useStudents } from '@/hooks/useStudents';
import { studentsAPI } from '@/lib/api-client';
import type { Student } from '@/lib/dataverse/students';

export default function StudentsPage() {
  const router = useRouter();
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Student | null>(null);

  const { students, loading, pagination, refetch } = useStudents(page, 15, debouncedSearch);

  // Debounce search
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>)._searchTimer);
    (window as unknown as Record<string, ReturnType<typeof setTimeout>>)._searchTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400);
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
    if (!confirm('Delete this student?')) return;
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
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.totalCount} student{pagination.totalCount !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <StudentTable
        students={students}
        loading={loading}
        onView={(id) => router.push(`/students/${id}`)}
        onEdit={(s) => { setEditing(s); setModalOpen(true); }}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      {pagination.totalCount > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {page} · {pagination.totalCount} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNextPage}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Student' : 'Add New Student'}
      >
        <StudentForm
          defaultValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>
    </div>
  );
}
