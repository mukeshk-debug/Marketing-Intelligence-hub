import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext.tsx';
import { GitFork, Info, ArrowRight, ShieldCheck } from 'lucide-react';

interface AttributionRow {
  source: string;
  medium: string;
  campaign: string;
  firstTouchLeads: number;
  lastTouchLeads: number;
  mql: number;
  sql: number;
  revenue: number;
}

export const AttributionView: React.FC = () => {
  const { filters, formatCurrency } = useFilters();
  const [data, setData] = useState<AttributionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/attribution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters),
        });
        if (res.ok) {
          const result = await res.json();
          setData(result.attribution || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return (
    <div id="attribution-view" className="p-6 space-y-6">
      {/* Attribution Educational / Non-causation Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-semibold text-amber-900">Attribution Methodology & Non-Causation Note</h3>
          <p className="text-amber-800 leading-relaxed">
            First Touch models attribute 100% credit to the initial channel of brand discovery, while Last Touch
            credits the immediate channel used during conversion. These metrics measure touchpoint correlation across
            multi-channel journeys and do not prove single-source causation. High-value enterprise B2B sales typically
            involve multiple touches across organic, paid search, directory verification (Clutch/GoodFirms), and direct visits.
          </p>
        </div>
      </div>

      {/* Attribution Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="text-sm font-semibold text-slate-900">First Touch Attribution</h3>
          </div>
          <p className="text-xs text-slate-500">
            Identifies the top-of-funnel acquisition channels that initially brought prospects to the domain.
            Essential for understanding top-of-funnel awareness and ad reach.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              L
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Last Touch Attribution</h3>
          </div>
          <p className="text-xs text-slate-500">
            Identifies the final channel active when the prospect submitted the inquiry form or completed a lead conversion.
            Essential for conversion rate optimization.
          </p>
        </div>
      </div>

      {/* Multi-Touch Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            Channel Attribution Comparison (First Touch vs Last Touch)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare lead generation counts and pipeline value based on touchpoint attribution
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Medium</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4 text-right">First Touch Leads</th>
                <th className="py-3 px-4 text-right">Last Touch Leads</th>
                <th className="py-3 px-4 text-right">MQL</th>
                <th className="py-3 px-4 text-right">SQL</th>
                <th className="py-3 px-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.source}</td>
                  <td className="py-3 px-4 text-slate-600">{row.medium}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{row.campaign}</td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-600">{row.firstTouchLeads}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600">{row.lastTouchLeads}</td>
                  <td className="py-3 px-4 text-right text-slate-700 font-medium">{row.mql}</td>
                  <td className="py-3 px-4 text-right text-slate-700 font-medium">{row.sql}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {row.revenue > 0 ? formatCurrency(row.revenue) : '—'}
                  </td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No attribution data found for selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
