'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StudentCard } from '@/components/students/StudentCard';
import { StudentForm } from '@/components/students/StudentForm';
import { studentsAPI, attendanceAPI } from '@/lib/api-client';
import type { Student } from '@/lib/dataverse/students';

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [student, setStudent]         = useState<Student | null>(null);
  const [attendance, setAttendance]   = useState<AttendanceSummary | null>(null);
  const [loading, setLoading]         = useState(true);
  const [editOpen, setEditOpen]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await studentsAPI.getById(id);
      setStudent(res.data ?? null);

      const end   = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attRes: any = await attendanceAPI.getStudentReport(id, start, end);
      setAttendance(attRes.data?.summary ?? null);
    } catch {
      toast.error('Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = async (data: any) => {
    try {
      await studentsAPI.update(id, data);
      toast.success('Student updated');
      setEditOpen(false);
      load();
    } catch {
      toast.error('Failed to update student');
    }
  };

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 text-gray-400">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="text-sm">Student not found</p>
        <button onClick={() => router.push('/students')} className="text-xs text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const attCards = attendance ? [
    { label: 'Days Present', value: attendance.present, color: 'text-green-600' },
    { label: 'Days Absent',  value: attendance.absent,  color: 'text-red-500' },
    { label: 'Days Late',    value: attendance.late,    color: 'text-yellow-600' },
    { label: 'Rate (90d)',   value: `${attendance.percentage.toFixed(1)}%`, color: 'text-blue-600' },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/students')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Students
        </button>
        <Button onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Profile card */}
        <StudentCard student={student} />

        {/* Right column */}
        <div className="space-y-5">
          {/* Attendance stats */}
          {attendance && (
            <Card>
              <CardHeader><CardTitle>Attendance (last 90 days)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {attCards.map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg bg-gray-50 px-4 py-3 text-center">
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                {/* Rate bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Attendance rate</span>
                    <span className="font-medium">{attendance.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        attendance.percentage >= 90 ? 'bg-green-500' : attendance.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${attendance.percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick info */}
          <Card>
            <CardHeader><CardTitle>Additional Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Gender',        student.gender === 1 ? 'Male' : student.gender === 2 ? 'Female' : '—'],
                  ['State',         student.address1_stateorprovince || '—'],
                  ['Postal Code',   student.address1_postalcode     || '—'],
                  ['Guardian Email',student.parentemail             || '—'],
                  ['Created',       new Date(student.createdon).toLocaleDateString()],
                  ['Last Updated',  new Date(student.modifiedon).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-gray-400">{label}</dt>
                    <dd className="mt-0.5 font-medium text-gray-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Student">
        <StudentForm
          defaultValues={student}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </div>
  );
}
