import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  Star, 
  Search, 
  X, 
  ChevronUp, 
  ChevronDown,
  FileText,
  Filter,
  RotateCcw
} from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import { useDebounce } from '../hooks/useDebounce';
import { useStore } from '../store';

// Filter types
type RatingFilter = number | null;
type SortField = 'date' | 'rating';
type SortDirection = 'asc' | 'desc';

const ReviewsPage = () => {
  const currentLocation = useStore((state) => state.currentLocation);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Filter states
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(null);
  
  // Sort state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch reviews from API (server-side filters for initial load)
  const { reviews: apiReviews, isLoading, error, refetch } = useReviews({
    location_id: currentLocation,
    min_rating: ratingFilter !== null ? ratingFilter : undefined,
    max_rating: ratingFilter !== null ? ratingFilter : undefined,
  });
  
  // Check if any filters are active
  const hasActiveFilters = ratingFilter !== null || searchQuery !== '';
  
  // Client-side search filtering
  const filteredReviews = useMemo(() => {
    if (!debouncedSearch.trim()) return apiReviews;
    
    const query = debouncedSearch.toLowerCase();
    return apiReviews.filter((review) => 
      review.content.toLowerCase().includes(query) ||
      review.author.toLowerCase().includes(query) ||
      review.topics.some(t => t.toLowerCase().includes(query))
    );
  }, [apiReviews, debouncedSearch]);
  
  // Client-side sorting
  const sortedReviews = useMemo(() => {
    const sorted = [...filteredReviews];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredReviews, sortField, sortDirection]);
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setRatingFilter(null);
  };
  
  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={14} className="opacity-0 group-hover:opacity-30" />;
    return sortDirection === 'asc' 
      ? <ChevronUp size={14} className="text-accent-primary" />
      : <ChevronDown size={14} className="text-accent-primary" />;
  };

  // Highlight search matches in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-accent-primary/30 text-text-primary rounded px-0.5">{part}</mark>
        : part
    );
  };

  // Loading skeleton for table
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-display text-text-primary">Reviews Explorer</h2>
        </div>
        
        {/* Skeleton Search & Filters */}
        <Card padding="md" className="space-y-4">
          <Skeleton variant="rounded" width="100%" height={44} />
          <div className="flex gap-2 flex-wrap">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rounded" width={80} height={32} />
            ))}
          </div>
        </Card>
        
        {/* Skeleton Table */}
        <Card padding="none" className="overflow-hidden">
          <div className="bg-bg-surface px-4 py-3 border-b-2 border-accent-primary/20">
            <div className="flex gap-4">
              <Skeleton variant="text" width={100} height={16} />
              <Skeleton variant="text" width={80} height={16} />
              <Skeleton variant="text" width={300} height={16} />
              <Skeleton variant="text" width={100} height={16} />
            </div>
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-4 py-4 border-b-2 border-accent-primary/10">
              <div className="flex gap-4 items-start">
                <Skeleton variant="text" width={100} height={14} />
                <Skeleton variant="text" width={70} height={14} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="100%" height={14} />
                  <Skeleton variant="text" width="80%" height={14} />
                </div>
                <Skeleton variant="rounded" width={70} height={24} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-display text-text-primary">Reviews Explorer</h2>
        </div>
        <ErrorState message={error.message || 'Failed to load reviews'} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Reviews Explorer</h2>
          <p className="text-text-tertiary text-sm mt-1">
            {sortedReviews.length} review{sortedReviews.length !== 1 ? 's' : ''} 
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
      </div>

      {/* Search & Filters Card */}
      <Card padding="md" className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews by content, author, or topic..." 
            className="w-full bg-bg-base border-2 border-accent-primary/20 rounded-none pl-10 pr-10 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-accent-primary transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-text-tertiary text-sm mr-2">
            <Filter size={14} />
            <span>Filters:</span>
          </div>
          
          {/* Rating Chips */}
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-none text-xs font-medium border-2 transition-all ${
                ratingFilter === rating
                  ? 'bg-yellow-400/20 text-yellow-600 border-yellow-400/50'
                  : 'bg-bg-surface text-text-secondary border-accent-primary/20 hover:border-accent-primary/40'
              }`}
            >
              <Star size={12} className={ratingFilter === rating ? 'fill-yellow-500' : ''} />
              {rating}
            </button>
          ))}
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-none text-xs font-medium bg-status-warning/10 text-status-warning border-2 border-status-warning/30 hover:bg-status-warning/20 transition-all ml-auto"
            >
              <RotateCcw size={12} />
              Clear All
            </button>
          )}
        </div>
      </Card>

      {/* Reviews Table */}
      <Card padding="none" className="overflow-hidden">
        {sortedReviews.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-text-tertiary mb-4" size={48} />
            <h3 className="text-lg font-bold text-text-primary mb-2">No reviews found</h3>
            <p className="text-text-secondary text-sm">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search query.'
                : 'There are no reviews for this location yet.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-accent-primary hover:underline text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-bg-surface border-b-2 border-accent-primary/20">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-32">
                    <button 
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 group hover:text-accent-primary transition-colors"
                    >
                      Date
                      <SortIndicator field="date" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-24">
                    <button 
                      onClick={() => handleSort('rating')}
                      className="flex items-center gap-1 group hover:text-accent-primary transition-colors"
                    >
                      Rating
                      <SortIndicator field="rating" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Review
                  </th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="divide-y-2 divide-accent-primary/10">
                {sortedReviews.map((review) => (
                  <tr 
                    key={review.id} 
                    className="hover:bg-bg-surface/50 transition-colors"
                  >
                    {/* Date & Author */}
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm text-text-primary">{review.date}</div>
                      <div className="text-xs text-text-tertiary mt-0.5 truncate max-w-[120px]" title={review.author}>
                        {review.author}
                      </div>
                    </td>
                    
                    {/* Rating */}
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} 
                          />
                        ))}
                      </div>
                    </td>
                    
                    {/* Review Content */}
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        "{highlightText(review.content, debouncedSearch)}"
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReviewsPage;
