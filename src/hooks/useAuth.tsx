
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string | null;
  role: 'admin' | 'user';
  first_name: string | null;
  last_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile yükleme hatası:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Profile yükleme hatası:', error);
    }
  };

  useEffect(() => {
    // Auth state listener'ı kur
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Mevcut session'ı kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Safari için önce state'i temizle
      setSession(null);
      setUser(null);
      setProfile(null);
      
      const { error } = await supabase.auth.signOut();
      if (error && 
          error.message !== 'Session from session_id claim in JWT does not exist' &&
          error.message !== 'Auth session missing!') {
        console.error('Çıkış hatası:', error);
      }
      
      // Safari için kapsamlı storage temizleme
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Supabase storage anahtarlarını özellikle temizle
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('supabase') || key.startsWith('sb-')
        );
        supabaseKeys.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.log('Storage temizleme hatası:', e);
      }
      
      // Sayfa yenilemek yerine programatik yönlendirme (Safari için daha güvenli)
      window.location.href = '/';
      
    } catch (error) {
      console.error('Çıkış hatası:', error);
      // Hata olsa bile state'i temizle ve ana sayfaya yönlendir
      setSession(null);
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
