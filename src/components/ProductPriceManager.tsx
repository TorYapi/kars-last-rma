
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Search, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';

interface Product {
  id: string;
  stok_kodu: string;
  firma: string | null;
  urun_adi: string | null;
  birim: string | null;
  raf_fiyati_kdv_dahil: number | null;
  liste_fiyati_kdv_dahil: number | null;
  indirim_5: number | null;
  indirim_10: number | null;
  indirim_15: number | null;
  currency: string | null;
}

interface PriceUpdateForm {
  raf_fiyati_kdv_dahil: number;
  liste_fiyati_kdv_dahil: number;
  indirim_5: number;
  indirim_10: number;
  indirim_15: number;
}

const ProductPriceManager: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<PriceUpdateForm>();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('stok_kodu');

      if (error) {
        console.error('Ürünler yüklenirken hata:', error);
        toast({
          title: "Hata!",
          description: "Ürünler yüklenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (err) {
      console.error('Ürün yükleme hatası:', err);
      toast({
        title: "Hata!",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => 
      product.stok_kodu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.urun_adi && product.urun_adi.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.firma && product.firma.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    form.reset({
      raf_fiyati_kdv_dahil: product.raf_fiyati_kdv_dahil || 0,
      liste_fiyati_kdv_dahil: product.liste_fiyati_kdv_dahil || 0,
      indirim_5: product.indirim_5 || 0,
      indirim_10: product.indirim_10 || 0,
      indirim_15: product.indirim_15 || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async (data: PriceUpdateForm) => {
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          raf_fiyati_kdv_dahil: data.raf_fiyati_kdv_dahil,
          liste_fiyati_kdv_dahil: data.liste_fiyati_kdv_dahil,
          indirim_5: data.indirim_5,
          indirim_10: data.indirim_10,
          indirim_15: data.indirim_15,
        })
        .eq('id', selectedProduct.id);

      if (error) {
        console.error('Ürün güncelleme hatası:', error);
        toast({
          title: "Hata!",
          description: "Ürün güncellenirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı!",
        description: "Ürün fiyatları başarıyla güncellendi.",
      });

      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      loadProducts(); // Verileri yenile
    } catch (err) {
      console.error('Güncelleme hatası:', err);
      toast({
        title: "Hata!",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`${product.stok_kodu} kodlu ürünü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) {
        console.error('Ürün silme hatası:', error);
        toast({
          title: "Hata!",
          description: "Ürün silinirken hata oluştu.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı!",
        description: "Ürün başarıyla silindi.",
      });

      loadProducts(); // Verileri yenile
    } catch (err) {
      console.error('Silme hatası:', err);
      toast({
        title: "Hata!",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string | null): string => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'TL': return '₺';
      default: return '$';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Ürün Fiyat Yönetimi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Stok kodu, ürün adı veya firma ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={loadProducts} disabled={loading}>
            {loading ? 'Yükleniyor...' : 'Yenile'}
          </Button>
        </div>

        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stok Kodu</TableHead>
                <TableHead>Ürün Adı</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Raf Fiyatı</TableHead>
                <TableHead>Liste Fiyatı</TableHead>
                <TableHead>%5 İndirim</TableHead>
                <TableHead>%10 İndirim</TableHead>
                <TableHead>%15 İndirim</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.stok_kodu}</TableCell>
                  <TableCell>{product.urun_adi || '-'}</TableCell>
                  <TableCell>{product.firma || '-'}</TableCell>
                  <TableCell>
                    {getCurrencySymbol(product.currency)}{product.raf_fiyati_kdv_dahil?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    {getCurrencySymbol(product.currency)}{product.liste_fiyati_kdv_dahil?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    {getCurrencySymbol(product.currency)}{product.indirim_5?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    {getCurrencySymbol(product.currency)}{product.indirim_10?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    {getCurrencySymbol(product.currency)}{product.indirim_15?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProduct(product)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Aramanızla eşleşen ürün bulunamadı.' : 'Henüz ürün bulunmuyor.'}
            </div>
          )}
        </div>

        {/* Düzenleme Dialog'u */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ürün Fiyatlarını Düzenle</DialogTitle>
            </DialogHeader>
            
            {selectedProduct && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdateProduct)} className="space-y-4">
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium">{selectedProduct.stok_kodu}</p>
                    <p className="text-sm text-gray-600">{selectedProduct.urun_adi}</p>
                    <p className="text-xs text-gray-500">{selectedProduct.firma}</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="raf_fiyati_kdv_dahil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Raf Fiyatı KDV Dahil</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="liste_fiyati_kdv_dahil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Liste Fiyatı KDV Dahil</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="indirim_5"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>%5 İndirim Fiyatı</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="indirim_10"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>%10 İndirim Fiyatı</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="indirim_15"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>%15 İndirim Fiyatı</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      İptal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProductPriceManager;
