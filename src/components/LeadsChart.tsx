import React from 'react';
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

interface LeadsChartProps {
  data: { date: string; leads: number; mql: number; sql: number }[];
}

export const LeadsChart: React.FC<LeadsChartProps> = ({ data }) => {
  return (
    <div id="leads-chart-container" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Leads & Qualification Over Time</h2>
          <p className="text-xs text-slate-500 mt-0.5">Daily volume of raw leads, MQLs, and SQLs</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />

            <Bar dataKey="leads" name="Total Leads" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="mql" name="MQL" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="sql" name="SQL" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
