/**
 * SSR-safe Web Storage shim.
 *
 * This app was built as a client-only SPA, so a lot of UI state is read from
 * `localStorage` / `sessionStorage` inside `useState` initializers. Those code
 * paths now also run during server rendering, where the globals do not exist.
 *
 * Installing an empty in-memory implementation on the server makes those reads
 * return "nothing stored yet", which is exactly the default state the SPA used
 * to render on a first visit. Real values are read again in the browser after
 * hydration.
 *
 * Imported for its side effect from the server entry only — it never ships to
 * the browser, and never overrides a real Storage implementation.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const globalScope = globalThis as typeof globalThis & {
  localStorage?: Storage;
  sessionStorage?: Storage;
};

if (typeof globalScope.localStorage === 'undefined') {
  globalScope.localStorage = new MemoryStorage();
}

if (typeof globalScope.sessionStorage === 'undefined') {
  globalScope.sessionStorage = new MemoryStorage();
}

export {};
