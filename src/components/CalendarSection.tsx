import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "motion/react";

interface CalendarSectionProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export default function CalendarSection({ selectedDate, onChange }: CalendarSectionProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  // Quick helper dates in local timezone
  const getToday = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const getRelativeDate = (offset: number) => {
    const d = getToday();
    d.setDate(d.getDate() + offset);
    return d;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate days in month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
  const lastDate = new Date(year, month + 1, 0).getDate(); // Total days in month

  const days: (Date | null)[] = [];
  // Pad previous month's days
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  // Add current month's days
  for (let i = 1; i <= lastDate; i++) {
    days.push(new Date(year, month, i));
  }

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-900 dark:bg-slate-950">
      {/* Short Toggles */}
      <div className="mb-5 flex gap-2">
        {[
          { label: "어제", offset: -1 },
          { label: "오늘", offset: 0 },
          { label: "내일", offset: 1 },
        ].map((item) => {
          const date = getRelativeDate(item.offset);
          const active = isSameDay(selectedDate, date);
          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onChange(date);
                setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
              }}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                active
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {item.label}
            </motion.button>
          );
        })}
      </div>

      {/* Calendar Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <CalendarIcon size={16} className="text-orange-500" />
          <span>{`${year}년 ${month + 1}월`}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => {
              const today = getToday();
              onChange(today);
              setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            }}
            className="rounded-lg px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            이번 달
          </button>
          <button
            onClick={handleNextMonth}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekDays.map((d, index) => (
          <span
            key={d}
            className={`py-1.5 font-semibold ${
              index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-slate-400"
            }`}
          >
            {d}
          </span>
        ))}

        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;

          const isSelected = isSameDay(selectedDate, date);
          const isToday = isSameDay(getToday(), date);
          const dayOfWeek = date.getDay();

          return (
            <motion.button
              key={date.toISOString()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(date)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg mx-auto font-medium transition-all ${
                isSelected
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                  : isToday
                  ? "bg-orange-50 border border-orange-200 text-orange-600 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-400"
                  : dayOfWeek === 0
                  ? "text-red-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                  : dayOfWeek === 6
                  ? "text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              {date.getDate()}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-orange-500" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
