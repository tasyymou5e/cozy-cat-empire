import { useState, useEffect } from 'react';

/**
 * Custom hook for debounced search input
 * 
 * Delays updating the output value until the user stops typing for the specified delay.
 * This prevents expensive filtering operations on every keystroke.
 * 
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in ms (default: 300)
 * @returns Tuple of [inputValue, setInputValue, debouncedValue]
 * 
 * @example
 * ```tsx
 * const [search, setSearch, debouncedSearch] = useDebouncedSearch('', 300);
 * 
 * // Use `search` for the input value
 * // Use `debouncedSearch` for filtering logic
 * ```
 */
export function useDebouncedSearch(initialValue = '', delay = 300) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [inputValue, delay]);

  return [inputValue, setInputValue, debouncedValue] as const;
}
