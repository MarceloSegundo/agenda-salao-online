import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';

// Componentes temporários (Stubs)
const PublicBookingPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Agendamento Online</h1>
      <p className="text-gray-500 mb-6">Escolha o serviço e horário desejado.</p>
      <button className="bg-primary-500 text-white w-full py-3 rounded-lg font-medium hover:bg-primary-600 transition">
        Agendar Horário
      </button>
    </div>
  </div>
);

const AdminDashboard = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold text-gray-800">Painel do Salão (Admin)</h1>
      <p className="text-gray-500 mt-2">Visão geral da agenda e configurações.</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota para o cliente agendar (Public) */}
        <Route path="/book/:domain" element={<PublicBookingPage />} />
        
        {/* Rota para o salão gerenciar (Admin) */}
        <Route path="/admin/*" element={<AdminDashboard />} />

        {/* Rota raiz cai no agendamento por padrão ou página institucional */}
        <Route path="/" element={<div className="p-8 text-center">Página Institucional do SaaS (Freemium)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
