import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  // Track which user ID we've completed checking - null means no check done yet
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
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

    async function checkAdminRole() {
      try {
        
        
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: userIdBeingChecked,
          _role: 'admin'
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

  return { isAdmin, loading, user, checked: !!user && checkedUserId === user.id };
}
