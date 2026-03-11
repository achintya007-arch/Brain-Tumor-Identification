'use client';

import { useEffect, useState, useRef } from 'react';

export interface HealthStatus {
  status: 'checking' | 'healthy' | 'unhealthy';
  message: string;
  lastChecked: Date | null;
  modelLoaded: boolean;
}

const INTERVAL = 10_000;
const TIMEOUT  = 8_000;
const DEBOUNCE = 2; // failures before marking unhealthy

export function useHealthCheck(
  apiUrl: string = 'http://localhost:8000'
): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>({
    status: 'checking',
    message: 'Connecting…',
    lastChecked: null,
    modelLoaded: false,
  });

  const failCount = useRef(0);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      if (!mounted) return;
      try {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), TIMEOUT);
        const res  = await fetch(`${apiUrl}/health`, { signal: ctrl.signal });
        clearTimeout(tid);
        const body = await res.json();

        if (res.ok && body.model_loaded) {
          failCount.current = 0;
          if (mounted) setStatus({
            status: 'healthy',
            message: 'API online · Model ready',
            lastChecked: new Date(),
            modelLoaded: true,
          });
        } else {
          throw new Error('model not loaded');
        }
      } catch {
        failCount.current++;
        if (failCount.current >= DEBOUNCE && mounted) {
          setStatus({
            status: 'unhealthy',
            message: 'Cannot reach API — run: uvicorn main:app --port 8000',
            lastChecked: new Date(),
            modelLoaded: false,
          });
        }
      }
    };

    check();
    const id = setInterval(check, INTERVAL);
    return () => { mounted = false; clearInterval(id); };
  }, [apiUrl]);

  return status;
}
