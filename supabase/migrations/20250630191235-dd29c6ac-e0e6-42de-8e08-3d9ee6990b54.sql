
-- Currency sütununun var olup olmadığını kontrol et ve yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'TL'));
    END IF;
END $$;

-- Eğer trigger yoksa oluştur
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_products_updated_at'
    ) THEN
        CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON public.products
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- RLS policy'leri kontrol et ve yoksa oluştur
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'products' 
        AND policyname = 'Herkes ürünleri yönetebilir'
    ) THEN
        CREATE POLICY "Herkes ürünleri yönetebilir" ON public.products
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- RLS'yi etkinleştir
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
