/**
 * useBrands Hook
 * 
 * Custom hook for fetching and managing available brands.
 * Fetches brands on mount and handles loading/error states.
 */

import { useEffect, useState } from 'react';
import { fetchBrands } from '../services/apiService';
import { useStore } from '../store';
import type { Brand } from '../types/api';

// Static fallback brands
const STATIC_BRANDS: Brand[] = [
  { brand_id: 'avis', name: 'Avis' },
  { brand_id: 'hertz', name: 'Hertz' },
  { brand_id: 'budget', name: 'Budget' },
];

interface UseBrandsResult {
  brands: Brand[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and manage available brands.
 */
export function useBrands(): UseBrandsResult {
  const [error, setError] = useState<Error | null>(null);
  
  const brands = useStore((state) => state.brands);
  const isLoading = useStore((state) => state.brandsLoading);
  const setBrands = useStore((state) => state.setBrands);
  const setBrandsLoading = useStore((state) => state.setBrandsLoading);

  useEffect(() => {
    let isMounted = true;

    async function loadBrands() {
      setBrandsLoading(true);
      setError(null);

      try {
        const response = await fetchBrands();
        
        if (isMounted) {
          // API returns string[] like ["avis", "hertz"], transform to Brand[]
          if (response.brands && response.brands.length > 0) {
            const transformedBrands: Brand[] = response.brands.map((brand: string | Brand) => {
              // Handle both string and object formats
              if (typeof brand === 'string') {
                return {
                  brand_id: brand,
                  name: brand.charAt(0).toUpperCase() + brand.slice(1), // Capitalize
                };
              }
              return brand;
            });
            setBrands(transformedBrands);
          } else {
            setBrands(STATIC_BRANDS);
          }
          setBrandsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorInstance = err instanceof Error ? err : new Error('Failed to fetch brands');
          setError(errorInstance);
          
          // Use static brands as fallback on error
          setBrands(STATIC_BRANDS);
          setBrandsLoading(false);
        }
      }
    }

    loadBrands();

    return () => {
      isMounted = false;
    };
  }, [setBrands, setBrandsLoading]);

  return {
    brands: brands.length > 0 ? brands : STATIC_BRANDS,
    isLoading,
    error,
  };
}
