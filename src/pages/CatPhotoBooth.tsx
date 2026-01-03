import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cat as CatIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGameState } from '@/hooks/useGameState';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSave } from '@/hooks/useCloudSave';
import { PhotoBooth } from '@/components/game/PhotoBooth';

const CatPhotoBooth: React.FC = () => {
  const { catId } = useParams<{ catId?: string }>();
  const navigate = useNavigate();
  const { state: gameState, actions } = useGameState();
  const { playSound } = useSound();
  const { user } = useAuth();
  const { cloudLoad } = useCloudSave(user?.id);
  
  const [selectedCatId, setSelectedCatId] = useState<string | null>(catId || null);
  const [isLoading, setIsLoading] = useState(true);

  // Load game state on mount
  useEffect(() => {
    const initializeGameState = async () => {
      try {
        if (user) {
          const result = await cloudLoad();
          if (result.data) {
            actions.loadFromData(result.data.game_state, result.data.kittens_bred, result.data.relationships);
          } else {
            // Fallback to local storage if cloud returns no data
            actions.loadGame();
          }
        } else {
          // loadGame handles localStorage internally
          actions.loadGame();
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
        // Fallback to local storage on error
        actions.loadGame();
      } finally {
        setIsLoading(false);
      }
    };

    initializeGameState();
  }, [user]);

  // Set initial cat if available
  useEffect(() => {
    if (!selectedCatId && gameState.cats.length > 0) {
      setSelectedCatId(catId || gameState.cats[0].id);
    }
  }, [gameState.cats, catId, selectedCatId]);

  const selectedCat = gameState.cats.find(c => c.id === selectedCatId);

  // Get equipped costume for selected cat (stored in catCostumes)
  const equippedCostumeId = selectedCat 
    ? gameState.catCostumes?.[selectedCat.id] 
    : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CatIcon className="w-12 h-12 mx-auto mb-4 text-primary animate-bounce" />
          <p className="text-muted-foreground">Loading Photo Booth...</p>
        </div>
      </div>
    );
  }

  if (gameState.cats.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CatIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">No Cats Yet!</h2>
          <p className="text-muted-foreground mb-4">
            You need at least one cat to use the photo booth.
          </p>
          <Button onClick={() => navigate('/')}>
            Go Adopt a Cat
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedCat) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/collection')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">📸 Photo Booth</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/gallery')}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Gallery
            </Button>
            
            <Select 
              value={selectedCatId || ''} 
              onValueChange={(value) => {
                setSelectedCatId(value);
                playSound('click');
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a cat" />
              </SelectTrigger>
              <SelectContent>
                {gameState.cats.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.breed})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <PhotoBooth 
          cat={selectedCat} 
          equippedCostumeId={equippedCostumeId}
        />
      </main>
    </div>
  );
};

export default CatPhotoBooth;
