-- Create empire-renders storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('empire-renders', 'empire-renders', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their empire renders
CREATE POLICY "Users can upload empire renders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'empire-renders' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own renders
CREATE POLICY "Users can view own empire renders"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'empire-renders' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own renders
CREATE POLICY "Users can delete own empire renders"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'empire-renders' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public read for empire renders (so they display in the UI)
CREATE POLICY "Empire renders are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'empire-renders');