-- Crear bucket para documentos y archivos judiciales
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'judicial-documents',
  'judicial-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Crear tabla para metadata de documentos
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla documents
CREATE POLICY "Los usuarios pueden ver sus propios documentos"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden subir sus propios documentos"
ON public.documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios documentos"
ON public.documents FOR DELETE
USING (auth.uid() = user_id);

-- Políticas de Storage para el bucket
CREATE POLICY "Los usuarios pueden ver sus propios archivos"
ON storage.objects FOR SELECT
USING (bucket_id = 'judicial-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Los usuarios pueden subir sus propios archivos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'judicial-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Los usuarios pueden eliminar sus propios archivos"
ON storage.objects FOR DELETE
USING (bucket_id = 'judicial-documents' AND auth.uid()::text = (storage.foldername(name))[1]);