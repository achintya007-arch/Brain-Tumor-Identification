'use client';

import { useState, useEffect } from 'react';

interface LoadingStateProps {
  stage: 'preprocessing' | 'inference' | 'analyzing';
}

export function LoadingState({ stage }: LoadingStateProps) {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const stageMessages = {
    preprocessing: 'Preprocessing image',
    inference: 'Running inference model',
    analyzing: 'Analyzing results',
  };

  const dots = '.'.repeat(dotCount);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
        <div className="absolute inset-0 rounded-full border-2 border-cyan-accent border-t-transparent animate-spin" />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-cyan-accent">
          {stageMessages[stage]}{dots}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          {stage === 'preprocessing' && 'Preparing X-ray for analysis'}
          {stage === 'inference' && 'This may take up to 60 seconds'}
          {stage === 'analyzing' && 'Processing predictions'}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        {['preprocessing', 'inference', 'analyzing'].map((s, idx) => (
          <div
            key={s}
            className="flex items-center gap-2"
            style={{
              animation: stage === s ? 'animate-staggered-progress 1.5s ease-out' : 'none',
              animationDelay: `${idx * 0.1}s`,
            }}
          >
            <div className="w-1 h-1 bg-cyan-accent rounded-full" />
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-accent/50 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}
