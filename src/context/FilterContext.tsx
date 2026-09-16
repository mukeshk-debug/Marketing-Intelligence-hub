import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { GlobalFilterState, CurrencyCode } from '../types/index.ts';

interface FilterContextType {
  filters: GlobalFilterState;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilterState>>;
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (c: CurrencyCode) => void;
  formatCurrency: (amount: number, currency?: CurrencyCode) => string;
  setDatePreset: (preset: GlobalFilterState['dateRange']) => void;
  resetFilters: () => void;
}

// Preset date ranges calculation relative to 2026-09-15
export function computeDatePreset(preset: GlobalFilterState['dateRange']): { startDate: string; endDate: string } {
  // Application base date: 2026-09-15
  const base = new Date('2026-09-15T00:00:00Z');
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  switch (preset) {
    case 'today':
      return { startDate: '2026-09-15', endDate: '2026-09-15' };
    case 'yesterday':
      return { startDate: '2026-09-14', endDate: '2026-09-14' };
    case 'last7': {
      const start = new Date(base.getTime() - 6 * 86400000);
      return { startDate: formatDate(start), endDate: '2026-09-15' };
    }
    case 'last30': {
      const start = new Date(base.getTime() - 29 * 86400000);
      return { startDate: formatDate(start), endDate: '2026-09-15' };
    }
    case 'thisMonth':
      return { startDate: '2026-09-01', endDate: '2026-09-15' };
    case 'prevMonth':
      return { startDate: '2026-08-01', endDate: '2026-08-31' };
    case 'custom':
    default:
      return { startDate: '2026-08-17', endDate: '2026-09-15' };
  }
}

const defaultRange = computeDatePreset('last30');

export const defaultFilters: GlobalFilterState = {
  dateRange: 'last30',
  startDate: defaultRange.startDate,
  endDate: defaultRange.endDate,
  platform: 'all',
  source: 'all',
  medium: 'all',
  campaign: 'all',
  country: 'all',
  service: 'all',
  landingPage: 'all',
  leadStatus: 'all',
  mqlOnly: false,
  sqlOnly: false,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const defaultRates: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 83.5,
  AED: 3.67,
  GBP: 0.79,
  SAR: 3.75,
  EUR: 0.92,
};

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<GlobalFilterState>(defaultFilters);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(defaultRates);

  useEffect(() => {
    fetch('/api/currencies')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.exchangeRates) {
          const map: Record<string, number> = { ...defaultRates };
          for (const r of data.exchangeRates) {
            if (r.from_currency === 'USD') {
              map[r.to_currency] = r.rate;
            }
          }
          setExchangeRates(map);
        }
      })
      .catch((err) => console.error('Error loading currency rates:', err));
  }, []);

  const setDatePreset = useCallback((preset: GlobalFilterState['dateRange']) => {
    const { startDate, endDate } = computeDatePreset(preset);
    setFilters((prev) => ({
      ...prev,
      dateRange: preset,
      startDate,
      endDate,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    const range = computeDatePreset('last30');
    setFilters({
      ...defaultFilters,
      startDate: range.startDate,
      endDate: range.endDate,
    });
  }, []);

  const formatCurrency = useCallback(
    (amount: number, currency: CurrencyCode = selectedCurrency): string => {
      const symbols: Record<CurrencyCode, string> = {
        USD: '$',
        INR: '₹',
        AED: 'AED ',
        GBP: '£',
        SAR: 'SAR ',
        EUR: '€',
      };
      const sym = symbols[currency] || '$';
      const rate = exchangeRates[currency] || defaultRates[currency] || 1;
      const converted = amount * rate;
      return `${sym}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    },
    [selectedCurrency, exchangeRates]
  );

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        selectedCurrency,
        setSelectedCurrency,
        formatCurrency,
        setDatePreset,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
