import React, { useMemo, useState } from 'react';
import {
  Swords,
  TrendingUp,
  Star,
  MessageSquare,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend,
} from 'recharts';
import { clsx } from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton, SkeletonChartCard } from '../components/ui/Skeleton';
import { GapAnalysisChart } from '../components/competitive/GapAnalysisChart';
import { MarketPositionChart } from '../components/competitive/MarketPositionChart';
import { useCompetitiveData, CompetitivePeriod } from '../hooks/useCompetitiveData';
import { useStore } from '../store';
import { isOwnBrand } from '../types/api';
import { filterBrandsBySelection } from '../utils/competitiveUtils';
import type { BrandMetrics, CompetitiveTrendsResponse } from '../types/api';

const OWN_COLOR = '#7C3AED';
const COMPETITOR_COLOR = '#EF4444';
const BRAND_COLORS = [
  '#7C3AED', '#8B5CF6', '#A78BFA', '#6D28D9', '#5B21B6', // purples for own
  '#EF4444', '#F97316', '#F59E0B', '#EC4899', '#06B6D4', // warm/cool for competitors
];

const PERIOD_OPTIONS: { value: CompetitivePeriod; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

function getBrandColor(brand: string, index: number): string {
  return BRAND_COLORS[index % BRAND_COLORS.length];
}

/** Separate brands into own portfolio vs competitors */
function partitionBrands(brands: BrandMetrics[]): { own: BrandMetrics[]; competitors: BrandMetrics[] } {
  const own: BrandMetrics[] = [];
  const competitors: BrandMetrics[] = [];
  brands.forEach(b => (b.is_own_brand ? own : competitors).push(b));
  return { own, competitors };
}

/** Build rating comparison bar chart data */
function buildRatingComparisonData(brands: BrandMetrics[]) {
  return brands
    .sort((a, b) => b.average_rating - a.average_rating)
    .map(b => ({
      name: b.brand,
      rating: Number(b.average_rating.toFixed(2)),
      isOwn: b.is_own_brand,
    }));
}

/** Build trend line data from competitive trends */
function buildTrendLineData(trends: CompetitiveTrendsResponse | null) {
  if (!trends?.brand_trends?.length) return [];
  // Pivot: each period becomes a row, each brand a column
  const periodMap = new Map<string, Record<string, number>>();
  trends.brand_trends.forEach(bt => {
    bt.trends.forEach(t => {
      if (!periodMap.has(t.period)) periodMap.set(t.period, {});
      periodMap.get(t.period)![bt.brand] = t.avg_rating;
    });
  });
  return Array.from(periodMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, brands]) => ({ period, ...brands }));
}

interface BrandScorecardProps {
  brand: BrandMetrics;
  marketAvg: number;
}

const BrandScorecard: React.FC<BrandScorecardProps> = ({ brand, marketAvg }) => {
  const diff = brand.average_rating - marketAvg;
  const diffLabel = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
  const total = brand.sentiment_breakdown.positive + brand.sentiment_breakdown.neutral + brand.sentiment_breakdown.negative;
  const posPct = total > 0 ? Math.round((brand.sentiment_breakdown.positive / total) * 100) : 0;

  return (
    <Card className="p-4 hover:border-accent-primary transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={clsx(
            'w-2 h-2 rounded-none',
            brand.is_own_brand ? 'bg-accent-primary' : 'bg-red-500'
          )} />
          <span className="font-bold text-text-primary capitalize">{brand.brand}</span>
        </div>
        <Badge variant={brand.is_own_brand ? 'default' : 'warning'}>
          {brand.is_own_brand ? 'Portfolio' : 'Competitor'}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xl font-bold text-text-primary">{brand.average_rating.toFixed(1)}</div>
          <div className="text-xs text-text-tertiary">Avg Rating</div>
          <div className={clsx('text-xs font-medium mt-0.5', diff >= 0 ? 'text-green-400' : 'text-red-400')}>
            {diffLabel} vs market
          </div>
        </div>
        <div>
          <div className="text-xl font-bold text-text-primary">{brand.total_reviews.toLocaleString()}</div>
          <div className="text-xs text-text-tertiary">Reviews</div>
        </div>
        <div>
          <div className="text-xl font-bold text-text-primary">{posPct}%</div>
          <div className="text-xs text-text-tertiary">Positive</div>
        </div>
      </div>
    </Card>
  );
};

