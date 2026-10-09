/**
 * Extrai uma mensagem legível do erro padrão da API (ApiErrorResponse):
 * os erros por campo (`details`) quando houver, senão `message`.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object') {
    const { details, message } = data as { details?: Record<string, string> | null; message?: string };
    if (details && Object.keys(details).length > 0) {
      return Object.values(details).join(' ');
    }
    if (message) {
      return message;
    }
  }
  return fallback;
}
