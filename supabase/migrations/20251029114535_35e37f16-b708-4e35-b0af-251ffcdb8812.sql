-- Add created_by to study_guides to track who uploaded the file
ALTER TABLE public.study_guides 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create referral codes table
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create user referral codes junction table
CREATE TABLE public.user_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code_id uuid REFERENCES public.referral_codes(id) ON DELETE CASCADE NOT NULL,
  used_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, referral_code_id)
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Admins can view their own codes"
  ON public.referral_codes
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

CREATE POLICY "Admins can create codes"
  ON public.referral_codes
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

CREATE POLICY "Anyone can view active codes for validation"
  ON public.referral_codes
  FOR SELECT
  USING (is_active = true);

-- RLS policies for user_referral_codes
CREATE POLICY "Users can view their own referral usage"
  ON public.user_referral_codes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral usage"
  ON public.user_referral_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view referral usage for their codes"
  ON public.user_referral_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.referral_codes 
      WHERE referral_codes.id = user_referral_codes.referral_code_id 
      AND referral_codes.created_by = auth.uid()
    )
  );

-- Update study_guides RLS to allow filtering by created_by
CREATE POLICY "Users can view guides from their referral code teacher"
  ON public.study_guides
  FOR SELECT
  USING (
    created_by IN (
      SELECT rc.created_by 
      FROM public.user_referral_codes urc
      JOIN public.referral_codes rc ON rc.id = urc.referral_code_id
      WHERE urc.user_id = auth.uid()
    )
    OR created_by IS NULL
  );