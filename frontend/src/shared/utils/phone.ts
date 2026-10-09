const COUNTRY_CODE = '55';

/** Dígitos do número nacional (DDD + número), sem o 55 do país. */
function nationalDigits(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith(COUNTRY_CODE) && digits.length >= 12) {
    digits = digits.slice(COUNTRY_CODE.length);
  }
  return digits.slice(0, 11);
}

/** Máscara (DD) 99999-9999 ou (DD) 9999-9999, aplicada enquanto o usuário digita. */
export function maskPhone(input: string): string {
  const digits = nationalDigits(input);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  if (number.length <= 4) return `(${ddd}) ${number}`;
  // Celular tem 9 dígitos (5-4); fixo e números incompletos ficam 4-x
  const split = number.length === 9 ? 5 : 4;
  return `(${ddd}) ${number.slice(0, split)}-${number.slice(split)}`;
}

/** Formato da API: só dígitos, com o código do país (ex.: 5586999990000). */
export function phoneToApi(masked: string): string {
  return COUNTRY_CODE + nationalDigits(masked);
}

/** Telefone vindo da API para exibição: "5586999990000" vira "(86) 99999-0000". */
export function formatPhone(apiPhone: string): string {
  return maskPhone(apiPhone);
}
