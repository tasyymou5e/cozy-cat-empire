import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CatFarm } from '@/components/game/CatFarm';
import { ProfileSetupDialog } from '@/components/game/ProfileSetupDialog';
import { AnnouncementBanner } from '@/components/game/AnnouncementBanner';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="text-6xl animate-bounce inline-block">😺</span>
          <p className="mt-4 text-xl text-muted-foreground">Waking up the kittens...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
