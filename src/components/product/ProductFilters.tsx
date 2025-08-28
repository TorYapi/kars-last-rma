
import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedSupplier: string;
  setSelectedSupplier: (supplier: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  showTopCheapest: boolean;
  setShowTopCheapest: (show: boolean) => void;
  categories: string[];
  suppliers: string[];
}

const ProductFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedSupplier,
  setSelectedSupplier,
  sortBy,
  setSortBy,
  showTopCheapest,
  setShowTopCheapest,
  categories,
  suppliers
}: ProductFiltersProps) => {
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Arama sorgularını kaydet (debounced)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length > 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const { data: authData } = await supabase.auth.getUser();
          const userId = authData.user?.id || null;
          
          await supabase
            .from('search_queries')
            .insert({
              user_id: userId,
              query_text: searchTerm.trim(),
              results_count: 0 // Bu filteredProducts sayısıyla güncellenebilir
            });
        } catch (error) {
          console.log('Arama kaydedilemedi:', error);
        }
      }, 1000); // 1 saniye delay
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Arama</Label>
            <Input
              id="search"
              placeholder="Ürün adı veya stok kodu ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Label>Kategori</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.filter(category => category && category.trim() !== '').map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sıralama</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sıralama seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stokKodu">Stok Kodu</SelectItem>
                <SelectItem value="urunAdi">Ürün Adı</SelectItem>
                <SelectItem value="rafFiyatiKdvDahil-low">Fiyat (Düşük-Yüksek)</SelectItem>
                <SelectItem value="rafFiyatiKdvDahil-high">Fiyat (Yüksek-Düşük)</SelectItem>
                <SelectItem value="listeFiyatiKdvDahil-low">Liste Fiyatı (Düşük-Yüksek)</SelectItem>
                <SelectItem value="listeFiyatiKdvDahil-high">Liste Fiyatı (Yüksek-Düşük)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="top-cheapest"
              checked={showTopCheapest}
              onCheckedChange={setShowTopCheapest}
            />
            <Label htmlFor="top-cheapest">En Ucuz 5 Ürün</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductFilters;
