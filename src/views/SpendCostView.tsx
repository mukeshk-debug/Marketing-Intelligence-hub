import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, DollarSign, Edit2, X, AlertCircle, Trash2 } from 'lucide-react';
import type { SpendRecord, PlatformType, CostType, CurrencyCode } from '../types/index.ts';
import { useFilters } from '../context/FilterContext.tsx';

export const SpendCostView: React.FC = () => {
  const { filters, formatCurrency, selectedCurrency } = useFilters();
  const [spendRecords, setSpendRecords] = useState<SpendRecord[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'adjust'>('create');
  const [formData, setFormData] = useState<Partial<SpendRecord>>({});

  const fetchSpend = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/spend?startDate=${filters.startDate}&endDate=${filters.endDate}&platform=${filters.platform}`
      );
      if (res.ok) {
        const data = await res.json();
        setSpendRecords(data.records);
        setTotalSpend(data.totalSpend);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSpend();
  }, [fetchSpend]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      platform: 'Google Ads',
      campaign: 'Custom Software Development',
      amount: 150,
      currency: 'USD',
      cost_type: 'cpc',
      notes: '',
      is_manual_adjustment: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenAdjust = (original: SpendRecord) => {
    setModalMode('adjust');
    setFormData({
      date: original.date,
      platform: original.platform,
      campaign: original.campaign,
      amount: 0, // Adjustment delta or corrected amount
      currency: original.currency,
      cost_type: original.cost_type,
      notes: `Adjustment against record #${original.id}: `,
      is_manual_adjustment: true,
      original_record_id: original.id,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchSpend();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSpend = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete spend record #${id}?`)) return;
    try {
      const res = await fetch(`/api/spend/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSpend();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = spendRecords.filter((s) => {
    const matchesSearch =
      s.platform.toLowerCase().includes(search.toLowerCase()) ||
      (s.campaign && s.campaign.toLowerCase().includes(search.toLowerCase())) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesPlatform = platformFilter === 'all' || s.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div id="spend-cost-view" className="p-6 space-y-6">
      {/* Overview Metric Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Filtered Marketing Spend
          </span>
          <div className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(totalSpend)}</div>
          <p className="text-xs text-slate-500 mt-1">
            Across {spendRecords.length} recorded entries between {filters.startDate} and {filters.endDate}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Spend Record</span>
        </button>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search spend records by platform, campaign, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Bing Ads">Bing Ads</option>
              <option value="GoodFirms">GoodFirms</option>
              <option value="Clutch">Clutch</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4 text-right">Spend Amount</th>
                <th className="py-3 px-4">Cost Type</th>
                <th className="py-3 px-4">Audit / Adjustment</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    s.is_manual_adjustment ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{s.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{s.platform}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{s.campaign || '—'}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(s.amount, s.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 uppercase">
                      {s.cost_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {s.is_manual_adjustment ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" />
                        Manual Adjustment
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Original Record</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={s.notes}>
                    {s.notes || '—'}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(s)}
                      className="px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="Create linked audit adjustment without overwriting raw source"
                    >
                      Adjust
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSpend(s.id)}
                      className="p-1 rounded text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete spend entry"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No spend records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Adjust Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {modalMode === 'create' ? 'Record Marketing Spend' : 'Add Linked Spend Adjustment'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {modalMode === 'adjust' && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
                  <strong>Audited Adjustment:</strong> This creates an explicit delta or adjustment record referencing
                  record #{formData.original_record_id}. The original raw record remains untouched.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Platform</label>
                  <select
                    value={formData.platform || 'Google Ads'}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as PlatformType })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Google Ads">Google Ads</option>
                    <option value="Bing Ads">Bing Ads</option>
                    <option value="GoodFirms">GoodFirms</option>
                    <option value="Clutch">Clutch</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Campaign</label>
                  <input
                    type="text"
                    value={formData.campaign || ''}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Amount ({formData.currency || 'USD'}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.amount !== undefined ? formData.amount : ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cost Type</label>
                  <select
                    value={formData.cost_type || 'cpc'}
                    onChange={(e) => setFormData({ ...formData, cost_type: e.target.value as CostType })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="cpc">CPC</option>
                    <option value="flat">Flat</option>
                    <option value="sponsorship">Sponsorship</option>
                    <option value="subscription">Subscription</option>
                    <option value="pay_per_lead">Pay Per Lead</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes / Reason for Adjustment
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  Save Spend Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
