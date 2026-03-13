import { useEffect, useRef } from 'react';

export function usePolling(refreshFn, intervalMs = 5000) {
  const refreshRef = useRef(refreshFn);
  refreshRef.current = refreshFn;

  useEffect(() => {
    if (!refreshRef.current) return;

    refreshRef.current();
    const interval = setInterval(refreshRef.current, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);
}
