import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Session ID oluşturmak için yardımcı fonksiyon
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Kullanıcı aktivitelerini takip eden hook
export const useUserActivity = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>(generateSessionId());
  const sessionStartRef = useRef<Date>(new Date());
  const pageViewCountRef = useRef<number>(0);
  const actionCountRef = useRef<number>(0);

  // Sayfa değişikliklerini takip et
  const trackPageView = (pageUrl: string) => {
    if (!user) return;

    pageViewCountRef.current += 1;
    
    // Aktiviteyi kaydet
    trackActivity('page_view', { page_url: pageUrl });
    
    // Session bilgilerini güncelle
    updateSession();
  };

  // Kullanıcı eylemlerini takip et
  const trackAction = (actionType: string, data?: any) => {
    if (!user) return;

    actionCountRef.current += 1;
    
    // Aktiviteyi kaydet
    trackActivity(actionType, data);
    
    // Session bilgilerini güncelle
    updateSession();
  };

  // Genel aktivite kaydetme fonksiyonu
  const trackActivity = async (activityType: string, data?: any) => {
    if (!user) return;

    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          page_url: data?.page_url || window.location.pathname,
          session_id: sessionIdRef.current,
          user_agent: navigator.userAgent,
        });
    } catch (error) {
      console.log('Aktivite kaydedilemedi:', error);
    }
  };

  // Session bilgilerini güncelle - yeni upsert fonksiyonunu kullan
  const updateSession = async () => {
    if (!user) return;

    try {
      // Yeni upsert fonksiyonunu kullan
      await supabase.rpc('upsert_user_session', {
        p_user_id: user.id,
        p_session_id: sessionIdRef.current,
        p_page_views: pageViewCountRef.current,
        p_actions_count: actionCountRef.current
      });
    } catch (error) {
      console.log('Session güncellenemedi:', error);
    }
  };

  // Component mount edildiğinde login aktivitesi kaydet
  useEffect(() => {
    if (user) {
      trackActivity('login');
      trackPageView(window.location.pathname);
    }
  }, [user]);

  // Sayfa değişimlerini dinle
  useEffect(() => {
    const handlePathChange = () => {
      trackPageView(window.location.pathname);
    };

    // popstate event'ini dinle (browser back/forward)
    window.addEventListener('popstate', handlePathChange);

    return () => {
      window.removeEventListener('popstate', handlePathChange);
    };
  }, [user]);

  // Sayfa kapatılırken session'ı sonlandır
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        trackActivity('logout');
        updateSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // Session'ı periyodik olarak güncelle (her 30 saniyede bir)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updateSession();
    }, 30000); // 30 saniye

    return () => clearInterval(interval);
  }, [user]);

  return {
    trackPageView,
    trackAction,
    sessionId: sessionIdRef.current
  };
};

export default useUserActivity;