import React, { useMemo } from 'react';
import { 
  MessageCircle, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  Hash
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';
import { Skeleton, SkeletonKPICard, SkeletonChartCard } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { useRedditDashboardStats } from '../../hooks/useRedditDashboardStats';

// Colors
const SENTIMENT_COLORS = {
  Positive: '#10B981',
  Neutral: '#F59E0B',
  Negative: '#EF4444',
};

const TOPIC_COLORS = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5', '#FFF7ED'];
const SUBREDDIT_COLORS = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

interface RedditDashboardTabProps {
  brand: string;
}

export const RedditDashboardTab: React.FC<RedditDashboardTabProps> = ({ brand }) => {
  const { stats, isLoading, error, refetch } = useRedditDashboardStats(brand);

  // Transform sentiment data for pie chart
  const sentimentData = useMemo(() => {
    if (!stats?.sentiment_breakdown) return [];
    const { positive, negative, neutral } = stats.sentiment_breakdown;
    const total = positive + negative + neutral;
    if (total === 0) return [];
    
    return [
      { name: 'Positive', value: Math.round((positive / total) * 100), color: SENTIMENT_COLORS.Positive },
      { name: 'Neutral', value: Math.round((neutral / total) * 100), color: SENTIMENT_COLORS.Neutral },
      { name: 'Negative', value: Math.round((negative / total) * 100), color: SENTIMENT_COLORS.Negative },
    ];
  }, [stats]);

  // Transform topics for bar chart
  const topicsData = useMemo(() => {
    if (!stats?.top_topics) return [];
    return stats.top_topics.slice(0, 6).map((t, i) => ({
      name: t.topic,
      count: t.count,
      color: TOPIC_COLORS[i % TOPIC_COLORS.length],
    }));
  }, [stats]);

  // Transform subreddit breakdown for bar chart
  const subredditData = useMemo(() => {
    if (!stats?.subreddit_breakdown) return [];
    return stats.subreddit_breakdown.slice(0, 5).map((s, i) => ({
      name: `r/${s.subreddit}`,
      count: s.count,
      color: SUBREDDIT_COLORS[i % SUBREDDIT_COLORS.length],
    }));
  }, [stats]);

  // Calculate positive percentage
  const positivePercentage = useMemo(() => {
    if (!stats?.sentiment_breakdown) return 0;
    const { positive, negative, neutral } = stats.sentiment_breakdown;
    const total = positive + negative + neutral;
    return total > 0 ? Math.round((positive / total) * 100) : 0;
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonKPICard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChartCard className="lg:col-span-2" height={300} />
          <SkeletonChartCard height={300} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <ErrorState 
          message={error.message || 'Failed to load Reddit data'} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 hover:border-orange-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-none bg-orange-500/10 group-hover:scale-110 transition-transform">
              <MessageCircle className="text-orange-500" size={24} />
            </div>
          </div>
          <p className="text-text-tertiary text-sm font-medium">Total Mentions</p>
          <h4 className="text-3xl font-bold font-display mt-1">
            {stats?.total_reviews?.toLocaleString() ?? '--'}
          </h4>
        </Card>

        <Card className="p-5 hover:border-yellow-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-none bg-yellow-400/10 group-hover:scale-110 transition-transform">
              <Star className="text-yellow-400" size={24} />
            </div>
          </div>
          <p className="text-text-tertiary text-sm font-medium">Avg Rating</p>
          <h4 className="text-3xl font-bold font-display mt-1">
            {stats?.average_rating?.toFixed(1) ?? '--'}
          </h4>
        </Card>

        <Card className="p-5 hover:border-green-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-none bg-green-500/10 group-hover:scale-110 transition-transform">
              <ThumbsUp className="text-green-500" size={24} />
            </div>
          </div>
          <p className="text-text-tertiary text-sm font-medium">Positive</p>
          <h4 className="text-3xl font-bold font-display mt-1">
            {stats?.sentiment_breakdown?.positive ?? '--'}
          </h4>
        </Card>

        <Card className="p-5 hover:border-red-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-none bg-red-500/10 group-hover:scale-110 transition-transform">
              <ThumbsDown className="text-red-500" size={24} />
            </div>
          </div>
          <p className="text-text-tertiary text-sm font-medium">Negative</p>
          <h4 className="text-3xl font-bold font-display mt-1">
            {stats?.sentiment_breakdown?.negative ?? '--'}
          </h4>
        </Card>
      </div>

      {/* Charts Row 1: Topics & Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Distribution */}
        <Card className="lg:col-span-2 min-h-[350px] flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Hash size={16} className="text-orange-500" />
              <h3 className="font-bold text-lg text-text-primary">Top Topics</h3>
            </div>
            <p className="text-text-tertiary text-sm">Most discussed topics on Reddit</p>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            {topicsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#FFF7ED' }}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#F97316', borderWidth: 2 }} 
                  />
                  <Bar dataKey="count" name="Mentions" radius={[0, 0, 0, 0]} barSize={40}>
                    {topicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                No topic data available
              </div>
            )}
          </div>
        </Card>

        {/* Sentiment Pie */}
        <Card className="flex flex-col min-h-[350px]">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-text-primary">Sentiment</h3>
            <p className="text-text-tertiary text-sm">Reddit sentiment breakdown</p>
          </div>
          <div className="flex-1 relative">
            {sentimentData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#F97316', borderWidth: 2 }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                  <div className="text-2xl font-bold text-white">{positivePercentage}%</div>
                  <div className="text-xs text-text-tertiary">Positive</div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                No sentiment data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Subreddit Breakdown */}
      <Card className="min-h-[300px] flex flex-col">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle size={16} className="text-accent-primary" />
            <h3 className="font-bold text-lg text-text-primary">Subreddit Breakdown</h3>
          </div>
          <p className="text-text-tertiary text-sm">Where {brand} is being discussed</p>
        </div>
        <div className="flex-1 w-full min-h-[200px]">
          {subredditData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subredditData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  width={90}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#7C3AED', borderWidth: 2 }} 
                />
                <Bar dataKey="count" name="Posts" radius={[0, 0, 0, 0]} barSize={20}>
                  {subredditData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-text-tertiary">
              No subreddit data available
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RedditDashboardTab;
