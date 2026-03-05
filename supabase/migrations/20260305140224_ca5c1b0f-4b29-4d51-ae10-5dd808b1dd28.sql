
-- Fix PUBLIC_DATA_EXPOSURE: Restrict sessions SELECT to owner or admin
-- Sessions contain sensitive legal case data that should not be visible to all users

DROP POLICY "Authenticated users can view sessions" ON public.sessions;
CREATE POLICY "Users can view own or admin all sessions"
ON public.sessions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Restrict victims SELECT to owner or admin
DROP POLICY "Authenticated users can view victims" ON public.victims;
CREATE POLICY "Users can view own or admin all victims"
ON public.victims FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Restrict judges SELECT to owner or admin
DROP POLICY "Authenticated users can view judges" ON public.judges;
CREATE POLICY "Users can view own or admin all judges"
ON public.judges FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Restrict psychologists SELECT to owner or admin
DROP POLICY "Authenticated users can view psychologists" ON public.psychologists;
CREATE POLICY "Users can view own or admin all psychologists"
ON public.psychologists FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
