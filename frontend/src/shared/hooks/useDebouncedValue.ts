import { useEffect, useState } from 'react';

/** Devolve o valor só depois que ele para de mudar por `delayMs` (ex.: busca enquanto digita). */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
