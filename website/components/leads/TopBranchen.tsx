'use client';

import { useState, useEffect } from 'react';

interface TopBranchenProps {
  data: { name: string; count: number }[];
}

export default function TopBranchen({ data }: TopBranchenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111111] p-5 px-6">
      <div className="mb-4 text-[13px] font-semibold text-white">Top Branchen</div>
      <div className="flex flex-col gap-3">
        {data.map((item, i) => {
          const pct = (item.count / maxCount) * 100;
          return (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between">
                <span className="max-w-[160px] truncate text-[12px] text-white/50">{item.name}</span>
                <span className="text-[12px] font-semibold text-white/50">{item.count}</span>
              </div>
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: mounted ? `${pct}%` : '0%',
                    backgroundColor: i === 0 ? '#6B7AFF' : 'rgba(255,255,255,0.18)',
                    transition: `width 1s ease-out ${i * 60}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
