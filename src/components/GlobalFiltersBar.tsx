import React from 'react';
import { useFilters } from '../context/FilterContext.tsx';
import type { PlatformType, LeadStatus } from '../types/index.ts';

interface GlobalFiltersBarProps {
  platforms?: PlatformType[];
  campaigns?: string[];
  landingPages?: string[];
}

export const GlobalFiltersBar: React.FC<GlobalFiltersBarProps> = ({
  platforms = [
    'Google Ads',
    'Bing Ads',
    'Organic Search',
    'GoodFirms',
    'Clutch',
    'Meta Ads',
    'LinkedIn',
    'Direct',
    'Referral',
    'Other',
  ],
  campaigns = [
    'AI Development',
    'Custom Software Development',
    'Blockchain Development',
    'Mobile App Development',
    'SEO High Intent B2B',
    'GoodFirms Top Tier Directory',
    'Clutch Leaders Matrix',
    'LinkedIn B2B Decision Makers',
  ],
  landingPages = [
    'https://example.com/ai-development',
    'https://example.com/custom-software',
    'https://example.com/mobile-apps',
    'https://example.com/blockchain',
    'https://example.com/cloud-architecture',
  ],
}) => {
  const { filters, setFilters } = useFilters();

  const sources = ['google', 'bing', 'goodfirms', 'clutch', 'meta', 'linkedin', 'direct', 'partner-directory'];
  const mediums = ['cpc', 'organic', 'referral', 'paid-social', 'display', 'none'];
  const countries = ['United States', 'United Kingdom', 'Germany', 'United Arab Emirates', 'India', 'Canada', 'Singapore'];
  const services = [
    'AI Development',
    'Custom Software',
    'Blockchain Engineering',
    'Mobile Apps',
    'Cloud Architecture',
    'Enterprise Solutions',
  ];
  const leadStatuses: LeadStatus[] = [
    'New',
    'Contacted',
    'Qualified',
    'MQL',
    'SQL',
    'Opportunity',
    'Proposal',
    'Won',
    'Lost',
    'Invalid',
    'Duplicate',
  ];

  const update = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div id="global-filters-container" className="bg-slate-50 border-b border-slate-200 px-6 py-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Platform */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Platform</label>
          <select
            id="filter-platform-select"
            value={filters.platform}
            onChange={(e) => update('platform', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Source</label>
          <select
            id="filter-source-select"
            value={filters.source}
            onChange={(e) => update('source', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Medium */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Medium</label>
          <select
            id="filter-medium-select"
            value={filters.medium}
            onChange={(e) => update('medium', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Mediums</option>
            {mediums.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Campaign */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Campaign</label>
          <select
            id="filter-campaign-select"
            value={filters.campaign}
            onChange={(e) => update('campaign', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Country</label>
          <select
            id="filter-country-select"
            value={filters.country}
            onChange={(e) => update('country', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Service */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Service</label>
          <select
            id="filter-service-select"
            value={filters.service}
            onChange={(e) => update('service', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Services</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Landing Page */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Landing Page</label>
          <select
            id="filter-landing-page-select"
            value={filters.landingPage}
            onChange={(e) => update('landingPage', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          >
            <option value="all">All Landing Pages</option>
            {landingPages.map((lp) => (
              <option key={lp} value={lp}>
                {lp.replace('https://example.com/', '/')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Secondary toggles row */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Lead Status:</span>
            <select
              id="filter-lead-status-select"
              value={filters.leadStatus}
              onChange={(e) => update('leadStatus', e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
            >
              <option value="all">All Statuses</option>
              {leadStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              id="filter-mql-only-checkbox"
              checked={filters.mqlOnly}
              onChange={(e) => update('mqlOnly', e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>MQL Only</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              id="filter-sql-only-checkbox"
              checked={filters.sqlOnly}
              onChange={(e) => update('sqlOnly', e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>SQL Only</span>
          </label>
        </div>

        <div className="text-[11px] text-slate-400">
          Range: <span className="font-medium text-slate-600">{filters.startDate}</span> to{' '}
          <span className="font-medium text-slate-600">{filters.endDate}</span>
        </div>
      </div>
    </div>
  );
};
