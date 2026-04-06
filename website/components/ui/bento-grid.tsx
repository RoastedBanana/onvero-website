'use client';

import { cn } from '@/lib/utils';

export interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
  onClick?: () => void;
  accent?: string;
}

interface BentoGridProps {
  items: BentoItem[];
}

function BentoGrid({ items }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-7xl mx-auto">
      {items.map((item, index) => (
        <div
          key={index}
          onClick={item.onClick}
          className={cn(
            'group relative p-5 rounded-xl overflow-hidden transition-all duration-300',
            'border border-white/[0.06] bg-white/[0.02]',
            'hover:shadow-[0_4px_20px_rgba(255,255,255,0.03)]',
            'hover:-translate-y-1 will-change-transform',
            item.onClick && 'cursor-pointer',
            item.colSpan === 2 ? 'md:col-span-2' : 'col-span-1',
            {
              'shadow-[0_2px_12px_rgba(255,255,255,0.03)] -translate-y-0.5': item.hasPersistentHover,
            }
          )}
        >
          {/* Dot pattern overlay on hover */}
          <div
            className={`absolute inset-0 ${
              item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            } transition-opacity duration-300`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[length:4px_4px]" />
          </div>

          <div className="relative flex flex-col space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.06] group-hover:bg-white/[0.1] transition-all duration-300">
                {item.icon}
              </div>
              {item.status && (
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase',
                    'bg-white/[0.06] text-white/40',
                    'transition-colors duration-300 group-hover:bg-white/[0.1] group-hover:text-white/60'
                  )}
                >
                  {item.status}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-white/90 tracking-tight text-[15px]">
                {item.title}
                {item.meta && (
                  <span className="ml-2 text-xs text-white/30 font-normal font-[family-name:var(--font-dm-mono)]">
                    {item.meta}
                  </span>
                )}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">{item.description}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-[10px]">
                {item.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white/[0.04] text-white/30 transition-all duration-200 group-hover:bg-white/[0.08] group-hover:text-white/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-white/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {item.cta || 'Explore →'}
              </span>
            </div>
          </div>

          {/* Border gradient on hover */}
          <div
            className={`absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-white/[0.06] to-transparent ${
              item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            } transition-opacity duration-300`}
          />
        </div>
      ))}
    </div>
  );
}

export { BentoGrid };
