import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Star, Search, Filter } from 'lucide-react';

const mockReviews = [
  {
    id: '1',
    author: 'Sarah M.',
    rating: 5,
    date: 'Jan 15, 2026',
    sentiment: 'positive',
    content: "Great Customer Service, wonderful vehicle, easy rental. The staff at the counter was incredibly helpful despite the long line.",
    topics: ['customer_service', 'vehicle_condition']
  },
  {
    id: '2',
    author: 'John D.',
    rating: 1,
    date: 'Jan 14, 2026',
    sentiment: 'negative',
    content: "We waited over an hour for our car when there were just 3 people ahead of us. Completely unacceptable for a 'Preferred' member.",
    topics: ['wait_times', 'staff_behavior']
  },
  {
    id: '3',
    author: 'Emily R.',
    rating: 3,
    date: 'Jan 12, 2026',
    sentiment: 'neutral',
    content: "Car was clean but the tank wasn't full. Had to stop for gas immediately.",
    topics: ['cleanliness', 'vehicle_condition']
  }
];

const ReviewsPage = () => {
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
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button className="flex items-center gap-2 px-3 py-2 bg-bg-base border border-white/10 rounded-lg text-sm text-text-secondary hover:text-text-primary whitespace-nowrap">
            <Star size={14} /> All Ratings
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-bg-base border border-white/10 rounded-lg text-sm text-text-secondary hover:text-text-primary whitespace-nowrap">
            <Filter size={14} /> All Topics
          </button>
        </div>
      </Card>

      {/* Review List */}
      <div className="space-y-4">
        {mockReviews.map((review) => (
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

            <div className="flex gap-2 mb-3">
              {review.topics.map(topic => (
                <Badge key={topic} variant="default" className="bg-bg-base border border-white/5 capitalize">
                  {topic.replace('_', ' ')}
                </Badge>
              ))}
            </div>

            <p className="text-text-secondary leading-relaxed text-sm">
              "{review.content}"
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewsPage;