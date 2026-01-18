'use client';

import { ReactNode } from 'react';

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  children: ReactNode;
}

export function StepWizard({ steps, currentStep, children }: StepWizardProps) {
  return (
    <div>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Steps */}
          {steps.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step.id < currentStep
                    ? 'bg-blue-500 text-white'
                    : step.id === currentStep
                    ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {step.id < currentStep ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  step.id <= currentStep ? 'text-white' : 'text-slate-500'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="animate-fade-in">{children}</div>
    </div>
  );
}

interface StepNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  backLabel?: string;
  disabled?: boolean;
}

export function StepNavigation({
  onBack,
  onNext,
  onSubmit,
  isFirstStep,
  isLastStep,
  isLoading,
  nextLabel = 'التالي',
  submitLabel = 'ارسال',
  backLabel = 'السابق',
  disabled,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-slate-700 mt-8">
      {!isFirstStep ? (
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <ChevronRightIcon className="w-5 h-5" />
          <span>{backLabel}</span>
        </button>
      ) : (
        <div />
      )}

      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || disabled}
          className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري الارسال...</span>
            </>
          ) : (
            <>
              <span>{submitLabel}</span>
              <CheckIcon className="w-5 h-5" />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading || disabled}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{nextLabel}</span>
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// Icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
