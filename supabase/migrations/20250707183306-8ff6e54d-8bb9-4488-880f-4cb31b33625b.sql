-- Kullanıcı aktivitelerini takip etmek için tablo oluştur
CREATE TABLE public.user_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'page_view', 'search', 'add_to_cart', 'order_create'
  page_url TEXT,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User activities tablosu için RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Herkes kendi aktivitesini kaydedebilir
CREATE POLICY "Users can insert their own activities" 
ON public.user_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Sadmin aktiviteleri görüntüleyebilir
CREATE POLICY "Only admins can view user activities" 
ON public.user_activities 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Performance için indeksler
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at);
CREATE INDEX idx_user_activities_activity_type ON public.user_activities(activity_type);
CREATE INDEX idx_user_activities_session_id ON public.user_activities(session_id);

-- Kullanıcı oturumlarını takip etmek için tablo
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  page_views INTEGER DEFAULT 0,
  actions_count INTEGER DEFAULT 0
);

-- User sessions tablosu için RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Herkes kendi oturumunu yönetebilir
CREATE POLICY "Users can manage their own sessions" 
ON public.user_sessions 
FOR ALL 
USING (auth.uid() = user_id OR auth.uid() IS NULL)
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Sadece adminler tüm oturumları görüntüleyebilir
CREATE POLICY "Only admins can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Performance için indeksler
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at);