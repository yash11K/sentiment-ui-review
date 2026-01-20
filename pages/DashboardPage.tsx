import React, { useMemo } from 'react';
import { 
  Star, 
  MessageSquare, 
  SmilePlus, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  ChevronDown,
  Clock,
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
import { useDashboardData } from '../hooks/useDashboardData';
import { useStore } from '../store';
import type { TrendsResponse, TopicsResponse, SentimentResponse } from '../types/api';

// Color palette for topics
const TOPIC_COLORS = ['#22B8A0', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA', '#34D399'];

// Sentiment colors
const SENTIMENT_COLORS = {
  positive: '#4ADE80',
  neutral: '#FBBF24',
  negative: '#F87171',
};

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

// Mock wait time data - kept as mock since API doesn't provide this data
const waitTimeData = [
  { hour: '6AM', wait: 12, satisfaction: 85 },
  { hour: '9AM', wait: 25, satisfaction: 60 },
  { hour: '12PM', wait: 18, satisfaction: 75 },
  { hour: '3PM', wait: 22, satisfaction: 70 },
  { hour: '6PM', wait: 45, satisfaction: 40 },
  { hour: '9PM', wait: 15, satisfaction: 80 },
];

const DashboardPage = () => {
  // Get current location from store
  const currentLocation = useStore((state) => state.currentLocation);
  
  // Fetch dashboard data using the hook
  const { summary, trends, topics, sentiment, isLoading, error, refetch } = useDashboardData(currentLocation);
  
  // Transform API data to chart-compatible formats using useMemo for performance
  const trendData = useMemo(() => transformTrendData(trends), [trends]);
  const topicData = useMemo(() => transformTopicData(topics), [topics]);
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
      { 
        label: 'NPS Score', 
        value: '+45', // Mock - API doesn't provide NPS data
        sub: 'Stable', // Mock trend
        icon: TrendingUp, 
        color: 'text-purple-400', 
        bg: 'bg-purple-400/10' 
      },
    ];
  }, [summary]);

  // Show loading state while data is being fetched (Requirement 3.5)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Loading dashboard data..." size="lg" />
      </div>
    );
  }

  // Show error state with retry functionality (Requirement 3.6)
  if (error) {
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
      
      {/* Smart Alert Banner */}
      <div className="rounded-xl border-l-4 border-status-warning bg-bg-elevated p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-status-warning/10 to-transparent pointer-events-none" />
        <div className="flex items-start gap-4 z-10">
          <div className="p-2 bg-status-warning/20 rounded-lg text-status-warning shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-text-primary">Peak Congestion Forecast</h3>
              <Badge variant="warning">HIGH PRIORITY</Badge>
            </div>
            <p className="text-text-secondary text-sm">
              Wait times on Fridays between 4PM-7PM are driving a <span className="text-text-primary font-semibold">15% drop</span> in sentiment.
            </p>
          </div>
        </div>
        <Button variant="ghost" className="text-status-warning hover:text-status-warning hover:bg-status-warning/10 z-10 whitespace-nowrap">
          View Analysis <ArrowRight size={16} className="ml-1" />
        </Button>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Executive Overview</h2>
          <p className="text-text-tertiary">Real-time performance metrics for {currentLocation}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" size="sm" leftIcon={<ChevronDown size={14} />}>
            Last 30 Days
          </Button>
           <Button variant="primary" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Grid - Uses real API data from summary (Requirement 3.1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => (
          <Card key={idx} className="p-5 hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className={clsx("p-3 rounded-xl transition-colors group-hover:scale-110 duration-200", kpi.bg)}>
                <kpi.icon className={kpi.color} size={24} />
              </div>
              <span className={clsx("text-xs font-medium px-2 py-1 rounded-full", kpi.sub.includes('↗') ? 'bg-green-500/10 text-green-400' : kpi.sub.includes('↘') ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400')}>
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

      {/* New Row: Wait Time & Sentiment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wait Time Analysis */}
        <Card className="lg:col-span-2 min-h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-accent-primary" />
                <h3 className="font-bold text-lg text-text-primary">Wait Time Impact</h3>
              </div>
              <p className="text-text-tertiary text-sm">Wait duration (mins) vs Customer Satisfaction Score</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitTimeData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3640" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#6B7785'}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#6B7785'}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#6B7785'}} />
                <Tooltip 
                  cursor={{fill: '#242B35'}}
                  contentStyle={{backgroundColor: '#1A1F26', borderColor: 'rgba(255,255,255,0.1)', color: '#fff'}} 
                />
                <Legend iconType="circle" />
                <Bar yAxisId="left" dataKey="wait" name="Wait (mins)" fill="#60A5FA" radius={[4,4,0,0]} barSize={30} />
                <Bar yAxisId="right" dataKey="satisfaction" name="Sat Score" fill="#22B8A0" radius={[4,4,0,0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
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
                    <Tooltip contentStyle={{backgroundColor: '#1A1F26', borderColor: 'rgba(255,255,255,0.1)'}} />
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

      {/* Existing Row: Sentiment Velocity & Topics */}
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
                <span className="w-3 h-3 rounded-full bg-accent-primary"></span>
                <span className="text-text-secondary">Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sentiment-negative"></span>
                <span className="text-text-secondary">Negative</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22B8A0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22B8A0" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F87171" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3640" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7785', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7785', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1F26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="positive" stroke="#22B8A0" strokeWidth={3} fillOpacity={1} fill="url(#colorPos)" />
                  <Area type="monotone" dataKey="negative" stroke="#F87171" strokeWidth={3} fillOpacity={1} fill="url(#colorNeg)" />
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
                    <span className="text-text-secondary group-hover:text-text-primary transition-colors">{topic.name}</span>
                    <span className="text-text-primary">{topic.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-bg-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out group-hover:brightness-110" 
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
    </div>
  );
};

export default DashboardPage;
