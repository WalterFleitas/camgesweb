
-- Allow admins to manage user_roles (insert, update, delete)
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user_roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow all authenticated users to view all profiles (for admin page)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = id);

-- Drop the old restrictive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
