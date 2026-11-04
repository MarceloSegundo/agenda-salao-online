import { describe, expect, it } from 'vitest';
import { dashboardView } from './dashboard-view';

describe('dashboardView', () => {
  it('sem dados e com erro: tela de erro', () => {
    expect(dashboardView({ isError: true, hasData: false })).toBe('error');
  });

  it('atualização falhou com dados em cache: mantém o painel com aviso', () => {
    expect(dashboardView({ isError: true, hasData: true })).toBe('stale');
  });

  it('carregando pela primeira vez: esqueleto', () => {
    expect(dashboardView({ isError: false, hasData: false })).toBe('loading');
  });

  it('com dados e sem erro: painel', () => {
    expect(dashboardView({ isError: false, hasData: true })).toBe('ready');
  });
});
