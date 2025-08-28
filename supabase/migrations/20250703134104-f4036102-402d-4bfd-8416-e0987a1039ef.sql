
-- Önce mevcut problematik RLS politikasını kaldıralım
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Güvenli bir security definer fonksiyon oluşturalım
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Yeni güvenli RLS politikası oluşturalım
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.get_current_user_role() = 'admin'
  );

-- Admin kullanıcının rolünü tekrar güncelle (emin olmak için)
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE email = 'ugurcan-231@hotmail.com';
