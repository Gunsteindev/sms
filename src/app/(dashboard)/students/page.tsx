'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, AlertCircle, UserPlus, X, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StudentTable } from '@/components/students/StudentTable';
import { StudentForm } from '@/components/students/StudentForm';
import { useStudents } from '@/hooks/useStudents';
import { studentsAPI, parentsAPI } from '@/lib/api-client';
import { AISummary } from '@/components/ui/AISummary';
import type { Student } from '@/lib/dataverse/students';

const STATUS_OPTIONS = [
  { value: '',  label: 'All Statuses' },
  { value: '1', label: 'Active' },
  { value: '2', label: 'Graduated' },
  { value: '3', label: 'Transferred' },
  { value: '4', label: 'Suspended' },
];

const PAGE_SIZE = 20;

interface ParentOption { parentid: string; fullname: string; phone: string; }

function AssignParentModal({ student, onClose, onSaved }: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<ParentOption[]>([]);
  const [selected, setSelected] = useState<ParentOption | null>(
    student.parentid ? { parentid: student.parentid, fullname: student.parentname || student.guardianname, phone: '' } : null
  );
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await parentsAPI.getAll(query) as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: ParentOption[] = (res.data ?? []).map((p: any) => ({
          parentid: p.parentid,
          fullname: p.fullname || `${p.firstname} ${p.lastname}`.trim(),
          phone:    p.phone ?? '',
        }));
        setResults(items);
        setOpen(items.length > 0);
      } catch { setResults([]); }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await studentsAPI.update(student.studentid, { parentid: selected?.parentid ?? '' });
      toast.success(selected ? `Parent linked: ${selected.fullname}` : 'Parent removed');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update parent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Student: <span className="font-semibold text-slate-900 dark:text-slate-100">{student.firstname} {student.lastname}</span>
        </p>
      </div>

      {/* Selected parent chip */}
      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{selected.fullname}</p>
            {selected.phone && <p className="text-xs text-slate-500 dark:text-slate-400">{selected.phone}</p>}
          </div>
          <button type="button" onClick={() => setSelected(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div ref={dropRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by parent name…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              autoFocus
            />
          </div>
          {open && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-52 overflow-y-auto">
              {results.map(p => (
                <button
                  key={p.parentid}
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                  onMouseDown={() => { setSelected(p); setQuery(''); setOpen(false); }}
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{p.fullname}</span>
                  {p.phone && <span className="ml-2 text-xs text-slate-400">{p.phone}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          {saving ? 'Saving…' : selected ? 'Link Parent' : 'Remove Parent'}
        </Button>
      </div>
    </div>
  );
}

const STUDENT_STATUSES = [
  { value: 1, label: 'Active',      color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  { value: 2, label: 'Graduated',   color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  { value: 3, label: 'Transferred', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  { value: 4, label: 'Suspended',   color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
];

const ENROLLMENT_STATUSES = [
  { value: 1, label: 'Enrolled',   color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  { value: 2, label: 'Completed',  color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  { value: 3, label: 'Dropped',    color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  { value: 4, label: 'On Hold',    color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
];

function UpdateStatusModal({ student, onClose, onSaved }: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [studentStatus,    setStudentStatus]    = useState(student.studentstatus    || 1);
  const [enrollmentStatus, setEnrollmentStatus] = useState(student.enrollmentstatus || 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await studentsAPI.update(student.studentid, {
        studentstatus:    studentStatus,
        enrollmentstatus: enrollmentStatus,
      });
      toast.success('Status updated');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Student: <span className="font-semibold text-slate-900 dark:text-slate-100">{student.firstname} {student.lastname}</span>
      </p>

      {/* Student Status */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Student Status</p>
        <div className="grid grid-cols-2 gap-2">
          {STUDENT_STATUSES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStudentStatus(s.value)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                studentStatus === s.value
                  ? `${s.color} ring-2 ring-offset-1 ring-current`
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {s.label}
              {studentStatus === s.value && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Enrollment Status */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Enrollment Status</p>
        <div className="grid grid-cols-2 gap-2">
          {ENROLLMENT_STATUSES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setEnrollmentStatus(s.value)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                enrollmentStatus === s.value
                  ? `${s.color} ring-2 ring-offset-1 ring-current`
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {s.label}
              {enrollmentStatus === s.value && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          <ShieldCheck className="h-4 w-4 mr-1.5" />
          {saving ? 'Saving…' : 'Update Status'}
        </Button>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const router = useRouter();

  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<Student | null>(null);
  const [toDelete, setToDelete]       = useState<string | null>(null);
  const [assigningParent, setAssigningParent] = useState<Student | null>(null);
  const [updatingStatus, setUpdatingStatus]   = useState<Student | null>(null);

  const { students, loading, error, pagination, refetch } = useStudents(
    page, PAGE_SIZE, debouncedSearch || undefined, statusFilter
  );

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
        onAssignParent={s => setAssigningParent(s)}
        onUpdateStatus={s => setUpdatingStatus(s)}
      />

      {/* Pagination */}
      {!loading && pagination.totalCount > 0 && (() => {
        const totalPages = Math.max(1, Math.ceil(pagination.totalCount / PAGE_SIZE));
        const rangeStart = (page - 1) * PAGE_SIZE + 1;
        const rangeEnd   = Math.min(page * PAGE_SIZE, pagination.totalCount);
        const pageNums   = Array.from({ length: totalPages }, (_, i) => i + 1);
        return (
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>Showing {rangeStart}–{rangeEnd} of {pagination.totalCount} students</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pageNums.map(n => (
                <Button key={n} variant={n === page ? 'default' : 'outline'} size="sm"
                  className="w-8 px-0" onClick={() => setPage(n)}>
                  {n}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Student' : 'Add New Student'}>
        <StudentForm
          defaultValues={editing ? {
            firstname:        editing.firstname,
            lastname:         editing.lastname,
            dateofbirth:      editing.dateofbirth?.slice(0, 10),
            gender:           editing.gender,
            email:            editing.email || undefined,
            phone:            editing.phone || undefined,
            address:          editing.address || undefined,
            enrollmentdate:   editing.enrollmentdate?.slice(0, 10),
            rollnumber:       editing.rollnumber || undefined,
            classid:          editing.classid || undefined,
            parentid:         editing.parentid || undefined,
            parentname:       editing.parentname || editing.guardianname || undefined,
            studentstatus:    editing.studentstatus || 1,
            enrollmentstatus: editing.enrollmentstatus || 1,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>

      {/* Update Status modal */}
      <Modal
        isOpen={!!updatingStatus}
        onClose={() => setUpdatingStatus(null)}
        title="Update Student Status"
      >
        {updatingStatus && (
          <UpdateStatusModal
            student={updatingStatus}
            onClose={() => setUpdatingStatus(null)}
            onSaved={refetch}
          />
        )}
      </Modal>

      {/* Assign Parent modal */}
      <Modal
        isOpen={!!assigningParent}
        onClose={() => setAssigningParent(null)}
        title="Assign Parent / Guardian"
      >
        {assigningParent && (
          <AssignParentModal
            student={assigningParent}
            onClose={() => setAssigningParent(null)}
            onSaved={refetch}
          />
        )}
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
