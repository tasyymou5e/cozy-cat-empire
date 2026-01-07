-- Create backgrounds bucket for storing generated background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to backgrounds
CREATE POLICY "Public can view backgrounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'backgrounds');

-- Allow service role to manage backgrounds (for edge functions)
CREATE POLICY "Service role can manage backgrounds"
ON storage.objects FOR ALL
USING (bucket_id = 'backgrounds')
WITH CHECK (bucket_id = 'backgrounds');