
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/types/product';
import { ProductVariant, isProductVariant } from '@/utils/productVariants';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ProductCardProps {
  product: Product | ProductVariant;
  onAddToCart: (product: Product, selectedVariant?: string) => void;
  onCompare: (product: Product) => void;
  isInComparison: boolean;
}

const ProductCard = ({ product, onAddToCart, onCompare, isInComparison }: ProductCardProps) => {
  const { toast } = useToast();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [imageError, setImageError] = useState(false);

  // Determine if this is a variant product or single product
  const isVariant = isProductVariant(product);
  const displayProduct = isVariant ? product.variants[selectedVariantIndex] : product;
  const baseProduct = isVariant ? product.baseProduct : product;

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'TL':
      default:
        return '₺';
    }
  };

  const handleAddToCart = () => {
    const selectedVariant = isVariant ? product.variantOptions[selectedVariantIndex] : undefined;
    
    console.log('🛒 ProductCard - Adding to cart:', {
      productName: displayProduct.urunAdi,
      stockCode: displayProduct.stokKodu,
      selectedVariant,
      isVariant
    });
    
    onAddToCart(displayProduct, selectedVariant);
  };

  const handleVariantChange = (value: string) => {
    const index = parseInt(value);
    setSelectedVariantIndex(index);
    console.log('🔄 Variant changed to index:', index, 'variant:', isVariant ? product.variantOptions[index] : 'none');
  };

  const currencySymbol = getCurrencySymbol(displayProduct.currency);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Product Image */}
          {displayProduct.image_url && !imageError ? (
            <div className="bg-muted rounded-lg overflow-hidden">
              <img
                src={displayProduct.image_url}
                alt={baseProduct.urunAdi}
                className="w-full h-auto object-contain bg-white transition-transform duration-300 hover:scale-105"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 h-48">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 mb-2 bg-muted-foreground/10 rounded-lg flex items-center justify-center">
                  📷
                </div>
                <p className="text-sm text-muted-foreground">Resim yok</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-start">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {displayProduct.firma}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {displayProduct.birim}
            </Badge>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
              {baseProduct.urunAdi}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Stok Kodu:</span> {displayProduct.stokKodu}
            </p>
          </div>

          {/* Variant Selection */}
          {isVariant && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Seçenek:
              </label>
              <Select value={selectedVariantIndex.toString()} onValueChange={handleVariantChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {product.variantOptions.map((option, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Raf Fiyatı (KDV Dahil):</span>
              <span className="font-medium">
                {currencySymbol}{displayProduct.rafFiyatiKdvDahil.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Liste Fiyatı (KDV Dahil):</span>
              <span className="font-semibold text-lg text-green-600">
                {currencySymbol}{displayProduct.listeFiyatiKdvDahil.toFixed(2)}
              </span>
            </div>
          </div>

          {(displayProduct.indirim5 > 0 || displayProduct.indirim10 > 0 || displayProduct.indirim15 > 0) && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">İndirimli Fiyatlar:</p>
              <div className="space-y-1">
                {displayProduct.indirim5 > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>%5 İndirim:</span>
                    <span className="text-green-600 font-medium">
                      {currencySymbol}{displayProduct.indirim5.toFixed(2)}
                    </span>
                  </div>
                )}
                {displayProduct.indirim10 > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>%10 İndirim:</span>
                    <span className="text-green-600 font-medium">
                      {currencySymbol}{displayProduct.indirim10.toFixed(2)}
                    </span>
                  </div>
                )}
                {displayProduct.indirim15 > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>%15 İndirim:</span>
                    <span className="text-green-600 font-medium">
                      {currencySymbol}{displayProduct.indirim15.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Sepete Ekle
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ürün Detayları</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Product Image in Dialog */}
                  {displayProduct.image_url && !imageError && (
                    <div className="bg-muted rounded-lg overflow-hidden">
                      <img
                        src={displayProduct.image_url}
                        alt={baseProduct.urunAdi}
                        className="w-full h-auto object-contain bg-white"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Ürün Adı</p>
                      <p className="font-medium">{displayProduct.urunAdi}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Stok Kodu</p>
                      <p className="font-medium">{displayProduct.stokKodu}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Firma</p>
                      <p className="font-medium">{displayProduct.firma}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Birim</p>
                      <p className="font-medium">{displayProduct.birim}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">KDV Oranı</p>
                      <p className="font-medium">%{displayProduct.kdv}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Alış İskonto Oranı</p>
                      <p className="font-medium">%{displayProduct.alisIskontoOrani}</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant={isInComparison ? "secondary" : "outline"}
              onClick={() => onCompare(displayProduct)}
              size="icon"
              title={isInComparison ? "Karşılaştırmadan Çıkar" : "Karşılaştırmaya Ekle"}
            >
              ⚖️
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
