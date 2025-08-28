
import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { enhancedTurkishSearch } from '@/utils/turkishSearch';

export const useProductFilters = (products: Product[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [sortBy, setSortBy] = useState('stokKodu');
  const [showTopCheapest, setShowTopCheapest] = useState(false);
  const [restrictedTerms, setRestrictedTerms] = useState<string[]>([]);

  // Yasaklı terimleri yükle
  useEffect(() => {
    const loadRestrictedTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('restricted_terms')
          .select('term, type');

        if (error) {
          console.error('Yasaklı terimler yüklenirken hata:', error);
          return;
        }

        const terms = (data || []).map(item => item.term.toLowerCase());
        setRestrictedTerms(terms);
      } catch (error) {
        console.error('Yasaklı terimler yüklenirken beklenmeyen hata:', error);
      }
    };

    loadRestrictedTerms();
  }, []);

  // Get unique categories and suppliers, filtering out empty strings and restricted terms
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.firma).filter(firma => firma && firma.trim() !== ''))];
    // Filter out restricted company names
    return uniqueCategories.filter(category => 
      !restrictedTerms.some(term => category.toLowerCase().includes(term))
    );
  }, [products, restrictedTerms]);

  const suppliers = useMemo(() => {
    const uniqueSuppliers = [...new Set(products.map(p => p.firma).filter(firma => firma && firma.trim() !== ''))];
    // Filter out restricted company names
    return uniqueSuppliers.filter(supplier => 
      !restrictedTerms.some(term => supplier.toLowerCase().includes(term))
    );
  }, [products, restrictedTerms]);

  // Check if a product contains any restricted terms
  const isProductRestricted = (product: Product) => {
    if (restrictedTerms.length === 0) return false;
    
    const searchableText = [
      product.urunAdi,
      product.stokKodu,
      product.firma
    ].join(' ').toLowerCase();

    return restrictedTerms.some(term => searchableText.includes(term));
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // First check if product is restricted
      if (isProductRestricted(product)) {
        return false;
      }

      const matchesSearch = enhancedTurkishSearch(searchTerm, product.urunAdi) ||
                           enhancedTurkishSearch(searchTerm, product.stokKodu);
      const matchesCategory = selectedCategory === 'all' || product.firma === selectedCategory;
      const matchesSupplier = selectedSupplier === 'all' || product.firma === selectedSupplier;
      
      return matchesSearch && matchesCategory && matchesSupplier;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rafFiyatiKdvDahil-low':
          return a.rafFiyatiKdvDahil - b.rafFiyatiKdvDahil;
        case 'rafFiyatiKdvDahil-high':
          return b.rafFiyatiKdvDahil - a.rafFiyatiKdvDahil;
        case 'listeFiyatiKdvDahil-low':
          return a.listeFiyatiKdvDahil - b.listeFiyatiKdvDahil;
        case 'listeFiyatiKdvDahil-high':
          return b.listeFiyatiKdvDahil - a.listeFiyatiKdvDahil;
        case 'urunAdi':
          return a.urunAdi.localeCompare(b.urunAdi);
        case 'stokKodu':
          return a.stokKodu.localeCompare(b.stokKodu);
        default:
          return 0;
      }
    });

    // Show only top 5 cheapest if requested
    if (showTopCheapest) {
      return filtered.sort((a, b) => a.rafFiyatiKdvDahil - b.rafFiyatiKdvDahil).slice(0, 5);
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedSupplier, sortBy, showTopCheapest, restrictedTerms, isProductRestricted]);

  return {
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
  };
};
