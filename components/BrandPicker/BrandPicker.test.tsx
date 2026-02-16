import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrandPicker } from './BrandPicker';
import type { BrandMetrics } from '../../types/api';

const makeBrand = (brand: string, isOwn: boolean): BrandMetrics => ({
  brand,
  is_own_brand: isOwn,
  total_reviews: 100,
  average_rating: 4.0,
  sentiment_breakdown: { positive: 60, neutral: 20, negative: 20 },
  top_topics: [],
  rating_distribution: {},
});

const brands: BrandMetrics[] = [
  makeBrand('Avis', true),
  makeBrand('Budget', true),
  makeBrand('Hertz', false),
  makeBrand('Enterprise', false),
];

describe('BrandPicker', () => {
  it('renders with "All Brands" when no brand is selected', () => {
    render(<BrandPicker brands={brands} selectedBrand={null} onSelectBrand={vi.fn()} />);
    expect(screen.getByText('All Brands')).toBeDefined();
  });

  it('renders with the selected brand name', () => {
    render(<BrandPicker brands={brands} selectedBrand="Avis" onSelectBrand={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Avis/i })).toBeDefined();
  });

  it('opens dropdown on click and shows grouped brands', () => {
    render(<BrandPicker brands={brands} selectedBrand={null} onSelectBrand={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('Our Brands')).toBeDefined();
    expect(screen.getByText('Competitors')).toBeDefined();
    expect(screen.getByText('Avis')).toBeDefined();
    expect(screen.getByText('Budget')).toBeDefined();
    expect(screen.getByText('Hertz')).toBeDefined();
    expect(screen.getByText('Enterprise')).toBeDefined();
  });

  it('calls onSelectBrand with brand name on selection', () => {
    const onSelect = vi.fn();
    render(<BrandPicker brands={brands} selectedBrand={null} onSelectBrand={onSelect} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByText('Hertz'));

    expect(onSelect).toHaveBeenCalledWith('Hertz');
  });

  it('calls onSelectBrand with null when "All Brands" is selected', () => {
    const onSelect = vi.fn();
    render(<BrandPicker brands={brands} selectedBrand="Avis" onSelectBrand={onSelect} />);
    fireEvent.click(screen.getByText('Avis'));
    // Click "All Brands" option in the dropdown
    const allBrandsOptions = screen.getAllByText('All Brands');
    fireEvent.click(allBrandsOptions[allBrandsOptions.length - 1]);

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('closes dropdown after selection', () => {
    render(<BrandPicker brands={brands} selectedBrand={null} onSelectBrand={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.click(screen.getByText('Avis'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes dropdown on outside click', () => {
    render(<BrandPicker brands={brands} selectedBrand={null} onSelectBrand={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('renders with empty brand list showing only "All Brands"', () => {
    render(<BrandPicker brands={[]} selectedBrand={null} onSelectBrand={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.queryByText('Our Brands')).toBeNull();
    expect(screen.queryByText('Competitors')).toBeNull();
    // "All Brands" in the dropdown
    expect(screen.getAllByText('All Brands').length).toBeGreaterThanOrEqual(1);
  });
});
