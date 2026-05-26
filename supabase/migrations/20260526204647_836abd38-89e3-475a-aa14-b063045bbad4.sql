
-- 1. Fix privilege escalation: restrict self-insert on user_roles to 'student' only
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;
CREATE POLICY "Users can insert student role on signup"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'student'::app_role);

-- 2. Remove public exposure of referral_codes; add security definer validator
DROP POLICY IF EXISTS "Anyone can view active codes for validation" ON public.referral_codes;

CREATE OR REPLACE FUNCTION public.validate_referral_code(code_text text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.referral_codes
  WHERE code = code_text AND is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

-- 3. Allow admins to delete newsletter subscriptions (GDPR support)
CREATE POLICY "Admins can delete subscriptions"
  ON public.newsletter_subscriptions
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
