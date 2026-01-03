import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Heart, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePhotoGallery } from '@/hooks/usePhotoGallery';
import { GalleryPhotoCard } from '@/components/game/GalleryPhotoCard';
import { PhotoLightbox } from '@/components/game/PhotoLightbox';
import { useToast } from '@/hooks/use-toast';
import { MAX_GALLERY_PHOTOS } from '@/types/gallery';

type FilterMode = 'all' | 'favorites';
type SortMode = 'newest' | 'oldest' | 'name';

export default function CatGallery() {
  const { photos, deletePhoto, toggleFavorite, clearGallery, photoCount } = usePhotoGallery();
  const { toast } = useToast();
  
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // Get unique cat names for filter
  const catNames = useMemo(() => {
    const names = new Set(photos.map(p => p.catName));
    return Array.from(names).sort();
  }, [photos]);

  // Filter and sort photos
  const filteredPhotos = useMemo(() => {
    let result = [...photos];
    
    // Filter by favorites
    if (filterMode === 'favorites') {
      result = result.filter(p => p.isFavorite);
    }
    
    // Filter by cat
    if (filterCat !== 'all') {
      result = result.filter(p => p.catName === filterCat);
    }
    
    // Sort
    switch (sortMode) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.catName.localeCompare(b.catName));
        break;
    }
    
    return result;
  }, [photos, filterMode, filterCat, sortMode]);

  const selectedPhoto = selectedPhotoId 
    ? filteredPhotos.find(p => p.id === selectedPhotoId) || null 
    : null;

  const handleDownload = (photo: typeof photos[0]) => {
    const link = document.createElement('a');
    link.download = `${photo.catName}-gallery.png`;
    link.href = photo.imageDataUrl;
    link.click();
    toast({ title: 'Downloaded!', description: 'Photo saved to your device.' });
  };

  const handleDelete = (photoId: string) => {
    deletePhoto(photoId);
    toast({ title: 'Deleted', description: 'Photo removed from gallery.' });
  };

  const handleClearAll = () => {
    clearGallery();
    toast({ title: 'Gallery cleared', description: 'All photos have been deleted.' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/collection">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">🖼️ Photo Gallery</h1>
            <span className="text-sm text-muted-foreground">
              {photoCount} / {MAX_GALLERY_PHOTOS}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/photobooth">
              <Button variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" />
                Photo Booth
              </Button>
            </Link>
            
            {photos.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear entire gallery?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {photos.length} photos from your gallery. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll}>Delete All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>
      
      {/* Filters */}
      <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant={filterMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('all')}
            >
              All
            </Button>
            <Button
              variant={filterMode === 'favorites' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('favorites')}
            >
              <Heart className="w-4 h-4 mr-1" />
              Favorites
            </Button>
          </div>
          
          {catNames.length > 1 && (
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by cat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cats</SelectItem>
                {catNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Cat Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Gallery Grid */}
      <main className="container mx-auto px-4 py-6">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">
              {photos.length === 0 ? 'No Photos Yet!' : 'No Matching Photos'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {photos.length === 0 
                ? 'Take some photos in the Photo Booth to see them here.'
                : 'Try changing your filters to see more photos.'}
            </p>
            {photos.length === 0 && (
              <Link to="/photobooth">
                <Button>
                  <Camera className="w-4 h-4 mr-2" />
                  Open Photo Booth
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPhotos.map(photo => (
              <GalleryPhotoCard
                key={photo.id}
                photo={photo}
                onView={() => setSelectedPhotoId(photo.id)}
                onDelete={() => handleDelete(photo.id)}
                onToggleFavorite={() => toggleFavorite(photo.id)}
                onDownload={() => handleDownload(photo)}
              />
            ))}
          </div>
        )}
      </main>
      
      {/* Lightbox */}
      <PhotoLightbox
        photo={selectedPhoto}
        photos={filteredPhotos}
        open={!!selectedPhoto}
        onClose={() => setSelectedPhotoId(null)}
        onNavigate={setSelectedPhotoId}
        onToggleFavorite={toggleFavorite}
        onDelete={handleDelete}
      />
    </div>
  );
}
