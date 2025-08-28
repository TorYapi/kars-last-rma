
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileFormProps {
  onProfileUpdate?: () => void;
}

const ProfileForm = ({ onProfileUpdate }: ProfileFormProps) => {
  const { user, profile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profil güncelleme hatası:', error);
        toast({
          title: "Hata!",
          description: "Profil güncellenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı!",
        description: "Profiliniz güncellendi."
      });

      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      toast({
        title: "Hata!",
        description: "Profil güncellenirken hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Profil Bilgileri</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName">Ad</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Adınızı girin"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Soyad</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Soyadınızı girin"
            />
          </div>
          <div>
            <Label>E-posta</Label>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-100"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Güncelleniyor...' : 'Profili Güncelle'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
