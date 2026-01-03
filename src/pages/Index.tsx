import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CatFarm } from '@/components/game/CatFarm';
import { ProfileSetupDialog } from '@/components/game/ProfileSetupDialog';
import { AnnouncementBanner } from '@/components/game/AnnouncementBanner';

const Index = () => {
  console.log('[PAGE] Index: Component rendering');
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log('[PAGE] Index: Auth state', { hasUser: !!user, loading });

  useEffect(() => {
    console.log('[PAGE] Index: useEffect - checking auth redirect', { loading, hasUser: !!user });
    if (!loading && !user) {
      console.log('[PAGE] Index: Redirecting to /auth');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    console.log('[PAGE] Index: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="text-6xl animate-bounce inline-block">🐱</span>
          <p className="mt-4 text-xl text-muted-foreground">Loading Cat Farm...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[PAGE] Index: No user, returning null (will redirect)');
    return null; // Will redirect
  }

  console.log('[PAGE] Index: User authenticated, rendering CatFarm');

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-auto">
        <div className="max-w-3xl mx-auto">
          <AnnouncementBanner />
        </div>
      </div>
      <CatFarm />
      <ProfileSetupDialog userId={user?.id} />
    </>
  );
};

export default Index;
