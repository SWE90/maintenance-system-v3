'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface InfoCardProps {
  /** Card title */
  title: string;
  /** Icon component to display next to title */
  icon: React.ElementType;
  /** Card content */
  children: ReactNode;
  /** Optional actions to display in the header */
  actions?: ReactNode;
  /** Whether the card can be collapsed */
  collapsible?: boolean;
  /** Default open state (for collapsible cards) */
  defaultOpen?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * InfoCard Component
 * A card component for displaying information sections with optional collapse functionality
 */
export function InfoCard({
  title,
  icon: Icon,
  children,
  actions,
  collapsible = false,
  defaultOpen = true,
  className = '',
}: InfoCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div
        className={`px-4 py-3 border-b border-gray-100 flex items-center justify-between ${
          collapsible ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-500" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {actions}
          {collapsible && (
            <button className="p-1 text-gray-400 hover:text-gray-600">
              {isOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
      {(!collapsible || isOpen) && <div className="p-4">{children}</div>}
    </div>
  );
}

export interface InfoRowProps {
  /** Row label */
  label: string;
  /** Row value */
  value: ReactNode;
  /** Optional icon */
  icon?: React.ElementType;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * InfoRow Component
 * A row component for displaying label-value pairs within InfoCard
 */
export function InfoRow({ label, value, icon: Icon, className = '' }: InfoRowProps) {
  return (
    <div className={`flex items-start py-2 ${className}`}>
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex-1 text-sm text-gray-900 font-medium">{value}</div>
    </div>
  );
}

export default InfoCard;
