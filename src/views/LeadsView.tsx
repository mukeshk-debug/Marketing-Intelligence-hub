import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { Lead, LeadStatus, CurrencyCode } from '../types/index.ts';
import { useFilters } from '../context/FilterContext.tsx';

export const LeadsView: React.FC = () => {
  const { filters, formatCurrency } = useFilters();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicateCount: number;
    duplicates: any[];
    errors: string[];
  } | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        search,
        startDate: filters.startDate,
        endDate: filters.endDate,
        leadStatus: statusFilter !== 'all' ? statusFilter : filters.leadStatus,
        source: filters.source,
        medium: filters.medium,
        campaign: filters.campaign,
        mqlOnly: filters.mqlOnly ? 'true' : 'false',
        sqlOnly: filters.sqlOnly ? 'true' : 'false',
      });

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Lead duplicate checking during form input
  const checkDuplicate = async (email?: string, phone?: string, external_id?: string) => {
    if (!email && !phone && !external_id) {
      setDuplicateWarning(null);
      return;
    }
    try {
      const res = await fetch('/api/leads/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          external_id,
          excludeId: formMode === 'edit' ? formData.id : undefined,
        }),
      });
      const data = await res.json();
      if (data.isDuplicate) {
        setDuplicateWarning(
          `Warning: Duplicate match found on ${data.matchedField} for existing lead "${data.existingLead.name}" (${data.existingLead.company || 'No company'})`
        );
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      status: 'New',
      source: 'google',
      medium: 'cpc',
      campaign: 'AI Development',
      landing_page: 'https://example.com/ai-development',
      country: 'United States',
      service: 'AI Development',
      is_mql: false,
      is_sql: false,
      is_opportunity: false,
      is_proposal: false,
      is_won: false,
      revenue: 0,
      currency: 'USD',
    });
    setDuplicateWarning(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setFormMode('edit');
    setFormData({ ...lead });
    setDuplicateWarning(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || !formData.email) {
      setFormError('Lead name and email are mandatory.');
      return;
    }

    try {
      const url = formMode === 'create' ? '/api/leads' : `/api/leads/${formData.id}`;
      const method = formMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          formMode === 'create'
            ? {
                lead: formData,
                attribution: {
                  first_source: formData.source,
                  first_medium: formData.medium,
                  first_campaign: formData.campaign,
                  first_landing_page: formData.landing_page,
                  last_source: formData.source,
                  last_medium: formData.medium,
                  last_campaign: formData.campaign,
                  last_landing_page: formData.landing_page,
                },
              }
            : formData
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save lead');
        return;
      }

      setIsFormOpen(false);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || 'Network error');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this lead?')) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedLead?.id === id) setIsDetailOpen(false);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Parsing & Import
  const handleParseCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length === 0 || !cols[0]) continue;
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] || '';
      });

      // Normalize fields
      rows.push({
        date: obj.date || new Date().toISOString().slice(0, 10),
        name: obj.name || obj.lead || 'Unknown',
        company: obj.company || '',
        email: obj.email || '',
        phone: obj.phone || '',
        country: obj.country || 'Global',
        service: obj.service || 'General',
        source: obj.source || obj.utm_source || 'direct',
        medium: obj.medium || obj.utm_medium || 'none',
        campaign: obj.campaign || obj.utm_campaign || 'direct',
        landing_page: obj.landing_page || obj.landingpage || 'https://example.com',
        status: (obj.status as LeadStatus) || 'New',
        is_mql: obj.mql === '1' || obj.is_mql === 'true' || obj.status === 'MQL',
        is_sql: obj.sql === '1' || obj.is_sql === 'true' || obj.status === 'SQL',
        is_opportunity: obj.opportunity === '1' || obj.status === 'Opportunity',
        is_won: obj.won === '1' || obj.status === 'Won',
        revenue: Number(obj.revenue) || 0,
        currency: (obj.currency as CurrencyCode) || 'USD',
        external_id: obj.external_id || obj.externalid || '',
      });
    }

    setCsvPreview(rows);
  };

  const handleExecuteImport = async () => {
    if (csvPreview.length === 0) return;
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'leads', rows: csvPreview }),
      });
      const data = await res.json();
      setImportResult(data);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="leads-view" className="p-6 space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="leads-search-input"
              placeholder="Search leads by name, email, company, phone, campaign..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            id="leads-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="MQL">MQL</option>
            <option value="SQL">SQL</option>
            <option value="Opportunity">Opportunity</option>
            <option value="Proposal">Proposal</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-csv-import-modal"
            type="button"
            onClick={() => {
              setCsvText('');
              setCsvPreview([]);
              setImportResult(null);
              setIsImportOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Import</span>
          </button>

          <a
            id="export-leads-csv-btn"
            href="/api/export/csv?entity=leads"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Export</span>
          </a>

          <button
            id="add-new-lead-button"
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Lead</th>
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Country</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Source / Med</th>
                <th className="py-3 px-3">Campaign</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">MQL</th>
                <th className="py-3 px-3 text-center">SQL</th>
                <th className="py-3 px-3 text-right">Revenue</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{lead.date}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsDetailOpen(true);
                      }}
                      className="hover:text-blue-600 text-left font-semibold cursor-pointer"
                    >
                      {lead.name}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{lead.company || '—'}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{lead.email}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{lead.phone || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{lead.country}</td>
                  <td className="py-2.5 px-3 text-slate-700">{lead.service}</td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    <span className="font-medium text-slate-800">{lead.source}</span>
                    <span className="text-slate-400"> / {lead.medium}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={lead.campaign}>
                    {lead.campaign}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        lead.status === 'Won'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lead.status === 'Lost'
                          ? 'bg-red-100 text-red-800'
                          : lead.status === 'Proposal' || lead.status === 'Opportunity'
                          ? 'bg-purple-100 text-purple-800'
                          : lead.status === 'MQL' || lead.status === 'SQL'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {lead.is_mql ? (
                      <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold leading-4">
                        ✓
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {lead.is_sql ? (
                      <span className="inline-block w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold leading-4">
                        ✓
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-900 whitespace-nowrap">
                    {lead.revenue > 0 ? formatCurrency(lead.revenue) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLead(lead);
                          setIsDetailOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        title="View Full Attribution & Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(lead)}
                        className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100"
                        title="Edit Lead"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400">
                    No leads found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{leads.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span> total leads
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {page} of {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* LEAD DETAIL MODAL */}
      {isDetailOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedLead.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedLead.company || 'Private Lead'} • Lead ID: {selectedLead.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Section 1: Lead Information */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Lead Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email</span>
                    <span className="font-semibold text-slate-800">{selectedLead.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone</span>
                    <span className="font-semibold text-slate-800">{selectedLead.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Country</span>
                    <span className="font-semibold text-slate-800">{selectedLead.country}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Service Inquired</span>
                    <span className="font-semibold text-slate-800">{selectedLead.service}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date Created</span>
                    <span className="font-semibold text-slate-800">{selectedLead.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">External Lead ID</span>
                    <span className="font-mono text-slate-700">{selectedLead.external_id || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Attribution (First Touch vs Last Touch) */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Attribution Touchpoints
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Touch */}
                  <div className="p-3.5 rounded-lg border border-blue-100 bg-blue-50/40 text-xs space-y-1.5">
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                      First Touch (Initial Discovery)
                    </span>
                    <div>
                      <span className="text-slate-500">Source / Medium: </span>
                      <strong className="text-slate-800">
                        {selectedLead.attribution?.first_source || selectedLead.source} /{' '}
                        {selectedLead.attribution?.first_medium || selectedLead.medium}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Campaign: </span>
                      <span className="text-slate-800">
                        {selectedLead.attribution?.first_campaign || selectedLead.campaign}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Landing Page: </span>
                      <span className="font-mono text-[11px] text-slate-700 truncate block">
                        {selectedLead.attribution?.first_landing_page || selectedLead.landing_page}
                      </span>
                    </div>
                  </div>

                  {/* Last Touch */}
                  <div className="p-3.5 rounded-lg border border-emerald-100 bg-emerald-50/40 text-xs space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Last Touch (Conversion Action)
                    </span>
                    <div>
                      <span className="text-slate-500">Source / Medium: </span>
                      <strong className="text-slate-800">
                        {selectedLead.attribution?.last_source || selectedLead.source} /{' '}
                        {selectedLead.attribution?.last_medium || selectedLead.medium}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Campaign: </span>
                      <span className="text-slate-800">
                        {selectedLead.attribution?.last_campaign || selectedLead.campaign}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Landing Page: </span>
                      <span className="font-mono text-[11px] text-slate-700 truncate block">
                        {selectedLead.attribution?.last_landing_page || selectedLead.landing_page}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Qualification & Sales */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Qualification & Sales
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block text-[11px]">Current Status</span>
                    <span className="font-bold text-slate-900">{selectedLead.status}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block text-[11px]">Reported Revenue</span>
                    <span className="font-bold text-emerald-600">
                      {selectedLead.revenue > 0 ? formatCurrency(selectedLead.revenue) : '—'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block text-[11px]">Assigned Rep</span>
                    <span className="font-medium text-slate-800">{selectedLead.assigned_to || 'Unassigned'}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block text-[11px]">Won / Closed</span>
                    <span className="font-medium text-slate-800">{selectedLead.is_won ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Internal Marketing & Discovery Notes
                  </h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {selectedLead.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT LEAD MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {formMode === 'create' ? 'Add New Lead' : 'Edit Lead Record'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              {/* Duplicate warning alert */}
              {duplicateWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Duplicate Lead Alert:</span> {duplicateWarning}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lead Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      checkDuplicate(e.target.value, formData.phone, formData.external_id);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      checkDuplicate(formData.email, e.target.value, formData.external_id);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Service</label>
                  <input
                    type="text"
                    value={formData.service || ''}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={formData.source || ''}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Medium</label>
                  <input
                    type="text"
                    value={formData.medium || ''}
                    onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Campaign</label>
                  <input
                    type="text"
                    value={formData.campaign || ''}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Landing Page URL</label>
                  <input
                    type="text"
                    value={formData.landing_page || ''}
                    onChange={(e) => setFormData({ ...formData, landing_page: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'New'}
                    onChange={(e) => {
                      const st = e.target.value as LeadStatus;
                      setFormData({
                        ...formData,
                        status: st,
                        is_mql: st === 'MQL' || st === 'SQL' || st === 'Opportunity' || st === 'Proposal' || st === 'Won',
                        is_sql: st === 'SQL' || st === 'Opportunity' || st === 'Proposal' || st === 'Won',
                        is_opportunity: st === 'Opportunity' || st === 'Proposal' || st === 'Won',
                        is_won: st === 'Won',
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="MQL">MQL</option>
                    <option value="SQL">SQL</option>
                    <option value="Opportunity">Opportunity</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                    <option value="Invalid">Invalid</option>
                    <option value="Duplicate">Duplicate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Revenue ($)</label>
                  <input
                    type="number"
                    value={formData.revenue || 0}
                    onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="px-0 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-xs"
                >
                  {formMode === 'create' ? 'Create Lead' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">CSV Lead Importer</h3>
                <p className="text-xs text-slate-500">
                  Bulk import leads with column validation and automated duplicate detection
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Paste CSV Data (or upload file):
                </label>
                <textarea
                  rows={5}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Date,Name,Company,Email,Phone,Country,Service,Source,Medium,Campaign,LandingPage,Status,MQL,SQL&#10;2026-09-15,John Smith,Acme Corp,john@acme.com,+1234567890,United States,AI Development,google,cpc,AI Development,https://example.com/ai-development,MQL,1,0"
                  className="w-full p-2.5 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        setCsvText(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="text-xs text-slate-500"
                />

                <button
                  type="button"
                  onClick={handleParseCsv}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900"
                >
                  Parse & Preview
                </button>
              </div>

              {/* Preview Table */}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Preview: {csvPreview.length} leads parsed
                    </span>
                    <span className="text-[11px] text-slate-500">Duplicate detection will run on import</span>
                  </div>

                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 text-[11px]">
                        <tr>
                          <th className="py-2 px-2.5">Name</th>
                          <th className="py-2 px-2.5">Company</th>
                          <th className="py-2 px-2.5">Email</th>
                          <th className="py-2 px-2.5">Source</th>
                          <th className="py-2 px-2.5">Campaign</th>
                          <th className="py-2 px-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreview.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td className="py-1.5 px-2.5 font-medium text-slate-800">{r.name}</td>
                            <td className="py-1.5 px-2.5 text-slate-600">{r.company}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-600">{r.email}</td>
                            <td className="py-1.5 px-2.5">{r.source}</td>
                            <td className="py-1.5 px-2.5">{r.campaign}</td>
                            <td className="py-1.5 px-2.5">{r.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Results */}
              {importResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-700">
                    <Check className="w-4 h-4" />
                    <span>Successfully imported {importResult.imported} records!</span>
                  </div>
                  {importResult.duplicateCount > 0 && (
                    <div className="text-amber-700">
                      <strong>Duplicate Warning:</strong> {importResult.duplicateCount} duplicate records were safely
                      skipped to prevent duplicate database pollution.
                    </div>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="text-red-600">
                      <strong>Errors:</strong> {importResult.errors.join('; ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
              >
                Close
              </button>
              {csvPreview.length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-xs"
                >
                  Import {csvPreview.length} Records
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
