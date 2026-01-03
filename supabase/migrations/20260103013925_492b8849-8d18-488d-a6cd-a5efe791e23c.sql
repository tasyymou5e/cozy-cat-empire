-- Create storage bucket for photo gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('photo-gallery', 'photo-gallery', true);

-- RLS policies for storage bucket
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photo-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photo-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view gallery photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photo-gallery');

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photo-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create gallery_photos metadata table
CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cat_id text NOT NULL,
  cat_name text NOT NULL,
  image_path text NOT NULL,
  background_id text NOT NULL,
  pose_id text NOT NULL,
  frame_id text NOT NULL,
  sticker_count integer DEFAULT 0,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for gallery_photos
CREATE POLICY "Users can view own photos" ON public.gallery_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" ON public.gallery_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON public.gallery_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON public.gallery_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_gallery_photos_updated_at
  BEFORE UPDATE ON public.gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();