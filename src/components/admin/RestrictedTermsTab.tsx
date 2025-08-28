
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RestrictedTerm {
  id: string;
  term: string;
  type: 'keyword' | 'company' | 'product';
  description?: string;
  created_at: string;
  created_by: string;
}

const RestrictedTermsTab = () => {
  const { toast } = useToast();
  const [terms, setTerms] = useState<RestrictedTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTerm, setNewTerm] = useState({
    term: '',
    type: 'keyword' as 'keyword' | 'company' | 'product',
    description: ''
  });

  const loadTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('restricted_terms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Yasaklı terimler yüklenirken hata:', error);
        toast({
          title: "Hata",
          description: "Yasaklı terimler yüklenemedi.",
          variant: "destructive"
        });
        return;
      }

      // Type assertion to ensure proper typing
      const typedData = (data || []).map(item => ({
        ...item,
        type: item.type as 'keyword' | 'company' | 'product'
      }));
      
      setTerms(typedData);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const handleAddTerm = async () => {
    if (!newTerm.term.trim()) {
      toast({
        title: "Hata",
        description: "Terim boş olamaz.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Hata",
          description: "Kullanıcı oturumu bulunamadı.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('restricted_terms')
        .insert({
          term: newTerm.term.trim(),
          type: newTerm.type,
          description: newTerm.description.trim() || null,
          created_by: user.id
        });

      if (error) {
        console.error('Terim ekleme hatası:', error);
        toast({
          title: "Hata",
          description: "Terim eklenemedi.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı",
        description: "Yasaklı terim eklendi."
      });

      setNewTerm({ term: '', type: 'keyword', description: '' });
      loadTerms();
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    try {
      const { error } = await supabase
        .from('restricted_terms')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Terim silme hatası:', error);
        toast({
          title: "Hata",
          description: "Terim silinemedi.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı",
        description: "Yasaklı terim silindi."
      });

      loadTerms();
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'keyword': return 'Kelime';
      case 'company': return 'Firma';
      case 'product': return 'Ürün';
      default: return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'keyword': return 'default';
      case 'company': return 'secondary';
      case 'product': return 'outline';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Yasaklı terimler yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Yasaklı Terim Ekle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="term">Terim</Label>
              <Input
                id="term"
                value={newTerm.term}
                onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                placeholder="Yasaklanacak kelime/firma/ürün adı"
              />
            </div>
            <div>
              <Label htmlFor="type">Tür</Label>
              <Select value={newTerm.type} onValueChange={(value: 'keyword' | 'company' | 'product') => setNewTerm({ ...newTerm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Kelime</SelectItem>
                  <SelectItem value="company">Firma</SelectItem>
                  <SelectItem value="product">Ürün</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
            <Textarea
              id="description"
              value={newTerm.description}
              onChange={(e) => setNewTerm({ ...newTerm, description: e.target.value })}
              placeholder="Bu terimin neden yasaklandığına dair açıklama"
              rows={3}
            />
          </div>
          <Button onClick={handleAddTerm} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Terim Ekle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yasaklı Terimler ({terms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {terms.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Henüz yasaklı terim bulunmuyor.</p>
          ) : (
            <div className="space-y-4">
              {terms.map((term) => (
                <div key={term.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{term.term}</span>
                      <Badge variant={getTypeBadgeVariant(term.type)}>
                        {getTypeLabel(term.type)}
                      </Badge>
                    </div>
                    {term.description && (
                      <p className="text-sm text-gray-600">{term.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Ekleme tarihi: {new Date(term.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTerm(term.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RestrictedTermsTab;
