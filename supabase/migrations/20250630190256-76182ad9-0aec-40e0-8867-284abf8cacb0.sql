
-- Products tablosunu oluştur
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stok_kodu TEXT NOT NULL,
  firma TEXT,
  urun_adi TEXT,
  birim TEXT,
  raf_fiyati_kdv_dahil DECIMAL(10,2),
  alis_iskonto_orani DECIMAL(5,2),
  liste_fiyati_kdv_dahil DECIMAL(10,2),
  indirim_5 DECIMAL(10,2),
  indirim_10 DECIMAL(10,2),
  indirim_15 DECIMAL(10,2),
  kdv DECIMAL(5,2),
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'TL')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performans için indeksler oluştur
CREATE INDEX idx_products_stok_kodu ON public.products(stok_kodu);
CREATE INDEX idx_products_firma ON public.products(firma);
CREATE INDEX idx_products_urun_adi ON public.products(urun_adi);

-- Güncelleme trigger'ı ekle
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security etkinleştir - herkes okuyabilir ve yazabilir (public app için)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Herkes ürünleri görebilir ve yönetebilir
CREATE POLICY "Herkes ürünleri yönetebilir" ON public.products
FOR ALL USING (true) WITH CHECK (true);
