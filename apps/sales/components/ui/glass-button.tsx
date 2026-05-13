'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

const glassButtonVariants = cva('relative isolate cursor-pointer rounded-full transition-all', {
  variants: {
    size: {
      default: 'text-base font-medium',
      sm: 'text-sm font-medium',
      lg: 'text-lg font-medium',
      icon: 'h-9 w-9',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const glassButtonTextVariants = cva('glass-button-text relative block select-none tracking-tight', {
  variants: {
    size: {
      default: 'px-5 py-2.5',
      sm: 'px-3.5 py-1.5',
      lg: 'px-7 py-3.5',
      icon: 'flex h-9 w-9 items-center justify-center',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
  isDark?: boolean;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, isDark, style, ...props }, ref) => {
    return (
      <div className={cn('glass-button-wrap cursor-pointer rounded-full', className)}>
        <button
          className={cn('glass-button', isDark && 'glass-button-dark', glassButtonVariants({ size }))}
          ref={ref}
          style={style}
          {...props}
        >
          <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>{children}</span>
        </button>
        <div className="glass-button-shadow rounded-full" style={isDark ? { opacity: 0.25 } : undefined} />
      </div>
    );
  }
);
GlassButton.displayName = 'GlassButton';

export { GlassButton, glassButtonVariants };
