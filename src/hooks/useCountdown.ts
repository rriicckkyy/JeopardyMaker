import { useEffect, useState } from 'react';

/**
 * Ticks locally toward an epoch-ms deadline and returns the whole seconds
 * remaining (clamped at 0), or null when there's no deadline. Host and Board
 * each compute this independently from the same synced deadline rather than
 * broadcasting a per-tick value, so they stay in lockstep without any extra
 * network chatter.
 */
export function useCountdown(deadline: number | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
