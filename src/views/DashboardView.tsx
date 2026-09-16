import React, { useEffect, useState, useCallback } from 'react';
import { useFilters } from '../context/FilterContext.tsx';
import { KPICards } from '../components/KPICards.tsx';
import { ChannelPerformanceTable } from '../components/ChannelPerformanceTable.tsx';
import { TrafficChart } from '../components/TrafficChart.tsx';
import { SpendChart } from '../components/SpendChart.tsx';
import { LeadsChart } from '../components/LeadsChart.tsx';
import { MarketingFunnel } from '../components/MarketingFunnel.tsx';
import type { DashboardKPIs, ChannelPerformanceRow } from '../types/index.ts';

export const DashboardView: React.FC = () => {
  const { filters } = useFilters();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<DashboardKPIs>({
    currentSpend: 0,
    previousSpend: 0,
    spendChangePct: null,
    users: 0,
    sessions: 0,
    leads: 0,
    mql: 0,
    sql: 0,
    opportunity: 0,
    proposal: 0,
    won: 0,
    revenue: 0,
    cpl: null,
    costPerMql: null,
    conversionRate: null,
    mqlRate: null,
    sqlRate: null,
    opportunityRate: null,
  });

  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformanceRow[]>([]);
  const [trafficTimeSeries, setTrafficTimeSeries] = useState<any[]>([]);
  const [spendTimeSeries, setSpendTimeSeries] = useState<any[]>([]);
  const [leadsTimeSeries, setLeadsTimeSeries] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
      const data = await res.json();
      setKpis(data.kpis);
      setChannelPerformance(data.channelPerformance);
      setTrafficTimeSeries(data.trafficTimeSeries);
      setSpendTimeSeries(data.spendTimeSeries);
      setLeadsTimeSeries(data.leadsTimeSeries);
      setFunnel(data.funnel);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div id="dashboard-view" className="p-6 space-y-6">
      {/* Error alert */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* KPI Cards Row */}
      <KPICards kpis={kpis} loading={loading} />

      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficChart data={trafficTimeSeries} />
        <SpendChart data={spendTimeSeries} />
      </div>

      {/* Secondary Chart & Pipeline Funnel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LeadsChart data={leadsTimeSeries} />
        </div>
        <div className="lg:col-span-2">
          <MarketingFunnel funnel={funnel} />
        </div>
      </div>

      {/* Channel Performance Factual Table */}
      <ChannelPerformanceTable data={channelPerformance} />
    </div>
  );
};
