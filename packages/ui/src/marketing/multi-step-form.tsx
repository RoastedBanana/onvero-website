// components/ui/multi-step-form.tsx
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@onvero/lib/utils";
import { X } from "lucide-react";

// ── Layout variants ────────────────────────────────────────────────────────────
const multiStepFormVariants = cva("flex flex-col w-full", {
  variants: {
    size: {
      default: "md:max-w-[640px]",
      sm:      "md:max-w-[480px]",
      lg:      "md:max-w-[820px]",
    },
  },
  defaultVariants: { size: "default" },
});

// ── Simple progress bar (no radix dependency) ──────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="relative h-px w-full overflow-hidden rounded-full"
      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.55)" }}
        initial={false}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface MultiStepFormProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiStepFormVariants> {
  currentStep: number;        // 1-based
  totalSteps: number;
  title: string;
  description?: string;
  onBack: () => void;
  onNext: () => void;
  onClose?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  nextLoading?: boolean;
  footerContent?: React.ReactNode;
  direction?: number;         // 1 = forward, -1 = backward
}

const MultiStepForm = React.forwardRef<HTMLDivElement, MultiStepFormProps>(
  (
    {
      className,
      size,
      currentStep,
      totalSteps,
      title,
      description,
      onBack,
      onNext,
      onClose,
      backButtonText = "Zurück",
      nextButtonText = "Weiter →",
      nextLoading = false,
      footerContent,
      direction = 1,
      children,
      ...props
    },
    ref,
  ) => {
    const progress = Math.round((currentStep / totalSteps) * 100);

    const variants = {
      enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 30 : -30 }),
      center: { opacity: 1, x: 0 },
      exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -30 : 30 }),
    };

    return (
      <div
        ref={ref}
        className={cn(multiStepFormVariants({ size }), className)}
        style={{
          backgroundColor: "#111111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6)",
        }}
        {...props}
      >
        {/* ── Header ── */}
        <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Schließen"
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {description && (
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              {description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <ProgressBar value={progress} />
            <span
              className="text-xs font-medium whitespace-nowrap tabular-nums"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              {currentStep}/{totalSteps}
            </span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-7 py-6 min-h-[320px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-7 py-5 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            {footerContent}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                {backButtonText}
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={nextLoading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              style={{ background: "#ffffff", color: "#000000" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.88)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#ffffff")}
            >
              {nextLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="black" strokeOpacity="0.2" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="black" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Wird gesendet…
                </span>
              ) : nextButtonText}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

MultiStepForm.displayName = "MultiStepForm";

export { MultiStepForm };
