import { useEffect } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { useAdminAuth, logAuthAttempt } from '@/hooks/admin';
import { useAdminPrefetch } from '@/hooks/usePrefetch';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading, user } = useAdminAuth();
  const navigate = useNavigate();
  
  // Prefetch other admin routes once user is confirmed admin
  useAdminPrefetch();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/catking');
      return;
    }

    if (!isAdmin) {
      // Log unauthorized access attempt
      logAuthAttempt({
        email: user.email || 'unknown',
        attemptType: 'access_denied',
        success: false,
        userId: user.id,
        errorMessage: 'User attempted to access admin route without admin role',
      });
      navigate('/catking');
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Admin sign-in required</h1>
            <p className="text-sm text-muted-foreground">
              {user
                ? 'This account does not have administrative access.'
                : 'Sign in with an administrator account to view this page.'}
            </p>
          </div>
          <Button onClick={() => navigate('/catking')}>Go to admin sign-in</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
