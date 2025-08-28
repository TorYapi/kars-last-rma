// String similarity utility for search suggestions
export const calculateLevenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

export const calculateSimilarity = (str1: string, str2: string): number => {
  const distance = calculateLevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
};

export const findSimilarProductNames = (
  searchTerm: string,
  productNames: string[],
  threshold: number = 0.6,
  maxSuggestions: number = 3
): string[] => {
  if (!searchTerm.trim() || searchTerm.length < 2) return [];

  const suggestions = productNames
    .map(name => ({
      name,
      similarity: calculateSimilarity(searchTerm, name)
    }))
    .filter(item => 
      item.similarity >= threshold && 
      item.name.toLowerCase() !== searchTerm.toLowerCase()
    )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxSuggestions)
    .map(item => item.name);

  return suggestions;
};