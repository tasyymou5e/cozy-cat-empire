import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock supabase before importing AuthContext
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

vi.mock('@/hooks/usePlayerActivityLog', () => ({
  logPlayerActivity: vi.fn(),
}));

import { AuthProvider, useAuth } from '../AuthContext';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  const mockUnsubscribe = vi.fn();
  let capturedAuthCallback: ((event: string, session: unknown) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedAuthCallback = null;
    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      capturedAuthCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('throws when useAuth is called outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('initializes and resolves loading via auth callback', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Trigger the auth state change callback (simulating Supabase)
    await act(async () => {
      capturedAuthCallback?.('INITIAL_SESSION', null);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('sets user when session is present', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const mockSession = { user: mockUser };

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      capturedAuthCallback?.('SIGNED_IN', mockSession);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });

  it('signIn calls supabase and returns result', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { capturedAuthCallback?.('INITIAL_SESSION', null); });

    let signInResult: { error: Error | null } | undefined;
    await act(async () => {
      signInResult = await result.current.signIn('test@test.com', 'pass');
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'pass',
    });
    expect(signInResult?.error).toBeNull();
  });

  it('signIn returns error on failure', async () => {
    const mockError = new Error('Invalid credentials');
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: mockError });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { capturedAuthCallback?.('INITIAL_SESSION', null); });

    let signInResult: { error: Error | null } | undefined;
    await act(async () => {
      signInResult = await result.current.signIn('bad@test.com', 'wrong');
    });

    expect(signInResult?.error).toBe(mockError);
  });

  it('signUp calls supabase with metadata', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { capturedAuthCallback?.('INITIAL_SESSION', null); });

    await act(async () => {
      await result.current.signUp('new@test.com', 'pass123', {
        display_name: 'TestUser',
        avatar_emoji: '🐱',
      });
    });

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@test.com',
        password: 'pass123',
        options: expect.objectContaining({
          data: { display_name: 'TestUser', avatar_emoji: '🐱' },
        }),
      })
    );
  });

  it('signOut calls supabase signOut', async () => {
    mockSignOut.mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { capturedAuthCallback?.('INITIAL_SESSION', null); });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('cleans up subscription on unmount', async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { capturedAuthCallback?.('INITIAL_SESSION', null); });
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
