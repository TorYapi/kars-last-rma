-- Sonuçsuz aramaları takip etmek için tablo oluştur
CREATE TABLE public.unsuccessful_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  search_query TEXT NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_email TEXT,
  user_name TEXT,
  is_resolved BOOLEAN DEFAULT false,
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

-- Unsuccessful searches tablosu için RLS
ALTER TABLE public.unsuccessful_searches ENABLE ROW LEVEL SECURITY;

-- Herkes sonuçsuz arama kaydedebilir
CREATE POLICY "Anyone can insert unsuccessful searches" 
ON public.unsuccessful_searches 
FOR INSERT 
WITH CHECK (true);

-- Sadece adminler sonuçsuz aramaları görüntüleyebilir ve yönetebilir
CREATE POLICY "Only admins can view unsuccessful searches" 
ON public.unsuccessful_searches 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

CREATE POLICY "Only admins can update unsuccessful searches" 
ON public.unsuccessful_searches 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Performance için indeksler
CREATE INDEX idx_unsuccessful_searches_user_id ON public.unsuccessful_searches(user_id);
CREATE INDEX idx_unsuccessful_searches_searched_at ON public.unsuccessful_searches(searched_at);
CREATE INDEX idx_unsuccessful_searches_is_resolved ON public.unsuccessful_searches(is_resolved);
CREATE INDEX idx_unsuccessful_searches_search_query ON public.unsuccessful_searches(search_query);