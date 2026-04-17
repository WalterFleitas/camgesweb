
-- Courts: allow all authenticated users to view
DROP POLICY IF EXISTS "Users can view own or admin all courts" ON public.courts;
CREATE POLICY "Authenticated users can view all courts"
ON public.courts FOR SELECT
TO authenticated
USING (true);

-- Victims: allow all authenticated users to view
DROP POLICY IF EXISTS "Users can view own or admin all victims" ON public.victims;
CREATE POLICY "Authenticated users can view all victims"
ON public.victims FOR SELECT
TO authenticated
USING (true);

-- Judges: allow all authenticated users to view
DROP POLICY IF EXISTS "Users can view own or admin all judges" ON public.judges;
CREATE POLICY "Authenticated users can view all judges"
ON public.judges FOR SELECT
TO authenticated
USING (true);

-- Psychologists: allow all authenticated users to view
DROP POLICY IF EXISTS "Users can view own or admin all psychologists" ON public.psychologists;
CREATE POLICY "Authenticated users can view all psychologists"
ON public.psychologists FOR SELECT
TO authenticated
USING (true);
