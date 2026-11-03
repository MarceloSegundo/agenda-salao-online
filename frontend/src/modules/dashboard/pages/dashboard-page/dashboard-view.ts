export type DashboardView = 'loading' | 'error' | 'stale' | 'ready';

/**
 * O painel fica aberto o dia todo e recarrega a cada 60 s: uma atualização que
 * falha (rede oscilando, celular saindo do bloqueio) não pode esconder os dados
 * que já estão na tela. Só sem dados o erro vira tela cheia.
 */
export function dashboardView({ isError, hasData }: { isError: boolean; hasData: boolean }): DashboardView {
  if (hasData) return isError ? 'stale' : 'ready';
  return isError ? 'error' : 'loading';
}
