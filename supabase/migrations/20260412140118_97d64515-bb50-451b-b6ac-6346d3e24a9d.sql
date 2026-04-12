INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for company assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'company-assets');
