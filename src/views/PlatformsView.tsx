import React, { useState, useEffect } from 'react';
import { Layers, Plus, ExternalLink, FileSpreadsheet, DollarSign, CheckCircle2 } from 'lucide-react';
import { useFilters } from '../context/FilterContext.tsx';
import type { PlatformSummary } from '../types/index.ts';

export const PlatformsView: React.FC = () => {
  const { filters, formatCurrency } = useFilters();
  const [activeTab, setActiveTab] = useState<'all' | 'clutch' | 'goodfirms'>('all');
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Clutch & GoodFirms manual record states
  const [clutchRecords, setClutchRecords] = useState([
    {
      id: 'cl-1',
      month: '2026-09',
      planType: 'Leaders Matrix Sponsorship',
      sponsorshipAmount: 1800,
      pplAmount: 450,
      otherSpend: 0,
      traffic: 540,
      leads: 18,
      mql: 11,
      sql: 6,
      invoiceNumber: 'CL-INV-2026-091',
      notes: 'Ranked #2 in Custom Software Development directory',
    },
    {
      id: 'cl-2',
      month: '2026-08',
      planType: 'Leaders Matrix Sponsorship',
      sponsorshipAmount: 1800,
      pplAmount: 600,
      otherSpend: 150,
      traffic: 610,
      leads: 22,
      mql: 14,
      sql: 8,
      invoiceNumber: 'CL-INV-2026-082',
      notes: 'High conversion from enterprise US tech buyers',
    },
  ]);

  const [goodfirmsRecords, setGoodfirmsRecords] = useState([
    {
      id: 'gf-1',
      month: '2026-09',
      subscriptionAmount: 1200,
      pplAmount: 300,
      traffic: 420,
      leads: 14,
      mql: 8,
      sql: 4,
      category: 'Artificial Intelligence Developers',
      technology: 'AI & Generative Models',
      notes: 'Tier 1 Featured Sponsor placement',
    },
    {
      id: 'gf-2',
      month: '2026-08',
      subscriptionAmount: 1200,
      pplAmount: 450,
      traffic: 480,
      leads: 17,
      mql: 10,
      sql: 5,
      category: 'Top Software Development Companies',
      technology: 'React, Node, Python',
      notes: 'Active PPC badge in Europe & Middle East regions',
    },
  ]);

  useEffect(() => {
    const fetchPlatforms = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/platforms');
        if (res.ok) {
          const data = await res.json();
          setPlatforms(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlatforms();
  }, []);

  return (
    <div id="platforms-view" className="p-6 space-y-6">
      {/* Top tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Platforms Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clutch')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'clutch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Clutch Directory Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('goodfirms')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'goodfirms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            GoodFirms Directory Management
          </button>
        </div>
      </div>

      {/* VIEW 1: All Platforms Overview */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((p) => (
              <div key={p.name} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{p.name}</h3>
                      <span className="text-[11px] text-slate-400 capitalize">{p.type} Channel</span>
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      p.connected ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    title={p.connected ? 'Connected' : 'Manual Data'}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Spend</span>
                    <span className="font-semibold text-slate-800">
                      {p.metrics.spend > 0 ? formatCurrency(p.metrics.spend) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Traffic</span>
                    <span className="font-semibold text-slate-800">{p.metrics.sessions.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Leads</span>
                    <span className="font-semibold text-emerald-600">{p.metrics.leads}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: Clutch Management */}
      {activeTab === 'clutch' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Clutch B2B Directory Placement Tracker</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly sponsorship, Pay-Per-Lead (PPL), invoice logs, and lead qualification
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newRec = {
                  id: `cl-${Date.now()}`,
                  month: '2026-10',
                  planType: 'Featured Sponsorship',
                  sponsorshipAmount: 1800,
                  pplAmount: 300,
                  otherSpend: 0,
                  traffic: 500,
                  leads: 15,
                  mql: 10,
                  sql: 5,
                  invoiceNumber: `CL-INV-${Date.now().toString().slice(-4)}`,
                  notes: 'Added via marketing team portal',
                };
                setClutchRecords([newRec, ...clutchRecords]);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Clutch Month</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4">Package / Tier</th>
                    <th className="py-3 px-4 text-right">Sponsorship</th>
                    <th className="py-3 px-4 text-right">PPL Spend</th>
                    <th className="py-3 px-4 text-right">Total Clutch Spend</th>
                    <th className="py-3 px-4 text-right">Traffic</th>
                    <th className="py-3 px-4 text-right">Leads</th>
                    <th className="py-3 px-4 text-right">MQL</th>
                    <th className="py-3 px-4 text-right">SQL</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clutchRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.month}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{r.planType}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(r.sponsorshipAmount)}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(r.pplAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(r.sponsorshipAmount + r.pplAmount + r.otherSpend)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{r.traffic}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">{r.leads}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">{r.mql}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">{r.sql}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{r.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: GoodFirms Management */}
      {activeTab === 'goodfirms' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">GoodFirms Directory Placement Tracker</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Subscription plans, category rankings, technology verticals, and MQL progression
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newRec = {
                  id: `gf-${Date.now()}`,
                  month: '2026-10',
                  subscriptionAmount: 1200,
                  pplAmount: 250,
                  traffic: 400,
                  leads: 12,
                  mql: 7,
                  sql: 4,
                  category: 'Custom Software Development',
                  technology: 'Full Stack & AI',
                  notes: 'Top tier placement',
                };
                setGoodfirmsRecords([newRec, ...goodfirmsRecords]);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log GoodFirms Month</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Technology Vertical</th>
                    <th className="py-3 px-4 text-right">Subscription</th>
                    <th className="py-3 px-4 text-right">PPL Spend</th>
                    <th className="py-3 px-4 text-right">Total Spend</th>
                    <th className="py-3 px-4 text-right">Traffic</th>
                    <th className="py-3 px-4 text-right">Leads</th>
                    <th className="py-3 px-4 text-right">MQL</th>
                    <th className="py-3 px-4 text-right">SQL</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {goodfirmsRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.month}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{r.category}</td>
                      <td className="py-3 px-4 text-slate-600">{r.technology}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(r.subscriptionAmount)}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(r.pplAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(r.subscriptionAmount + r.pplAmount)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{r.traffic}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">{r.leads}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">{r.mql}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">{r.sql}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
