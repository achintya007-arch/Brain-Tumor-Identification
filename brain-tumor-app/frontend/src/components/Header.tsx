'use client';

export default function Header() {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-accent-cyan/30 flex items-center justify-center glow-cyan">
            <BrainIcon />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Neuro<span className="text-accent-cyan">Scan</span>
            <span className="text-slate-500 font-light"> AI</span>
          </h1>
        </div>
        <p className="text-slate-500 text-sm font-mono">
          MRI Brain Tumour Classification · EfficientNetV2-L · Grad-CAM
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-3 py-1.5 rounded-md bg-bg-elevated border border-bg-border text-xs font-mono text-slate-500">
          v1.0.0
        </span>
        <span className="px-3 py-1.5 rounded-md bg-bg-elevated border border-accent-cyan/20 text-xs font-mono text-accent-cyan">
          Research Build
        </span>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-md bg-bg-elevated border border-bg-border text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
        >
          API Docs ↗
        </a>
      </div>
    </header>
  );
}

function BrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M8 16C8 10 12 7 16 7C20 7 24 10 24 16"
        stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M8 16C8 22 12 25 16 25C20 25 24 22 24 16"
        stroke="#818cf8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M16 7L16 25" stroke="rgba(6,182,212,0.25)" strokeWidth="1" />
      <path d="M11 10C13 12 13 14 11 16" stroke="#06b6d4" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M21 10C19 12 19 14 21 16" stroke="#818cf8" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.8" />
      <circle cx="16" cy="16" r="2.5" fill="#06b6d4" opacity="0.9" />
    </svg>
  );
}