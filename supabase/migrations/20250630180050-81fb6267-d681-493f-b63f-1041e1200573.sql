
-- Ürünler tablosunu oluştur
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stok_kodu TEXT NOT NULL UNIQUE,
  firma TEXT NOT NULL,
  urun_adi TEXT NOT NULL,
  birim TEXT,
  raf_fiyati_kdv_dahil DECIMAL(10,2) DEFAULT 0,
  alis_iskonto_orani DECIMAL(5,2) DEFAULT 0,
  liste_fiyati_kdv_dahil DECIMAL(10,2) DEFAULT 0,
  indirim_5 DECIMAL(10,2) DEFAULT 0,
  indirim_10 DECIMAL(10,2) DEFAULT 0,
  indirim_15 DECIMAL(10,2) DEFAULT 0,
  kdv DECIMAL(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'TL')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performans için indeksler oluştur
CREATE INDEX idx_products_stok_kodu ON public.products(stok_kodu);
CREATE INDEX idx_products_firma ON public.products(firma);
CREATE INDEX idx_products_urun_adi ON public.products(urun_adi);

-- Otomatik updated_at güncellemesi için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE
ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) etkinleştir - herkes okuyabilir, sadmin ekleyebilir
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Herkes ürünleri görüntüleyebilir
CREATE POLICY "Herkes ürünleri görüntüleyebilir" ON public.products
FOR SELECT USING (true);

-- Herkes ürün ekleyebilir (gerekirse daha kısıtlayıcı yapabilirsiniz)
CREATE POLICY "Herkes ürün ekleyebilir" ON public.products
FOR INSERT WITH CHECK (true);

-- Herkes ürün güncelleyebilir (gerekirse daha kısıtlayıcı yapabilirsiniz)
CREATE POLICY "Herkes ürün güncelleyebilir" ON public.products
FOR UPDATE USING (true);

-- Herkes ürün silebilir (gerekirse daha kısıtlayıcı yapabilirsiniz)
CREATE POLICY "Herkes ürün silebilir" ON public.products
FOR DELETE USING (true);
