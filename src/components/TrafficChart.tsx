import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface TrafficChartProps {
  data: { date: string; users: number; sessions: number; leads: number; mql: number }[];
}

type MetricKey = 'users' | 'sessions' | 'leads' | 'mql';

export const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('sessions');

  const metricConfig: Record<
    MetricKey,
    { label: string; stroke: string; fill: string; format: (val: number) => string }
  > = {
    sessions: { label: 'Sessions', stroke: '#2563eb', fill: '#3b82f6', format: (v) => v.toLocaleString() },
    users: { label: 'Users', stroke: '#4f46e5', fill: '#6366f1', format: (v) => v.toLocaleString() },
    leads: { label: 'Leads', stroke: '#059669', fill: '#10b981', format: (v) => v.toString() },
    mql: { label: 'MQL', stroke: '#7c3aed', fill: '#8b5cf6', format: (v) => v.toString() },
  };

  const current = metricConfig[activeMetric];

  return (
    <div id="traffic-chart-container" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Traffic & Conversions Over Time</h2>
          <p className="text-xs text-slate-500 mt-0.5">Daily volume trends across the selected period</p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium border border-slate-200">
          {(['sessions', 'users', 'leads', 'mql'] as MetricKey[]).map((m) => (
            <button
              key={m}
              id={`traffic-metric-tab-${m}`}
              type="button"
              onClick={() => setActiveMetric(m)}
              className={`px-3 py-1 rounded-md transition-all ${
                activeMetric === m
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {metricConfig[m].label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => val.slice(5)} // MM-DD
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
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
              formatter={(value: any) => [current.format(Number(value)), current.label]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />
            <Line
              type="monotone"
              dataKey={activeMetric}
              name={current.label}
              stroke={current.stroke}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: current.stroke }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
