-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create student statistics table
CREATE TABLE public.student_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_level TEXT NOT NULL,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  school_name TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on student_statistics
ALTER TABLE public.student_statistics ENABLE ROW LEVEL SECURITY;

-- Create study guides table
CREATE TABLE public.study_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  education_level TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on study_guides
ALTER TABLE public.study_guides ENABLE ROW LEVEL SECURITY;

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  study_guide_id UUID REFERENCES public.study_guides(id) ON DELETE CASCADE NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_statistics
CREATE POLICY "Admins can view all statistics"
  ON public.student_statistics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert statistics"
  ON public.student_statistics FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update statistics"
  ON public.student_statistics FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for study_guides
CREATE POLICY "Everyone can view study guides"
  ON public.study_guides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert study guides"
  ON public.study_guides FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update study guides"
  ON public.study_guides FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete study guides"
  ON public.study_guides FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for feedback
CREATE POLICY "Users can view their own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for testing
INSERT INTO public.student_statistics (education_level, enrolled_count, school_name)
VALUES 
  ('Secondary 1', 450, 'Kigali Innovation School'),
  ('Secondary 2', 380, 'Kigali Innovation School'),
  ('Secondary 3', 320, 'Kigali Innovation School');

INSERT INTO public.study_guides (title, subject, education_level, description, file_url)
VALUES 
  ('Introduction to Algebra', 'Mathematics', 'Secondary 1', 'Basic algebraic concepts and operations', '/guides/algebra-basics.pdf'),
  ('Geometry Fundamentals', 'Mathematics', 'Secondary 1', 'Understanding shapes, angles, and theorems', '/guides/geometry-fundamentals.pdf'),
  ('Linear Equations', 'Mathematics', 'Secondary 1', 'Solving linear equations step by step', '/guides/linear-equations.pdf');