import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { User, Building2, ArrowLeft } from 'lucide-react';
import { Button, Input, Label } from '../../../../shared/components';
import { apiClient } from '../../../../shared/api-client';

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    salonName: ''
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: typeof formData) => apiClient.post('/tenants/register', data),
    onSuccess: () => {
      navigate('/login', { state: { registered: true } });
    },
    onError: (err: any) => {
      if (err.response?.data?.details) {
        const errorMessages = Object.values(err.response.data.details) as string[];
        setError(errorMessages.join(' • '));
      } else {
        setError(err.response?.data?.message || 'Ocorreu um erro ao criar a conta.');
      }
    }
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      setError('Preencha todos os dados da conta.');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setError('');
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.salonName) {
      setError('Preencha o nome do seu salão.');
      return;
    }
    setError('');
    mutate(formData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {/* Container Principal - Mobile First */}
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Cabeçalho do Wizard */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)} 
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 flex justify-center space-x-2">
              <div className={`h-1.5 w-8 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`h-1.5 w-8 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
            {step === 2 && <div className="w-5" /> /* Espaçador para alinhar */}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            {step === 1 ? 'Crie sua Conta' : 'Sobre o seu Salão'}
          </h1>
          <p className="text-sm text-gray-500 text-center mt-2">
            {step === 1 ? 'Primeiro, precisamos dos seus dados.' : 'Como seus clientes conhecerão seu espaço?'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Passo 1 - Dados do Administrador */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminName">Seu Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input 
                  id="adminName" 
                  className="pl-10" 
                  placeholder="Ex: João Silva" 
                  value={formData.adminName}
                  onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">E-mail</Label>
              <Input 
                id="adminEmail" 
                type="email" 
                placeholder="seu@email.com" 
                value={formData.adminEmail}
                onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Senha</Label>
              <Input 
                id="adminPassword" 
                type="password" 
                placeholder="••••••••" 
                value={formData.adminPassword}
                onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full mt-6">
              Continuar
            </Button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Já possui uma conta? <Link to="/login" className="text-blue-600 font-medium hover:underline">Fazer login</Link>
            </p>
          </form>
        )}

        {/* Passo 2 - Dados do Salão */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salonName">Nome do Salão ou Barbearia</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input 
                  id="salonName" 
                  className="pl-10" 
                  placeholder="Ex: Studio Elegance" 
                  value={formData.salonName}
                  onChange={(e) => setFormData({...formData, salonName: e.target.value})}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" isLoading={isPending}>
              Criar meu Salão
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
