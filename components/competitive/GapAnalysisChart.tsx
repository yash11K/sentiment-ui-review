import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { GapAnalysisResponse } from '../../types/api';
import { partitionGapTopics } from '../../utils/competitiveUtils';

const OWN_COLOR = '#7C3AED';
const COMPETITOR_COLOR = '#EF4444';

interface GapAnalysisChartProps {
  topics: GapAnalysisResponse['topics'];
}

export const GapAnalysisChart: React.FC<GapAnalysisChartProps> = ({ topics }) => {
  const { strengths, weaknesses } = partitionGapTopics(topics);
  const data = [...strengths, ...weaknesses];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        No gap analysis data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
        <YAxis
          type="category"
          dataKey="topic"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          width={90}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#7C3AED', borderWidth: 2 }}
          formatter={(value: number) => [value.toFixed(2), 'Gap Score']}
        />
        <Bar dataKey="gap_score" name="Gap Score" radius={[0, 0, 0, 0]} barSize={20}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.gap_score < 0 ? OWN_COLOR : COMPETITOR_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
