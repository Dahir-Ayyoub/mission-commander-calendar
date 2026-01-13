
import React, { useMemo } from 'react';
import { 
  format, 
  addMonths, 
  endOfMonth, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Mission } from '../types';

interface CalendarProps {
  missions: Mission[];
  onDateClick: (date: Date) => void;
  currentViewDate: Date;
  onViewDateChange: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  missions, 
  onDateClick, 
  currentViewDate, 
  onViewDateChange 
}) => {
  const days = useMemo(() => {
    const monthStart = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1);
    const monthEnd = endOfMonth(monthStart);
    const startDate = new Date(monthStart);
    startDate.setDate(monthStart.getDate() - monthStart.getDay());
    const endDate = endOfWeek(monthEnd);

    const interval = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return interval.map(day => ({
      date: day,
      isCurrentMonth: isSameMonth(day, monthStart),
      missions: missions.filter(m => isSameDay(new Date(m.date), new Date(day)))
    }));
  }, [currentViewDate, missions]);

  const nextMonth = () => onViewDateChange(addMonths(currentViewDate, 1));
  const prevMonth = () => onViewDateChange(addMonths(currentViewDate, -1));
  const goToToday = () => onViewDateChange(new Date());

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] transition-all duration-500 shadow-2xl shadow-slate-200/20 dark:shadow-none">
      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-5">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
            <CalendarIcon size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white min-w-[200px] uppercase tracking-tighter">
            {format(currentViewDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={goToToday} className="px-6 py-2.5 text-[11px] font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl transition-all uppercase tracking-widest">Aujourd'hui</button>
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden">
            <button onClick={prevMonth} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-r-2 border-slate-100 dark:border-slate-800 transition-all"><ChevronLeft size={20} /></button>
            <button onClick={nextMonth} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
        {weekDays.map(day => (
          <div key={day} className="py-4 text-center text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800">
        {days.map((day, idx) => {
          const isToday = isSameDay(day.date, new Date());

          return (
            <div
              key={idx}
              onClick={() => onDateClick(day.date)}
              className={`min-h-[140px] p-3 bg-white dark:bg-slate-900 cursor-pointer transition-all hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 ${!day.isCurrentMonth ? 'bg-slate-50/40 dark:bg-slate-900/40 opacity-30 grayscale' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`inline-flex items-center justify-center w-9 h-9 text-base font-black rounded-2xl transition-all ${isToday ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 scale-110' : day.isCurrentMonth ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                  {format(day.date, 'd')}
                </span>
                {day.missions.length > 0 && (
                  <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl">
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 font-black">{day.missions.length}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 overflow-y-auto max-h-[90px] custom-scrollbar pr-1">
                {day.missions.map((mission) => (
                  <div
                    key={mission.id}
                    className="px-3 py-1.5 text-[10px] font-bold bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 text-indigo-900 dark:text-indigo-300 rounded-r-xl truncate transition-all hover:translate-x-1"
                    title={String(mission.mission)}
                  >
                    {String(mission.mission)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
