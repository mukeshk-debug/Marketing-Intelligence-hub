import React, { useEffect, useState } from 'react';
import { useFilters } from '../context/FilterContext.tsx';
import { Globe, Users, UserPlus, MousePointer, Activity, CheckCircle2 } from 'lucide-react';

interface TrafficOverview {
  users: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  engagementRate: number | null;
  conversions: number;
}

export const TrafficAnalyticsView: React.FC = () => {
  const { filters } = useFilters();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<TrafficOverview>({
    users: 0,
    newUsers: 0,
    sessions: 0,
    engagedSessions: 0,
    engagementRate: null,
    conversions: 0,
  });
  const [sourceMedium, setSourceMedium] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [landingPages, setLandingPages] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/traffic-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters),
        });
        if (res.ok) {
          const data = await res.json();
          setOverview(data.overview);
          setSourceMedium(data.sourceMedium);
          setCampaigns(data.campaigns);
          setLandingPages(data.landingPages);
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
    <div id="traffic-analytics-view" className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase">Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview.users.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total active users</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase">New Users</span>
            <UserPlus className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview.newUsers.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">First time visitors</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase">Sessions</span>
            <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview.sessions.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total visit sessions</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase">Engaged Sessions</span>
            <MousePointer className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview.engagedSessions.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">&gt;10s or 2+ views</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase">Engagement Rate</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {overview.engagementRate !== null ? `${overview.engagementRate.toFixed(1)}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Engaged / Total</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase">Conversions</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview.conversions.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Goal completion events</div>
        </div>
      </div>

      {/* Source / Medium Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Source / Medium Breakdown</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Normalized attribution channels (e.g. google / cpc, goodfirms / referral, direct / none)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Medium</th>
                <th className="py-3 px-4 text-right">Users</th>
                <th className="py-3 px-4 text-right">Sessions</th>
                <th className="py-3 px-4 text-right">Leads</th>
                <th className="py-3 px-4 text-right">MQL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sourceMedium.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.source}</td>
                  <td className="py-3 px-4 text-slate-600">{row.medium}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{row.users.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{row.sessions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600">{row.leads}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{row.mql}</td>
                </tr>
              ))}
              {sourceMedium.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No source/medium records for current range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaigns and Landing Pages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Campaign Traffic</h2>
            <p className="text-xs text-slate-500 mt-0.5">Performance aggregated across marketing campaigns</p>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px] sticky top-0">
                <tr>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4 text-right">Users</th>
                  <th className="py-3 px-4 text-right">Sessions</th>
                  <th className="py-3 px-4 text-right">Leads</th>
                  <th className="py-3 px-4 text-right">MQL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{row.campaign}</td>
                    <td className="py-2.5 px-4 text-right text-slate-600">{row.users.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-slate-800 font-medium">{row.sessions.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">{row.leads}</td>
                    <td className="py-2.5 px-4 text-right text-slate-800 font-medium">{row.mql}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Landing Page Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Landing Page Conversion</h2>
            <p className="text-xs text-slate-500 mt-0.5">Top entrance URLs and lead generation rates</p>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px] sticky top-0">
                <tr>
                  <th className="py-3 px-4">Landing Page</th>
                  <th className="py-3 px-4 text-right">Sessions</th>
                  <th className="py-3 px-4 text-right">Leads</th>
                  <th className="py-3 px-4 text-right">MQL</th>
                  <th className="py-3 px-4 text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {landingPages.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono text-slate-700 truncate max-w-xs" title={row.landingPage}>
                      {row.landingPage.replace('https://example.com', '')}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-800">{row.sessions.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">{row.leads}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-800">{row.mql}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-blue-600">
                      {row.conversionRate !== null ? `${row.conversionRate.toFixed(2)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
