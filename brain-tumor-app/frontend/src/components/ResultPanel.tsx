'use client';

import { useState } from 'react';
import { type PredictionResult } from '@/lib/api';

type ViewMode = 'original' | 'heatmap' | 'overlay';

const LABELS: Record<string, string> = {
  glioma: 'Glioma', meningioma: 'Meningioma',
  notumor: 'No Tumour', pituitary: 'Pituitary',
};

const SEV = {
  none:   { label:'CLEAR',    bg:'bg-emerald-500/10', border:'border-emerald-500/30', text:'text-emerald-400', bar:'bg-emerald-500', glow:'glow-green', ring:'#10b981' },
  medium: { label:'DETECTED', bg:'bg-orange-500/10',  border:'border-orange-500/30',  text:'text-orange-400',  bar:'bg-orange-500',  glow:'',           ring:'#f97316' },
  high:   { label:'DETECTED', bg:'bg-red-500/10',     border:'border-red-500/30',     text:'text-red-400',     bar:'bg-red-500',     glow:'glow-red',   ring:'#ef4444' },
} as const;

interface Props { result: PredictionResult; onReset: () => void; }

export default function ResultPanel({ result, onReset }: Props) {
  const [view,   setView]   = useState<ViewMode>('overlay');
  const [copied, setCopied] = useState(false);

  const sev   = SEV[result.severity];
  const label = LABELS[result.prediction] ?? result.prediction;

  const img = {
    original: result.original_image,
    heatmap:  result.heatmap_image,
    overlay:  result.overlay_image,
  }[view];

  const copyRaw = async () => {
    await navigator.clipboard.writeText(JSON.stringify({
      prediction:    result.prediction,
      confidence:    result.confidence,
      probabilities: Object.fromEntries(
        result.probabilities.map(p => [p.name, `${p.percentage.toFixed(4)}%`])
      ),
    }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-up space-y-5">

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-md ${sev.bg} border ${sev.border}`}>
            <span className={`text-xs font-mono font-bold ${sev.text}`}>
              {result.severity === 'none' ? '✓' : '⚠'} {sev.label}
            </span>
          </div>
          <span className="text-slate-500 font-mono text-sm">Analysis complete</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-bg-border text-slate-400 hover:text-white hover:border-accent-cyan/40 transition-all text-sm font-mono"
        >
          ↺ New Scan
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Image — 3 cols */}
        <div className="lg:col-span-3 space-y-3">
          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-bg-surface rounded-lg border border-bg-border w-fit">
            {(['original', 'heatmap', 'overlay'] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setView(m)}
                className={`px-4 py-1.5 rounded-md text-xs font-mono capitalize transition-all ${
                  view === m ? 'bg-accent-cyan text-bg-base font-semibold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >{m}</button>
            ))}
          </div>

          {/* Image */}
          <div className={`relative rounded-xl overflow-hidden border border-bg-border aspect-square ${sev.glow}`}>
            <img
              src={`data:image/png;base64,${img}`}
              alt={`${view} MRI`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 bg-bg-base/80 backdrop-blur rounded text-xs font-mono text-slate-400 border border-bg-border">
                {view === 'heatmap' ? 'Grad-CAM' : view === 'overlay' ? 'Overlay 60/40' : 'Original'}
              </span>
            </div>
            <div className="absolute bottom-3 right-3">
              <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${sev.bg} ${sev.text} border ${sev.border}`}>
                {label}
              </span>
            </div>
          </div>

          {/* Heatmap legend */}
          {view === 'heatmap' && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-gradient-to-r from-[#00008b] via-[#00ff00] via-[#ffff00] to-[#ff0000]" />
              <div className="flex justify-between text-xs font-mono text-slate-600">
                <span>Low activation</span><span>High activation</span>
              </div>
              <p className="text-xs font-mono text-slate-600 text-center">
                Red = regions most influential in the model's decision
              </p>
            </div>
          )}
        </div>

        {/* Results — 2 cols */}
        <div className="lg:col-span-2 space-y-4">

          {/* Prediction card */}
          <div className={`p-5 rounded-xl border ${sev.border} ${sev.bg}`}>
            <p className="text-xs font-mono text-slate-500 mb-3">PRIMARY CLASSIFICATION</p>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className={`font-display text-3xl font-bold ${sev.text} leading-none mb-1`}>{label}</h2>
                <p className="text-xs font-mono text-slate-500">Confidence score</p>
              </div>
              <ConfidenceRing value={result.confidence} color={sev.ring} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${sev.bar}`} style={{ width: `${result.confidence}%`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
              <span className={`text-sm font-mono font-bold tabular-nums ${sev.text}`}>
                {result.confidence.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl border border-bg-border bg-bg-surface">
            <p className="text-xs font-mono text-slate-500 mb-2">CLINICAL NOTES</p>
            <p className="text-sm text-slate-300 leading-relaxed">{result.description}</p>
          </div>

          {/* All probabilities */}
          <div className="p-4 rounded-xl border border-bg-border bg-bg-surface">
            <p className="text-xs font-mono text-slate-500 mb-3">CLASS PROBABILITIES</p>
            <div className="space-y-3">
              {[...result.probabilities]
                .sort((a, b) => b.probability - a.probability)
                .map(p => {
                  const isPred = p.name === result.prediction;
                  return (
                    <div key={p.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-mono ${isPred ? 'text-white' : 'text-slate-500'}`}>
                          {LABELS[p.name] ?? p.name}
                          {isPred && <span className={`ml-1.5 ${sev.text}`}>◆</span>}
                        </span>
                        <span className={`text-xs font-mono tabular-nums ${isPred ? sev.text : 'text-slate-600'}`}>
                          {p.percentage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-bg-base rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPred ? sev.bar : 'bg-slate-700'}`}
                          style={{ width: `${p.percentage}%`, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Raw output */}
          <details className="group">
            <summary className="cursor-pointer text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors list-none flex items-center gap-2">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Raw output
            </summary>
            <div className="mt-2 rounded-lg border border-bg-border overflow-hidden">
              <div className="flex justify-between items-center px-3 py-2 bg-bg-elevated border-b border-bg-border">
                <span className="text-xs font-mono text-slate-600">JSON</span>
                <button onClick={copyRaw} className="text-xs font-mono text-slate-500 hover:text-accent-cyan transition-colors">
                  {copied ? <span className="text-emerald-400">✓ Copied</span> : '⎘ Copy'}
                </button>
              </div>
              <pre className="p-3 bg-bg-base overflow-auto max-h-36 text-xs font-mono text-slate-500">{
                JSON.stringify({
                  prediction: result.prediction,
                  confidence: result.confidence,
                  probabilities: Object.fromEntries(
                    result.probabilities.map(p => [p.name, `${p.percentage.toFixed(4)}%`])
                  ),
                }, null, 2)
              }</pre>
            </div>
          </details>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
        <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-xs text-amber-400/80 font-mono leading-relaxed">
          <strong>Medical Disclaimer:</strong> This tool is for research and educational purposes only.
          Results must not be used for clinical diagnosis. Always consult a qualified radiologist or neurologist.
        </p>
      </div>
    </div>
  );
}

function ConfidenceRing({ value, color }: { value: number; color: string }) {
  const r = 26, circ = 2 * Math.PI * r;
  return (
    <div className="relative flex-shrink-0">
      <svg width="68" height="68" className="-rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ - (value / 100) * circ}
          strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 6px ${color})`, transition:'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-mono font-bold" style={{ color }}>{Math.round(value)}%</span>
      </div>
    </div>
  );
}