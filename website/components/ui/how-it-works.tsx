'use client';

import { cn } from '@/lib/utils';
import type React from 'react';

export interface StepData {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  steps: StepData[];
  compact?: boolean;
}

const StepCard: React.FC<StepData & { compact?: boolean }> = ({ icon, title, description, benefits, compact }) => (
  <div
    className={cn(
      'relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 ease-in-out',
      'hover:bg-white/[0.04] hover:border-white/[0.12] hover:-translate-y-0.5',
      'group'
    )}
  >
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] group-hover:bg-white/[0.1] transition-colors duration-300">
      {icon}
    </div>
    <h3 className={cn('font-semibold text-white/90 mb-1.5', compact ? 'text-[14px]' : 'text-[15px]')}>{title}</h3>
    <p className={cn('text-white/35 leading-relaxed mb-4', compact ? 'text-xs' : 'text-sm')}>{description}</p>
    <ul className="space-y-2">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-start gap-2.5">
          <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
          </div>
          <span className={cn('text-white/40', compact ? 'text-[11px]' : 'text-xs')}>{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  title = "So funktioniert's",
  subtitle,
  steps,
  compact,
  ...props
}) => {
  return (
    <section className={cn('w-full py-8', className)} {...props}>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className={cn('font-bold tracking-tight text-white/90', compact ? 'text-lg' : 'text-xl')}>{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-white/30 max-w-md mx-auto">{subtitle}</p>}
        </div>

        {/* Step numbers with line */}
        <div className="relative mx-auto mb-6 w-full max-w-3xl">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-px w-[66.6667%] -translate-y-1/2 bg-white/[0.06]"
          />
          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
            {steps.map((_, index) => (
              <div
                key={index}
                className="flex h-7 w-7 items-center justify-center justify-self-center rounded-full bg-white/[0.06] text-[11px] font-semibold text-white/50 ring-4 ring-[#080808]"
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Steps Grid */}
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(steps.length, 3)}, 1fr)` }}
        >
          {steps.map((step, index) => (
            <StepCard key={index} {...step} compact={compact} />
          ))}
        </div>
      </div>
    </section>
  );
};
