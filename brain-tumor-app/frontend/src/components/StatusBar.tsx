'use client';

interface StatusBarProps {
  apiOnline: boolean | null;
}

export default function StatusBar({ apiOnline }: StatusBarProps) {
  const statusColor =
    apiOnline === null  ? 'bg-slate-500 animate-pulse' :
    apiOnline           ? 'bg-accent-green animate-pulse' :
                          'bg-accent-red';

  const statusText =
    apiOnline === null  ? 'CONNECTING…' :
    apiOnline           ? 'ONLINE' :
                          'OFFLINE';

  const statusTextColor =
    apiOnline === null  ? 'text-slate-500' :
    apiOnline           ? 'text-accent-green' :
                          'text-accent-red';

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 px-4 py-3 rounded-lg bg-bg-surface border border-bg-border">

      {/* API status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="text-xs font-mono text-slate-400">
          API: <span className={statusTextColor}>{statusText}</span>
        </span>
      </div>

      <div className="h-3 w-px bg-bg-border" />

      {/* Model */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">MODEL:</span>
        <span className="text-xs font-mono text-slate-400">EfficientNetV2-L</span>
      </div>

      <div className="h-3 w-px bg-bg-border hidden sm:block" />

      {/* Classes */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">CLASSES:</span>
        <div className="flex gap-1.5">
          {['glioma', 'meningioma', 'notumor', 'pituitary'].map(cls => (
            <span key={cls} className="px-1.5 py-0.5 rounded text-xs font-mono bg-bg-elevated text-slate-400 border border-bg-border">
              {cls}
            </span>
          ))}
        </div>
      </div>

      {/* Offline hint */}
      {apiOnline === false && (
        <div className="ml-auto flex items-center gap-2 text-xs font-mono text-amber-400">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          uvicorn main:app --host 0.0.0.0 --port 8000 --reload
        </div>
      )}
    </div>
  );
}