
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProductFilters from '@/components/product/ProductFilters';
import ProductCompareBar from '@/components/product/ProductCompareBar';
import ProductCard from '@/components/product/ProductCard';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useProductComparison } from '@/hooks/useProductComparison';
import { Product } from '@/types/product';
import { addToCart } from '@/utils/cartUtils';
import { detectProductVariants, isProductVariant } from '@/utils/productVariants';
import { findSimilarProductNames } from '@/utils/searchSuggestions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, MessageCircle, Phone } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductList = ({ products, onAddToCart }: ProductListProps) => {
  console.log('🔧 ProductList render - products count:', products.length);
  const { toast } = useToast();
  const { user } = useAuth();

  const {
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
    suppliers,
    filteredProducts
  } = useProductFilters(products);

  console.log('🔧 Filtered products count:', filteredProducts.length);

  // Detect and group product variants
  const productsWithVariants = detectProductVariants(filteredProducts);
  console.log('🔧 Products with variants count:', productsWithVariants.length);

  const {
    compareList,
    toggleCompare,
    isInCompareList,
    clearCompareList
  } = useProductComparison();

  // Sonuçsuz aramayı kaydet
  const recordUnsuccessfulSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) return;

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || null;
      
      // Kullanıcı bilgilerini al
      let userName = null;
      let userEmail = null;
      
      if (userId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', userId)
          .maybeSingle();
          
        if (profileData) {
          userName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
          userEmail = profileData.email;
        }
      }

      await supabase
        .from('unsuccessful_searches')
        .insert({
          user_id: userId,
          search_query: query.trim(),
          user_email: userEmail,
          user_name: userName || null
        });
        
      console.log('Sonuçsuz arama kaydedildi:', query);
    } catch (error) {
      console.log('Sonuçsuz arama kaydedilemedi:', error);
    }
  };

  // Sonuçsuz arama kontrolü - arama yapıldığında ve sonuç boşsa kaydet
  useEffect(() => {
    if (searchTerm.trim().length > 2 && productsWithVariants.length === 0 && products.length > 0) {
      const timer = setTimeout(() => {
        recordUnsuccessfulSearch(searchTerm);
      }, 2000); // 2 saniye bekle, kullanıcı yazmaya devam ediyorsa kaydetme
      
      return () => clearTimeout(timer);
    }
  }, [searchTerm, productsWithVariants.length, products.length]);

  // Eğer products array boşsa erken return
  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Henüz ürün bulunamadı. Lütfen önce ürün yükleyin.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddToCart = (product: Product, selectedVariant?: string) => {
    console.log('🛒 Adding to cart:', {
      productName: product.urunAdi,
      stockCode: product.stokKodu,
      price: product.listeFiyatiKdvDahil,
      variant: selectedVariant
    });
    
    // Create a unique identifier that includes the variant information
    const variantId = selectedVariant 
      ? `${product.stokKodu}-${selectedVariant.replace(/\s+/g, '-')}`
      : product.stokKodu;
    
    addToCart(product, 1, variantId);
    
    const variantText = selectedVariant ? ` (${selectedVariant})` : '';
    toast({
      title: "Ürün sepete eklendi",
      description: `${product.urunAdi}${variantText} sepetinize eklendi.`,
    });
    
    // Also call the parent callback for any additional logic
    onAddToCart(product, 1);
  };

  return (
    <div className="space-y-6">
      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSupplier={selectedSupplier}
        setSelectedSupplier={setSelectedSupplier}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showTopCheapest={showTopCheapest}
        setShowTopCheapest={setShowTopCheapest}
        categories={categories}
        suppliers={suppliers}
      />

      <ProductCompareBar
        compareList={compareList}
        onClearAll={clearCompareList}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productsWithVariants.map((productOrVariant, index) => {
          const displayProduct = isProductVariant(productOrVariant) 
            ? productOrVariant.baseProduct 
            : productOrVariant;
          
          console.log(`🎯 Rendering product ${index + 1}:`, displayProduct.stokKodu);
          
          return (
            <ProductCard
              key={`${displayProduct.stokKodu}-${index}`}
              product={productOrVariant}
              onAddToCart={handleAddToCart}
              onCompare={toggleCompare}
              isInComparison={isInCompareList(displayProduct)}
            />
          );
        })}
      </div>

      {productsWithVariants.length === 0 && products.length > 0 && searchTerm.trim().length > 0 && (() => {
        // "Bunu mu demek istediniz?" önerileri
        const allProductNames = products.map(p => p.urunAdi);
        const suggestions = findSimilarProductNames(searchTerm, allProductNames);
        
        return (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-12 text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <AlertTriangle className="h-16 w-16 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-orange-800 mb-2">
                    Aradığınız ürün bulunamadı!
                  </h3>
                  <p className="text-orange-700 mb-4">
                    "<strong>{searchTerm}</strong>" için arama sonucu bulunamadı.
                  </p>
                  
                  {suggestions.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-left max-w-md mx-auto mb-4">
                      <h4 className="font-medium text-blue-800 mb-2">Bunu mu demek istediniz?</h4>
                      <div className="space-y-1">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setSearchTerm(suggestion)}
                            className="block text-blue-600 hover:text-blue-800 hover:underline text-sm cursor-pointer text-left"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                <div className="bg-white rounded-lg p-4 border border-orange-200 text-left max-w-md mx-auto">
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Yöneticinle İletişime Geç</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Aradığınız ürün kataloğumuzda bulunmuyor. Yöneticimizle iletişime geçerek ürün talebinizi iletebilirsiniz.
                      </p>
                      
                      {suggestions.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-3">
                          <h5 className="font-medium text-blue-800 mb-2 text-sm">
                            "{searchTerm}" yerine bunlardan birini mi demek istediniz?
                          </h5>
                          <div className="space-y-1">
                            {suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => setSearchTerm(suggestion)}
                                className="block text-blue-600 hover:text-blue-800 hover:underline text-sm cursor-pointer text-left w-full"
                              >
                                • {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <Phone className="h-4 w-4" />
                        <span>İletişim için: <strong>admin@firma.com</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-orange-600 mt-4">
                  Bu arama talebi otomatik olarak yöneticiye iletilmiştir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })()}

      {productsWithVariants.length === 0 && products.length > 0 && searchTerm.trim().length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Kriterlere uyan ürün bulunamadı.</p>
            <p className="text-sm text-gray-400 mt-2">
              Toplam {products.length} ürün mevcut ancak filtreleme sonucu gösterilecek ürün yok.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-gray-500 text-center">
        {products.length} üründen {productsWithVariants.length} tanesi gösteriliyor
      </div>
    </div>
  );
};

export default ProductList;
