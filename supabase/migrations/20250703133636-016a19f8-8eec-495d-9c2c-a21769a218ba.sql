
-- Admin email adresini tekrar admin rolüne güncelle
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE email = 'ugurcan-231@hotmail.com';

-- Ayrıca yeni kullanıcı kayıt fonksiyonunu da güncelleyelim
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
