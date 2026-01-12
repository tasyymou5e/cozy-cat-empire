import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth, logAuthAttempt } from '@/hooks/admin';
import { useAdminPrefetch } from '@/hooks/usePrefetch';
import { Loader2 } from 'lucide-react';

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
    return null;
  }

  return <>{children}</>;
}
