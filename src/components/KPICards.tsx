import React from 'react';
import { DollarSign, Globe, Users, TrendingUp, Target, Percent } from 'lucide-react';
import type { DashboardKPIs } from '../types/index.ts';
import { useFilters } from '../context/FilterContext.tsx';

interface KPICardsProps {
  kpis: DashboardKPIs;
  loading?: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis, loading = false }) => {
  const { formatCurrency } = useFilters();

  const renderSpendChange = () => {
    if (kpis.spendChangePct === null || kpis.previousSpend === 0) {
      return <span className="text-slate-400">vs prev: —</span>;
    }
    const isUp = kpis.spendChangePct > 0;
    return (
      <span className={`inline-flex items-center text-xs font-semibold ${isUp ? 'text-amber-600' : 'text-emerald-600'}`}>
        {isUp ? '+' : ''}
        {kpis.spendChangePct.toFixed(1)}% vs prev ({formatCurrency(kpis.previousSpend)})
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Total Spend */}
      <div id="kpi-total-spend" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Spend</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {loading ? '...' : formatCurrency(kpis.currentSpend)}
        </div>
        <div className="mt-2 text-[11px]">{renderSpendChange()}</div>
      </div>

      {/* 2. Traffic */}
      <div id="kpi-traffic" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Traffic</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {loading ? '...' : kpis.sessions.toLocaleString()}
          <span className="text-xs font-normal text-slate-500 ml-1">sessions</span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{kpis.users.toLocaleString()}</span> unique users
        </div>
      </div>

      {/* 3. Leads (Leads, MQL, SQL) */}
      <div id="kpi-leads" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Leads</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {loading ? '...' : kpis.leads.toLocaleString()}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span>
            <strong className="text-slate-700">{kpis.mql}</strong> MQL
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-700">{kpis.sql}</strong> SQL
          </span>
        </div>
      </div>

      {/* 4. CPL (Cost Per Lead) */}
      <div id="kpi-cpl" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">CPL (Cost / Lead)</span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {loading
            ? '...'
            : kpis.cpl !== null && isFinite(kpis.cpl)
            ? formatCurrency(kpis.cpl)
            : '—'}
        </div>
        <div className="mt-2 text-xs text-slate-500">Spend / Total Leads</div>
      </div>

      {/* 5. Cost per MQL */}
      <div id="kpi-cost-per-mql" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Cost per MQL</span>
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {loading
            ? '...'
            : kpis.costPerMql !== null && isFinite(kpis.costPerMql)
            ? formatCurrency(kpis.costPerMql)
            : '—'}
        </div>
        <div className="mt-2 text-xs text-slate-500">Spend / Marketing Qual.</div>
      </div>

      {/* 6. Lead Conversion Rate */}
      <div id="kpi-conversion-rate" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Conversion Rate</span>
          <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {loading
            ? '...'
            : kpis.conversionRate !== null && isFinite(kpis.conversionRate)
            ? `${kpis.conversionRate.toFixed(2)}%`
            : '—'}
        </div>
        <div className="mt-2 text-xs text-slate-500">Leads / Sessions × 100</div>
      </div>
    </div>
  );
};
