import { useEffect, useState } from 'react';

export function useLiveClock(intervalMs = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const sync = () => setNow(new Date());
    const id = window.setInterval(sync, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        sync();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);

  return now;
}

export function useMinuteClock(): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let timeoutId: number | undefined;

    const scheduleNext = () => {
      const current = new Date();
      const msUntilNextMinute =
        60_000 - (current.getSeconds() * 1000 + current.getMilliseconds()) + 50;
      timeoutId = window.setTimeout(() => {
        setNow(new Date());
        scheduleNext();
      }, msUntilNextMinute);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        setNow(new Date());
        scheduleNext();
      }
    };

    scheduleNext();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return now;
}
