import { describe, expect, it } from 'vitest';
import { formatCurrency } from './currency';

// Intl separa "R$" do valor com espaço não separável
const plain = (text: string) => text.replace(/ /g, ' ');

describe('formatCurrency', () => {
  it('formata em reais', () => {
    expect(plain(formatCurrency(640))).toBe('R$ 640,00');
    expect(plain(formatCurrency(1234.5))).toBe('R$ 1.234,50');
  });

  it('formata zero', () => {
    expect(plain(formatCurrency(0))).toBe('R$ 0,00');
  });
});
