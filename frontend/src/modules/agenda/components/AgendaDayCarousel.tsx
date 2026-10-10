import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { toApiDate } from '../../../shared/utils/date';

interface DayItem {
  date: Date;
  dayOfWeek: string;
  dayOfMonth: string;
  isToday: boolean;
}

interface AgendaDayCarouselProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function AgendaDayCarousel({ selectedDate, onSelectDate }: AgendaDayCarouselProps) {
  const [days, setDays] = useState<DayItem[]>([]);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate the next 15 days starting from today
    const generatedDays: DayItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatterWeek = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
    const formatterDay = new Intl.DateTimeFormat('pt-BR', { day: '2-digit' });

    for (let i = 0; i < 15; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      let dayOfWeek = formatterWeek.format(d).substring(0, 3).toUpperCase();
      dayOfWeek = dayOfWeek.replace('.', '');
      
      generatedDays.push({
        date: d,
        dayOfWeek: dayOfWeek,
        dayOfMonth: formatterDay.format(d),
        isToday: i === 0,
      });
    }
    
    setDays(generatedDays);
  }, []);

  const handleSelect = (day: DayItem) => {
    onSelectDate(day.date);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Create date from YYYY-MM-DD input avoiding timezone shifts
      const [year, month, day] = e.target.value.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      onSelectDate(newDate);
    }
  };

  return (
    <div className="w-full bg-white border-b border-slate-100 py-3 shadow-sm overflow-x-auto no-scrollbar relative flex items-center">
      <div className="flex gap-2 px-4 min-w-max items-center">
        {/* Calendar Picker Button */}
        <div className="relative">
          <button 
            className="flex items-center justify-center w-14 h-16 rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 bg-slate-50 mr-2"
            onClick={() => dateInputRef.current?.showPicker?.()}
          >
            <Calendar className="w-6 h-6" />
          </button>
          <input 
            type="date" 
            ref={dateInputRef}
            onChange={handleDateChange}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {days.map((day, idx) => {
          const isSelected = toApiDate(selectedDate) === toApiDate(day.date);
          return (
            <button
              key={idx}
              onClick={() => handleSelect(day)}
              className={`flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              <span className={`text-[10px] font-semibold tracking-wider ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                {day.dayOfWeek}
              </span>
              <span className="text-lg font-bold mt-0.5">
                {day.dayOfMonth}
              </span>
              {day.isToday && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
