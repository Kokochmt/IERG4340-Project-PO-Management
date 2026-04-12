DROP POLICY IF EXISTS "Public read access for company assets" ON storage.objects;

CREATE POLICY "Public read access for logo file"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-assets' AND name = 'logo.png');