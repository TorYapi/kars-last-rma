-- Arama sorgularını takip etmek için tablo oluştur
CREATE TABLE public.search_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  query_text TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Search queries tablosu için RLS
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Herkes arama sorgusu kaydedebilir
CREATE POLICY "Anyone can insert search queries" 
ON public.search_queries 
FOR INSERT 
WITH CHECK (true);

-- Sadece adminler arama sorgularını görüntüleyebilir
CREATE POLICY "Only admins can view search queries" 
ON public.search_queries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- İndeksler performans için
CREATE INDEX idx_search_queries_created_at ON public.search_queries(created_at);
CREATE INDEX idx_search_queries_query_text ON public.search_queries(query_text);
CREATE INDEX idx_search_queries_user_id ON public.search_queries(user_id);