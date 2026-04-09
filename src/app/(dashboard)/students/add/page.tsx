'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StudentForm } from '@/components/students/StudentForm';
import { studentsAPI } from '@/lib/api-client';

export default function AddStudentPage() {
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      await studentsAPI.create(data);
      toast.success('Student added successfully');
      router.push('/students');
    } catch {
      toast.error('Failed to add student');
      throw new Error('submit failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the details below to enrol a new student.</p>
        </CardHeader>
        <CardContent>
          <StudentForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/students')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
