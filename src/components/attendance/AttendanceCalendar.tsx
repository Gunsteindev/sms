'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayStats { date: string; percentage: number; }

interface Props {
  stats?: DayStats[];
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dayColor(pct?: number) {
  if (pct === undefined) return '';
  if (pct >= 90) return 'bg-green-100 text-green-700 font-medium';
  if (pct >= 75) return 'bg-yellow-100 text-yellow-700 font-medium';
  return 'bg-red-100 text-red-700 font-medium';
}

export function AttendanceCalendar({ stats = [], onDateSelect, selectedDate }: Props) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const statsMap = Object.fromEntries(stats.map((s) => [s.date, s.percentage]));
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
        <p className="text-sm font-semibold text-gray-800">{monthName}</p>
        <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-gray-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const iso = toISO(year, month, day);
          const pct = statsMap[iso];
          const isSelected = iso === selectedDate;
          const isToday = iso === toISO(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <button
              key={iso}
              onClick={() => onDateSelect(iso)}
              className={`rounded-lg py-1.5 text-xs transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-1'
                  : pct !== undefined
                    ? dayColor(pct)
                    : isToday
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {day}
              {pct !== undefined && !isSelected && (
                <div className="text-[9px] opacity-70">{Math.round(pct)}%</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end gap-3 text-[10px] text-gray-400">
        {[['bg-green-100','≥90%'],['bg-yellow-100','≥75%'],['bg-red-100','<75%']].map(([bg, label]) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-sm inline-block ${bg}`} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}
