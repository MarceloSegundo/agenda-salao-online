import { describe, expect, it } from 'vitest';
import { formatPhone, maskPhone, phoneToApi } from './phone';

describe('maskPhone', () => {
  it('formata celular com DDD', () => {
    expect(maskPhone('86999990000')).toBe('(86) 99999-0000');
  });

  it('formata fixo com DDD', () => {
    expect(maskPhone('8633334444')).toBe('(86) 3333-4444');
  });

  it('aceita número colado com +55 e pontuação', () => {
    expect(maskPhone('+55 86 99999-0000')).toBe('(86) 99999-0000');
  });

  it('formata enquanto o usuário digita', () => {
    expect(maskPhone('869')).toBe('(86) 9');
  });
});

describe('phoneToApi', () => {
  it('envia só dígitos com o código do país', () => {
    expect(phoneToApi('(86) 99999-0000')).toBe('5586999990000');
  });
});

describe('formatPhone', () => {
  it('mostra o telefone da API no formato brasileiro', () => {
    expect(formatPhone('5586999990000')).toBe('(86) 99999-0000');
  });
});
