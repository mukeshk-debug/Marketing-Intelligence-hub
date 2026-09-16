import React from 'react';
import { Calendar, RefreshCw, Link2, DollarSign, Filter } from 'lucide-react';
import { useFilters } from '../context/FilterContext.tsx';
import type { CurrencyCode, GlobalFilterState } from '../types/index.ts';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenUtmBuilder: () => void;
  showFiltersToggle?: boolean;
  filtersOpen?: boolean;
  setFiltersOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenUtmBuilder,
  showFiltersToggle = true,
  filtersOpen,
  setFiltersOpen,
}) => {
  const { filters, setDatePreset, setFilters, selectedCurrency, setSelectedCurrency, resetFilters } = useFilters();

  const presets: { key: GlobalFilterState['dateRange']; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7', label: 'Last 7 Days' },
    { key: 'last30', label: 'Last 30 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'prevMonth', label: 'Previous Month' },
    { key: 'custom', label: 'Custom Range' },
  ];

  const currencies: CurrencyCode[] = ['USD', 'INR', 'AED', 'GBP', 'SAR', 'EUR'];

  return (
    <header id="main-header" className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title area */}
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Currency Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-slate-500 ml-1 mr-0.5" />
            <select
              id="currency-selector"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
              className="bg-transparent text-slate-700 font-medium py-1 px-1 focus:outline-none cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1 mr-1" />
            <select
              id="date-range-preset-selector"
              value={filters.dateRange}
              onChange={(e) => setDatePreset(e.target.value as GlobalFilterState['dateRange'])}
              className="bg-transparent text-slate-800 font-medium py-1 pr-2 focus:outline-none cursor-pointer"
            >
              {presets.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>

            {filters.dateRange === 'custom' && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-300">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700"
                />
              </div>
            )}
          </div>

          {/* Filter Bar Toggle */}
          {showFiltersToggle && setFiltersOpen && (
            <button
              id="toggle-filters-bar-button"
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filtersOpen
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          )}

          {/* UTM Builder Quick Button */}
          <button
            id="header-utm-builder-button"
            type="button"
            onClick={onOpenUtmBuilder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>UTM Builder</span>
          </button>

          {/* Reset Filters */}
          <button
            id="reset-all-filters-button"
            type="button"
            onClick={resetFilters}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Reset all filters to defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
