import { useMemo } from 'react';
import { toApiDate } from '../../../../shared/utils/date';
import type { AvailableSlot } from '../../api/appointments';

interface WhenStepProps {
  date: Date;
  onDateChange: (date: Date) => void;
  slots: AvailableSlot[];
  isLoading: boolean;
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
  /** Modo "qualquer profissional": mostra quem atende em cada horário. */
  showProfessional: boolean;
}

const DAYS_AHEAD = 15;
const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

export function WhenStep({ date, onDateChange, slots, isLoading, selectedSlot, onSelectSlot, showProfessional }: WhenStepProps) {
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      return day;
    });
  }, []);
  const selectedDay = toApiDate(date);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Quando?</h3>

      <div className="-mx-6 px-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {days.map((day) => {
            const isSelected = toApiDate(day) === selectedDay;
            return (
              <button
                key={day.getTime()}
                type="button"
                onClick={() => onDateChange(day)}
                className={`flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-colors ${
                  isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {weekday.format(day).replace('.', '')}
                </span>
                <span className="text-lg font-bold">{day.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">Nenhum horário livre neste dia.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.time === slot.time && selectedSlot.professionalId === slot.professionalId;
            return (
              <button
                key={`${slot.time}-${slot.professionalId}`}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className={`px-2 py-3 rounded-xl border transition-colors text-center ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 text-slate-700'
                }`}
              >
                <span className="font-bold block">{slot.time}</span>
                {showProfessional && <span className="text-xs text-slate-500 block truncate">{slot.professionalName}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
