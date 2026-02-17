import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Badge } from '../ui/Badge';
import type { MarketPositionResponse } from '../../types/api';

const OWN_COLOR = '#7C3AED';
const COMPETITOR_COLOR = '#EF4444';

interface MarketPositionChartProps {
  brands: MarketPositionResponse['brands'] | undefined | null;
}

export const MarketPositionChart: React.FC<MarketPositionChartProps> = ({ brands }) => {
  if (!brands || brands.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        No market position data available
      </div>
    );
  }

  const sorted = [...brands].sort((a, b) => b.review_share_pct - a.review_share_pct);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 45)}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} unit="%" />
          <YAxis
            type="category"
            dataKey="brand"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            width={90}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#7C3AED', borderWidth: 2 }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Review Share']}
          />
          <Bar dataKey="review_share_pct" name="Review Share %" radius={[0, 0, 0, 0]} barSize={20}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={entry.is_own_brand ? OWN_COLOR : COMPETITOR_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 px-4">
        {sorted.map(b => (
          <div key={b.brand} className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-none ${b.is_own_brand ? 'bg-purple-500' : 'bg-red-500'}`} />
            <span className="text-text-primary capitalize">{b.brand}</span>
            <Badge variant={b.rating_rank <= 3 ? 'default' : 'warning'}>
              #{b.rating_rank}
            </Badge>
            <span className="text-text-tertiary">({b.avg_rating.toFixed(1)}★)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
