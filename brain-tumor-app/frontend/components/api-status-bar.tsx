'use client';

import { useEffect, useState } from 'react';

interface ApiStatusBarProps {
  apiUrl?: string;
}

export function ApiStatusBar({ apiUrl = 'http://localhost:5000' }: ApiStatusBarProps) {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [message, setMessage] = useState('Checking API health...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${apiUrl}/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setStatus('healthy');
          setMessage('API healthy');
        } else {
          setStatus('unhealthy');
          setMessage('API returned error');
        }
      } catch (error) {
        setStatus('unhealthy');
        setMessage('Unable to connect to API');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);

    return () => clearInterval(interval);
  }, [apiUrl]);

  const statusColor =
    status === 'healthy'
      ? 'bg-green-500'
      : status === 'unhealthy'
        ? 'bg-red-500'
        : 'bg-yellow-500';

  const statusDot =
    status === 'healthy' ? (
      <div className={`${statusColor} w-2 h-2 rounded-full animate-pulse`} />
    ) : (
      <div className={`${statusColor} w-2 h-2 rounded-full`} />
    );

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
      {statusDot}
      <span className="text-xs font-medium text-gray-400">{message}</span>
    </div>
  );
}
