
import { useState } from 'react';
import { Product } from '@/types/product';

export const useProductComparison = () => {
  const [compareList, setCompareList] = useState<Product[]>([]);

  const toggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.stokKodu === product.stokKodu);
      if (exists) {
        return prev.filter(p => p.stokKodu !== product.stokKodu);
      } else if (prev.length < 3) {
        return [...prev, product];
      }
      return prev;
    });
  };

  const isInCompareList = (product: Product) => 
    compareList.some(p => p.stokKodu === product.stokKodu);

  const clearCompareList = () => setCompareList([]);

  return {
    compareList,
    toggleCompare,
    isInCompareList,
    clearCompareList
  };
};
