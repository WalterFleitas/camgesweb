-- Add missing columns to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS oficio_number text,
ADD COLUMN IF NOT EXISTS cantidad_copias integer;