const CompetitiveAnalysisPage = () => {
  const currentLocation = useStore((state) => state.currentLocation);
  const selectedBrand = useStore((state) => state.selectedBrand);
  const [period, setPeriod] = useState<CompetitivePeriod>('week');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparedBrands, setComparedBrands] = useState<string[]>([]);

  const { analysis, trends, topics, gapAnalysis, marketPosition, isLoading, error, refetch } = useCompetitiveData(currentLocation, period, selectedBrand);

  const filteredBrands = useMemo(() => {
    if (!analysis) return [];
    if (compareMode && comparedBrands.length >= 2) {
      return filterBrandsBySelection(analysis.brands, new Set(comparedBrands));
    }
    return analysis.brands;
  }, [analysis, compareMode, comparedBrands]);

  const ratingData = useMemo(
    () => buildRatingComparisonData(filteredBrands),
    [filteredBrands]
  );

  const trendLineData = useMemo(() => buildTrendLineData(trends), [trends]);

  const brandNames = useMemo(
    () => (trends?.brand_trends ?? []).map(bt => bt.brand),
    [trends]
  );

  const { own, competitors } = useMemo(
    () => partitionBrands(filteredBrands),
    [filteredBrands]
  );

  const currentPeriodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || 'Weekly';

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width={280} height={28} />
          <Skeleton variant="rounded" width={100} height={36} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rounded" width="100%" height={140} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChartCard height={300} />
          <SkeletonChartCard height={300} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChartCard height={300} />
          <SkeletonChartCard height={300} />
        </div>
      </div>
    );
  }

  // Error — show full error only when no data loaded at all
  if (error && !analysis && !trends && !topics && !gapAnalysis && !marketPosition) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorState message={error.message || 'Failed to load competitive data'} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary flex items-center gap-3">
            <Swords className="text-accent-primary" size={28} />
            Competitive Analysis
          </h2>
          <p className="text-text-tertiary text-sm mt-1">
            Portfolio vs Competitor performance at {currentLocation || 'all locations'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={compareMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) setComparedBrands([]);
            }}
          >
            {compareMode ? 'Exit Compare' : 'Compare Brands'}
          </Button>
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ChevronDown size={14} className={clsx('transition-transform', showPeriodDropdown && 'rotate-180')} />}
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            >
              {currentPeriodLabel}
            </Button>
            {showPeriodDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-bg-elevated border-2 border-accent-primary rounded-none shadow-lg z-10">
                {PERIOD_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={clsx(
                      'w-full px-4 py-2 text-left text-sm hover:bg-bg-surface transition-colors',
                      period === option.value ? 'text-accent-primary bg-bg-surface' : 'text-text-secondary'
                    )}
                    onClick={() => { setPeriod(option.value); setShowPeriodDropdown(false); }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compare Mode Brand Selection */}
      {compareMode && analysis && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            {analysis.brands.map(b => (
              <label key={b.brand} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={comparedBrands.includes(b.brand)}
                  onChange={(e) => {
                    setComparedBrands(prev =>
                      e.target.checked
                        ? [...prev, b.brand]
                        : prev.filter(name => name !== b.brand)
                    );
                  }}
                  className="accent-purple-500"
                />
                <span className={`w-2 h-2 rounded-none ${b.is_own_brand ? 'bg-purple-500' : 'bg-red-500'}`} />
                <span className="text-text-primary">{b.brand}</span>
              </label>
            ))}
          </div>
          {comparedBrands.length < 2 && (
            <p className="text-text-tertiary text-sm mt-2">Select at least 2 brands to compare</p>
          )}
        </Card>
      )}

      {/* Market Summary KPIs */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-400/10 rounded-none"><Star className="text-yellow-400" size={20} /></div>
              <span className="text-text-tertiary text-sm">Market Avg Rating</span>
            </div>
            <div className="text-3xl font-bold text-text-primary">{analysis.market_average_rating.toFixed(1)}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-400/10 rounded-none"><MessageSquare className="text-blue-400" size={20} /></div>
              <span className="text-text-tertiary text-sm">Total Market Reviews</span>
            </div>
            <div className="text-3xl font-bold text-text-primary">{analysis.market_total_reviews.toLocaleString()}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-400/10 rounded-none"><BarChart3 className="text-purple-400" size={20} /></div>
              <span className="text-text-tertiary text-sm">Portfolio Brands</span>
            </div>
            <div className="text-3xl font-bold text-text-primary">{own.length}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-400/10 rounded-none"><TrendingUp className="text-red-400" size={20} /></div>
              <span className="text-text-tertiary text-sm">Competitors Tracked</span>
            </div>
            <div className="text-3xl font-bold text-text-primary">{competitors.length}</div>
          </Card>
        </div>
      )}

      {/* Brand Scorecards */}
      {analysis && (
        <>
          {own.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-accent-primary rounded-none" /> Our Portfolio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {own.map(b => (
                  <BrandScorecard key={b.brand} brand={b} marketAvg={analysis.market_average_rating} />
                ))}
              </div>
            </div>
          )}
          {competitors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-none" /> Competitors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitors.map(b => (
                  <BrandScorecard key={b.brand} brand={b} marketAvg={analysis.market_average_rating} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Comparison Bar Chart */}
        <Card className="min-h-[380px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-text-primary">Rating Comparison</h3>
            <p className="text-text-tertiary text-sm">Average rating by brand</p>
          </div>
          <div className="flex-1 min-h-[280px]">
            {ratingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" debounce={200}>
                <BarChart data={ratingData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#7C3AED', borderWidth: 2 }} />
                  <Bar dataKey="rating" name="Avg Rating" radius={[0, 0, 0, 0]} barSize={36}>
                    {ratingData.map((entry, i) => (
                      <Cell key={i} fill={entry.isOwn ? OWN_COLOR : COMPETITOR_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">No data available</div>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-none bg-accent-primary" /> Portfolio</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-none bg-red-500" /> Competitor</span>
          </div>
        </Card>

        {/* Rating Trends Line Chart */}
        <Card className="min-h-[380px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-text-primary">Rating Trends</h3>
            <p className="text-text-tertiary text-sm">Brand ratings over time ({currentPeriodLabel.toLowerCase()})</p>
          </div>
          <div className="flex-1 min-h-[280px]">
            {trendLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" debounce={200}>
                <LineChart data={trendLineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#7C3AED', borderWidth: 2 }} />
                  <Legend />
                  {brandNames.map((brand, i) => (
                    <Line
                      key={brand}
                      type="monotone"
                      dataKey={brand}
                      stroke={getBrandColor(brand, i)}
                      strokeWidth={isOwnBrand(brand) ? 3 : 1.5}
                      strokeDasharray={isOwnBrand(brand) ? undefined : '5 5'}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">No trend data available</div>
            )}
          </div>
        </Card>
      </div>

      {/* Gap Analysis & Market Position */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[380px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-text-primary">Gap Analysis</h3>
            <p className="text-text-tertiary text-sm">Strengths and weaknesses vs competitors by topic</p>
          </div>
          <div className="flex-1">
            {gapAnalysis?.topics ? (
              <GapAnalysisChart topics={gapAnalysis.topics} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                {error ? 'Failed to load gap analysis data' : 'No gap analysis data available'}
              </div>
            )}
          </div>
        </Card>

        <Card className="min-h-[380px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-text-primary">Market Position</h3>
            <p className="text-text-tertiary text-sm">Brand review share and rating rankings</p>
          </div>
          <div className="flex-1">
            {marketPosition?.brands ? (
              <MarketPositionChart brands={marketPosition.brands} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                {error ? 'Failed to load market position data' : 'No market position data available'}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Topic Comparison Table */}
      {topics && topics.topic_comparison?.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="font-bold text-lg text-text-primary">Topic Comparison</h3>
            <p className="text-text-tertiary text-sm">How brands perform across key topics</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-surface border-b-2 border-accent-primary/20">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Topic</th>
                  {topics.topic_comparison[0]?.brands.map(b => (
                    <th key={b.brand} className="text-center px-4 py-3 text-xs font-semibold uppercase">
                      <span className={clsx(b.is_own_brand ? 'text-accent-primary' : 'text-red-400')}>
                        {b.brand}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-accent-primary/10">
                {topics.topic_comparison.map(tc => (
                  <tr key={tc.topic} className="hover:bg-bg-surface/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-text-primary capitalize">{tc.topic}</td>
                    {tc.brands.map(b => (
                      <td key={b.brand} className="px-4 py-3 text-center">
                        <div className="text-sm font-bold text-text-primary">{b.avg_rating.toFixed(1)}</div>
                        <div className="text-xs text-text-tertiary">{b.count} reviews</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CompetitiveAnalysisPage;
