
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import ExcelUpload from '@/components/ExcelUpload';
import ProductPriceManager from '@/components/ProductPriceManager';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

const Upload = () => {
  const { toast } = useToast();
  const [totalProductCount, setTotalProductCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadProductCount = async () => {
    setLoading(true);
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Supabase count hatası:', error);
        return;
      }

      setTotalProductCount(count || 0);
    } catch (err) {
      console.error('Ürün sayısı yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductCount();
  }, []);

  const handleProductsUploaded = (products: Product[]) => {
    toast({
      title: "Ürünler başarıyla yüklendi!",
      description: `${products.length} ürün Supabase'e kaydedildi.`,
    });
    
    // Toplam ürün sayısını güncelle
    loadProductCount();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ana Sayfaya Dön
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
              {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/products">
                <Button variant="outline">
                  Ürünleri Görüntüle ({totalProductCount})
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Excel Yükleme Bölümü */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Türkçe Excel Dosyası Yükleme ve Supabase Entegrasyonu
          </h2>
          <p className="text-gray-600 mb-6">
            Ürün kataloğunuzu Excel dosyasından yükleyin. Sistem tüm verileri otomatik olarak okuyacak ve Supabase veritabanına kaydedecektir.
          </p>
          <ExcelUpload onProductsUploaded={handleProductsUploaded} />
        </div>

        {/* Ürün Fiyat Yönetimi Bölümü */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Mevcut Ürün Fiyat Yönetimi
          </h2>
          <p className="text-gray-600 mb-6">
            Veritabanındaki ürünleri arayabilir, fiyatlarını güncelleyebilir veya silebilirsiniz.
          </p>
          <ProductPriceManager />
        </div>

        {/* Supabase Durumu */}
        <Card>
          <CardHeader>
            <CardTitle>Supabase Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-600">
                Supabase'de toplam ürün sayısı: <strong>{totalProductCount}</strong>
              </p>
              <Button variant="outline" size="sm" onClick={loadProductCount} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Güncelle
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Upload;
