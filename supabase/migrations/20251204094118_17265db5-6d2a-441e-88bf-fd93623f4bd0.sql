-- Create storage bucket for campaign media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-media', 
  'campaign-media', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload campaign media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own campaign media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own campaign media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access since bucket is public
CREATE POLICY "Public read access for campaign media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaign-media');