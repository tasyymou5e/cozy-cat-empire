-- Create storage bucket for cat portraits
INSERT INTO storage.buckets (id, name, public)
VALUES ('cat-portraits', 'cat-portraits', true);

-- Allow public read access
CREATE POLICY "Public can view cat portraits"
ON storage.objects FOR SELECT
USING (bucket_id = 'cat-portraits');

-- Allow authenticated users to upload portraits
CREATE POLICY "Authenticated users can upload portraits"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cat-portraits' AND auth.role() = 'authenticated');

-- Allow service role to upload (for edge functions)
CREATE POLICY "Service role can upload portraits"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cat-portraits');