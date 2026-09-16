import React, { useState, useEffect } from 'react';
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileSpreadsheet,
  Settings,
  X,
  Check,
  ArrowRight,
  Activity,
} from 'lucide-react';
import type { IntegrationState, SyncLog } from '../types/index.ts';
import { GoogleSheetsIntegration } from '../components/GoogleSheetsIntegration.tsx';
import { GA4Integration } from '../components/GA4Integration.tsx';

interface IntegrationsViewProps {
  onNavigateToLeads?: () => void;
  onNavigateToTraffic?: () => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  onNavigateToLeads,
  onNavigateToTraffic,
}) => {
  const [integrations, setIntegrations] = useState<IntegrationState[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'logs' | 'sheets' | 'ga4'>('cards');
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
      const logsRes = await fetch('/api/sync-logs');
      if (logsRes.ok) {
        const data = await logsRes.json();
        setSyncLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTriggerSync = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/integrations/${id}/sync`, { method: 'POST' });
      if (res.ok) {
        await fetchIntegrations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div id="integrations-view" className="p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'cards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Integration Adapters ({integrations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ga4')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'ga4'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>GA4 Access & Property Checker</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'sheets'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Google Sheets Importer & Column Mapper
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Sync Logs & Audit Trail
          </button>
        </div>
      </div>

      {/* VIEW 1: INTEGRATION CARDS */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                      {item.platform.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.platform}</h3>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {item.sync_frequency} sync frequency
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.status === 'connected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.status === 'connected' && <CheckCircle2 className="w-3 h-3" />}
                    {item.status === 'error' && <AlertCircle className="w-3 h-3" />}
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  {item.platform === 'Google Sheets'
                    ? 'Sync custom spreadsheets and external partner CSV logs directly into leads.'
                    : item.platform === 'Google Analytics 4'
                    ? 'Ingests daily session volume, unique users, engaged sessions, and UTM tags.'
                    : item.platform === 'Google Ads'
                    ? 'Synchronizes campaign budgets, daily clicks, and keyword CPC costs.'
                    : `Modular adapter for authenticating and exchanging metrics with ${item.platform}.`}
                </p>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Sync:</span>
                    <span className="font-mono text-slate-700 font-medium">{item.last_sync || 'Never'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next Scheduled:</span>
                    <span className="font-mono text-slate-700">{item.next_sync || 'Continuous'}</span>
                  </div>
                  {item.error_message && (
                    <div className="text-red-600 text-[11px] font-medium pt-1 border-t border-slate-200">
                      {item.error_message}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {item.platform === 'Google Sheets' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('sheets')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Open Sheet Importer</span>
                  </button>
                ) : item.platform === 'Google Analytics 4' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('ga4')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    <span>Check GA4 Access & Data</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTriggerSync(item.id)}
                    disabled={syncingId === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === item.id ? 'animate-spin' : ''}`} />
                    <span>{syncingId === item.id ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (item.platform === 'Google Sheets') {
                      setActiveTab('sheets');
                      return;
                    }
                    if (item.platform === 'Google Analytics 4') {
                      setActiveTab('ga4');
                      return;
                    }
                    const nextStatus = item.status === 'connected' ? 'disconnected' : 'connected';
                    fetch(`/api/integrations/${item.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: nextStatus }),
                    }).then(() => fetchIntegrations());
                  }}
                  className={`text-xs font-semibold ${
                    item.status === 'connected' ? 'text-slate-500 hover:text-slate-800' : 'text-blue-600 hover:underline'
                  }`}
                >
                  {item.platform === 'Google Sheets'
                    ? 'Configure & Sync'
                    : item.platform === 'Google Analytics 4'
                    ? 'Access Diagnostic'
                    : item.status === 'connected'
                    ? 'Disconnect'
                    : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: GA4 ACCESS & PROPERTY CHECKER */}
      {activeTab === 'ga4' && (
        <GA4Integration
          onSyncComplete={fetchIntegrations}
          onNavigateToTraffic={onNavigateToTraffic}
        />
      )}

      {/* VIEW 3: GOOGLE SHEETS IMPORTER */}
      {activeTab === 'sheets' && (
        <GoogleSheetsIntegration
          onSyncComplete={fetchIntegrations}
          onNavigateToLeads={onNavigateToLeads}
        />
      )}

      {/* VIEW 4: SYNC LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Automated & Manual Sync Audit Logs</h2>
              <p className="text-xs text-slate-500">History of synchronization tasks and record ingestion counts</p>
            </div>
            <button
              type="button"
              onClick={fetchIntegrations}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Refresh logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Records Ingested</th>
                  <th className="py-3 px-4 text-right">Duration (ms)</th>
                  <th className="py-3 px-4">Error / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{log.platform}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-800">{log.records_imported}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500">{log.duration_ms}</td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-sm truncate">{log.error_message || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
