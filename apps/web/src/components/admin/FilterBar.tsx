'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

export interface FilterBarProps {
  /** Search value */
  searchValue: string;
  /** Search change handler */
  onSearchChange: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Filter configurations */
  filters: FilterConfig[];
  /** Current filter values */
  filterValues: Record<string, string>;
  /** Filter change handler */
  onFilterChange: (key: string, value: string) => void;
  /** Clear all filters handler */
  onClearFilters: () => void;
  /** Optional additional filters (e.g., date inputs) */
  additionalFilters?: React.ReactNode;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * FilterSelect Component
 * A styled select dropdown for filters
 */
function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'الكل',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm appearance-none cursor-pointer hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute left-3 top-8 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

/**
 * FilterBar Component
 * A comprehensive filter bar with search, expandable filters, and clear functionality
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'بحث...',
  filters,
  filterValues,
  onFilterChange,
  onClearFilters,
  additionalFilters,
  className = '',
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Count active filters
  const activeFiltersCount = Object.values(filterValues).filter(Boolean).length;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          فلاتر
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filters.map((filter) => (
              <FilterSelect
                key={filter.key}
                label={filter.label}
                value={filterValues[filter.key] || ''}
                onChange={(v) => onFilterChange(filter.key, v)}
                options={filter.options}
                placeholder={filter.placeholder}
              />
            ))}
            {additionalFilters}
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClearFilters}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
