import { describe, expect, it } from 'vitest';
import { formatDayLabel, formatWeekdayLong, fromApiDate, toApiDate } from './date';

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

describe('fromApiDate', () => {
  it('lê aaaa-mm-dd como meia-noite local', () => {
    const date = fromApiDate('2026-11-03');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(3);
    expect(date?.getHours()).toBe(0);
  });

  it('devolve null para formato ou data inválidos', () => {
    expect(fromApiDate('03-11-2026')).toBeNull();
    expect(fromApiDate('2026-13-40')).toBeNull();
    expect(fromApiDate('2026-02-30')).toBeNull();
    expect(fromApiDate('')).toBeNull();
    expect(fromApiDate(null)).toBeNull();
  });
});

describe('formatWeekdayLong', () => {
  it('mostra dia da semana e mês por extenso', () => {
    expect(formatWeekdayLong(new Date(2026, 10, 3))).toBe('terça, 3 de novembro');
  });
});
