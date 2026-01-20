import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Star, Search, Filter, FileText, ChevronDown, X } from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import { useStore } from '../store';

// Sentiment filter options
type SentimentFilter = 'positive' | 'negative' | 'neutral' | null;

// Rating filter options (null = all ratings, 1-5 = specific rating)
type RatingFilter = number | null;

const ReviewsPage = () => {
  // Get current location and dashboard topics from store
  const currentLocation = useStore((state) => state.currentLocation);
  const dashboardTopics = useStore((state) => state.dashboardTopics);
  
  // Filter states (Requirement 4.2, 4.3, 4.4)
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(null);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>(null);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  
  // Dropdown visibility states
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showSentimentDropdown, setShowSentimentDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  
  // Refs for dropdown click-outside handling
  const ratingDropdownRef = useRef<HTMLDivElement>(null);
  const sentimentDropdownRef = useRef<HTMLDivElement>(null);
  const topicDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ratingDropdownRef.current && !ratingDropdownRef.current.contains(event.target as Node)) {
        setShowRatingDropdown(false);
      }
      if (sentimentDropdownRef.current && !sentimentDropdownRef.current.contains(event.target as Node)) {
        setShowSentimentDropdown(false);
      }
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target as Node)) {
        setShowTopicDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Build useReviews parameters based on filter states
  // Requirement 4.2: Rating filters use min_rating and max_rating
  // Requirement 4.3: Sentiment filter uses sentiment parameter
  // Requirement 4.4: Topic filter uses topic parameter (fetches from /api/dashboard/reviews-by-topic/{topic})
  const { reviews, isLoading, error, refetch } = useReviews({
    location_id: currentLocation,
    min_rating: ratingFilter !== null ? ratingFilter : undefined,
    max_rating: ratingFilter !== null ? ratingFilter : undefined,
    sentiment: sentimentFilter !== null ? sentimentFilter : undefined,
    topic: topicFilter !== null ? topicFilter : undefined,
  });
  
  // Get available topics from dashboard data
  const availableTopics = dashboardTopics?.topics?.map(t => t.topic) || [];
  
  // Check if any filters are active
  const hasActiveFilters = ratingFilter !== null || sentimentFilter !== null || topicFilter !== null;
  
  // Clear all filters
  const clearFilters = () => {
    setRatingFilter(null);
    setSentimentFilter(null);
    setTopicFilter(null);
  };
  
  // Rating filter handler
  const handleRatingFilter = (rating: RatingFilter) => {
    setRatingFilter(rating);
    setShowRatingDropdown(false);
  };
  
  // Sentiment filter handler
  const handleSentimentFilter = (sentiment: SentimentFilter) => {
    setSentimentFilter(sentiment);
    setShowSentimentDropdown(false);
  };
  
  // Topic filter handler
  const handleTopicFilter = (topic: string | null) => {
    setTopicFilter(topic);
    setShowTopicDropdown(false);
  };

  // Show loading state while fetching reviews (Requirement 4.5)
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-display text-text-primary">Reviews Explorer</h2>
        </div>
        <LoadingState message="Loading reviews..." size="lg" />
      </div>
    );
  }

  // Show error state if request failed (Requirement 4.6)
  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-display text-text-primary">Reviews Explorer</h2>
        </div>
        <ErrorState 
          message={error.message || 'Failed to load reviews'} 
          onRetry={refetch} 
        />
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-display text-text-primary">Reviews Explorer</h2>
      </div>

      {/* Filter Bar */}
      <Card padding="sm" className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input 
            type="text" 
            placeholder="Search reviews..." 
            className="w-full bg-bg-base border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:border-accent-primary outline-none"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 items-center">
          {/* Rating Filter Dropdown */}
          <div className="relative" ref={ratingDropdownRef}>
            <button 
              onClick={() => setShowRatingDropdown(!showRatingDropdown)}
              className={`flex items-center gap-2 px-3 py-2 bg-bg-base border rounded-lg text-sm whitespace-nowrap transition-colors ${
                ratingFilter !== null 
                  ? 'border-accent-primary text-accent-primary' 
                  : 'border-white/10 text-text-secondary hover:text-text-primary'
              }`}
            >
              <Star size={14} className={ratingFilter !== null ? 'fill-accent-primary' : ''} />
              {ratingFilter !== null ? `${ratingFilter} Star${ratingFilter !== 1 ? 's' : ''}` : 'All Ratings'}
              <ChevronDown size={14} className={`transition-transform ${showRatingDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showRatingDropdown && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-bg-elevated border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => handleRatingFilter(null)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                    ratingFilter === null ? 'text-accent-primary bg-white/5' : 'text-text-secondary'
                  }`}
                >
                  All Ratings
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingFilter(rating)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                      ratingFilter === rating ? 'text-accent-primary bg-white/5' : 'text-text-secondary'
                    }`}
                  >
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} 
                        />
                      ))}
                    </div>
                    <span>{rating} Star{rating !== 1 ? 's' : ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Sentiment Filter Dropdown */}
          <div className="relative" ref={sentimentDropdownRef}>
            <button 
              onClick={() => setShowSentimentDropdown(!showSentimentDropdown)}
              className={`flex items-center gap-2 px-3 py-2 bg-bg-base border rounded-lg text-sm whitespace-nowrap transition-colors ${
                sentimentFilter !== null 
                  ? 'border-accent-primary text-accent-primary' 
                  : 'border-white/10 text-text-secondary hover:text-text-primary'
              }`}
            >
              <Filter size={14} />
              {sentimentFilter !== null ? sentimentFilter.charAt(0).toUpperCase() + sentimentFilter.slice(1) : 'All Sentiments'}
              <ChevronDown size={14} className={`transition-transform ${showSentimentDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showSentimentDropdown && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-bg-elevated border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => handleSentimentFilter(null)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                    sentimentFilter === null ? 'text-accent-primary bg-white/5' : 'text-text-secondary'
                  }`}
                >
                  All Sentiments
                </button>
                {(['positive', 'neutral', 'negative'] as const).map((sentiment) => (
                  <button
                    key={sentiment}
                    onClick={() => handleSentimentFilter(sentiment)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                      sentimentFilter === sentiment ? 'text-accent-primary bg-white/5' : 'text-text-secondary'
                    }`}
                  >
                    <Badge variant={sentiment} className="capitalize text-xs">{sentiment}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Topic Filter Dropdown */}
          <div className="relative" ref={topicDropdownRef}>
            <button 
              onClick={() => setShowTopicDropdown(!showTopicDropdown)}
              className={`flex items-center gap-2 px-3 py-2 bg-bg-base border rounded-lg text-sm whitespace-nowrap transition-colors ${
                topicFilter !== null 
                  ? 'border-accent-primary text-accent-primary' 
                  : 'border-white/10 text-text-secondary hover:text-text-primary'
              }`}
            >
              <Filter size={14} />
              {topicFilter !== null ? topicFilter.replace(/_/g, ' ') : 'All Topics'}
              <ChevronDown size={14} className={`transition-transform ${showTopicDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showTopicDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-bg-elevated border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto">
                <button
                  onClick={() => handleTopicFilter(null)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                    topicFilter === null ? 'text-accent-primary bg-white/5' : 'text-text-secondary'
                  }`}
                >
                  All Topics
                </button>
                {availableTopics.length > 0 ? (
                  availableTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleTopicFilter(topic)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors capitalize ${
                        topicFilter === topic ? 'text-accent-primary bg-white/5' : 'text-text-secondary'
                      }`}
                    >
                      {topic.replace(/_/g, ' ')}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-text-tertiary">
                    No topics available
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 bg-status-warning/10 border border-status-warning/30 rounded-lg text-sm text-status-warning hover:bg-status-warning/20 whitespace-nowrap transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </Card>
      
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-text-tertiary">Active filters:</span>
          {ratingFilter !== null && (
            <Badge 
              variant="default" 
              className="bg-accent-primary/10 border border-accent-primary/30 text-accent-primary flex items-center gap-1 cursor-pointer hover:bg-accent-primary/20"
              onClick={() => setRatingFilter(null)}
            >
              <Star size={12} className="fill-accent-primary" />
              {ratingFilter} Star{ratingFilter !== 1 ? 's' : ''}
              <X size={12} />
            </Badge>
          )}
          {sentimentFilter !== null && (
            <Badge 
              variant={sentimentFilter} 
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => setSentimentFilter(null)}
            >
              {sentimentFilter.charAt(0).toUpperCase() + sentimentFilter.slice(1)}
              <X size={12} />
            </Badge>
          )}
          {topicFilter !== null && (
            <Badge 
              variant="default" 
              className="bg-accent-primary/10 border border-accent-primary/30 text-accent-primary flex items-center gap-1 cursor-pointer hover:bg-accent-primary/20 capitalize"
              onClick={() => setTopicFilter(null)}
            >
              {topicFilter.replace(/_/g, ' ')}
              <X size={12} />
            </Badge>
          )}
        </div>
      )}

      {/* Review List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="mx-auto text-text-tertiary mb-4" size={48} />
            <h3 className="text-lg font-bold text-text-primary mb-2">
              No reviews found
            </h3>
            <p className="text-text-secondary">
              There are no reviews matching your current filters for this location.
            </p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="hover:border-white/20 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} 
                      />
                    ))}
                  </div>
                  <div className="h-4 w-px bg-white/10"></div>
                  <Badge variant={review.sentiment as any} className="capitalize">{review.sentiment}</Badge>
                  <span className="text-sm text-text-tertiary">{review.date}</span>
                </div>
                <span className="text-sm font-medium text-text-secondary">{review.author}</span>
              </div>

              {review.topics && review.topics.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {review.topics.map(topic => (
                    <Badge key={topic} variant="default" className="bg-bg-base border border-white/5 capitalize">
                      {topic.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-text-secondary leading-relaxed text-sm">
                "{review.content}"
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;