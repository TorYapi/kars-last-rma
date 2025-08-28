-- Admin profillerinin herkese görünür olmasını sağla
CREATE POLICY "Admin profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (role = 'admin');