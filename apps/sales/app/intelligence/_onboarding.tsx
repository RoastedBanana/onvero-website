'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ALL_TASK_IDS = [
  'icp-1',
  'icp-2',
  'icp-3',
  'data-1',
  'data-2',
  'data-3',
  'sig-1',
  'sig-2',
  'pipe-1',
  'pipe-2',
  'pipe-3',
];

// Tasks that are auto-detected from real data — manual toggle is ignored for these
const AUTO_DETECTED = new Set(['icp-1', 'icp-2', 'icp-3', 'data-1', 'data-2', 'data-3', 'sig-2', 'pipe-1', 'pipe-2']);

const STORAGE_KEY = 'onvero_setup_done_ids';

type OnboardingCtx = {
  doneIds: Set<string>;
  toggleTask: (id: string) => void;
  refresh: () => void;
  allDone: boolean;
  totalCount: number;
  doneCount: number;
};

const Ctx = createContext<OnboardingCtx>({
  doneIds: new Set(),
  toggleTask: () => {},
  refresh: () => {},
  allDone: false,
  totalCount: ALL_TASK_IDS.length,
  doneCount: 0,
});

export function useOnboarding() {
  return useContext(Ctx);
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [manualIds, setManualIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const [autoIds, setAutoIds] = useState<Set<string>>(new Set());

  // Persist manual toggles
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...manualIds]));
  }, [manualIds]);

  const fetchStatus = useCallback(() => {
    fetch('/api/setup/status')
      .then((r) => r.json())
      .then((data: { status?: Record<string, boolean> }) => {
        if (!data.status) return;
        const detected = new Set<string>();
        for (const [id, done] of Object.entries(data.status)) {
          if (done) detected.add(id);
        }
        setAutoIds(detected);
      })
      .catch(() => {});
  }, []);

  // Initial fetch + re-fetch when tab regains focus
  useEffect(() => {
    fetchStatus();
    const onFocus = () => fetchStatus();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchStatus]);

  const doneIds = new Set([...autoIds, ...manualIds]);

  const toggleTask = useCallback((id: string) => {
    // Auto-detected tasks can't be manually toggled
    if (AUTO_DETECTED.has(id)) return;
    setManualIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const doneCount = doneIds.size;
  const allDone = doneCount >= ALL_TASK_IDS.length;

  return (
    <Ctx.Provider
      value={{ doneIds, toggleTask, refresh: fetchStatus, allDone, totalCount: ALL_TASK_IDS.length, doneCount }}
    >
      {children}
    </Ctx.Provider>
  );
}
