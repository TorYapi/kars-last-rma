
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import ProductImageUpload from '@/components/product/ProductImageUpload';

const ProductImageManager = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Products loading error:', error);
        toast({
          title: "Hata",
          description: "Ürünler yüklenemedi.",
          variant: "destructive"
        });
        return;
      }

      const formattedProducts: Product[] = (data || [])
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
          image_url: item.image_url || undefined
        }));

      setProducts(formattedProducts);
      setFilteredProducts(formattedProducts);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.urunAdi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.stokKodu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.firma.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleImageUploaded = (productId: string, imageUrl: string) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.stokKodu === productId
          ? { ...product, image_url: imageUrl }
          : product
      )
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Ürünler yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ürün Resim Yönetimi ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Ürün adı, stok kodu veya firma ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={loadProducts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>

          {filteredProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchTerm ? 'Arama kriterlerine uygun ürün bulunamadı.' : 'Henüz ürün bulunmuyor.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.stokKodu} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                          {product.urunAdi}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{product.firma}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {product.stokKodu}
                          </Badge>
                        </div>
                      </div>

                      <ProductImageUpload
                        productId={product.stokKodu}
                        currentImageUrl={product.image_url}
                        onImageUploaded={(url) => handleImageUploaded(product.stokKodu, url)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductImageManager;
