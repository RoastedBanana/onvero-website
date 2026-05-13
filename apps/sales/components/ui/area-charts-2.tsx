'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import * as RechartsPrimitive from 'recharts';

const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> });
};

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error('useChart must be used within a <ChartContainer />');
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div data-slot="chart" data-chart={chartId} className={cn('flex justify-center text-xs', className)} {...props}>
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, c]) => c.theme || c.color);
  if (!colorConfig.length) return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join('\n')}
}`
          )
          .join('\n'),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  name?: string;
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  fill?: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
};

function ChartTooltipContent({
  active,
  payload,
  className,
  label,
  color,
  nameKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    nameKey?: string;
    payload?: TooltipPayloadItem[];
    label?: string;
  }) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        'border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl',
        className
      )}
    >
      {label && <div className="font-medium mb-1">{label}</div>}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`;
          const itemConfig = config[key];
          const indicatorColor = color || (item.payload?.fill as string | undefined) || item.color;
          return (
            <div key={item.dataKey} className="flex w-full items-center gap-2">
              <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: indicatorColor }} />
              <div className="flex flex-1 justify-between">
                <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
                {item.value !== undefined && (
                  <span className="font-mono font-medium tabular-nums">{item.value.toLocaleString()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartStyle };
