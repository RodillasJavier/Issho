/**
 * src/hooks/useDebouncedValue.ts
 *
 * Returns a copy of `value` that only updates after it has stayed unchanged
 * for `delayMs`. Used to debounce live-search input before it drives a
 * network query.
 */
import { useEffect, useState } from "react";

export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
};
