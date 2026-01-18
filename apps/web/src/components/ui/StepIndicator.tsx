'use client';

import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface Step {
  /** Step number (1-based) */
  number: number;
  /** Step label/title */
  label: string;
  /** Optional description */
  description?: string;
}

export interface StepIndicatorProps {
  /** Array of step definitions */
  steps: Step[];
  /** Current active step (1-based) */
  currentStep: number;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional click handler for step navigation */
  onStepClick?: (stepNumber: number) => void;
  /** Whether clicking on steps is allowed */
  clickable?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * StepIndicator Component
 * A stepper component showing progress through wizard steps (1-2-3)
 */
export function StepIndicator({
  steps,
  currentStep,
  orientation = 'horizontal',
  size = 'md',
  onStepClick,
  clickable = false,
  className,
}: StepIndicatorProps) {
  const isStepCompleted = (stepNumber: number) => stepNumber < currentStep;
  const isStepActive = (stepNumber: number) => stepNumber === currentStep;
  const isStepPending = (stepNumber: number) => stepNumber > currentStep;

  const handleStepClick = (stepNumber: number) => {
    if (clickable && onStepClick && stepNumber <= currentStep) {
      onStepClick(stepNumber);
    }
  };

  const sizeConfig = {
    sm: {
      circle: 'w-8 h-8',
      font: 'text-sm',
      labelFont: 'text-xs',
      descFont: 'text-xs',
      connector: 'h-0.5',
      connectorVertical: 'w-0.5',
    },
    md: {
      circle: 'w-10 h-10',
      font: 'text-base',
      labelFont: 'text-sm',
      descFont: 'text-xs',
      connector: 'h-0.5',
      connectorVertical: 'w-0.5',
    },
    lg: {
      circle: 'w-12 h-12',
      font: 'text-lg',
      labelFont: 'text-base',
      descFont: 'text-sm',
      connector: 'h-1',
      connectorVertical: 'w-1',
    },
  };

  const config = sizeConfig[size];

  if (orientation === 'vertical') {
    return (
      <div className={clsx('flex flex-col', className)}>
        {steps.map((step, index) => {
          const completed = isStepCompleted(step.number);
          const active = isStepActive(step.number);
          const pending = isStepPending(step.number);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex">
              {/* Step indicator and connector */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <button
                  type="button"
                  onClick={() => handleStepClick(step.number)}
                  disabled={!clickable || pending}
                  className={clsx(
                    'flex items-center justify-center rounded-full border-2 transition-all duration-300',
                    config.circle,
                    config.font,
                    {
                      'bg-primary-500 border-primary-500 text-white': completed,
                      'bg-primary-500 border-primary-500 text-white ring-4 ring-primary-100': active,
                      'bg-white border-gray-300 text-gray-400': pending,
                      'cursor-pointer hover:scale-105': clickable && !pending,
                      'cursor-default': !clickable || pending,
                    }
                  )}
                  aria-label={`الخطوة ${step.number}: ${step.label}`}
                  aria-current={active ? 'step' : undefined}
                >
                  {completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </button>

                {/* Vertical connector */}
                {!isLast && (
                  <div
                    className={clsx(
                      'flex-1 min-h-[40px] my-2 transition-colors duration-300',
                      config.connectorVertical,
                      {
                        'bg-primary-500': completed,
                        'bg-gray-200': !completed,
                      }
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 mr-4 pb-8">
                <p
                  className={clsx(
                    'font-medium transition-colors duration-300',
                    config.labelFont,
                    {
                      'text-primary-700': completed || active,
                      'text-gray-400': pending,
                    }
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p
                    className={clsx(
                      'mt-1 transition-colors duration-300',
                      config.descFont,
                      {
                        'text-primary-600': completed || active,
                        'text-gray-400': pending,
                      }
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={clsx('flex items-center w-full', className)}>
      {steps.map((step, index) => {
        const completed = isStepCompleted(step.number);
        const active = isStepActive(step.number);
        const pending = isStepPending(step.number);
        const isLast = index === steps.length - 1;

        return (
          <div
            key={step.number}
            className={clsx('flex items-center', {
              'flex-1': !isLast,
            })}
          >
            {/* Step */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <button
                type="button"
                onClick={() => handleStepClick(step.number)}
                disabled={!clickable || pending}
                className={clsx(
                  'flex items-center justify-center rounded-full border-2 transition-all duration-300',
                  config.circle,
                  config.font,
                  {
                    'bg-primary-500 border-primary-500 text-white': completed,
                    'bg-primary-500 border-primary-500 text-white ring-4 ring-primary-100': active,
                    'bg-white border-gray-300 text-gray-400': pending,
                    'cursor-pointer hover:scale-105': clickable && !pending,
                    'cursor-default': !clickable || pending,
                  }
                )}
                aria-label={`الخطوة ${step.number}: ${step.label}`}
                aria-current={active ? 'step' : undefined}
              >
                {completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.number}</span>
                )}
              </button>

              {/* Label */}
              <div className="mt-2 text-center">
                <p
                  className={clsx(
                    'font-medium transition-colors duration-300 whitespace-nowrap',
                    config.labelFont,
                    {
                      'text-primary-700': completed || active,
                      'text-gray-400': pending,
                    }
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p
                    className={clsx(
                      'mt-0.5 transition-colors duration-300',
                      config.descFont,
                      {
                        'text-primary-600': completed || active,
                        'text-gray-400': pending,
                      }
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector */}
            {!isLast && (
              <div
                className={clsx(
                  'flex-1 mx-4 transition-colors duration-300',
                  config.connector,
                  {
                    'bg-primary-500': completed,
                    'bg-gray-200': !completed,
                  }
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Default 3-step wizard configuration
 */
export const DEFAULT_WIZARD_STEPS: Step[] = [
  { number: 1, label: 'بيانات الجهاز', description: 'نوع الجهاز والمشكلة' },
  { number: 2, label: 'الموقع', description: 'العنوان والخريطة' },
  { number: 3, label: 'التأكيد', description: 'مراجعة وإرسال' },
];

export default StepIndicator;
