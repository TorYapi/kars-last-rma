
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { Product } from '@/types/product';

interface ProductCompareBarProps {
  compareList: Product[];
  onClearAll: () => void;
}

const ProductCompareBar = ({ compareList, onClearAll }: ProductCompareBarProps) => {
  if (compareList.length === 0) return null;

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              Ürün Karşılaştır ({compareList.length}/3)
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClearAll}
          >
            Tümünü Temizle
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {compareList.map(product => (
            <Badge key={product.stokKodu} variant="secondary" className="bg-blue-100">
              {product.urunAdi} - ₺{product.rafFiyatiKdvDahil.toFixed(2)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCompareBar;
