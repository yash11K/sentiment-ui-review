import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { clsx } from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton, SkeletonKPICard, SkeletonChartCard } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useRedditData } from '../hooks/useRedditData';
import { useStore } from '../store';

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: '#10B981',
  Neutral: '#F59E0B',
  Negative: '#EF4444',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const RedditPage = () => {
  const selectedBrand = useStore((state) => state.selectedBrand);
  const brand = selectedBrand || 'avis';
  const [selectedSubreddit, setSelectedSubreddit] = useState<string | null>(null);

  const { stats, topicDistribution, posts, sentiment, isLoading, error, refetch, fetchPosts } = useRedditData(brand);

  const handleSubredditFilter = (subreddit: string | null) => {
    setSelectedSubreddit(subreddit);
    fetchPosts(subreddit ?? undefined);
  };

  // Sort posts by date descending
  const sortedPosts = useMemo(() => {
    if (!posts?.posts) return [];
    return [...posts.posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [posts]);

  // Donut chart data from sentiment endpoint
  const donutData = useMemo(() => {
    if (!sentiment?.sentiment) return [];
    return sentiment.sentiment.map((s) => ({
      ...s,
      color: SENTIMENT_COLORS[s.name] ?? '#6B7280',
    }));
  }, [sentiment]);

  // Topic distribution horizontal bar chart data
  const topicChartData = useMemo(() => {
    if (!topicDistribution?.topics) return [];
    return topicDistribution.topics
      .slice()
      .sort((a, b) => b.count - a.count)
      .map((t) => ({
        topic: t.topic,
        positive: t.sentiment_split.positive,
        negative: t.sentiment_split.negative,
        neutral: t.sentiment_split.neutral,
        avg_score: t.avg_score,
        count: t.count,
      }));
  }, [topicDistribution]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width={300} height={32} />
          <Skeleton variant="rounded" width={160} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonKPICard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChartCard height={300} />
          <SkeletonChartCard height={300} />
        </div>
        <SkeletonChartCard height={300} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorState message={error.message || 'Failed to load Reddit data'} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-none">
            <MessageCircle className="text-orange-500" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-text-primary">Reddit Intelligence</h2>
            <p className="text-text-tertiary text-sm">Social sentiment analysis from Reddit</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={refetch}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Row 1 — KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 hover:border-orange-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-none bg-orange-500/10 group-hover:scale-110 transition-transform">
              <MessageCircle className="text-orange-500" size={24} />
            </div>
          </div>
          <p className="text-text-tertiary text-sm font-medium">Total Mentions</p>
          <h4 className="text-3xl font-bold font-display mt-1">
            {stats?.total_mentions?.toLocaleString() ?? '--'}
          </h4>
        </Card>

        <Card className="p-5 hover:border-green-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-none bg-green-500/10 group-hover:scale-110 transition-transform">
              <ThumbsUp className="text-green-500" size={24} />
            </div>
          </div>
          <p className="text-text-tertiary text-sm font-medium">Positive Sentiment</p>
          <h4 className="text-3xl font-bold font-display mt-1 text-green-500">
            {stats?.positive_sentiment != null ? `${stats.positive_sentiment}%` : '--'}
          </h4>
        </Card>

        <Card className="p-5 hover:border-red-500 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-none bg-red-500/10 group-hover:scale-110 transition-transform">
              <ThumbsDown className="text-red-500" size={24} />
            </div>
          </div>
          <p className="text-text-tertiary text-sm font-medium">Negative Sentiment</p>
          <h4 className="text-3xl font-bold font-display mt-1 text-red-500">
            {stats?.negative_sentiment != null ? `${stats.negative_sentiment}%` : '--'}
          </h4>
        </Card>

        <Card className="p-5 hover:border-accent-primary transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-none bg-accent-primary/10 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-accent-primary" size={24} />
            </div>
          </div>
          <p className="text-text-tertiary text-sm font-medium">Trending Score</p>
          <h4 className="text-3xl font-bold font-display mt-1">
            {stats?.trending_score != null ? `${stats.trending_score}` : '--'}
            <span className="text-base font-normal text-text-tertiary"> / 10</span>
          </h4>
        </Card>
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Distribution */}
        <Card className="min-h-[350px] flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-text-primary">Topic Distribution</h3>
            <p className="text-text-tertiary text-sm">Topics by post count, segmented by sentiment</p>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            {topicChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicChartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#7C3AED', borderWidth: 2, color: '#F9FAFB' }}
                    formatter={(value: number, name: string) => [value, name]}
                    labelFormatter={(label: string) => {
                      const item = topicChartData.find((t) => t.topic === label);
                      return `${label} (avg score: ${item?.avg_score?.toFixed(1) ?? '—'})`;
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="square" />
                  <Bar dataKey="negative" name="Negative" stackId="sentiment" fill="#EF4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutral" name="Neutral" stackId="sentiment" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="positive" name="Positive" stackId="sentiment" fill="#10B981" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">No topic data available</div>
            )}
          </div>
        </Card>

        {/* Sentiment Distribution Donut */}
        <Card className="min-h-[350px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-text-primary">Sentiment Distribution</h3>
            <p className="text-text-tertiary text-sm">Breakdown of Reddit sentiment</p>
          </div>
          <div className="flex-1 relative">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#7C3AED', borderWidth: 2, color: '#F9FAFB' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">No sentiment data available</div>
            )}
          </div>
        </Card>
      </div>

      {/* Row 3 — Subreddit Filter + Posts Table */}
      <Card padding="none" className="overflow-hidden">
        {/* Subreddit pills */}
        <div className="flex items-center gap-2 flex-wrap p-4 border-b-2 border-accent-primary/20">
          <button
            onClick={() => handleSubredditFilter(null)}
            className={clsx(
              'px-3 py-1.5 text-xs font-medium rounded-none border-2 transition-colors',
              selectedSubreddit === null
                ? 'bg-accent-primary text-white border-accent-primary'
                : 'bg-bg-surface text-text-secondary border-accent-primary/20 hover:border-accent-primary/50'
            )}
          >
            All
          </button>
          {stats?.top_subreddits?.map((sub) => (
            <button
              key={sub}
              onClick={() => handleSubredditFilter(sub)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-none border-2 transition-colors',
                selectedSubreddit === sub
                  ? 'bg-accent-primary text-white border-accent-primary'
                  : 'bg-bg-surface text-text-secondary border-accent-primary/20 hover:border-accent-primary/50'
              )}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Posts table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-accent-primary/20 bg-bg-surface">
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">Subreddit</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">Score</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">Comments</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">Sentiment</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">No posts found</td>
                </tr>
              ) : (
                sortedPosts.map((post) => (
                  <tr key={post.id} className="border-b border-accent-primary/10 hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3 text-text-primary">{post.title}</td>
                    <td className="px-4 py-3 text-text-secondary">{post.subreddit}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">{post.score}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">{post.comments}</td>
                    <td className="px-4 py-3">
                      <Badge variant={post.sentiment}>{post.sentiment}</Badge>
                    </td>
                    <td className="px-4 py-3 text-text-tertiary whitespace-nowrap">{formatDate(post.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RedditPage;
