/**
 * @fileoverview Tests for useAdminAuth hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Mock Auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
  })),
}));

import { useAdminAuth } from '../useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

describe('useAdminAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return isAdmin=false when user is not logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useAdminAuth());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('should return isAdmin=false when user has no admin role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useAdminAuth());

    await waitFor(() => {
      expect(result.current.checked).toBe(true);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('should return isAdmin=true when user has admin role', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'admin-123', email: 'admin@example.com' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: true,
      error: null,
    } as any);

    const { result } = renderHook(() => useAdminAuth());

    await waitFor(() => {
      expect(result.current.checked).toBe(true);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('should handle RPC errors gracefully', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    } as any);

    const { result } = renderHook(() => useAdminAuth());

    await waitFor(() => {
      expect(result.current.checked).toBe(true);
    });

    // Should default to false on error
    expect(result.current.isAdmin).toBe(false);
  });

  it('should show loading state during auth check', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useAdminAuth());

    expect(result.current.loading).toBe(true);
  });
});
