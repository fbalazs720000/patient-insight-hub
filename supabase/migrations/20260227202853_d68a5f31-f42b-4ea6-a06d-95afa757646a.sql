
-- Create storage bucket for patient PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', true);

-- Allow public read access
CREATE POLICY "Public read patient documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-documents');

-- Allow authenticated insert (for future uploads)
CREATE POLICY "Allow insert patient documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patient-documents');
