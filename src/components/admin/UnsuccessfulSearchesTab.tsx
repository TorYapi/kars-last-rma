import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface UnsuccessfulSearch {
  id: string;
  user_id: string | null;
  search_query: string;
  searched_at: string;
  user_email: string | null;
  user_name: string | null;
  is_resolved: boolean;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

const UnsuccessfulSearchesTab = () => {
  const [searches, setSearches] = useState<UnsuccessfulSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [editingNotes, setEditingNotes] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  useEffect(() => {
    loadUnsuccessfulSearches();
  }, [showResolved]);

  const loadUnsuccessfulSearches = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('unsuccessful_searches')
        .select('*')
        .order('searched_at', { ascending: false });

      if (!showResolved) {
        query = query.eq('is_resolved', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Sonuçsuz aramalar yüklenirken hata:', error);
        toast({
          title: "Hata!",
          description: "Sonuçsuz aramalar yüklenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      setSearches(data || []);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata!",
        description: "Beklenmeyen hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (searchId: string, isResolved: boolean) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const adminId = authData.user?.id;

      const updateData: any = {
        is_resolved: !isResolved,
      };

      if (!isResolved) {
        // Çözüldü olarak işaretle
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = adminId;
      } else {
        // Çözülmedi olarak işaretle
        updateData.resolved_at = null;
        updateData.resolved_by = null;
      }

      const { error } = await supabase
        .from('unsuccessful_searches')
        .update(updateData)
        .eq('id', searchId);

      if (error) {
        console.error('Durum güncellenirken hata:', error);
        toast({
          title: "Hata!",
          description: "Durum güncellenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı!",
        description: isResolved ? "Arama çözülmedi olarak işaretlendi." : "Arama çözüldü olarak işaretlendi.",
      });

      await loadUnsuccessfulSearches();
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata!",
        description: "Beklenmeyen hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const updateNotes = async (searchId: string) => {
    try {
      const notes = editingNotes[searchId] || '';

      const { error } = await supabase
        .from('unsuccessful_searches')
        .update({ admin_notes: notes })
        .eq('id', searchId);

      if (error) {
        console.error('Notlar güncellenirken hata:', error);
        toast({
          title: "Hata!",
          description: "Notlar güncellenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı!",
        description: "Admin notları güncellendi.",
      });

      // Editing state'ini temizle
      setEditingNotes(prev => {
        const newState = { ...prev };
        delete newState[searchId];
        return newState;
      });

      await loadUnsuccessfulSearches();
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata!",
        description: "Beklenmeyen hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleNotesChange = (searchId: string, notes: string) => {
    setEditingNotes(prev => ({
      ...prev,
      [searchId]: notes
    }));
  };

  const getUnresolvedCount = () => {
    return searches.filter(search => !search.is_resolved).length;
  };

  const getTopSearchQueries = () => {
    const queryCount = new Map<string, number>();
    searches.forEach(search => {
      const query = search.search_query.toLowerCase();
      queryCount.set(query, (queryCount.get(query) || 0) + 1);
    });
    
    return Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-pulse">Sonuçsuz aramalar yükleniyor...</div>
        </div>
      </div>
    );
  }

  const topQueries = getTopSearchQueries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Sonuçsuz Aramalar</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-resolved"
            checked={showResolved}
            onCheckedChange={setShowResolved}
          />
          <Label htmlFor="show-resolved">Çözülmüş aramaları göster</Label>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Çözülmemiş Aramalar</p>
                <p className="text-2xl font-bold text-red-600">{getUnresolvedCount()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Çözülmüş Aramalar</p>
                <p className="text-2xl font-bold text-green-600">
                  {searches.filter(search => search.is_resolved).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Search className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Arama</p>
                <p className="text-2xl font-bold text-blue-600">{searches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* En Çok Aranan Ürünler */}
      {topQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>En Çok Aranan (Bulunamayan) Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topQueries.map((item, index) => (
                <div key={item.query} className="text-center p-4 bg-gray-50 rounded-lg">
                  <Badge variant="outline" className="mb-2">#{index + 1}</Badge>
                  <p className="font-medium text-sm">{item.query}</p>
                  <p className="text-xs text-gray-600">{item.count} kez arandı</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sonuçsuz Aramalar Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sonuçsuz Aramalar ({searches.length})</span>
            <Button onClick={loadUnsuccessfulSearches} variant="outline" size="sm">
              Yenile
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arama Sorgusu</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Admin Notları</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searches.map((search) => (
                <TableRow key={search.id}>
                  <TableCell>
                    <div className="font-medium">{search.search_query}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {search.user_name && (
                        <div className="font-medium">{search.user_name}</div>
                      )}
                      {search.user_email && (
                        <div className="text-gray-600">{search.user_email}</div>
                      )}
                      {!search.user_name && !search.user_email && (
                        <div className="text-gray-500 italic">Anonim kullanıcı</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(search.searched_at).toLocaleString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={search.is_resolved ? "default" : "destructive"}
                      className="flex items-center space-x-1"
                    >
                      {search.is_resolved ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>{search.is_resolved ? 'Çözüldü' : 'Çözülmedi'}</span>
                    </Badge>
                    {search.is_resolved && search.resolved_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(search.resolved_at).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Admin notları..."
                        value={editingNotes[search.id] !== undefined ? editingNotes[search.id] : (search.admin_notes || '')}
                        onChange={(e) => handleNotesChange(search.id, e.target.value)}
                        className="min-h-[80px]"
                      />
                      {editingNotes[search.id] !== undefined && (
                        <Button
                          size="sm"
                          onClick={() => updateNotes(search.id)}
                          className="w-full"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Kaydet
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={search.is_resolved ? "outline" : "default"}
                      onClick={() => toggleResolved(search.id, search.is_resolved)}
                      className="w-full"
                    >
                      {search.is_resolved ? (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Çözülmedi İşaretle
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Çözüldü İşaretle
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {searches.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              {showResolved 
                ? "Henüz hiç sonuçsuz arama kaydı bulunmuyor." 
                : "Henüz çözülmemiş sonuçsuz arama bulunmuyor."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsuccessfulSearchesTab;