import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { BrandMetrics } from '../../types/api';

export interface BrandPickerProps {
  brands: BrandMetrics[];
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
}

/**
 * Dropdown component for filtering competitive data by brand.
 * Groups brands into "Our Brands" and "Competitors" sections.
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export const BrandPicker: React.FC<BrandPickerProps> = ({
  brands,
  selectedBrand,
  onSelectBrand,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const ownBrands = brands.filter(b => b.is_own_brand);
  const competitors = brands.filter(b => !b.is_own_brand);

  const displayLabel = selectedBrand ?? 'All Brands';

  const handleSelect = (brand: string | null) => {
    onSelectBrand(brand);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-none transition-colors',
          'bg-bg-elevated border-2 border-accent-primary/20 hover:border-accent-primary',
          'text-text-primary hover:bg-bg-hover'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate max-w-[140px]">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={clsx('transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1 w-56 bg-bg-elevated border-2 border-accent-primary/20 shadow-lg z-50 max-h-72 overflow-y-auto"
        >
          {/* All Brands reset option */}
          <button
            role="option"
            aria-selected={selectedBrand === null}
            onClick={() => handleSelect(null)}
            className={clsx(
              'w-full text-left px-3 py-2 text-sm transition-colors',
              selectedBrand === null
                ? 'bg-accent-primary/10 text-accent-primary font-medium'
                : 'text-text-primary hover:bg-bg-hover'
            )}
          >
            All Brands
          </button>

          {ownBrands.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider border-t border-accent-primary/10">
                Our Brands
              </div>
              {ownBrands.map(b => (
                <button
                  key={b.brand}
                  role="option"
                  aria-selected={selectedBrand === b.brand}
                  onClick={() => handleSelect(b.brand)}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                    selectedBrand === b.brand
                      ? 'bg-accent-primary/10 text-accent-primary font-medium'
                      : 'text-text-primary hover:bg-bg-hover'
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] flex-shrink-0" />
                  {b.brand}
                </button>
              ))}
            </>
          )}

          {competitors.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider border-t border-accent-primary/10">
                Competitors
              </div>
              {competitors.map(b => (
                <button
                  key={b.brand}
                  role="option"
                  aria-selected={selectedBrand === b.brand}
                  onClick={() => handleSelect(b.brand)}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                    selectedBrand === b.brand
                      ? 'bg-accent-primary/10 text-accent-primary font-medium'
                      : 'text-text-primary hover:bg-bg-hover'
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] flex-shrink-0" />
                  {b.brand}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
