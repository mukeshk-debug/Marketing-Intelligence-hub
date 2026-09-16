import React, { useState, useEffect } from 'react';
import { DollarSign, Trash2, RefreshCw, CheckCircle2, ShieldAlert, Building2 } from 'lucide-react';
import { useFilters } from '../context/FilterContext.tsx';
import type { CurrencyCode } from '../types/index.ts';

export const SettingsView: React.FC = () => {
  const { selectedCurrency, setSelectedCurrency } = useFilters();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data.currencies);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset all databases with 30 days of clean, realistic marketing demo records?')) {
      return;
    }
    setLoading(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/settings/reset-demo-data', { method: 'POST' });
      const data = await res.json();
      setResetMessage(data.message || 'Demo data successfully reset!');
    } catch (err: any) {
      setResetMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (
      !window.confirm(
        'Are you sure you want to completely delete all demo data? This will clear all spend, traffic, and leads for live marketing operation.'
      )
    ) {
      return;
    }
    setLoading(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/settings/clear-data', { method: 'POST' });
      const data = await res.json();
      setResetMessage(data.message || 'All records successfully cleared.');
    } catch (err: any) {
      setResetMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="settings-view" className="p-6 space-y-6 max-w-4xl">
      {/* Feedback Banner */}
      {resetMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Organization Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Organization & Workspace Profile</h2>
            <p className="text-xs text-slate-500">Internal marketing configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Company / Domain</label>
            <input
              type="text"
              readOnly
              value="Acme Global Technologies (Internal Marketing)"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Marketing Team Lead</label>
            <input
              type="text"
              readOnly
              value="Sarah Jenkins (Growth & Performance Lead)"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Currency & Exchange Rates</h2>
            <p className="text-xs text-slate-500">
              Select your default reporting currency and view baseline exchange conversion rates
            </p>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-2">Default Active Currency</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {currencies.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setSelectedCurrency(c.code as CurrencyCode)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedCurrency === c.code
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-base font-bold">{c.code}</div>
                <div className="text-xs text-slate-500">{c.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">1 USD = {c.rateToUsd}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Database & Demo Data Management</h2>
            <p className="text-xs text-slate-500">
              Reset or wipe database records to transition from demo exploration to live production
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleResetDemoData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate / Reset Realistic Demo Data (30 Days)</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleClearAllData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Demo Data (Start Fresh)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
