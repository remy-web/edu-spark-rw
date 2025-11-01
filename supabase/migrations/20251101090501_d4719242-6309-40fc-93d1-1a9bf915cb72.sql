-- Create table for tracking material downloads
CREATE TABLE public.material_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  material_name text NOT NULL,
  level text NOT NULL,
  subject text NOT NULL,
  downloaded_at timestamp with time zone NOT NULL DEFAULT now(),
  completed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.material_downloads ENABLE ROW LEVEL SECURITY;

-- Students can insert their own downloads
CREATE POLICY "Students can insert their own downloads"
ON public.material_downloads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Students can view their own downloads
CREATE POLICY "Students can view their own downloads"
ON public.material_downloads
FOR SELECT
USING (auth.uid() = user_id);

-- Students can update their own downloads
CREATE POLICY "Students can update their own downloads"
ON public.material_downloads
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all downloads
CREATE POLICY "Admins can view all downloads"
ON public.material_downloads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_material_downloads_user_id ON public.material_downloads(user_id);
CREATE INDEX idx_material_downloads_subject ON public.material_downloads(subject);
CREATE INDEX idx_material_downloads_level ON public.material_downloads(level);
CREATE INDEX idx_material_downloads_downloaded_at ON public.material_downloads(downloaded_at DESC);