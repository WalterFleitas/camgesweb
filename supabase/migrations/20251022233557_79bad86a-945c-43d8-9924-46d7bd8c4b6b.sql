-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check roles
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
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create victims table
CREATE TABLE public.victims (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.victims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view victims"
  ON public.victims FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert victims"
  ON public.victims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update victims"
  ON public.victims FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete victims"
  ON public.victims FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create judges table
CREATE TABLE public.judges (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view judges"
  ON public.judges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert judges"
  ON public.judges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update judges"
  ON public.judges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete judges"
  ON public.judges FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create psychologists table
CREATE TABLE public.psychologists (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.psychologists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view psychologists"
  ON public.psychologists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert psychologists"
  ON public.psychologists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update psychologists"
  ON public.psychologists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete psychologists"
  ON public.psychologists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create sessions table
CREATE TABLE public.sessions (
  id SERIAL PRIMARY KEY,
  disco_number INTEGER NOT NULL,
  session_date TIMESTAMPTZ NOT NULL,
  case_name TEXT NOT NULL,
  defendant_name TEXT NOT NULL,
  victim_id INTEGER REFERENCES public.victims(id),
  judge_id INTEGER REFERENCES public.judges(id),
  psychologist_id INTEGER REFERENCES public.psychologists(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete sessions"
  ON public.sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();