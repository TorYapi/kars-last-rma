
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductList from '@/components/ProductList';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

const Products = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    console.log('🔄 Loading products...');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Supabase response:', { 
        dataCount: data ? data.length : 0, 
        error: error ? error.message : null
      });

      if (error) {
        console.error('❌ Supabase error:', error);
        toast({
          title: "Veritabanı Hatası!",
          description: `Ürünler yüklenirken hata: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No data found');
        setProducts([]);
        toast({
          title: "Bilgi",
          description: "Henüz ürün bulunamadı. Lütfen önce ürün yükleyin.",
        });
        return;
      }

      console.log('✅ Raw data received:', data.length, 'records');

      // Format Supabase data to frontend format
      const formattedProducts: Product[] = data
        .filter((item) => {
          // En az ürün adı veya stok kodu dolu olmalı
          const hasValidName = item.urun_adi && item.urun_adi.trim() !== '';
          const hasValidStokKodu = item.stok_kodu && item.stok_kodu.trim() !== '';
          return hasValidName || hasValidStokKodu;
        })
        .map((item) => ({
          stokKodu: item.stok_kodu || '',
          firma: item.firma || '',
          urunAdi: item.urun_adi || '',
          birim: item.birim || 'ADET',
          rafFiyatiKdvDahil: Number(item.raf_fiyati_kdv_dahil) || 0,
          alisIskontoOrani: Number(item.alis_iskonto_orani) || 0,
          listeFiyatiKdvDahil: Number(item.liste_fiyati_kdv_dahil) || 0,
          indirim5: Number(item.indirim_5) || 0,
          indirim10: Number(item.indirim_10) || 0,
          indirim15: Number(item.indirim_15) || 0,
          kdv: Number(item.kdv) || 0,
          currency: item.currency || 'USD',
          image_url: item.image_url || undefined // Resim URL'sini ekle
        }));

      console.log('🎯 Formatted products:', formattedProducts.length);
      setProducts(formattedProducts);
      
      toast({
        title: "Başarılı!",
        description: `${formattedProducts.length} ürün başarıyla yüklendi.`,
      });
      
    } catch (err: any) {
      console.error('💥 Unexpected error:', err);
      toast({
        title: "Bağlantı Hatası!",
        description: `Supabase bağlantısında sorun: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Products component mounted');
    loadProducts();
  }, []);

  const handleAddToCart = (product: Product, quantity: number) => {
    console.log('🛒 Adding to cart:', product.stokKodu, quantity);
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const existingItem = existingCart.find((item: any) => item.stokKodu === product.stokKodu);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      existingCart.push({ ...product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    toast({
      title: "Sepete eklendi!",
      description: `${product.urunAdi} (${quantity} adet) sepetinize eklendi.`,
    });
  };

  console.log('🎨 Render - products:', products.length, 'loading:', loading);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="p-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ana Sayfaya Dön</span>
                </Button>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Ürünler</h1>
              {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Button variant="outline" onClick={loadProducts} disabled={loading} size="sm" className="p-2 sm:px-4">
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Yenile</span>
              </Button>
              <Link to="/cart">
                <Button variant="outline" size="sm" className="p-2 sm:px-4">
                  <span className="hidden sm:inline">Sepeti Görüntüle</span>
                  <span className="sm:hidden">Sepet</span>
                </Button>
              </Link>
              <Link to="/upload">
                <Button size="sm" className="p-2 sm:px-4">
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ürün Yükle</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Ürünler Supabase'den yükleniyor...</p>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Ürün Bulunamadı</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Henüz Supabase'de ürün bulunamadı. Ürün kataloğunuzu yükleyerek başlayın.
              </p>
              <Link to="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Ürün Yükle
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <p className="text-sm text-gray-600">
                Toplam <strong>{products.length}</strong> ürün Supabase'den yüklendi
              </p>
            </div>
            <ProductList products={products} onAddToCart={handleAddToCart} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;
