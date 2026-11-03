const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Ex.: 640 vira "R$ 640,00". */
export function formatCurrency(value: number): string {
  return BRL.format(value);
}
