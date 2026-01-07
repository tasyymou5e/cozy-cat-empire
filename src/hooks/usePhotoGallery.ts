import { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryPhoto, GALLERY_STORAGE_KEY, MAX_GALLERY_PHOTOS } from '@/types/gallery';
import { useCloudGallery } from './useCloudGallery';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing the photo gallery with local and cloud storage
 *
 * Handles photo storage in localStorage with automatic cloud sync when
 * the user is authenticated. Supports favorites, deletion, and manual sync.
 *
 * @param userId - The current user's ID for cloud sync (optional)
 * @returns Photo list and gallery management functions
 *
 * @example
 * ```tsx
 * const { photos, savePhoto, deletePhoto, toggleFavorite, syncNow } = usePhotoGallery(userId);
 *
 * // Save a new photo
 * await savePhoto({
 *   catId: cat.id,
 *   catName: cat.name,
 *   imageDataUrl: dataUrl,
 *   backgroundId: 'forest',
 *   poseId: 'sitting',
 *   frameId: 'polaroid',
 *   stickerCount: 3,
 *   isFavorite: false
 * });
 *
 * // Toggle favorite status
 * await toggleFavorite(photoId);
 *
 * // Manual cloud sync
 * await syncNow();
 * ```
 */
export function usePhotoGallery(userId?: string | null) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cloudGallery = useCloudGallery(userId || undefined);

  // Load photos from localStorage
  const loadLocalPhotos = useCallback((): GalleryPhoto[] => {
    const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as GalleryPhoto[];
        // Ensure all photos have syncStatus
        return parsed.map((p) => ({
          ...p,
          syncStatus: p.syncStatus || 'local',
        }));
      } catch (e) {
        console.error('Failed to load gallery:', e);
      }
    }
    return [];
  }, []);

  // Save to localStorage
  const persistPhotos = useCallback((newPhotos: GalleryPhoto[]) => {
    setPhotos(newPhotos);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(newPhotos));
  }, []);

  // Sync with cloud
  const syncWithCloud = useCallback(async () => {
    if (!userId) return;

    setIsSyncing(true);
    try {
      const cloudPhotos = await cloudGallery.loadCloudPhotos();
      const localPhotos = loadLocalPhotos();

      // Build a map of cloud photos by their ID
      const cloudPhotoMap = new Map(cloudPhotos.map((p) => [p.id, p]));

      // Merge: cloud photos take precedence
      const mergedPhotos: GalleryPhoto[] = [];
      const processedCloudIds = new Set<string>();

      // First, process local photos
      for (const local of localPhotos) {
        if (local.cloudId && cloudPhotoMap.has(local.cloudId)) {
          // Photo exists in cloud - use cloud version
          const cloud = cloudPhotoMap.get(local.cloudId)!;
          processedCloudIds.add(cloud.id);

          // Get image URL from storage
          const { data } = supabase.storage.from('photo-gallery').getPublicUrl(cloud.image_path);

          mergedPhotos.push({
            ...local,
            isFavorite: cloud.is_favorite,
            syncStatus: 'synced',
            imageUrl: data.publicUrl,
          });
        } else if (local.syncStatus === 'local' || local.syncStatus === 'error') {
          // Local-only photo - try to sync to cloud
          const uploaded = await cloudGallery.uploadPhoto(local.id, local.imageDataUrl);
          if (uploaded) {
            const saved = await cloudGallery.savePhotoMetadata({
              cat_id: local.catId,
              cat_name: local.catName,
              image_path: uploaded.path,
              background_id: local.backgroundId,
              pose_id: local.poseId,
              frame_id: local.frameId,
              sticker_count: local.stickerCount,
              is_favorite: local.isFavorite,
            });

            if (saved) {
              mergedPhotos.push({
                ...local,
                cloudId: saved.id,
                imagePath: uploaded.path,
                imageUrl: uploaded.url,
                syncStatus: 'synced',
              });
              continue;
            }
          }
          // Failed to sync
          mergedPhotos.push({ ...local, syncStatus: 'error' });
        } else {
          mergedPhotos.push(local);
        }
      }

      // Add cloud photos that aren't in local storage
      for (const cloud of cloudPhotos) {
        if (!processedCloudIds.has(cloud.id)) {
          const { data } = supabase.storage.from('photo-gallery').getPublicUrl(cloud.image_path);

          mergedPhotos.push(cloudGallery.cloudPhotoToLocal(cloud, data.publicUrl));
        }
      }

      // Sort by created date
      mergedPhotos.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      persistPhotos(mergedPhotos);
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [userId, cloudGallery, loadLocalPhotos, persistPhotos]);

  // Store syncWithCloud in a ref to avoid re-triggering the effect
  const syncWithCloudRef = useRef(syncWithCloud);
  useEffect(() => {
    syncWithCloudRef.current = syncWithCloud;
  }, [syncWithCloud]);

  // Initial load
  useEffect(() => {
    const localPhotos = loadLocalPhotos();
    setPhotos(localPhotos);
    setIsLoading(false);

    if (userId) {
      syncWithCloudRef.current();
    }
  }, [userId, loadLocalPhotos]);

  // Realtime subscription for gallery updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`gallery-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gallery_photos',
          filter: `user_id=eq.${userId}`,
        },
        () => syncWithCloudRef.current()
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'gallery_photos',
          filter: `user_id=eq.${userId}`,
        },
        () => syncWithCloudRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const savePhoto = useCallback(
    async (photo: Omit<GalleryPhoto, 'id' | 'createdAt' | 'syncStatus'>) => {
      if (photos.length >= MAX_GALLERY_PHOTOS) {
        return { success: false, error: 'Gallery is full. Delete some photos first.' };
      }

      const newPhoto: GalleryPhoto = {
        ...photo,
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        syncStatus: userId ? 'syncing' : 'local',
      };

      // Save locally first
      const updatedPhotos = [newPhoto, ...photos];
      persistPhotos(updatedPhotos);

      // If logged in, sync to cloud in background
      if (userId) {
        const uploaded = await cloudGallery.uploadPhoto(newPhoto.id, newPhoto.imageDataUrl);
        if (uploaded) {
          const saved = await cloudGallery.savePhotoMetadata({
            cat_id: newPhoto.catId,
            cat_name: newPhoto.catName,
            image_path: uploaded.path,
            background_id: newPhoto.backgroundId,
            pose_id: newPhoto.poseId,
            frame_id: newPhoto.frameId,
            sticker_count: newPhoto.stickerCount,
            is_favorite: newPhoto.isFavorite,
          });

          if (saved) {
            const syncedPhoto: GalleryPhoto = {
              ...newPhoto,
              cloudId: saved.id,
              imagePath: uploaded.path,
              imageUrl: uploaded.url,
              syncStatus: 'synced',
            };
            persistPhotos([syncedPhoto, ...photos]);
            return { success: true, photo: syncedPhoto };
          }
        }

        // Mark as error if sync failed
        const errorPhoto: GalleryPhoto = { ...newPhoto, syncStatus: 'error' };
        persistPhotos([errorPhoto, ...photos]);
        return { success: true, photo: errorPhoto };
      }

      return { success: true, photo: newPhoto };
    },
    [photos, persistPhotos, userId, cloudGallery]
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (photo?.cloudId && photo?.imagePath && userId) {
        await cloudGallery.deleteCloudPhoto(photo.cloudId, photo.imagePath);
      }
      persistPhotos(photos.filter((p) => p.id !== photoId));
    },
    [photos, persistPhotos, userId, cloudGallery]
  );

  const toggleFavorite = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) return;

      const newFavorite = !photo.isFavorite;

      // Update locally
      persistPhotos(photos.map((p) => (p.id === photoId ? { ...p, isFavorite: newFavorite } : p)));

      // Sync to cloud if available
      if (photo.cloudId && userId) {
        await cloudGallery.updatePhotoMetadata(photo.cloudId, { is_favorite: newFavorite });
      }
    },
    [photos, persistPhotos, userId, cloudGallery]
  );

  const clearGallery = useCallback(async () => {
    // Delete all cloud photos
    if (userId) {
      for (const photo of photos) {
        if (photo.cloudId && photo.imagePath) {
          await cloudGallery.deleteCloudPhoto(photo.cloudId, photo.imagePath);
        }
      }
    }
    persistPhotos([]);
  }, [photos, persistPhotos, userId, cloudGallery]);

  const syncNow = useCallback(async () => {
    if (userId) {
      await syncWithCloud();
    }
  }, [userId, syncWithCloud]);

  return {
    photos,
    savePhoto,
    deletePhoto,
    toggleFavorite,
    clearGallery,
    isFull: photos.length >= MAX_GALLERY_PHOTOS,
    photoCount: photos.length,
    // Cloud sync properties
    isSyncing,
    lastSyncTime,
    syncNow,
    isCloudEnabled: !!userId,
    isLoading,
  };
}
