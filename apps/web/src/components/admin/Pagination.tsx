'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Handler for page change */
  onPageChange: (page: number) => void;
  /** Maximum number of page buttons to show */
  maxVisiblePages?: number;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Pagination Component
 * A flexible pagination component with page numbers and navigation
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className = '',
}: PaginationProps) {
  const pages = useMemo(() => {
    const result: (number | string)[] = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        result.push(i);
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2);

      if (currentPage <= half + 1) {
        // Near the start
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          result.push(i);
        }
        result.push('...');
        result.push(totalPages);
      } else if (currentPage >= totalPages - half) {
        // Near the end
        result.push(1);
        result.push('...');
        for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++) {
          result.push(i);
        }
      } else {
        // In the middle
        result.push(1);
        result.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          result.push(i);
        }
        result.push('...');
        result.push(totalPages);
      }
    }

    return result;
  }, [currentPage, totalPages, maxVisiblePages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Page Numbers */}
      {pages.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : page === '...'
              ? 'cursor-default text-gray-400'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-label={typeof page === 'number' ? `صفحة ${page}` : undefined}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="الصفحة التالية"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  );
}

export default Pagination;
