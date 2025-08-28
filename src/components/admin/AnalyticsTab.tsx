import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, ShoppingCart, TrendingUp } from 'lucide-react';

interface SearchAnalytics {
  query: string;
  count: number;
  words: string[];
}

interface ProductAnalytics {
  productName: string;
  company: string;
  orderCount: number;
  totalQuantity: number;
  totalRevenue: number;
}

interface WordFrequency {
  word: string;
  count: number;
}

const AnalyticsTab = () => {
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics[]>([]);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([]);
  const [wordFrequency, setWordFrequency] = useState<WordFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSearchAnalytics(),
        loadProductAnalytics()
      ]);
    } catch (error) {
      console.error('Analytics yüklenirken hata:', error);
      toast({
        title: "Hata!",
        description: "Analytics verileri yüklenirken hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSearchAnalytics = async () => {
    const { data: searchData, error } = await supabase
      .from('search_queries')
      .select('query_text')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Arama verileri yüklenirken hata:', error);
      return;
    }

    // Arama sorgularını grupla ve frekanslarını hesapla
    const queryMap = new Map<string, number>();
    const allWords: string[] = [];

    searchData?.forEach(item => {
      const query = item.query_text.toLowerCase().trim();
      queryMap.set(query, (queryMap.get(query) || 0) + 1);
      
      // Kelimeleri ayır ve temizle
      const words = query
        .split(/\s+/)
        .map(word => word.replace(/[^\w\sğüşıöç]/gi, ''))
        .filter(word => word.length > 2); // 2 karakterden uzun kelimeler
      
      allWords.push(...words);
    });

    // En çok aranan sorguları al
    const sortedQueries = Array.from(queryMap.entries())
      .map(([query, count]) => ({
        query,
        count,
        words: query.split(/\s+/).filter(word => word.length > 2)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Kelime frekanslarını hesapla
    const wordMap = new Map<string, number>();
    allWords.forEach(word => {
      wordMap.set(word, (wordMap.get(word) || 0) + 1);
    });

    const sortedWords = Array.from(wordMap.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    setSearchAnalytics(sortedQueries);
    setWordFrequency(sortedWords);
  };

  const loadProductAnalytics = async () => {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('order_data, status, total_amount')
      .eq('status', 'approved');

    if (error) {
      console.error('Sipariş verileri yüklenirken hata:', error);
      return;
    }

    // Ürün bazında analiz
    const productMap = new Map<string, {
      productName: string;
      company: string;
      orderCount: number;
      totalQuantity: number;
      totalRevenue: number;
    }>();

    ordersData?.forEach(order => {
      if (Array.isArray(order.order_data)) {
        order.order_data.forEach((item: any) => {
          const key = `${item.stokKodu}-${item.firma}`;
          const existing = productMap.get(key) || {
            productName: item.urunAdi || 'Bilinmeyen Ürün',
            company: item.firma || 'Bilinmeyen Firma',
            orderCount: 0,
            totalQuantity: 0,
            totalRevenue: 0
          };

          productMap.set(key, {
            ...existing,
            orderCount: existing.orderCount + 1,
            totalQuantity: existing.totalQuantity + (item.quantity || 0),
            totalRevenue: existing.totalRevenue + (item.total || 0)
          });
        });
      }
    });

    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 15);

    setProductAnalytics(sortedProducts);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-pulse">Analytics yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      </div>

      {/* Arama Kelime Analizi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>En Çok Aranan Kelimeler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {wordFrequency.map((item, index) => (
                <div key={item.word} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{item.word}</span>
                  </div>
                  <Badge>{item.count} kez</Badge>
                </div>
              ))}
            </div>
            {wordFrequency.length === 0 && (
              <p className="text-gray-500 text-center py-4">Henüz arama verisi bulunmuyor.</p>
            )}
          </CardContent>
        </Card>

        {/* Kelime Frekans Grafiği */}
        <Card>
          <CardHeader>
            <CardTitle>Kelime Frekans Grafiği</CardTitle>
          </CardHeader>
          <CardContent>
            {wordFrequency.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wordFrequency.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="word" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Görüntülenecek veri bulunmuyor
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* En Çok Aranan Sorgular */}
      <Card>
        <CardHeader>
          <CardTitle>En Çok Yapılan Aramalar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sıra</TableHead>
                <TableHead>Arama Sorgusu</TableHead>
                <TableHead>Arama Sayısı</TableHead>
                <TableHead>Kelimeler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchAnalytics.map((item, index) => (
                <TableRow key={item.query}>
                  <TableCell>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.query}</TableCell>
                  <TableCell>
                    <Badge>{item.count} kez</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.words.map((word, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {searchAnalytics.length === 0 && (
            <p className="text-gray-500 text-center py-4">Henüz arama verisi bulunmuyor.</p>
          )}
        </CardContent>
      </Card>

      {/* En Çok Sipariş Edilen Ürünler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>En Çok Sipariş Edilen Ürünler</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sıra</TableHead>
                <TableHead>Ürün Adı</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Sipariş Sayısı</TableHead>
                <TableHead>Toplam Miktar</TableHead>
                <TableHead>Toplam Gelir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productAnalytics.map((item, index) => (
                <TableRow key={`${item.productName}-${item.company}`}>
                  <TableCell>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.company}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{item.orderCount} sipariş</Badge>
                  </TableCell>
                  <TableCell>{item.totalQuantity} adet</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    ${item.totalRevenue.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {productAnalytics.length === 0 && (
            <p className="text-gray-500 text-center py-4">Henüz sipariş verisi bulunmuyor.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;