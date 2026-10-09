const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Data no formato da API (aaaa-mm-dd), no fuso local. Não use toISOString():
 * ela converte para UTC e um horário noturno cai no dia seguinte.
 */
export function toApiDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Ex.: "seg 12/10". */
export function formatDayLabel(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}
