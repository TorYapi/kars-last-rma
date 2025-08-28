
import { Product } from '@/types/product';

export interface ProductVariant {
  baseProduct: Product;
  variants: Product[];
  variantOptions: string[];
}

export const detectProductVariants = (products: Product[]): (Product | ProductVariant)[] => {
  // Group products by base name (remove color/variant words)
  const productGroups = new Map<string, Product[]>();
  
  // Common variant keywords to identify and remove from base names
  const variantKeywords = [
    'SIYAH', 'BEYAZ', 'GRI', 'KIRMIZI', 'MAVI', 'YESIL', 'SARI', 'KAHVE', 'PEMBE',
    'BLACK', 'WHITE', 'GREY', 'GRAY', 'RED', 'BLUE', 'GREEN', 'YELLOW', 'BROWN', 'PINK',
    'SMALL', 'MEDIUM', 'LARGE', 'XL', 'XXL', 'S', 'M', 'L'
  ];
  
  products.forEach(product => {
    if (!product.urunAdi) return;
    
    // Create a base name by removing variant keywords
    let baseName = product.urunAdi.toUpperCase();
    const originalName = baseName;
    
    // Remove variant keywords to find the base product name
    variantKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      baseName = baseName.replace(regex, '').trim();
    });
    
    // Clean up extra spaces and normalize
    baseName = baseName.replace(/\s+/g, ' ').trim();
    
    // If baseName is too short or same as original, use original
    if (baseName.length < 3 || baseName === originalName.trim()) {
      baseName = originalName.trim();
    }
    
    // Create a group key combining base name and company
    const groupKey = `${baseName}-${product.firma}`;
    
    if (!productGroups.has(groupKey)) {
      productGroups.set(groupKey, []);
    }
    productGroups.get(groupKey)!.push(product);
  });
  
  const result: (Product | ProductVariant)[] = [];
  
  productGroups.forEach((groupProducts, groupKey) => {
    if (groupProducts.length > 1) {
      // This is a product with variants
      const baseProduct = groupProducts[0];
      const baseName = groupKey.split('-')[0];
      
      const variantOptions = groupProducts.map(p => {
        // Extract the variant name by finding the difference
        const fullName = p.urunAdi?.toUpperCase() || '';
        const baseNameUpper = baseName.toUpperCase();
        
        // Find variant words that are in the full name but not in base name
        const words = fullName.split(/\s+/);
        const baseWords = baseNameUpper.split(/\s+/);
        
        const variantWords = words.filter(word => {
          return !baseWords.includes(word) && variantKeywords.some(vk => 
            word.includes(vk.toUpperCase()) || vk.toUpperCase().includes(word)
          );
        });
        
        return variantWords.length > 0 ? variantWords.join(' ') : 'Standart';
      });
      
      result.push({
        baseProduct,
        variants: groupProducts,
        variantOptions
      });
    } else {
      // Single product without variants
      result.push(groupProducts[0]);
    }
  });
  
  return result;
};

export const isProductVariant = (item: Product | ProductVariant): item is ProductVariant => {
  return 'variants' in item;
};
