-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study-materials', 'study-materials', true);

-- Add education level to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS education_level text;

-- Storage policies for study materials bucket
CREATE POLICY "Admins can upload study materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-materials' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update study materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study-materials' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete study materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-materials' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view study materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'study-materials');