import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toPng, toBlob } from 'html-to-image';
import {
  Download,
  Copy,
  Share2,
  RotateCcw,
  Sparkles,
  Save,
  Image as ImageIcon,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Cat } from '@/types/game';
import { CatVisual } from './CatVisual';
import { DraggableSticker } from './DraggableSticker';
import {
  PhotoBoothBackground,
  CatPose,
  PhotoFrame,
  PlacedSticker,
  PHOTO_BACKGROUNDS,
  CAT_POSES,
  PHOTO_FRAMES,
  PHOTO_STICKERS,
} from '@/types/photoBooth';
import { usePhotoGallery } from '@/hooks/usePhotoGallery';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Props for the PhotoBooth component
 */
interface PhotoBoothProps {
  /** The cat to photograph */
  cat: Cat;
  /** Optional equipped costume ID */
  equippedCostumeId?: string;
}

/**
 * PhotoBooth - Interactive cat photo creation interface
 *
 * Allows players to take stylized photos of their cats with customizable
 * backgrounds, poses, frames, and stickers. Supports export to download,
 * clipboard, share, and gallery saving.
 *
 * @example
 * ```tsx
 * <PhotoBooth cat={selectedCat} equippedCostumeId="crown" />
 * ```
 */

export const PhotoBooth: React.FC<PhotoBoothProps> = ({ cat, equippedCostumeId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { savePhoto, photoCount, isFull, isCloudEnabled, isSyncing } = usePhotoGallery(user?.id);
  const stageRef = useRef<HTMLDivElement>(null);

  const [background, setBackground] = useState<PhotoBoothBackground>(PHOTO_BACKGROUNDS[0]);
  const [pose, setPose] = useState<CatPose>(CAT_POSES[0]);
  const [frame, setFrame] = useState<PhotoFrame>(PHOTO_FRAMES[0]);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [backgroundCategory, setBackgroundCategory] = useState<
    'all' | 'nature' | 'fantasy' | 'seasonal' | 'solid'
  >('all');
  const [stickerCategory, setStickerCategory] = useState<
    'all' | 'hearts' | 'stars' | 'text' | 'animals' | 'effects'
  >('all');

  const filteredBackgrounds =
    backgroundCategory === 'all'
      ? PHOTO_BACKGROUNDS
      : PHOTO_BACKGROUNDS.filter((bg) => bg.category === backgroundCategory);

  const filteredStickers =
    stickerCategory === 'all'
      ? PHOTO_STICKERS
      : PHOTO_STICKERS.filter((s) => s.category === stickerCategory);

  const addSticker = (stickerId: string) => {
    const newSticker: PlacedSticker = {
      id: `${stickerId}-${Date.now()}`,
      stickerId,
      x: 50 + (Math.random() - 0.5) * 30,
      y: 50 + (Math.random() - 0.5) * 30,
      scale: 1,
      rotation: 0,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const updateSticker = (id: string, updates: Partial<PlacedSticker>) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const resetAll = () => {
    setBackground(PHOTO_BACKGROUNDS[0]);
    setPose(CAT_POSES[0]);
    setFrame(PHOTO_FRAMES[0]);
    setStickers([]);
  };

  const handleDownload = useCallback(async () => {
    if (!stageRef.current) return;

    setIsExporting(true);
    try {
      // Wait for state update to hide delete buttons
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(stageRef.current, {
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${cat.name}-photobooth.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: 'Downloaded!', description: 'Photo saved to your device.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download photo.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  }, [cat.name, toast]);

  const handleCopy = useCallback(async () => {
    if (!stageRef.current) return;

    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const blob = await toBlob(stageRef.current, { pixelRatio: 2 });
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast({ title: 'Copied!', description: 'Photo copied to clipboard.' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  const handleShare = useCallback(async () => {
    if (!stageRef.current || !navigator.share) {
      toast({
        title: 'Not supported',
        description: 'Sharing is not available on this device.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const blob = await toBlob(stageRef.current, { pixelRatio: 2 });
      if (blob) {
        const file = new File([blob], `${cat.name}-photobooth.png`, { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: `Check out my cat ${cat.name}!`,
        });
      }
    } catch (error) {
      // User cancelled share or error
    } finally {
      setIsExporting(false);
    }
  }, [cat.name, toast]);

  const handleSaveToGallery = useCallback(async () => {
    if (!stageRef.current) {
      toast({ title: 'Error', description: 'Photo stage not ready.', variant: 'destructive' });
      return;
    }

    if (isFull) {
      toast({
        title: 'Gallery Full',
        description: 'Delete some photos to make room.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(stageRef.current, {
        quality: 1,
        pixelRatio: 2,
      });

      const result = await savePhoto({
        catId: cat.id,
        catName: cat.name,
        imageDataUrl: dataUrl,
        backgroundId: background.id,
        poseId: pose.id,
        frameId: frame.id,
        stickerCount: stickers.length,
        isFavorite: false,
      });

      if (result.success) {
        const cloudMessage =
          result.photo?.syncStatus === 'synced'
            ? ' Synced to cloud.'
            : result.photo?.syncStatus === 'error'
              ? ' (Cloud sync failed, saved locally)'
              : '';
        toast({
          title: 'Saved to Gallery!',
          description: `View your photos in the gallery.${cloudMessage}`,
        });
      } else {
        toast({
          title: 'Save Failed',
          description: result.error || 'Unknown error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Photo save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to capture photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [
    cat.id,
    cat.name,
    background.id,
    pose.id,
    frame.id,
    stickers.length,
    isFull,
    savePhoto,
    toast,
  ]);

  const getFrameStyle = (): React.CSSProperties => {
    if (frame.id === 'rainbow') {
      return {
        border: '8px solid transparent',
        backgroundImage:
          'linear-gradient(white, white), linear-gradient(135deg, red, orange, yellow, green, blue, purple)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      };
    }
    return { border: frame.borderStyle };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Photo Stage */}
      <div className="flex flex-col items-center gap-4">
        <div
          ref={stageRef}
          className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden shadow-xl"
          style={{
            ...background.style,
            ...getFrameStyle(),
          }}
        >
          {/* Cat Avatar */}
          <div
            className={`absolute inset-0 flex items-center justify-center ${pose.animation || ''}`}
            style={{ transform: pose.transform }}
          >
            <CatVisual
              cat={cat}
              equippedCostumeId={equippedCostumeId}
              size="xl"
              preferPortrait={true}
              animated
            />
          </div>

          {/* Stickers */}
          {stickers.map((sticker) => (
            <DraggableSticker
              key={sticker.id}
              sticker={sticker}
              containerRef={stageRef}
              onUpdate={updateSticker}
              onRemove={removeSticker}
              isExporting={isExporting}
            />
          ))}

          {/* Cat name watermark */}
          <div className="absolute bottom-2 right-2 text-white text-sm font-bold drop-shadow-lg opacity-80">
            {cat.name}
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex gap-2 flex-wrap justify-center">
          <Button onClick={handleSaveToGallery} disabled={isExporting || isFull}>
            <Save className="w-4 h-4 mr-2" />
            Save to Gallery
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={handleCopy} disabled={isExporting}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          {typeof navigator.share === 'function' && (
            <Button variant="outline" onClick={handleShare} disabled={isExporting}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
          <Button variant="ghost" onClick={resetAll}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
        <div className="text-center flex items-center justify-center gap-2">
          <Link
            to="/gallery"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ImageIcon className="w-4 h-4 inline mr-1" />
            View Gallery ({photoCount} photos)
          </Link>
          {isCloudEnabled ? (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              {isSyncing ? 'Syncing...' : 'Cloud sync on'}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CloudOff className="w-3 h-3" />
              Local only
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <Tabs defaultValue="background">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="background">🎨</TabsTrigger>
            <TabsTrigger value="pose">🐱</TabsTrigger>
            <TabsTrigger value="frame">🖼️</TabsTrigger>
            <TabsTrigger value="stickers">✨</TabsTrigger>
          </TabsList>

          {/* Background Tab */}
          <TabsContent value="background" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'nature', 'fantasy', 'seasonal', 'solid'] as const).map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={backgroundCategory === cat ? 'default' : 'outline'}
                    onClick={() => setBackgroundCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>
              <ScrollArea className="h-48">
                <div className="grid grid-cols-4 gap-2">
                  {filteredBackgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      className={`w-full aspect-square rounded-lg transition-all ${
                        background.id === bg.id
                          ? 'ring-2 ring-primary ring-offset-2'
                          : 'hover:scale-105'
                      }`}
                      style={bg.style}
                      onClick={() => setBackground(bg)}
                      title={bg.name}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Pose Tab */}
          <TabsContent value="pose" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {CAT_POSES.map((p) => (
                <Button
                  key={p.id}
                  variant={pose.id === p.id ? 'default' : 'outline'}
                  className="h-auto py-3"
                  onClick={() => setPose(p)}
                >
                  <span className="text-2xl mr-2">{p.emoji}</span>
                  {p.name}
                </Button>
              ))}
            </div>
          </TabsContent>

          {/* Frame Tab */}
          <TabsContent value="frame" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {PHOTO_FRAMES.map((f) => (
                <Button
                  key={f.id}
                  variant={frame.id === f.id ? 'default' : 'outline'}
                  className="h-auto py-3"
                  onClick={() => setFrame(f)}
                >
                  <span className="text-2xl mr-2">{f.emoji}</span>
                  {f.name}
                </Button>
              ))}
            </div>
          </TabsContent>

          {/* Stickers Tab */}
          <TabsContent value="stickers" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'hearts', 'stars', 'text', 'animals', 'effects'] as const).map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={stickerCategory === cat ? 'default' : 'outline'}
                    onClick={() => setStickerCategory(cat)}
                  >
                    {cat === 'all' ? '✨ All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>
              <ScrollArea className="h-40">
                <div className="grid grid-cols-6 gap-2">
                  {filteredStickers.map((s) => (
                    <button
                      key={s.id}
                      className="w-full aspect-square rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-2xl hover:scale-110 transition-transform"
                      onClick={() => addSticker(s.id)}
                      title={s.name}
                    >
                      {s.emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              {stickers.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Drag stickers to reposition. Hover to delete.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
