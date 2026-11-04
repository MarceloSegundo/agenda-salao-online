import { describe, expect, it } from 'vitest';
import type { AppointmentDto } from '../api/appointments';
import { countActiveFilters, EMPTY_FILTERS, filterAppointments, hasActiveFilters } from './filter-appointments';

const appointment = (id: string, overrides: Partial<AppointmentDto>): AppointmentDto => ({
  id,
  customerName: 'Maria',
  serviceName: 'Corte',
  professionalId: 'ana',
  professionalName: 'Ana',
  startTime: '2026-11-04T09:00:00',
  endTime: '2026-11-04T09:30:00',
  durationMinutes: 30,
  status: 'PENDING',
  ...overrides,
});

const day = [
  appointment('1', { professionalId: 'ana', serviceName: 'Corte', status: 'PENDING' }),
  appointment('2', { professionalId: 'ana', serviceName: 'Escova', status: 'CANCELED' }),
  appointment('3', { professionalId: 'bruno', serviceName: 'Corte', status: 'CONFIRMED' }),
  appointment('4', { professionalId: 'bruno', serviceName: 'Barba', status: 'PENDING' }),
];

const ids = (list: AppointmentDto[]) => list.map((a) => a.id);

describe('filterAppointments', () => {
  it('sem filtros devolve o dia inteiro', () => {
    expect(ids(filterAppointments(day, EMPTY_FILTERS))).toEqual(['1', '2', '3', '4']);
  });

  it('filtra por profissional', () => {
    expect(ids(filterAppointments(day, { ...EMPTY_FILTERS, professionalId: 'bruno' }))).toEqual(['3', '4']);
  });

  it('filtra por status', () => {
    expect(ids(filterAppointments(day, { ...EMPTY_FILTERS, status: 'PENDING' }))).toEqual(['1', '4']);
  });

  it('filtra por serviço', () => {
    expect(ids(filterAppointments(day, { ...EMPTY_FILTERS, serviceName: 'Corte' }))).toEqual(['1', '3']);
  });

  it('combina os filtros', () => {
    expect(ids(filterAppointments(day, { professionalId: 'ana', status: 'PENDING', serviceName: 'Corte' }))).toEqual(['1']);
    expect(ids(filterAppointments(day, { professionalId: 'ana', status: 'CONFIRMED', serviceName: '' }))).toEqual([]);
  });
});

describe('countActiveFilters', () => {
  it('conta quantos filtros estão em uso', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...EMPTY_FILTERS, serviceName: 'Corte' })).toBe(1);
    expect(countActiveFilters({ professionalId: 'ana', status: 'PENDING', serviceName: 'Corte' })).toBe(3);
  });
});

describe('hasActiveFilters', () => {
  it('só é verdadeiro com algum filtro escolhido', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, status: 'CANCELED' })).toBe(true);
  });
});
