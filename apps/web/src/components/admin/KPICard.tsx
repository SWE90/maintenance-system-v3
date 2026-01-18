'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export interface KPICardProps {
  /** Title of the KPI card */
  title: string;
  /** Main value to display */
  value: number | string;
  /** Lucide icon component */
  icon: React.ElementType;
  /** Icon background color class (e.g., 'bg-blue-500') */
  iconColor: string;
  /** Card background color class (e.g., 'bg-blue-50') */
  bgColor: string;
  /** Optional change indicator */
  change?: {
    value: number;
    isPositive: boolean;
  };
  /** Optional link to navigate when clicked */
  href?: string;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * KPICard Component
 * Displays a key performance indicator with icon, value, and optional trend
 */
export function KPICard({
  title,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  change,
  href,
  className = '',
}: KPICardProps) {
  const content = (
    <div
      className={`p-6 rounded-xl transition-shadow hover:shadow-md ${bgColor} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 ${!change.isPositive ? 'rotate-180' : ''}`}
              />
              <span>{change.value}% من الأمس</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default KPICard;
