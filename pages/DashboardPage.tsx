import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  MessageSquare, 
  SmilePlus, 
  AlertTriangle, 
  ArrowRight,
  ChevronDown,
  Tag,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { clsx } from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton, SkeletonKPICard, SkeletonChartCard } from '../components/ui/Skeleton';
import { useDashboardData, TrendsPeriod } from '../hooks/useDashboardData';
import { useStore } from '../store';
import type { TrendsResponse, TopicsResponse, SentimentResponse, HighlightResponse } from '../types/api';

// Color palette for topics - Purple theme
const TOPIC_COLORS = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#6D28D9', '#5B21B6'];

// Sentiment colors
const SENTIMENT_COLORS = {
  positive: '#10B981',
  neutral: '#F59E0B',
  negative: '#EF4444',
};

// Period options for the dropdown
const PERIOD_OPTIONS: { value: TrendsPeriod; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

/**
 * Transform API sentiment trends to chart-compatible format
 * Maps period to name for the AreaChart
 */
function transformTrendData(trends: TrendsResponse | null): Array<{ name: string; positive: number; negative: number }> {
  if (!trends?.sentiment_trends || trends.sentiment_trends.length === 0) {
    return [];
  }
  
  return trends.sentiment_trends.map((trend) => ({
    name: trend.period,
    positive: trend.positive,
    negative: trend.negative,
  }));
}

/**
 * Transform API topics to chart-compatible format
 * Maps topic to name, count to value, and assigns colors
 */
function transformTopicData(topics: TopicsResponse | null): Array<{ name: string; value: number; color: string }> {
  if (!topics?.topics || topics.topics.length === 0) {
    return [];
  }
  
  // Calculate total count for percentage calculation
  const totalCount = topics.topics.reduce((sum, t) => sum + t.count, 0);
  
  return topics.topics.map((topic, index) => ({
    name: topic.topic,
    value: totalCount > 0 ? Math.round((topic.count / totalCount) * 100) : 0,
    color: TOPIC_COLORS[index % TOPIC_COLORS.length],
  }));
}

/**
 * Transform API topics to bar chart format for Topic Distribution
 * Shows raw count per topic
 */
function transformTopicDistributionData(topics: TopicsResponse | null): Array<{ name: string; count: number; color: string }> {
  if (!topics?.topics || topics.topics.length === 0) {
    return [];
  }
  
  return topics.topics.map((topic, index) => ({
    name: topic.topic,
    count: topic.count,
    color: TOPIC_COLORS[index % TOPIC_COLORS.length],
  }));
}

/**
 * Transform API topics to stacked bar chart format for Topic Sentiment Breakdown
 * Shows positive/negative/neutral counts per topic
 */
function transformTopicSentimentData(topics: TopicsResponse | null): Array<{ name: string; positive: number; neutral: number; negative: number }> {
  if (!topics?.topics || topics.topics.length === 0) {
    return [];
  }
  
  return topics.topics.map((topic) => ({
    name: topic.topic,
    positive: topic.sentiment_split.positive,
    neutral: topic.sentiment_split.neutral,
    negative: topic.sentiment_split.negative,
  }));
}

/**
 * Transform API sentiment summary to pie chart format
 * Converts counts to percentages
 */
function transformSentimentData(sentiment: SentimentResponse | null): Array<{ name: string; value: number; color: string }> {
  if (!sentiment?.summary) {
    return [];
  }
  
  const { positive_count, negative_count, neutral_count } = sentiment.summary;
  const total = positive_count + negative_count + neutral_count;
  
  if (total === 0) {
    return [];
  }
  
  return [
    { 
      name: 'Positive', 
      value: Math.round((positive_count / total) * 100), 
      color: SENTIMENT_COLORS.positive 
    },
    { 
      name: 'Neutral', 
      value: Math.round((neutral_count / total) * 100), 
      color: SENTIMENT_COLORS.neutral 
    },
    { 
      name: 'Negative', 
      value: Math.round((negative_count / total) * 100), 
      color: SENTIMENT_COLORS.negative 
    },
  ];
}

/**
 * Calculate positive percentage from sentiment data for the center display
 */
function getPositivePercentage(sentiment: SentimentResponse | null): number {
  if (!sentiment?.summary) {
    return 0;
  }
  
  const { positive_count, negative_count, neutral_count } = sentiment.summary;
  const total = positive_count + negative_count + neutral_count;
  
  if (total === 0) {
    return 0;
  }
  
  return Math.round((positive_count / total) * 100);
}

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // Get current location from store
  const currentLocation = useStore((state) => state.currentLocation);
  const selectedBrand = useStore((state) => state.selectedBrand);
  
  // Period state for trend data grouping
  const [period, setPeriod] = useState<TrendsPeriod>('week');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  
  // Fetch dashboard data using the hook
  const { summary, trends, topics, sentiment, highlight, isLoading, error, refetch } = useDashboardData(currentLocation, period);
  
  // Get current period label
  const currentPeriodLabel = PERIOD_OPTIONS.find(opt => opt.value === period)?.label || 'Weekly';
  
  // Transform API data to chart-compatible formats using useMemo for performance
  const trendData = useMemo(() => transformTrendData(trends), [trends]);
  const topicData = useMemo(() => transformTopicData(topics), [topics]);
  const topicDistributionData = useMemo(() => transformTopicDistributionData(topics), [topics]);
  const topicSentimentData = useMemo(() => transformTopicSentimentData(topics), [topics]);
  const sentimentData = useMemo(() => transformSentimentData(sentiment), [sentiment]);
  const positivePercentage = useMemo(() => getPositivePercentage(sentiment), [sentiment]);

  /**
   * Calculate KPI values from real API data
   * Requirement 3.1: Map total_reviews, average_rating, sentiment_breakdown to KPI display
   */
  const kpiData = useMemo(() => {
    // Format number with commas (e.g., 1240 -> "1,240")
    const formatNumber = (num: number): string => {
      return num.toLocaleString();
    };

    // Calculate positive sentiment percentage from sentiment_breakdown
    const calculateSentimentPercentage = (): number => {
      if (!summary?.sentiment_breakdown) {
        return 0;
      }
      const { positive, negative, neutral } = summary.sentiment_breakdown;
      const total = positive + negative + neutral;
      if (total === 0) {
        return 0;
      }
      return Math.round((positive / total) * 100);
    };

    return [
      { 
        label: 'Avg Rating', 
        value: summary?.average_rating?.toFixed(1) ?? '--', 
        sub: '↘ 2.4%', // Mock trend - API doesn't provide historical comparison
        icon: Star, 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-400/10' 
      },
      { 
        label: 'Total Reviews', 
        value: summary?.total_reviews !== undefined ? formatNumber(summary.total_reviews) : '--', 
        sub: '↗ 15%', // Mock trend - API doesn't provide historical comparison
        icon: MessageSquare, 
        color: 'text-blue-400', 
        bg: 'bg-blue-400/10' 
      },
      { 
        label: 'Sentiment', 
        value: summary?.sentiment_breakdown ? String(calculateSentimentPercentage()) : '--', 
        sub: '↘ 2%', // Mock trend - API doesn't provide historical comparison
        icon: SmilePlus, 
        color: 'text-green-400', 
        bg: 'bg-green-400/10' 
      },
    ];
  }, [summary]);

  // Show error state with retry functionality (Requirement 3.6)
  if (error && !summary && !trends && !topics && !sentiment && !highlight) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorState 
          message={error.message || 'Failed to load dashboard data'} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Smart Alert Banner - Dynamic from API */}
      {highlight === null && isLoading ? (
        <div className="rounded-none bg-bg-elevated p-4 flex items-center gap-4 border-2 border-accent-primary/20">
          <Skeleton variant="rounded" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width={200} height={20} />
            <Skeleton variant="text" width="80%" height={14} />
          </div>
        </div>
      ) : highlight?.highlight && (
        <div className={clsx(
          "rounded-none border-l-4 bg-bg-elevated p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden border-2",
          highlight.highlight.severity === 'high' ? 'border-status-warning border-status-warning/30' : 
          highlight.highlight.severity === 'medium' ? 'border-yellow-500 border-yellow-500/30' : 
          'border-blue-500 border-blue-500/30'
        )}>
          <div className={clsx(
            "absolute top-0 right-0 w-64 h-full bg-gradient-to-l to-transparent pointer-events-none",
            highlight.highlight.severity === 'high' ? 'from-status-warning/10' : 
            highlight.highlight.severity === 'medium' ? 'from-yellow-500/10' : 
            'from-blue-500/10'
          )} />
          <div className="flex items-start gap-4 z-10">
            <div className={clsx(
              "p-2 rounded-none shrink-0",
              highlight.highlight.severity === 'high' ? 'bg-status-warning/20 text-status-warning' : 
              highlight.highlight.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 
              'bg-blue-500/20 text-blue-500'
            )}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-text-primary">{highlight.highlight.headline}</h3>
                <Badge variant={highlight.highlight.severity === 'high' ? 'warning' : highlight.highlight.severity === 'medium' ? 'default' : 'success'}>
                  {highlight.highlight.severity.toUpperCase()} PRIORITY
                </Badge>
              </div>
              <p className="text-text-secondary text-sm">
                {highlight.highlight.description}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className={clsx(
              "z-10 whitespace-nowrap",
              highlight.highlight.severity === 'high' ? 'text-status-warning hover:text-status-warning hover:bg-status-warning/10' : 
              highlight.highlight.severity === 'medium' ? 'text-yellow-500 hover:text-yellow-500 hover:bg-yellow-500/10' : 
              'text-blue-500 hover:text-blue-500 hover:bg-blue-500/10'
            )}
            onClick={() => {
              const query = selectedBrand
                ? `${highlight.highlight.analysis_query} for ${selectedBrand}`
                : highlight.highlight.analysis_query;
              navigate('/ai-analysis?q=' + encodeURIComponent(query));
            }}
          >
            View Analysis <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Executive Overview</h2>
          <p className="text-text-tertiary">Real-time performance metrics for {currentLocation}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button 
              variant="secondary" 
              size="sm" 
              leftIcon={<ChevronDown size={14} className={clsx("transition-transform", showPeriodDropdown && "rotate-180")} />}
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            >
              {currentPeriodLabel}
            </Button>
            {showPeriodDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-bg-elevated border-2 border-accent-primary rounded-none shadow-lg z-10">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={clsx(
                      "w-full px-4 py-2 text-left text-sm hover:bg-bg-surface transition-colors",
                      period === option.value ? "text-accent-primary bg-bg-surface" : "text-text-secondary"
                    )}
                    onClick={() => {
                      setPeriod(option.value);
                      setShowPeriodDropdown(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
           <Button variant="primary" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Grid - Uses real API data from summary (Requirement 3.1) */}
      {summary === null && isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonKPICard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpiData.map((kpi, idx) => (
            <Card key={idx} className="p-5 hover:border-accent-primary transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-3 rounded-none transition-colors group-hover:scale-110 duration-200", kpi.bg)}>
                  <kpi.icon className={kpi.color} size={24} />
                </div>
                <span className={clsx("text-xs font-medium px-2 py-1 rounded-none", kpi.sub.includes('↗') ? 'bg-green-500/10 text-green-600' : kpi.sub.includes('↘') ? 'bg-red-500/10 text-red-600' : 'bg-gray-500/10 text-gray-600')}>
                  {kpi.sub}
                </span>
              </div>
              <div>
                <p className="text-text-tertiary text-sm font-medium">{kpi.label}</p>
                <h4 className="text-3xl font-bold font-display mt-1">{kpi.value}</h4>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Row: Topic Distribution & Sentiment Breakdown */}
      {(topics === null || sentiment === null) && isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChartCard className="lg:col-span-2" height={250} />
          <SkeletonChartCard height={250} />
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Distribution */}
        <Card className="lg:col-span-2 min-h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Tag size={16} className="text-accent-primary" />
                <h3 className="font-bold text-lg text-text-primary">Topic Distribution</h3>
              </div>
              <p className="text-text-tertiary text-sm">Review count by topic category</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            {topicDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                <BarChart data={topicDistributionData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                  <Tooltip 
                    cursor={{fill: '#F3F0FF'}}
                    contentStyle={{backgroundColor: '#FFFFFF', borderColor: '#7C3AED', borderWidth: 2, color: '#1F1F1F'}} 
                  />
                  <Bar dataKey="count" name="Reviews" radius={[0,0,0,0]} barSize={40}>
                    {topicDistributionData.map((entry, index) => (
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

        {/* Sentiment Breakdown Pie */}
        <Card className="flex flex-col min-h-[350px]">
          <div className="mb-4">
             <div className="flex items-center gap-2 mb-1">
                <PieChartIcon size={16} className="text-accent-primary" />
                <h3 className="font-bold text-lg text-text-primary">Sentiment</h3>
              </div>
            <p className="text-text-tertiary text-sm">Distribution by category</p>
          </div>
          <div className="flex-1 relative">
            {sentimentData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
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
                    <Tooltip contentStyle={{backgroundColor: '#FFFFFF', borderColor: '#7C3AED', borderWidth: 2}} />
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
      )}

      {/* Existing Row: Sentiment Velocity & Topics */}
      {(trends === null || topics === null) && isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChartCard className="lg:col-span-2" height={300} />
          <SkeletonChartCard height={300} />
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sentiment Velocity */}
        <Card className="lg:col-span-2 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-text-primary">Sentiment Velocity</h3>
              <p className="text-text-tertiary text-sm">Positive vs Negative trend (6 months)</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-none bg-accent-primary"></span>
                <span className="text-text-secondary">Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-none bg-sentiment-negative"></span>
                <span className="text-text-secondary">Negative</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={200}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '2px solid #7C3AED', borderRadius: '0px' }}
                    itemStyle={{ color: '#1F1F1F' }}
                  />
                  <Area type="monotone" dataKey="positive" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorPos)" />
                  <Area type="monotone" dataKey="negative" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorNeg)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                No trend data available
              </div>
            )}
          </div>
        </Card>

        {/* Topic Breakdown */}
        <Card className="flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-text-primary">Key Topics</h3>
            <p className="text-text-tertiary text-sm">Volume by category</p>
          </div>
          <div className="flex-1 space-y-6">
            {topicData.length > 0 ? (
              topicData.map((topic, idx) => (
                <div key={idx} className="space-y-2 group cursor-pointer">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-text-secondary group-hover:text-accent-primary transition-colors">{topic.name}</span>
                    <span className="text-text-primary">{topic.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-bg-surface rounded-none overflow-hidden">
                    <div 
                      className="h-full rounded-none transition-all duration-500 ease-out group-hover:brightness-110" 
                      style={{ width: `${topic.value}%`, backgroundColor: topic.color }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                No topic data available
              </div>
            )}
          </div>
          <Button variant="ghost" className="mt-6 w-full justify-between group text-text-secondary">
            View Full Report 
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </Card>
      </div>
      )}
    </div>
  );
};

export default DashboardPage;
