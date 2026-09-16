import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import type { ChannelPerformanceRow } from '../types/index.ts';
import { useFilters } from '../context/FilterContext.tsx';

interface ChannelPerformanceTableProps {
  data: ChannelPerformanceRow[];
}

type SortField = 'channel' | 'spend' | 'sessions' | 'users' | 'leads' | 'mql' | 'sql' | 'cpl' | 'costPerMql';

export const ChannelPerformanceTable: React.FC<ChannelPerformanceTableProps> = ({ data }) => {
  const { formatCurrency } = useFilters();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.channel.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let vA: any = a[sortField];
      let vB: any = b[sortField];

      // Handle nulls in sorting
      if (vA === null || vA === undefined) vA = -Infinity;
      if (vB === null || vB === undefined) vB = -Infinity;

      if (typeof vA === 'string') {
        return sortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return sortAsc ? vA - vB : vB - vA;
    });

    return list;
  }, [data, search, sortField, sortAsc]);

  return (
    <div id="channel-performance-card" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Channel Performance Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Factual attribution of spend, traffic, leads, and conversion metrics by channel
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSort('channel')}>
                <div className="flex items-center gap-1.5">
                  <span>Channel</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('spend')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Spend</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('sessions')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Traffic (Sessions)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('users')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Users</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('leads')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Leads</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('mql')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>MQL</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('sql')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>SQL</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('cpl')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>CPL</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('costPerMql')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Cost / MQL</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSorted.map((row) => (
              <tr key={row.channel} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-900">{row.channel}</td>
                <td className="py-3 px-4 text-right font-medium text-slate-800">
                  {row.spend > 0 ? formatCurrency(row.spend) : '—'}
                </td>
                <td className="py-3 px-4 text-right text-slate-700">{row.sessions.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-slate-500">{row.users.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-semibold text-emerald-700">{row.leads}</td>
                <td className="py-3 px-4 text-right font-medium text-slate-800">{row.mql}</td>
                <td className="py-3 px-4 text-right font-medium text-slate-800">{row.sql}</td>
                <td className="py-3 px-4 text-right text-slate-700 font-medium">
                  {row.cpl !== null && isFinite(row.cpl) ? formatCurrency(row.cpl) : '—'}
                </td>
                <td className="py-3 px-4 text-right text-slate-700 font-medium">
                  {row.costPerMql !== null && isFinite(row.costPerMql) ? formatCurrency(row.costPerMql) : '—'}
                </td>
              </tr>
            ))}
            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  No channel records matched the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
