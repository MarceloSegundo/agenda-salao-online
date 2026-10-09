import { describe, expect, it } from 'vitest';
import { formatDayLabel, toApiDate } from './date';

describe('toApiDate', () => {
  it('usa a data local, sem converter para UTC', () => {
    // 23:30 em Brasília já é dia 13 em UTC; a API precisa receber o dia 12
    expect(toApiDate(new Date(2026, 9, 12, 23, 30))).toBe('2026-10-12');
  });

  it('completa mês e dia com zero', () => {
    expect(toApiDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('formatDayLabel', () => {
  it('mostra dia da semana abreviado e dia/mês', () => {
    expect(formatDayLabel(new Date(2026, 9, 12))).toBe('seg 12/10');
  });
});
