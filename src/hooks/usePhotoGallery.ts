import { useState, useEffect, useCallback } from 'react';
import { GalleryPhoto, GALLERY_STORAGE_KEY, MAX_GALLERY_PHOTOS } from '@/types/gallery';

export function usePhotoGallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  // Load photos from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (stored) {
      try {
        setPhotos(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load gallery:', e);
      }
    }
  }, []);

  // Save to localStorage whenever photos change
  const persistPhotos = useCallback((newPhotos: GalleryPhoto[]) => {
    setPhotos(newPhotos);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(newPhotos));
  }, []);

  const savePhoto = useCallback((photo: Omit<GalleryPhoto, 'id' | 'createdAt'>) => {
    if (photos.length >= MAX_GALLERY_PHOTOS) {
      return { success: false, error: 'Gallery is full. Delete some photos first.' };
    }

    const newPhoto: GalleryPhoto = {
      ...photo,
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    persistPhotos([newPhoto, ...photos]);
    return { success: true, photo: newPhoto };
  }, [photos, persistPhotos]);

  const deletePhoto = useCallback((photoId: string) => {
    persistPhotos(photos.filter(p => p.id !== photoId));
  }, [photos, persistPhotos]);

  const toggleFavorite = useCallback((photoId: string) => {
    persistPhotos(photos.map(p => 
      p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  }, [photos, persistPhotos]);

  const clearGallery = useCallback(() => {
    persistPhotos([]);
  }, [persistPhotos]);

  return { 
    photos, 
    savePhoto, 
    deletePhoto, 
    toggleFavorite, 
    clearGallery,
    isFull: photos.length >= MAX_GALLERY_PHOTOS,
    photoCount: photos.length,
  };
}
