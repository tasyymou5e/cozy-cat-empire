export interface GalleryPhoto {
  id: string;
  catId: string;
  catName: string;
  imageDataUrl: string;
  backgroundId: string;
  poseId: string;
  frameId: string;
  stickerCount: number;
  createdAt: string;
  isFavorite: boolean;
}

export const GALLERY_STORAGE_KEY = 'cat-photo-gallery';
export const MAX_GALLERY_PHOTOS = 50;
