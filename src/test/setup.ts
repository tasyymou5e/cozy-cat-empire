/**
 * @fileoverview Vitest setup file
 *
 * Configures the test environment with necessary mocks, globals,
 * and centralized module mocks shared across all test suites.
 */

import { vi } from 'vitest';

// ── Global DOM mocks ─────────────────────────────────────────────────────

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ── Centralized module mocks (reduces boilerplate per-test) ──────────────

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/types/guards', () => ({
  isValidGameState: vi.fn().mockReturnValue(true),
  isCatRelationship: vi.fn().mockReturnValue(true),
  isRelationshipEvent: vi.fn().mockReturnValue(true),
}));

vi.mock('@/hooks/useErrorLogger', () => ({
  logErrorToDatabase: vi.fn().mockResolvedValue(undefined),
  useErrorLogger: () => ({
    logError: vi.fn(),
    logInteractionError: vi.fn(),
    logNetworkError: vi.fn(),
    logComponentError: vi.fn(),
  }),
}));

// ── Shared Supabase client mock ──────────────────────────────────────────
// Tests can override per-test by re-mocking `@/integrations/supabase/client`
// at file scope (vi.mock factory), or by importing `globalSupabaseMock` from
// `./supabaseMock` and calling setTableResult / setDefaultResult.

vi.mock('@/integrations/supabase/client', async () => {
  const { globalSupabaseMock } = await import('./supabaseMock');
  return { supabase: globalSupabaseMock.client };
});

// ── Auth context mock (most hooks call useAuth) ──────────────────────────
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { user: { id: 'test-user-id' } },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: unknown }) => children,
}));

// ── Toast hook mock ──────────────────────────────────────────────────────
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn(), dismiss: vi.fn(), toasts: [] }),
  toast: vi.fn(),
}));
