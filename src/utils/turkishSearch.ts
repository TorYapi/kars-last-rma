// Turkish search utility for handling character variations and word derivatives
export const turkishCharMap: Record<string, string[]> = {
  'a': ['a', 'â'],
  'c': ['c', 'ç'],
  'g': ['g', 'ğ'],
  'i': ['i', 'ı', 'î'],
  'o': ['o', 'ö', 'ô'],
  's': ['s', 'ş'],
  'u': ['u', 'ü', 'û'],
  'A': ['A', 'Â'],
  'C': ['C', 'Ç'],
  'G': ['G', 'Ğ'],
  'I': ['I', 'İ', 'Î'],
  'O': ['O', 'Ö', 'Ô'],
  'S': ['S', 'Ş'],
  'U': ['U', 'Ü', 'Û']
};

// Create reverse mapping for normalization
const normalizeMap: Record<string, string> = {};
Object.entries(turkishCharMap).forEach(([base, variants]) => {
  variants.forEach(variant => {
    normalizeMap[variant] = base;
  });
});

// Normalize Turkish characters to their base forms
export const normalizeTurkish = (text: string): string => {
  return text.split('').map(char => normalizeMap[char] || char).join('');
};

// Create a flexible search pattern that matches Turkish character variations
export const createFlexiblePattern = (searchTerm: string): RegExp => {
  const normalizedSearch = normalizeTurkish(searchTerm.toLowerCase());
  
  // Create pattern that matches any Turkish character variation
  const flexiblePattern = normalizedSearch.split('').map(char => {
    const variations = turkishCharMap[char] || [char];
    if (variations.length > 1) {
      return `[${variations.join('')}]`;
    }
    return char;
  }).join('');
  
  return new RegExp(flexiblePattern, 'gi');
};

// Enhanced search function that handles Turkish character variations
export const turkishSearch = (searchTerm: string, targetText: string): boolean => {
  if (!searchTerm.trim()) return true;
  
  // Try exact match first (fastest)
  if (targetText.toLowerCase().includes(searchTerm.toLowerCase())) {
    return true;
  }
  
  // Try flexible Turkish character matching
  const pattern = createFlexiblePattern(searchTerm);
  return pattern.test(targetText);
};

// Common Turkish word variations and derivatives
export const turkishWordVariations: Record<string, string[]> = {
  'ampul': ['ampül', 'ampu', 'lamba'],
  'ampül': ['ampul', 'ampu', 'lamba'],
  'çelik': ['celik', 'steel'],
  'çeşit': ['cesit', 'tür', 'tip'],
  'düğme': ['dugme', 'buton'],
  'göz': ['goz', 'eye'],
  'hızlı': ['hizli', 'fast', 'sürat'],
  'işık': ['isik', 'light', 'ışık'],
  'kağıt': ['kagit', 'paper'],
  'küçük': ['kucuk', 'small', 'mini'],
  'büyük': ['buyuk', 'large', 'big'],
  'müşteri': ['musteri', 'customer'],
  'ölçü': ['olcu', 'size', 'measure'],
  'özel': ['ozel', 'special'],
  'şeker': ['seker', 'sugar'],
  'tüp': ['tup', 'tube'],
  'ürün': ['urun', 'product'],
  'üst': ['ust', 'top', 'upper'],
  'yan': ['side', 'lateral'],
  'yeni': ['new', 'fresh']
};

// Enhanced search that includes word variations
export const enhancedTurkishSearch = (searchTerm: string, targetText: string): boolean => {
  if (!searchTerm.trim()) return true;
  
  // Try basic Turkish character search first
  if (turkishSearch(searchTerm, targetText)) {
    return true;
  }
  
  // Try word variations
  const lowerSearchTerm = searchTerm.toLowerCase();
  const variations = turkishWordVariations[lowerSearchTerm] || [];
  
  return variations.some(variation => turkishSearch(variation, targetText));
};