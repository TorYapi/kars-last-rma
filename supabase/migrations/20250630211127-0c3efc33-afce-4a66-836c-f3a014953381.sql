
-- orders tablosuna billing_info sütunu ekle
ALTER TABLE public.orders 
ADD COLUMN billing_info JSONB;
