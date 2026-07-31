import { useState, useEffect } from 'react';
import { AgendaDayCarousel } from '../components/AgendaDayCarousel';
import { AgendaList } from '../components/AgendaList';
import { NewAppointmentSheet } from '../components/NewAppointmentSheet';
import type { Appointment } from '../components/AppointmentCard';
import { Plus } from 'lucide-react';

export function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    // Mock fetching data for the selected date
    setIsLoading(true);
    
    setTimeout(() => {
      // Mock data
      const mockData: Appointment[] = [
        {
          id: '1',
          time: '09:00',
          customerName: 'João Silva',
          serviceName: 'Corte + Barba',
          professionalName: 'Carlos (Barbeiro)',
          status: 'PENDING',
          durationMinutes: 50
        },
        {
          id: '2',
          time: '11:00',
          customerName: 'Maria Souza',
          serviceName: 'Escova',
          professionalName: 'Ana (Cabeleireira)',
          status: 'CONFIRMED',
          durationMinutes: 40
        },
        {
          id: '3',
          time: '14:30',
          customerName: 'Pedro Santos',
          serviceName: 'Corte Masculino',
          professionalName: 'Carlos (Barbeiro)',
          status: 'COMPLETED',
          durationMinutes: 30
        }
      ];
      
      // Simulate an empty agenda if date is far in the future
      const today = new Date();
      const diffTime = Math.abs(selectedDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setAppointments(diffDays > 3 ? [] : mockData);
      setIsLoading(false);
    }, 600);
  }, [selectedDate]);

  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
    );
  };

  const handleEdit = (id: string) => {
    // In a real app, we would load the appointment data into the sheet
    console.log("Editing appointment:", id);
    setIsSheetOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="bg-white px-4 pt-4 pb-2 border-b border-slate-100 flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-800">Agenda</h1>
      </div>

      <AgendaDayCarousel onSelectDate={setSelectedDate} />
      
      <div className="flex-1 overflow-y-auto pb-24">
        <AgendaList 
          appointments={appointments} 
          isLoading={isLoading} 
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
        />
      </div>

      <button 
        onClick={() => setIsSheetOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 transition-all z-40 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      <NewAppointmentSheet 
        isOpen={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
      />
    </div>
  );
}
