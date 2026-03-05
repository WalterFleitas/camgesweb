
-- Fix: Change all policies from RESTRICTIVE to PERMISSIVE
-- by dropping and recreating them (default is PERMISSIVE)

-- sessions
DROP POLICY IF EXISTS "Users can view own or admin all sessions" ON public.sessions;
CREATE POLICY "Users can view own or admin all sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can insert sessions" ON public.sessions;
CREATE POLICY "Authenticated users can insert sessions"
  ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update sessions" ON public.sessions;
CREATE POLICY "Authenticated users can update sessions"
  ON public.sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete sessions" ON public.sessions;
CREATE POLICY "Authenticated users can delete sessions"
  ON public.sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- victims
DROP POLICY IF EXISTS "Users can view own or admin all victims" ON public.victims;
CREATE POLICY "Users can view own or admin all victims"
  ON public.victims FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can insert victims" ON public.victims;
CREATE POLICY "Authenticated users can insert victims"
  ON public.victims FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update victims" ON public.victims;
CREATE POLICY "Authenticated users can update victims"
  ON public.victims FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete victims" ON public.victims;
CREATE POLICY "Authenticated users can delete victims"
  ON public.victims FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- judges
DROP POLICY IF EXISTS "Users can view own or admin all judges" ON public.judges;
CREATE POLICY "Users can view own or admin all judges"
  ON public.judges FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can insert judges" ON public.judges;
CREATE POLICY "Authenticated users can insert judges"
  ON public.judges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update judges" ON public.judges;
CREATE POLICY "Authenticated users can update judges"
  ON public.judges FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete judges" ON public.judges;
CREATE POLICY "Authenticated users can delete judges"
  ON public.judges FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- psychologists
DROP POLICY IF EXISTS "Users can view own or admin all psychologists" ON public.psychologists;
CREATE POLICY "Users can view own or admin all psychologists"
  ON public.psychologists FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can insert psychologists" ON public.psychologists;
CREATE POLICY "Authenticated users can insert psychologists"
  ON public.psychologists FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update psychologists" ON public.psychologists;
CREATE POLICY "Authenticated users can update psychologists"
  ON public.psychologists FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete psychologists" ON public.psychologists;
CREATE POLICY "Authenticated users can delete psychologists"
  ON public.psychologists FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- documents
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios documentos" ON public.documents;
CREATE POLICY "Los usuarios pueden ver sus propios documentos"
  ON public.documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden subir sus propios documentos" ON public.documents;
CREATE POLICY "Los usuarios pueden subir sus propios documentos"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propios documentos" ON public.documents;
CREATE POLICY "Los usuarios pueden eliminar sus propios documentos"
  ON public.documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
CREATE POLICY "Users can view roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
CREATE POLICY "Admins can insert user_roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update user_roles" ON public.user_roles;
CREATE POLICY "Admins can update user_roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete user_roles" ON public.user_roles;
CREATE POLICY "Admins can delete user_roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- user_module_permissions
DROP POLICY IF EXISTS "Admins can select permissions" ON public.user_module_permissions;
CREATE POLICY "Admins can select permissions"
  ON public.user_module_permissions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert permissions" ON public.user_module_permissions;
CREATE POLICY "Admins can insert permissions"
  ON public.user_module_permissions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete permissions" ON public.user_module_permissions;
CREATE POLICY "Admins can delete permissions"
  ON public.user_module_permissions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
