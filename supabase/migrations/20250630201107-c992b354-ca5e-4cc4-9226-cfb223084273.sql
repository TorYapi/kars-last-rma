
-- Mevcut kullanıcının rolünü admin olarak güncelle
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE email = 'ugurcan-231@hotmail.com';
