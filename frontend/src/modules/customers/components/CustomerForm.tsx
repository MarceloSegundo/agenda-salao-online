import { useState } from 'react';
import { Button, Input, Label } from '../../../shared/components';
import { formatPhone, maskPhone, phoneToApi } from '../../../shared/utils/phone';
import type { Customer, CustomerRequest } from '../api/customers';

interface CustomerFormProps {
  /** "full": nome, telefone e e-mail; "short": só nome e telefone, com botão próprio (cadastro rápido). */
  variant: 'full' | 'short';
  formId: string;
  initial?: Customer | null;
  onSubmit: (request: CustomerRequest) => void;
  submitting: boolean;
  error: string | null;
}

export function CustomerForm({ variant, formId, initial, onSubmit, submitting, error }: CustomerFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial ? formatPhone(initial.phone) : '');
  const [email, setEmail] = useState(initial?.email ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      phone: phoneToApi(phone),
      email: variant === 'full' && email.trim() ? email.trim() : undefined,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${formId}-name`}>Nome</Label>
        <Input
          id={`${formId}-name`}
          placeholder="Ex: Maria Souza"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-phone`}>Telefone (WhatsApp)</Label>
        <Input
          id={`${formId}-phone`}
          type="tel"
          inputMode="tel"
          placeholder="(86) 99999-0000"
          value={phone}
          onChange={(e) => setPhone(maskPhone(e.target.value))}
          required
          minLength={14}
        />
      </div>

      {variant === 'full' && (
        <div className="space-y-2">
          <Label htmlFor={`${formId}-email`}>E-mail (opcional)</Label>
          <Input
            id={`${formId}-email`}
            type="email"
            placeholder="maria@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      {variant === 'short' && (
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar e selecionar'}
        </Button>
      )}
    </form>
  );
}
