import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GalleryPhoto, CloudGalleryPhoto } from '@/types/gallery';

/**
 * Hook for cloud storage operations on gallery photos
 *
 * Low-level hook that handles uploading, downloading, and managing
 * photo metadata in the cloud. Used internally by usePhotoGallery.
 *
 * @param userId - The current user's ID
 * @returns Cloud storage operation functions
 *
 * @example
 * ```tsx
 * const { uploadPhoto, loadCloudPhotos, deleteCloudPhoto } = useCloudGallery(userId);
 *
 * // Upload a photo to cloud storage
 * const result = await uploadPhoto(photoId, dataUrl);
 * if (result) {
 *   console.log('Uploaded to:', result.url);
 * }
 *
 * // Load all user's cloud photos
 * const cloudPhotos = await loadCloudPhotos();
 *
 * // Delete from cloud
 * await deleteCloudPhoto(photoId, imagePath);
 * ```
 */
export function useCloudGallery(userId: string | undefined) {
  const uploadPhoto = useCallback(async (
    photoId: string,
    dataUrl: string
  ): Promise<{ path: string; url: string } | null> => {
    if (!userId) return null;

    try {
      // Convert base64 to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const path = `${userId}/${photoId}.png`;
      
      const { error } = await supabase.storage
        .from('photo-gallery')
        .upload(path, blob, { 
          contentType: 'image/png',
          upsert: true 
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('photo-gallery')
        .getPublicUrl(path);

      return { path, url: urlData.publicUrl };
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  }, [userId]);

  const downloadPhoto = useCallback(async (path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('photo-gallery')
        .download(path);

      if (error || !data) return null;

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(data);
      });
    } catch (error) {
      console.error('Download failed:', error);
      return null;
    }
  }, []);

  const savePhotoMetadata = useCallback(async (
    photo: Omit<CloudGalleryPhoto, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ id: string } | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('gallery_photos')
      .insert({
        user_id: userId,
        cat_id: photo.cat_id,
        cat_name: photo.cat_name,
        image_path: photo.image_path,
        background_id: photo.background_id,
        pose_id: photo.pose_id,
        frame_id: photo.frame_id,
        sticker_count: photo.sticker_count,
        is_favorite: photo.is_favorite,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Save metadata error:', error);
      return null;
    }

    return { id: data.id };
  }, [userId]);

  const loadCloudPhotos = useCallback(async (): Promise<CloudGalleryPhoto[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load cloud photos error:', error);
      return [];
    }

    return data as CloudGalleryPhoto[];
  }, [userId]);

  const updatePhotoMetadata = useCallback(async (
    id: string,
    updates: Partial<Pick<CloudGalleryPhoto, 'is_favorite'>>
  ): Promise<boolean> => {
    if (!userId) return false;

    const { error } = await supabase
      .from('gallery_photos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }, [userId]);

  const deleteCloudPhoto = useCallback(async (
    id: string,
    imagePath: string
  ): Promise<boolean> => {
    if (!userId) return false;

    // Delete from storage
    await supabase.storage
      .from('photo-gallery')
      .remove([imagePath]);

    // Delete metadata
    const { error } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }, [userId]);

  const cloudPhotoToLocal = useCallback((
    cloudPhoto: CloudGalleryPhoto,
    imageDataUrl: string
  ): GalleryPhoto => ({
    id: cloudPhoto.id,
    cloudId: cloudPhoto.id,
    catId: cloudPhoto.cat_id,
    catName: cloudPhoto.cat_name,
    imageDataUrl,
    imagePath: cloudPhoto.image_path,
    backgroundId: cloudPhoto.background_id,
    poseId: cloudPhoto.pose_id,
    frameId: cloudPhoto.frame_id,
    stickerCount: cloudPhoto.sticker_count,
    createdAt: cloudPhoto.created_at,
    isFavorite: cloudPhoto.is_favorite,
    syncStatus: 'synced',
  }), []);

  return {
    uploadPhoto,
    downloadPhoto,
    savePhotoMetadata,
    loadCloudPhotos,
    updatePhotoMetadata,
    deleteCloudPhoto,
    cloudPhotoToLocal,
  };
}
