import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useFilters } from '../context/FilterContext.tsx';
import type { PlatformType } from '../types/index.ts';

interface SpendChartProps {
  data: { date: string; spend: number; [platform: string]: any }[];
}

export const SpendChart: React.FC<SpendChartProps> = ({ data }) => {
  const { formatCurrency } = useFilters();
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const platforms: PlatformType[] = [
    'Google Ads',
    'Bing Ads',
    'GoodFirms',
    'Clutch',
    'Meta Ads',
    'LinkedIn',
  ];

  // Colors for platforms
  const platformColors: Record<string, string> = {
    'Google Ads': '#2563eb',
    'Bing Ads': '#0284c7',
    GoodFirms: '#d97706',
    Clutch: '#ea580c',
    'Meta Ads': '#0891b2',
    LinkedIn: '#4f46e5',
    Other: '#64748b',
  };

  const chartData = useMemo(() => {
    if (platformFilter === 'all') {
      return data;
    }
    return data.map((d) => ({
      date: d.date,
      spend: d[platformFilter] || 0,
      [platformFilter]: d[platformFilter] || 0,
    }));
  }, [data, platformFilter]);

  return (
    <div id="spend-chart-container" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Spend Over Time</h2>
          <p className="text-xs text-slate-500 mt-0.5">Marketing investment trajectory by platform</p>
        </div>

        {/* Platform Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Filter:</label>
          <select
            id="spend-chart-platform-select"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Paid Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => val.slice(5)}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />

            {platformFilter === 'all' ? (
              <Bar dataKey="spend" name="Total Spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            ) : (
              <Bar
                dataKey={platformFilter}
                name={platformFilter}
                fill={platformColors[platformFilter] || '#3b82f6'}
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
