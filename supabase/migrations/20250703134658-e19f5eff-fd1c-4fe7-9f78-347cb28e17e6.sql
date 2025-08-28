
-- Yasaklı kelimeler ve firmalar için tablo oluştur
CREATE TABLE public.restricted_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('keyword', 'company', 'product')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- RLS politikaları ekle
ALTER TABLE public.restricted_terms ENABLE ROW LEVEL SECURITY;

-- Sadece adminler yasaklı terimleri yönetebilir
CREATE POLICY "Only admins can manage restricted terms" ON public.restricted_terms
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ));

-- Herkesi yasaklı terimları okuyabilir (filtreleme için gerekli)
CREATE POLICY "Everyone can read restricted terms" ON public.restricted_terms
  FOR SELECT 
  USING (true);
