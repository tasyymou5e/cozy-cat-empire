import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2, Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { GalleryPhoto } from '@/types/gallery';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

/**
 * Props for the PhotoLightbox component
 */
interface PhotoLightboxProps {
  /** Currently displayed photo (null if closed) */
  photo: GalleryPhoto | null;
  /** All photos for navigation */
  photos: GalleryPhoto[];
  /** Whether the lightbox is open */
  open: boolean;
  /** Callback when closing the lightbox */
  onClose: () => void;
  /** Callback when navigating to another photo */
  onNavigate: (photoId: string) => void;
  /** Callback when toggling favorite status */
  onToggleFavorite: (photoId: string) => void;
  /** Callback when deleting a photo */
  onDelete: (photoId: string) => void;
}

/**
 * PhotoLightbox - Full-screen photo viewer with navigation
 *
 * Displays photos in a modal lightbox with keyboard navigation,
 * download, share, favorite, and delete actions.
 *
 * @example
 * ```tsx
 * <PhotoLightbox
 *   photo={selectedPhoto}
 *   photos={allPhotos}
 *   open={isOpen}
 *   onClose={handleClose}
 *   onNavigate={setSelectedPhoto}
 *   onToggleFavorite={handleToggleFavorite}
 *   onDelete={handleDelete}
 * />
 * ```
 */

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  photos,
  open,
  onClose,
  onNavigate,
  onToggleFavorite,
  onDelete,
}) => {
  const { toast } = useToast();

  const currentIndex = photo ? photos.findIndex((p) => p.id === photo.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) onNavigate(photos[currentIndex - 1].id);
  }, [hasPrev, currentIndex, photos, onNavigate]);

  const goToNext = useCallback(() => {
    if (hasNext) onNavigate(photos[currentIndex + 1].id);
  }, [hasNext, currentIndex, photos, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrev, goToNext, onClose]);

  const handleDownload = () => {
    if (!photo) return;
    const link = document.createElement('a');
    link.download = `${photo.catName}-gallery.png`;
    link.href = photo.imageDataUrl;
    link.click();
    toast({ title: 'Downloaded!', description: 'Photo saved to your device.' });
  };

  const handleShare = async () => {
    if (!photo || !navigator.share) {
      toast({
        title: 'Not supported',
        description: 'Sharing is not available.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(photo.imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${photo.catName}.png`, { type: 'image/png' });
      await navigator.share({ files: [file], title: `Check out ${photo.catName}!` });
    } catch (e) {
      // User cancelled
    }
  };

  const handleDelete = () => {
    if (!photo) return;
    onDelete(photo.id);
    onClose();
    toast({ title: 'Deleted', description: 'Photo removed from gallery.' });
  };

  if (!photo) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 bg-black/95 border-none">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 text-primary-foreground dark:text-foreground hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Main image area */}
        <div className="relative flex items-center justify-center min-h-[60vh]">
          {/* Navigation arrows */}
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 text-primary-foreground dark:text-foreground hover:bg-white/20"
              onClick={goToPrev}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          <img
            src={photo.imageDataUrl}
            alt={`${photo.catName} photo`}
            className="max-h-[70vh] max-w-full object-contain"
          />

          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 text-primary-foreground dark:text-foreground hover:bg-white/20"
              onClick={goToNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}
        </div>

        {/* Footer with info and actions */}
        <div className="p-4 bg-card border-t flex items-center justify-between">
          <div>
            <p className="font-bold">{photo.catName}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(photo.createdAt), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onToggleFavorite(photo.id)}
              className={photo.isFavorite ? 'text-red-500' : ''}
            >
              <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            {typeof navigator.share === 'function' && (
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
