import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleCheckComplete, setRoleCheckComplete] = useState(false);
  const checkInProgress = useRef(false);

  useEffect(() => {
    // Reset state when user changes
    if (!user) {
      setIsAdmin(false);
      setRoleCheckComplete(!authLoading); // Only complete if auth is done loading
      return;
    }

    // Prevent duplicate checks
    if (checkInProgress.current) return;

    let cancelled = false;
    checkInProgress.current = true;
    setRoleCheckComplete(false); // Mark as checking

    async function checkAdminRole() {
      try {
        console.log('[useAdminAuth] Starting role check for user:', user.id);
        
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        console.log('[useAdminAuth] RPC result:', { data, error });

        if (!cancelled) {
          setIsAdmin(data === true && !error);
        }
      } catch (err) {
        console.error('[useAdminAuth] Role check error:', err);
        if (!cancelled) {
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setRoleCheckComplete(true);
          checkInProgress.current = false;
        }
      }
    }

    checkAdminRole();

    return () => {
      cancelled = true;
      checkInProgress.current = false;
    };
  }, [user?.id, authLoading]);

  // Loading is true if auth is loading OR if we have a user but haven't completed the role check
  const loading = authLoading || (!!user && !roleCheckComplete);

  return { isAdmin, loading, user };
}
