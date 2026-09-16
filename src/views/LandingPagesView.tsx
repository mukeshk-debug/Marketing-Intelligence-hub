import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Globe, Eye, X } from 'lucide-react';
import { useFilters } from '../context/FilterContext.tsx';
import type { LandingPageMetric } from '../types/index.ts';

export const LandingPagesView: React.FC = () => {
  const { filters } = useFilters();
  const [pages, setPages] = useState<LandingPageMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPage, setSelectedPage] = useState<LandingPageMetric | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/landing-pages');
        if (res.ok) {
          const data = await res.json();
          setPages(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, []);

  const filtered = pages.filter((p) => {
    return (
      p.url.toLowerCase().includes(search.toLowerCase()) ||
      p.page_name.toLowerCase().includes(search.toLowerCase()) ||
      p.service.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div id="landing-pages-view" className="p-6 space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search landing pages by URL, name, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Landing Pages Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Landing Page Name</th>
                <th className="py-3 px-4">URL</th>
                <th className="py-3 px-4">Target Service</th>
                <th className="py-3 px-4 text-right">Sessions</th>
                <th className="py-3 px-4 text-right">Users</th>
                <th className="py-3 px-4 text-right">Leads</th>
                <th className="py-3 px-4 text-right">MQL</th>
                <th className="py-3 px-4 text-right">Conv. Rate</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.page_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 max-w-xs truncate" title={p.url}>
                    {p.url.replace('https://example.com', '')}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{p.service}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{p.sessions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{p.users.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600">{p.leads}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{p.mql}</td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600">
                    {p.conversion_rate !== null ? `${p.conversion_rate.toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedPage(p)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                      title="View Traffic & Channel Breakdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer Modal */}
      {selectedPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPage.page_name}</h3>
                <span className="font-mono text-xs text-slate-500">{selectedPage.url}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Sessions</span>
                  <span className="text-lg font-bold text-slate-900">{selectedPage.sessions.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Leads Generated</span>
                  <span className="text-lg font-bold text-emerald-600">{selectedPage.leads}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Conversion Rate</span>
                  <span className="text-lg font-bold text-blue-600">
                    {selectedPage.conversion_rate !== null ? `${selectedPage.conversion_rate.toFixed(2)}%` : '—'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Top Acquisition Sources for this Page
                </h4>
                <div className="space-y-1.5 text-xs">
                  {selectedPage.sources ? (
                    Object.entries(selectedPage.sources).map(([src, count]) => (
                      <div
                        key={src}
                        className="flex items-center justify-between p-2 rounded bg-white border border-slate-200"
                      >
                        <span className="font-medium text-slate-700 capitalize">{src}</span>
                        <span className="font-mono font-semibold text-slate-900">{count} sessions</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs py-2">No source breakdown available.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPage(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
