import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMonthProjects } from '../hooks/useProjects';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthProject {
  id: string;
  name: string;
  color: string;
  planned_date: string;
  bricks_per_day: number;
  bricks_completed: number;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface CalendarTabProps {
  selectedDate: string;
  onDateChange: (d: string) => void;
  onNavigateToProjects: () => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({
  selectedDate, onDateChange, onNavigateToProjects,
}) => {
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const rawProjects = useMonthProjects(viewYear, viewMonth) as unknown as MonthProject[];

  // Group by date
  const byDate = rawProjects.reduce<Record<string, MonthProject[]>>((acc, p) => {
    const key = p.planned_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // Build grid cells
  const firstDow  = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMon = new Date(viewYear, viewMonth, 0).getDate();
  const prevDays  = new Date(viewYear, viewMonth - 1, 0).getDate();

  type Cell = { dateStr: string | null; label: number; current: boolean };
  const cells: Cell[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ dateStr: null, label: prevDays - firstDow + 1 + i, current: false });
  }
  for (let d = 1; d <= daysInMon; d++) {
    const mm = String(viewMonth).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ dateStr: `${viewYear}-${mm}-${dd}`, label: d, current: true });
  }
  const trailing = 7 - (cells.length % 7);
  if (trailing < 7) {
    for (let i = 1; i <= trailing; i++) {
      cells.push({ dateStr: null, label: i, current: false });
    }
  }

  const todayStr = todayString();

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDay = (dateStr: string) => {
    onDateChange(dateStr);
    onNavigateToProjects();
  };

  const totalProjects  = rawProjects.length;
  const totalPlanned   = rawProjects.reduce((s, p) => s + p.bricks_per_day, 0);
  const totalCompleted = rawProjects.reduce((s, p) => s + p.bricks_completed, 0);
  const activeDays     = Object.keys(byDate).length;
  const monthPct       = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Header */}
      <div className="pt-1">
        <h2 className="text-2xl font-black tracking-tight uppercase">Monthly Plan</h2>
        <p className="text-sm font-bold text-base-content/50 mt-0.5">
          See the whole wall. Plan every brick.
        </p>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="btn btn-ghost btn-circle btn-sm">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <div className="font-black text-2xl">{MONTH_NAMES[viewMonth - 1]}</div>
          <div className="text-xs font-bold text-base-content/40">{viewYear}</div>
        </div>
        <button onClick={nextMonth} className="btn btn-ghost btn-circle btn-sm">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Month stats */}
      {totalProjects > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: totalProjects,  label: 'Projects' },
              { value: totalPlanned,   label: 'Planned 🧱' },
              { value: totalCompleted, label: 'Done ✅' },
              { value: activeDays,     label: 'Days' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-base-200 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-primary">{value}</div>
                <div className="text-[10px] font-black text-base-content/40 uppercase tracking-wider mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>
          {/* Month progress bar */}
          <div className="bg-base-200 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-black text-base-content/50 uppercase tracking-wider">Month Progress</span>
              <span className="text-sm font-black text-primary">{monthPct}%</span>
            </div>
            <div className="w-full bg-base-300 rounded-full h-2.5">
              <div
                className="bg-primary rounded-full h-2.5 transition-all duration-500"
                style={{ width: `${monthPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="card bg-base-200 shadow-sm overflow-hidden">

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-base-300">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-black text-base-content/40 py-2 uppercase tracking-wider">
              {d.charAt(0)}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            // Ghost cells (prev/next month)
            if (!cell.current) {
              return (
                <div
                  key={i}
                  className="min-h-[90px] p-1 border-r border-b border-base-300/40 flex flex-col items-center"
                >
                  <span className="text-[10px] font-bold text-base-content/15 mt-1">{cell.label}</span>
                </div>
              );
            }

            const dateStr     = cell.dateStr!;
            const dayProjects = byDate[dateStr] || [];
            const isToday     = dateStr === todayStr;
            const isSelected  = dateStr === selectedDate;
            const hasWork     = dayProjects.length > 0;

            const bricksPlanned   = dayProjects.reduce((s, p) => s + p.bricks_per_day, 0);
            const bricksCompleted = dayProjects.reduce((s, p) => s + p.bricks_completed, 0);
            const bricksAvail     = Math.max(0, bricksPlanned - bricksCompleted);
            const isComplete      = hasWork && bricksAvail === 0;
            const isInProgress    = hasWork && bricksCompleted > 0 && !isComplete;
            const pct             = bricksPlanned > 0 ? Math.min(100, Math.round((bricksCompleted / bricksPlanned) * 100)) : 0;

            let cellBg = '';
            if (isSelected)   cellBg = 'bg-primary/20 ring-1 ring-inset ring-primary/40';
            else if (isComplete)   cellBg = 'bg-emerald-900/20';
            else if (isInProgress) cellBg = 'bg-primary/10';

            return (
              <button
                key={i}
                onClick={() => handleDay(dateStr)}
                className={`min-h-[90px] p-1.5 border-r border-b border-base-300/40 transition-all hover:bg-primary/10 flex flex-col items-center gap-1 w-full group ${cellBg}`}
              >
                {/* Date number */}
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-black flex-shrink-0 transition-all ${
                  isToday
                    ? 'bg-primary text-primary-content'
                    : isSelected
                    ? 'text-primary'
                    : 'text-base-content/70'
                }`}>
                  {cell.label}
                </div>

                {hasWork ? (
                  <>
                    {/* Bricks info */}
                    <div className="text-[11px] leading-tight font-black text-primary text-center">
                      🧱 {bricksPlanned}
                    </div>
                    <div className="text-[11px] leading-tight font-bold text-base-content/50 text-center">
                      {bricksAvail} left
                    </div>
                    {/* Mini progress bar */}
                    <div className="w-full px-1 mt-auto">
                      <div className="w-full bg-base-300 rounded-full h-1.5">
                        <div
                          className={`rounded-full h-1.5 transition-all ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 mt-auto mb-auto">
                    <div className="text-[11px] leading-tight font-bold text-base-content/25 text-center">
                      nothing<br />planned
                    </div>
                    <Plus size={10} className="text-base-content/20 group-hover:text-primary/60 transition-colors" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-xs font-bold text-base-content/40 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span>In progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-900/40" />
          <span>Complete ✅</span>
        </div>
      </div>
      <p className="text-center text-xs font-bold text-base-content/25 -mt-2">
        Tap any day to open its projects 🧱
      </p>
      <div className="h-4" />
    </div>
  );
};
