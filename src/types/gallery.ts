export interface GalleryPhoto {
  id: string;
  catId: string;
  catName: string;
  imageDataUrl: string;
  imageUrl?: string;
  imagePath?: string;
  backgroundId: string;
  poseId: string;
  frameId: string;
  stickerCount: number;
  createdAt: string;
  isFavorite: boolean;
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
  cloudId?: string;
}

export interface CloudGalleryPhoto {
  id: string;
  user_id: string;
  cat_id: string;
  cat_name: string;
  image_path: string;
  background_id: string;
  pose_id: string;
  frame_id: string;
  sticker_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const GALLERY_STORAGE_KEY = 'cat-photo-gallery';
export const MAX_GALLERY_PHOTOS = 50;
