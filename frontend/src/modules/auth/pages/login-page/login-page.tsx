import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, Label } from '../../../../shared/components';
import { apiClient } from '../../../../shared/api-client';
import { CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;
  
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: typeof formData) => apiClient.post('/auth/login', data),
    onSuccess: (response) => {
      // Salva o token localmente e vai pro dashboard
      localStorage.setItem('agenda-salao-token', response.data.token);
      navigate('/app');
    },
    onError: (err: any) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente mais tarde.');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Preencha seu e-mail e senha.');
      return;
    }
    setError('');
    mutate(formData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {/* Container Principal - Mobile First */}
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta!</h1>
          <p className="text-sm text-gray-500 mt-2">
            Acesse o painel do seu salão
          </p>
        </div>

        {registered && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">Conta criada com sucesso!</h3>
              <p className="text-sm text-green-700 mt-1">Faça login abaixo para acessar seu painel.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Esqueci a senha</a>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <Button type="submit" className="w-full mt-6" isLoading={isPending}>
            Entrar
          </Button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Ainda não tem uma conta? <Link to="/register" className="text-blue-600 font-medium hover:underline">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
