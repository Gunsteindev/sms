'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface SubjectData {
  subject: string;
  average: number;
  highest: number;
  lowest: number;
}

const PLACEHOLDER: SubjectData[] = [
  { subject: 'Math',    average: 78, highest: 95, lowest: 45 },
  { subject: 'English', average: 82, highest: 98, lowest: 55 },
  { subject: 'Science', average: 75, highest: 92, lowest: 40 },
  { subject: 'History', average: 80, highest: 96, lowest: 50 },
  { subject: 'Art',     average: 88, highest: 100, lowest: 60 },
];

export function PerformanceChart({ data = PLACEHOLDER }: { data?: SubjectData[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="average" name="Avg"    fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="highest" name="Highest" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="lowest"  name="Lowest" fill="#f97316" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
