import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logPlayerActivity } from '@/hooks/usePlayerActivityLog';

console.log('[INIT] AuthContext.tsx: Module loaded');

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('[AUTH] AuthProvider: Component mounting');
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AUTH] AuthProvider: useEffect running - setting up auth listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AUTH] AuthProvider: onAuthStateChange triggered', { event, hasSession: !!session });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('[AUTH] AuthProvider: State updated from onAuthStateChange');
      }
    );

    // THEN check for existing session
    console.log('[AUTH] AuthProvider: Checking existing session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[AUTH] AuthProvider: getSession completed', { 
        hasSession: !!session, 
        hasError: !!error
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      console.log('[AUTH] AuthProvider: Initial state set, loading = false');
    }).catch(err => {
      console.error('[AUTH] AuthProvider: getSession FAILED', err);
      setLoading(false);
    });

    return () => {
      console.log('[AUTH] AuthProvider: Cleanup - unsubscribing');
      subscription.unsubscribe();
    };
  }, []);

  console.log('[AUTH] AuthProvider: Rendering with state', { 
    hasUser: !!user, 
    hasSession: !!session, 
    loading 
  });

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    // Log login activity (non-blocking)
    if (!error && data.user) {
      logPlayerActivity(data.user.id, {
        activityType: 'login',
        activityDescription: 'Logged into Cat Farm',
        metadata: { method: 'email' }
      });
    }
    
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Log logout activity before signing out (non-blocking)
    if (user) {
      logPlayerActivity(user.id, {
        activityType: 'logout',
        activityDescription: 'Logged out of Cat Farm'
      });
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
