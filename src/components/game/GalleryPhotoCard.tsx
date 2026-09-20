import React from 'react';
import { Download, Trash2, Heart, Eye, Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalleryPhoto } from '@/types/gallery';
import { format } from 'date-fns';

/**
 * Props for the GalleryPhotoCard component
 */
interface GalleryPhotoCardProps {
  /** The photo data to display */
  photo: GalleryPhoto;
  /** Callback when viewing the photo in lightbox */
  onView: () => void;
  /** Callback when deleting the photo */
  onDelete: () => void;
  /** Callback when toggling favorite status */
  onToggleFavorite: () => void;
  /** Callback when downloading the photo */
  onDownload: () => void;
}

/**
 * SyncStatusIcon - Shows cloud sync status indicator
 * @internal
 */

const SyncStatusIcon: React.FC<{ status: GalleryPhoto['syncStatus'] }> = ({ status }) => {
  switch (status) {
    case 'synced':
      return <Cloud className="w-3 h-3 text-green-500" />;
    case 'syncing':
      return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
    case 'error':
      return <AlertCircle className="w-3 h-3 text-destructive" />;
    case 'local':
    default:
      return <CloudOff className="w-3 h-3 text-muted-foreground" />;
  }
};

/**
 * GalleryPhotoCard - Photo thumbnail card for gallery display
 *
 * Displays a photo thumbnail with cat name, date, favorite status,
 * and cloud sync status. Shows action overlay on hover for view,
 * favorite, download, and delete operations.
 *
 * @example
 * ```tsx
 * <GalleryPhotoCard
 *   photo={photo}
 *   onView={handleView}
 *   onDelete={handleDelete}
 *   onToggleFavorite={handleToggleFavorite}
 *   onDownload={handleDownload}
 * />
 * ```
 */
export const GalleryPhotoCard: React.FC<GalleryPhotoCardProps> = ({
  photo,
  onView,
  onDelete,
  onToggleFavorite,
  onDownload,
}) => {
  // Use cloud URL if available, otherwise use local dataUrl
  const imageSrc = photo.imageUrl || photo.imageDataUrl;

  return (
    <div className="group relative rounded-lg overflow-hidden bg-card border shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-square cursor-pointer" onClick={onView}>
        <img src={imageSrc} alt={`${photo.catName} photo`} className="w-full h-full object-cover" />
      </div>

      {/* Favorite badge */}
      {photo.isFavorite && (
        <div className="absolute top-2 right-2 text-red-500">
          <Heart className="w-5 h-5 fill-current" />
        </div>
      )}

      {/* Sync status badge */}
      <div className="absolute top-2 left-2">
        <SyncStatusIcon status={photo.syncStatus} />
      </div>

      {/* Info bar */}
      <div className="p-2 border-t bg-card">
        <p className="font-medium text-sm truncate">{photo.catName}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(photo.createdAt), 'MMM d, yyyy')}
        </p>
      </div>

      {/* Action overlay: hover on desktop, always-visible bottom bar on touch */}
      {isCoarse ? (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-2 bg-gradient-to-t from-black/70 to-transparent">
          <Button size="icon" variant="secondary" className="h-9 w-9" onClick={onView} aria-label="View photo">
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className={`h-9 w-9 ${photo.isFavorite ? 'text-red-500' : ''}`}
            onClick={onToggleFavorite}
            aria-label="Toggle favorite"
          >
            <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button size="icon" variant="secondary" className="h-9 w-9" onClick={onDownload} aria-label="Download photo">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="destructive" className="h-9 w-9" onClick={onDelete} aria-label="Delete photo">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="secondary" onClick={onView} aria-label="View photo">
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={onToggleFavorite}
            className={photo.isFavorite ? 'text-red-500' : ''}
            aria-label="Toggle favorite"
          >
            <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button size="icon" variant="secondary" onClick={onDownload} aria-label="Download photo">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="destructive" onClick={onDelete} aria-label="Delete photo">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
