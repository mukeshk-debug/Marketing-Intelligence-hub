import React, { useState, useEffect } from 'react';
import { Layers, Plus, ExternalLink, FileSpreadsheet, DollarSign, CheckCircle2, Trash2, X } from 'lucide-react';
import { useFilters } from '../context/FilterContext.tsx';
import type { PlatformSummary } from '../types/index.ts';

export const PlatformsView: React.FC = () => {
  const { filters, formatCurrency } = useFilters();
  const [activeTab, setActiveTab] = useState<'all' | 'clutch' | 'goodfirms'>('all');
  const [platforms, setPlatforms] = useState<PlatformSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Clutch & GoodFirms persistent records
  const [clutchRecords, setClutchRecords] = useState<any[]>([]);
  const [goodfirmsRecords, setGoodfirmsRecords] = useState<any[]>([]);

  // Modal states
  const [isClutchModalOpen, setIsClutchModalOpen] = useState(false);
  const [isGoodfirmsModalOpen, setIsGoodfirmsModalOpen] = useState(false);

  const [clutchForm, setClutchForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    planType: 'Featured Sponsorship',
    sponsorshipAmount: 1800,
    pplAmount: 500,
    traffic: 500,
    leads: 15,
    mql: 10,
    sql: 5,
    invoiceNumber: `CL-INV-${new Date().toISOString().slice(0, 7)}`,
    notes: 'Directory sponsorship & verified client reviews',
  });

  const [goodfirmsForm, setGoodfirmsForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    category: 'Top AI & Custom Software Companies',
    technology: 'AI, Full Stack, Cloud',
    subscriptionAmount: 1200,
    pplAmount: 400,
    traffic: 420,
    leads: 14,
    mql: 8,
    sql: 4,
    invoice: `GF-INV-${new Date().toISOString().slice(0, 7)}`,
    notes: 'Featured sponsor badge and high intent inquiries',
  });

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

  const fetchB2B = async () => {
    try {
      const res = await fetch('/api/platforms/b2b');
      if (res.ok) {
        const data = await res.json();
        if (data.clutch) {
          setClutchRecords(
            data.clutch.map((c: any) => ({
              ...c,
              planType: c.planType || c.plan || 'Featured Sponsor',
              invoiceNumber: c.invoiceNumber || c.invoice || 'N/A',
              otherSpend: c.otherSpend || 0,
              mql: c.mql ?? Math.round((c.leads || 0) * 0.6),
              sql: c.sql ?? Math.round((c.leads || 0) * 0.3),
            }))
          );
        }
        if (data.goodfirms) {
          setGoodfirmsRecords(
            data.goodfirms.map((g: any) => ({
              ...g,
              category: g.category || 'AI & Enterprise Software',
              technology: g.technology || 'Web, Mobile, Cloud',
              mql: g.mql ?? Math.round((g.leads || 0) * 0.6),
              sql: g.sql ?? Math.round((g.leads || 0) * 0.3),
            }))
          );
        }
      }
    } catch (err) {
      console.error('Error fetching B2B records:', err);
    }
  };

  useEffect(() => {
    fetchPlatforms();
    fetchB2B();
  }, []);

  const handleSaveClutch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalCost = Number(clutchForm.sponsorshipAmount || 0) + Number(clutchForm.pplAmount || 0);
      const res = await fetch('/api/platforms/b2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'clutch',
          record: {
            ...clutchForm,
            totalCost,
            cpl: clutchForm.leads > 0 ? totalCost / clutchForm.leads : 0,
          },
        }),
      });
      if (res.ok) {
        setIsClutchModalOpen(false);
        fetchB2B();
        fetchPlatforms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveGoodfirms = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalCost = Number(goodfirmsForm.subscriptionAmount || 0) + Number(goodfirmsForm.pplAmount || 0);
      const res = await fetch('/api/platforms/b2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'goodfirms',
          record: {
            ...goodfirmsForm,
            totalCost,
            cpl: goodfirmsForm.leads > 0 ? totalCost / goodfirmsForm.leads : 0,
          },
        }),
      });
      if (res.ok) {
        setIsGoodfirmsModalOpen(false);
        fetchB2B();
        fetchPlatforms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteB2B = async (type: 'clutch' | 'goodfirms', id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} record?`)) return;
    try {
      const res = await fetch(`/api/platforms/b2b/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchB2B();
        fetchPlatforms();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
              onClick={() => setIsClutchModalOpen(true)}
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
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clutchRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.month}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{r.planType}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(r.sponsorshipAmount || 0)}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(r.pplAmount || 0)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency((r.sponsorshipAmount || 0) + (r.pplAmount || 0) + (r.otherSpend || 0))}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{r.traffic || 0}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">{r.leads || 0}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">{r.mql || 0}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">{r.sql || 0}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{r.invoiceNumber || '—'}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.notes || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteB2B('clutch', r.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {clutchRecords.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        No Clutch placement records found.
                      </td>
                    </tr>
                  )}
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
              onClick={() => setIsGoodfirmsModalOpen(true)}
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
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {goodfirmsRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.month}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{r.category}</td>
                      <td className="py-3 px-4 text-slate-600">{r.technology || 'Enterprise AI & Cloud'}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(r.subscriptionAmount || 0)}</td>
                      <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(r.pplAmount || 0)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency((r.subscriptionAmount || 0) + (r.pplAmount || 0))}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{r.traffic || 0}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">{r.leads || 0}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">{r.mql || 0}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">{r.sql || 0}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.notes || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteB2B('goodfirms', r.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {goodfirmsRecords.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        No GoodFirms placement records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Clutch Modal */}
      {isClutchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Log Clutch Placement Month</h3>
              <button
                type="button"
                onClick={() => setIsClutchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClutch} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Billing Month *</label>
                  <input
                    type="month"
                    required
                    value={clutchForm.month}
                    onChange={(e) => setClutchForm({ ...clutchForm, month: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={clutchForm.invoiceNumber}
                    onChange={(e) => setClutchForm({ ...clutchForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Sponsorship Plan / Tier</label>
                <input
                  type="text"
                  value={clutchForm.planType}
                  onChange={(e) => setClutchForm({ ...clutchForm, planType: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sponsorship Amount ($)</label>
                  <input
                    type="number"
                    value={clutchForm.sponsorshipAmount}
                    onChange={(e) => setClutchForm({ ...clutchForm, sponsorshipAmount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">PPL Spend ($)</label>
                  <input
                    type="number"
                    value={clutchForm.pplAmount}
                    onChange={(e) => setClutchForm({ ...clutchForm, pplAmount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Traffic</label>
                  <input
                    type="number"
                    value={clutchForm.traffic}
                    onChange={(e) => setClutchForm({ ...clutchForm, traffic: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Leads</label>
                  <input
                    type="number"
                    value={clutchForm.leads}
                    onChange={(e) => setClutchForm({ ...clutchForm, leads: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">MQL</label>
                  <input
                    type="number"
                    value={clutchForm.mql}
                    onChange={(e) => setClutchForm({ ...clutchForm, mql: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={clutchForm.notes}
                  onChange={(e) => setClutchForm({ ...clutchForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClutchModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Save Clutch Month
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GoodFirms Modal */}
      {isGoodfirmsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Log GoodFirms Placement Month</h3>
              <button
                type="button"
                onClick={() => setIsGoodfirmsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveGoodfirms} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Billing Month *</label>
                  <input
                    type="month"
                    required
                    value={goodfirmsForm.month}
                    onChange={(e) => setGoodfirmsForm({ ...goodfirmsForm, month: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={goodfirmsForm.category}
                    onChange={(e) => setGoodfirmsForm({ ...goodfirmsForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Technology Vertical</label>
                <input
                  type="text"
                  value={goodfirmsForm.technology}
                  onChange={(e) => setGoodfirmsForm({ ...goodfirmsForm, technology: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Subscription Amount ($)</label>
                  <input
                    type="number"
                    value={goodfirmsForm.subscriptionAmount}
                    onChange={(e) => setGoodfirmsForm({ ...goodfirmsForm, subscriptionAmount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">PPL Spend ($)</label>
                  <input
                    type="number"
                    value={goodfirmsForm.pplAmount}
                    onChange={(e) => setGoodfirmsForm({ ...goodfirmsForm, pplAmount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Traffic</label>
                  <input
                    type="number"
                    value={goodfirmsForm.traffic}
                    onChange={(e) => setGoodfirmsForm({ ...goodfirmsForm, traffic: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Leads</label>
                  <input
                    type="number"
                    value={goodfirmsForm.leads}
                    onChange={(e) => setGoodfirmsForm({ ...goodfirmsForm, leads: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">MQL</label>
                  <input
                    type="number"
                    value={goodfirmsForm.mql}
                    onChange={(e) => setGoodfirmsForm({ ...goodfirmsForm, mql: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={goodfirmsForm.notes}
                  onChange={(e) => setGoodfirmsForm({ ...goodfirmsForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoodfirmsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Save GoodFirms Month
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
