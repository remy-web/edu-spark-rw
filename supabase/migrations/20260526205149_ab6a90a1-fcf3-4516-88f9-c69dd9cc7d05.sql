
-- Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'study-materials';

-- Drop any prior policies on this bucket (idempotent)
DROP POLICY IF EXISTS "study_materials_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "study_materials_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "study_materials_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "study_materials_authenticated_read" ON storage.objects;

-- Authenticated users (students + admins) can read files via signed URLs / authed requests
CREATE POLICY "study_materials_authenticated_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'study-materials');

-- Only admins can upload / modify / delete
CREATE POLICY "study_materials_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'study-materials' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "study_materials_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'study-materials' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "study_materials_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'study-materials' AND public.has_role(auth.uid(), 'admin'::app_role));
