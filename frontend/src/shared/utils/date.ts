const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const WEEKDAYS_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Data no formato da API (aaaa-mm-dd), no fuso local. Não use toISOString():
 * ela converte para UTC e um horário noturno cai no dia seguinte.
 */
export function toApiDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Lê aaaa-mm-dd como meia-noite local; formato ou data inexistente viram null. */
export function fromApiDate(value: string | null): Date | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  // new Date "corrige" datas como 30/02 para março; a ida e volta pega isso
  return toApiDate(date) === value ? date : null;
}

/** Ex.: "terça, 3 de novembro". */
export function formatWeekdayLong(date: Date): string {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/** Ex.: "seg 12/10". */
export function formatDayLabel(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}
