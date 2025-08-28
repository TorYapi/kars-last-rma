
-- Profiles tablosuna isim ve soyisim kolonları ekle
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Orders tablosuna onaylayan admin bilgisi için yeni kolon ekle (zaten var ama kontrol edelim)
-- Bu kolon zaten mevcut, sadece kontrol amaçlı

-- Profil bilgilerini güncellemek için fonksiyonu da güncelleyelim
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'ugurcan-231@hotmail.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;
