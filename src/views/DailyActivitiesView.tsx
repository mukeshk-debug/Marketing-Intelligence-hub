import React, { useState, useEffect } from 'react';
import { Plus, Search, CalendarCheck, X } from 'lucide-react';
import type { DailyActivity, PlatformType, ActivityType } from '../types/index.ts';

export const DailyActivitiesView: React.FC = () => {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<DailyActivity>>({});

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      platform: 'Google Ads',
      activity_type: 'Bid Adjustment',
      description: '',
      campaign: '',
      performed_by: 'Alex Morgan',
      impact_notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchActivities();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = activities.filter((a) => {
    const matchesSearch =
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.performed_by.toLowerCase().includes(search.toLowerCase()) ||
      (a.campaign && a.campaign.toLowerCase().includes(search.toLowerCase()));
    const matchesPlatform = platformFilter === 'all' || a.platform === platformFilter;
    const matchesType = typeFilter === 'all' || a.activity_type === typeFilter;
    return matchesSearch && matchesPlatform && matchesType;
  });

  return (
    <div id="daily-activities-view" className="p-6 space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activities..."
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
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Activity Types</option>
            <option value="Budget Change">Budget Change</option>
            <option value="Ad Copy Update">Ad Copy Update</option>
            <option value="Bid Adjustment">Bid Adjustment</option>
            <option value="Landing Page Launch">Landing Page Launch</option>
            <option value="Directory Profile Update">Directory Profile Update</option>
            <option value="New Campaign Launch">New Campaign Launch</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Activity</span>
        </button>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Activity Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Impact Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{a.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{a.platform}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700">
                      {a.activity_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 max-w-sm">{a.description}</td>
                  <td className="py-3 px-4 text-slate-600">{a.campaign || '—'}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{a.performed_by}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={a.impact_notes}>
                    {a.impact_notes || '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No marketing activities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Log Daily Marketing Activity</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Activity Type</label>
                  <select
                    value={formData.activity_type || 'Bid Adjustment'}
                    onChange={(e) => setFormData({ ...formData, activity_type: e.target.value as ActivityType })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Budget Change">Budget Change</option>
                    <option value="Ad Copy Update">Ad Copy Update</option>
                    <option value="Bid Adjustment">Bid Adjustment</option>
                    <option value="Landing Page Launch">Landing Page Launch</option>
                    <option value="Directory Profile Update">Directory Profile Update</option>
                    <option value="New Campaign Launch">New Campaign Launch</option>
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

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Performed By *</label>
                  <input
                    type="text"
                    required
                    value={formData.performed_by || ''}
                    onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Observed Impact / Notes</label>
                  <textarea
                    rows={2}
                    value={formData.impact_notes || ''}
                    onChange={(e) => setFormData({ ...formData, impact_notes: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
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
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
