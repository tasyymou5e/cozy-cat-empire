import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { logAuthAttempt } from '@/hooks/useAdminActivityLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Crown, Shield, AlertTriangle } from 'lucide-react';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function AdminAuth() {
  const navigate = useNavigate();
  const { signIn, signOut, user } = useAuth();
  const { isAdmin, loading: adminLoading, checked } = useAdminAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Check admin status when user changes
  useEffect(() => {
    console.log('[AdminAuth] Effect running:', { user: user?.id, isAdmin, adminLoading, checked });
    
    // Don't do anything while still loading or checking
    if (adminLoading || !checked) {
      console.log('[AdminAuth] Still loading/checking, skipping...');
      return;
    }
    
    if (user && isAdmin) {
      console.log('[AdminAuth] User is admin, navigating to dashboard');
      // Log successful admin login
      logAuthAttempt({
        email: user.email || 'unknown',
        attemptType: 'admin_login',
        success: true,
        userId: user.id,
      });
      navigate('/catking/dashboard');
    } else if (user && !isAdmin && checked) {
      console.log('[AdminAuth] User is NOT admin, denying access');
      // Log access denied - only when we've definitively checked
      logAuthAttempt({
        email: user.email || 'unknown',
        attemptType: 'access_denied',
        success: false,
        userId: user.id,
        errorMessage: 'User does not have admin role',
      });
      setAccessDenied(true);
      signOut();
    }
  }, [user, isAdmin, adminLoading, checked, navigate, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAccessDenied(false);
    setIsSubmitting(true);

    try {
      const validated = authSchema.parse({ email, password });
      const { error: signInError } = await signIn(validated.email, validated.password);
      
      if (signInError) {
        // Log failed login attempt
        await logAuthAttempt({
          email: validated.email,
          attemptType: 'admin_login_failed',
          success: false,
          errorMessage: signInError.message,
        });
        setError(signInError.message);
      }
      // Admin check happens in useEffect after auth state changes
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        await logAuthAttempt({
          email,
          attemptType: 'admin_login_failed',
          success: false,
          errorMessage: 'Unexpected error during login',
        });
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (adminLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900">
        <div className="text-amber-200 flex items-center gap-2">
          <Shield className="h-5 w-5 animate-pulse" />
          Verifying credentials...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 p-4">
      <Card className="w-full max-w-md bg-amber-950/90 border-amber-700/50 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="relative">
              <Crown className="h-16 w-16 text-yellow-500" />
              <Shield className="h-8 w-8 text-amber-300 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-amber-100">
            Cat King Portal
          </CardTitle>
          <CardDescription className="text-amber-300/80">
            Administrative access only
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {accessDenied && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">
                Access Denied. You do not have administrative privileges.
              </p>
            </div>
          )}
          
          {error && !accessDenied && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="bg-amber-900/50 border-amber-700 text-amber-100 placeholder:text-amber-500"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-amber-900/50 border-amber-700 text-amber-100 placeholder:text-amber-500"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-semibold"
            >
              {isSubmitting ? 'Authenticating...' : 'Access Portal'}
            </Button>
          </form>

          <p className="mt-6 text-center text-amber-500/60 text-xs">
            🔒 This portal is for authorized personnel only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
