import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { todayISO, addDaysToISO, isoToDate } from '../utils/dateUtils';

const DAY_ABBREV = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DateStripProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  projectDates?: Set<string>; // ISO dates that have ≥1 project
}

export const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onDateChange, projectDates }) => {
  const [windowStart, setWindowStart] = useState(() => addDaysToISO(todayISO(), -1));

  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDaysToISO(windowStart, i));

  const midDate = isoToDate(days[3]);
  const monthLabel = `${MONTH_NAMES[midDate.getMonth()]} ${midDate.getFullYear()}`;

  return (
    <div className="bg-base-200 rounded-2xl px-3 py-3 flex flex-col gap-2">
      <div className="text-xs font-black uppercase tracking-widest text-center text-base-content/40">
        {monthLabel}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setWindowStart(w => addDaysToISO(w, -7))}
          className="btn btn-ghost btn-xs btn-circle shrink-0 text-base-content/40"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex flex-1 justify-between gap-0.5">
          {days.map(dateISO => {
            const d = isoToDate(dateISO);
            const isToday = dateISO === today;
            const isSelected = dateISO === selectedDate;
            const isPast = dateISO < today;
            const hasProjects = projectDates?.has(dateISO) ?? false;

            return (
              <button
                key={dateISO}
                onClick={() => onDateChange(dateISO)}
                className={`
                  flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 flex-1 transition-all
                  ${isSelected
                    ? 'bg-primary text-primary-content shadow-md scale-105'
                    : isToday
                    ? 'bg-base-300 text-base-content'
                    : isPast
                    ? 'text-base-content/30 hover:bg-base-300/50'
                    : 'text-base-content/70 hover:bg-base-300/60'}
                `}
              >
                <span className="text-[10px] font-black uppercase tracking-wide leading-none">
                  {DAY_ABBREV[d.getDay()]}
                </span>
                <span className="text-base font-black leading-none tabular-nums">
                  {d.getDate()}
                </span>
                <span className="flex gap-0.5 items-center h-2">
                  {isToday && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-content/70' : 'bg-primary'}`} />
                  )}
                  {hasProjects && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-content' : 'bg-orange-400'}`} />
                  )}
                  {!isToday && !hasProjects && <span className="w-1.5 h-1.5" />}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setWindowStart(w => addDaysToISO(w, 7))}
          className="btn btn-ghost btn-xs btn-circle shrink-0 text-base-content/40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};
