/**
 * @fileoverview Admin authentication hook
 *
 * Provides admin role verification for protected admin routes.
 * Uses the has_role RPC function to check admin privileges.
 *
 * @module hooks/admin/useAdminAuth
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Return type for the useAdminAuth hook
 *
 * @interface UseAdminAuthResult
 * @property {boolean} isAdmin - Whether the current user has admin role
 * @property {boolean} loading - Whether the role check is in progress
 * @property {Object | null} user - The current authenticated user object
 * @property {boolean} checked - Whether the role check has completed for the current user
 */
interface UseAdminAuthResult {
  isAdmin: boolean;
  loading: boolean;
  user: ReturnType<typeof useAuth>['user'];
  checked: boolean;
}

/**
 * Hook to check if the current user has admin role
 *
 * Verifies admin privileges by calling the `has_role` RPC function
 * in Supabase. The hook handles authentication state changes and
 * prevents duplicate checks for the same user.
 *
 * @returns {UseAdminAuthResult} Admin status, loading state, user, and check completion flag
 *
 * @example
 * ```tsx
 * function AdminDashboard() {
 *   const { isAdmin, loading, user } = useAdminAuth();
 *
 *   if (loading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   if (!isAdmin) {
 *     return <Navigate to="/auth" />;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Welcome, Admin {user?.email}</h1>
 *       <AdminContent />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using with AdminRoute component for protected routes
 * function AdminRoute({ children }: { children: React.ReactNode }) {
 *   const { isAdmin, loading, checked } = useAdminAuth();
 *
 *   if (loading) return <Spinner />;
 *   if (checked && !isAdmin) return <Navigate to="/catking" />;
 *
 *   return <>{children}</>;
 * }
 * ```
 */
export function useAdminAuth(): UseAdminAuthResult {
  const { user, loading: authLoading } = useAuth();

  /** Whether the current user has admin role */
  const [isAdmin, setIsAdmin] = useState(false);

  /** Track which user ID we've completed checking - null means no check done yet */
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  /** Ref to track in-progress check to prevent race conditions */
  const checkInProgress = useRef<string | null>(null);

  useEffect(() => {
    // If no user, reset everything
    if (!user) {
      setIsAdmin(false);
      setCheckedUserId(null);
      checkInProgress.current = null;
      return;
    }

    // If we're already checking this user, skip
    if (checkInProgress.current === user.id) {
      return;
    }

    // If we've already checked this user, skip
    if (checkedUserId === user.id) {
      return;
    }

    // Start checking this user
    checkInProgress.current = user.id;
    const userIdBeingChecked = user.id;

    /**
     * Performs the admin role check via RPC
     * @internal
     */
    async function checkAdminRole() {
      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: userIdBeingChecked,
          _role: 'admin',
        });

        // Only update state if we're still checking this same user
        if (checkInProgress.current === userIdBeingChecked) {
          setIsAdmin(data === true && !error);
          setCheckedUserId(userIdBeingChecked);
          checkInProgress.current = null;
        }
      } catch (err) {
        console.error('[useAdminAuth] Role check error:', err);
        if (checkInProgress.current === userIdBeingChecked) {
          setIsAdmin(false);
          setCheckedUserId(userIdBeingChecked);
          checkInProgress.current = null;
        }
      }
    }

    checkAdminRole();

    return () => {
      // Only clear if we're still checking this user
      if (checkInProgress.current === userIdBeingChecked) {
        checkInProgress.current = null;
      }
    };
  }, [user?.id, checkedUserId]);

  // Loading is true if:
  // 1. Auth is still loading, OR
  // 2. We have a user but haven't finished checking THIS user's role yet
  const loading = authLoading || (!!user && checkedUserId !== user.id);

  return {
    /** Whether the current user has admin role */
    isAdmin,
    /** Whether the role check is in progress */
    loading,
    /** The current authenticated user object */
    user,
    /** Whether the role check has completed for the current user */
    checked: !!user && checkedUserId === user.id,
  };
}
