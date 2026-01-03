import React from 'react';
import { Download, Trash2, Heart, Eye, Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalleryPhoto } from '@/types/gallery';
import { format } from 'date-fns';

interface GalleryPhotoCardProps {
  photo: GalleryPhoto;
  onView: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onDownload: () => void;
}

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
      <div 
        className="aspect-square cursor-pointer"
        onClick={onView}
      >
        <img 
          src={imageSrc} 
          alt={`${photo.catName} photo`}
          className="w-full h-full object-cover"
        />
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
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="icon" variant="secondary" onClick={onView}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={onToggleFavorite}
          className={photo.isFavorite ? 'text-red-500' : ''}
        >
          <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
        </Button>
        <Button size="icon" variant="secondary" onClick={onDownload}>
          <Download className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
