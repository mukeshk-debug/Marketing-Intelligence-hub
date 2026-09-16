import React, { useState, useEffect } from 'react';
import { Copy, Download, Calendar, Check, FileText, ChevronRight } from 'lucide-react';
import { useFilters } from '../context/FilterContext.tsx';
import type { EODReportData, MonthlyReportData } from '../types/index.ts';

export const ReportsView: React.FC = () => {
  const { formatCurrency } = useFilters();
  const [activeTab, setActiveTab] = useState<'eod' | 'monthly'>('eod');
  const [reportDate, setReportDate] = useState('2026-09-15');
  const [monthString, setMonthString] = useState('2026-09');

  const [eodData, setEodData] = useState<EODReportData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchEodReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/eod?date=${reportDate}`);
      if (res.ok) {
        const data = await res.json();
        setEodData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${monthString}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'eod') {
      fetchEodReport();
    } else {
      fetchMonthlyReport();
    }
  }, [activeTab, reportDate, monthString]);

  // Generate plain-text formatted EOD summary for clipboard
  const generateEodPlainText = () => {
    if (!eodData) return '';
    let text = `📊 MARKETING INTELLIGENCE HUB — EOD REPORT\n`;
    text += `Date: ${eodData.date}\n`;
    text += `-------------------------------------------\n`;
    text += `TOTAL DAILY PERFORMANCE:\n`;
    text += `• Spend: ${formatCurrency(eodData.summary.totalSpend)}\n`;
    text += `• Traffic: ${eodData.summary.totalSessions.toLocaleString()} sessions (${eodData.summary.totalUsers.toLocaleString()} users)\n`;
    text += `• Leads: ${eodData.summary.totalLeads} | MQL: ${eodData.summary.totalMql} | SQL: ${eodData.summary.totalSql}\n`;
    text += `• Daily CPL: ${
      eodData.summary.cpl !== null ? formatCurrency(eodData.summary.cpl) : 'Not available'
    }\n\n`;

    text += `PLATFORM BREAKDOWN:\n`;
    eodData.platforms.forEach((p) => {
      text += `[${p.platform.toUpperCase()}]\n`;
      text += `  - Spend: ${p.spend > 0 ? formatCurrency(p.spend) : 'Not available ($0)'}\n`;
      text += `  - Traffic: ${p.sessions > 0 ? `${p.sessions} sessions` : 'Not available'}\n`;
      text += `  - Leads: ${p.leads} (MQL: ${p.mql}, SQL: ${p.sql})\n`;
      text += `  - CPL: ${p.cpl !== null ? formatCurrency(p.cpl) : 'Not available'}\n`;
      if (p.activities.length > 0) {
        text += `  - Activities: ${p.activities.join('; ')}\n`;
      }
      text += `\n`;
    });

    return text;
  };

  const handleCopyEod = () => {
    const text = generateEodPlainText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="reports-view" className="p-6 space-y-6">
      {/* Top Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('eod')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'eod' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            End of Day (EOD) Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'monthly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Executive Monthly Report
          </button>
        </div>

        {/* Date / Month Picker */}
        <div className="flex items-center gap-2">
          {activeTab === 'eod' ? (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="focus:outline-none text-slate-700 font-medium"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="month"
                value={monthString}
                onChange={(e) => setMonthString(e.target.value)}
                className="focus:outline-none text-slate-700 font-medium"
              />
            </div>
          )}

          {activeTab === 'eod' && (
            <button
              type="button"
              onClick={handleCopyEod}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Text!' : 'Copy for Slack / Email'}</span>
            </button>
          )}
        </div>
      </div>

      {/* EOD REPORT VIEW */}
      {activeTab === 'eod' && eodData && (
        <div className="space-y-6">
          {/* Executive Daily Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              Daily Executive Marketing Performance — {eodData.date}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Spend</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {formatCurrency(eodData.summary.totalSpend)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Website Traffic</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {eodData.summary.totalSessions.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">sessions</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Leads (MQL / SQL)</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {eodData.summary.totalLeads}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({eodData.summary.totalMql} MQL • {eodData.summary.totalSql} SQL)
                  </span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Blended CPL</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {eodData.summary.cpl !== null ? formatCurrency(eodData.summary.cpl) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Platform Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eodData.platforms.map((p) => (
              <div key={p.platform} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="font-bold text-slate-900 text-sm">{p.platform}</h3>
                  <span className="text-xs font-semibold text-slate-700">
                    {p.spend > 0 ? formatCurrency(p.spend) : 'Spend: Not available'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Traffic</span>
                    <span className="font-semibold text-slate-800">
                      {p.sessions > 0 ? `${p.sessions} ses` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Leads (MQL)</span>
                    <span className="font-semibold text-emerald-600">
                      {p.leads} ({p.mql})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">CPL</span>
                    <span className="font-semibold text-slate-800">
                      {p.cpl !== null ? formatCurrency(p.cpl) : '—'}
                    </span>
                  </div>
                </div>

                {p.activities.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                      Daily Actions
                    </span>
                    <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-0.5">
                      {p.activities.map((act, i) => (
                        <li key={i} className="truncate">
                          {act}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MONTHLY REPORT VIEW */}
      {activeTab === 'monthly' && monthlyData && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Monthly Performance Report — {monthlyData.month}</h2>
                <p className="text-xs text-slate-500">Comprehensive audit of marketing velocity and economics</p>
              </div>
              <a
                href={`/api/export/csv?entity=leads`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Month CSV</span>
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Spend</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {formatCurrency(monthlyData.executiveSummary.totalSpend)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Sessions</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {monthlyData.executiveSummary.sessions.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Leads</span>
                <div className="text-lg font-bold text-emerald-600 mt-1">
                  {monthlyData.executiveSummary.leads}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">MQL</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {monthlyData.executiveSummary.mql}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">SQL</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {monthlyData.executiveSummary.sql}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Blended CPL</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {monthlyData.executiveSummary.cpl !== null
                    ? formatCurrency(monthlyData.executiveSummary.cpl)
                    : '—'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Cost / MQL</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {monthlyData.executiveSummary.costPerMql !== null
                    ? formatCurrency(monthlyData.executiveSummary.costPerMql)
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Channel Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Monthly Channel Attribution Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4 text-right">Monthly Spend</th>
                    <th className="py-3 px-4 text-right">Sessions</th>
                    <th className="py-3 px-4 text-right">Leads</th>
                    <th className="py-3 px-4 text-right">MQL</th>
                    <th className="py-3 px-4 text-right">SQL</th>
                    <th className="py-3 px-4 text-right">CPL</th>
                    <th className="py-3 px-4 text-right">Cost / MQL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData.channelBreakdown.map((r) => (
                    <tr key={r.channel} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.channel}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {r.spend > 0 ? formatCurrency(r.spend) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{r.sessions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">{r.leads}</td>
                      <td className="py-3 px-4 text-right text-slate-800 font-medium">{r.mql}</td>
                      <td className="py-3 px-4 text-right text-slate-800 font-medium">{r.sql}</td>
                      <td className="py-3 px-4 text-right text-slate-800">
                        {r.cpl !== null ? formatCurrency(r.cpl) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-800">
                        {r.costPerMql !== null ? formatCurrency(r.costPerMql) : '—'}
                      </td>
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
