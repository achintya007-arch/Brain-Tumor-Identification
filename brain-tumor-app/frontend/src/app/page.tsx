'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { predictImage, checkHealth, type PredictionResult } from '@/lib/api';
import Header     from '@/components/Header';
import StatusBar  from '@/components/StatusBar';
import UploadZone from '@/components/UploadZone';
import ResultPanel from '@/components/ResultPanel';

// Outside component — stable reference, no exhaustive-deps warning
const LOADING_STEPS = [
  'Loading MRI scan…',
  'Preprocessing image (224 × 224)…',
  'Running EfficientNetV2-L inference…',
  'Generating Grad-CAM heatmap…',
  'Computing class probabilities…',
];

export default function Home() {
  const [result,     setResult]     = useState<PredictionResult | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ── Debounced API status ──────────────────────────────────────────────────
  // Don't flash OFFLINE on a single failed poll (happens during XLA compile).
  // Require 2 consecutive failures before marking offline.
  const [apiOnline,  setApiOnline]  = useState<boolean | null>(null);
  const failCount = useRef(0);

  useEffect(() => {
    const poll = async () => {
      const ok = await checkHealth();
      if (ok) {
        failCount.current = 0;
        setApiOnline(true);
      } else {
        failCount.current += 1;
        if (failCount.current >= 2) setApiOnline(false);
      }
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, []);

  // ── File handler ──────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setLoading(true);
    try {
      setResult(await predictImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [previewUrl]);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        <StatusBar apiOnline={apiOnline} />

        <main className="mt-8">
          {!result && !loading && (
            <UploadZone
              onFileSelect={handleFile}
              disabled={apiOnline === false}
              error={error}
            />
          )}
          {loading && previewUrl && (
            <LoadingState previewUrl={previewUrl} />
          )}
          {result && (
            <ResultPanel result={result} onReset={handleReset} />
          )}
        </main>

        <footer className="mt-16 pt-8 border-t border-bg-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-sm font-mono">
              NeuroScan AI — Research use only. Not a medical device.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
              <span>EfficientNetV2-L</span>
              <span>·</span>
              <span>Grad-CAM</span>
              <span>·</span>
              <span>TensorFlow 2.x</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Loading state component ───────────────────────────────────────────────────
function LoadingState({ previewUrl }: { previewUrl: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setStep(i), i * 900)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-up">
      {/* MRI preview with scan line */}
      <div className="flex-1 max-w-md mx-auto lg:mx-0">
        <div className="relative rounded-xl overflow-hidden border border-bg-border glow-cyan">
          <img
            src={previewUrl}
            alt="MRI being analyzed"
            className="w-full aspect-square object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
            <div className="scan-line" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 bg-bg-base/80 backdrop-blur border border-accent-cyan/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
              <span className="text-accent-cyan text-sm font-mono">ANALYZING</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex-1">
        <h3 className="font-display text-xl text-white mb-6">Processing MRI Scan</h3>
        <div className="space-y-3">
          {LOADING_STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-3 transition-all duration-500 ${
                i <= step ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                i < step  ? 'bg-accent-green border-accent-green' :
                i === step ? 'border-accent-cyan animate-pulse' :
                             'border-bg-border'
              }`}>
                {i < step && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {i === step && <div className="w-2 h-2 bg-accent-cyan rounded-full" />}
              </div>
              <span className={`font-mono text-sm ${
                i === step ? 'text-accent-cyan' :
                i < step   ? 'text-slate-400'   :
                             'text-slate-600'
              }`}>{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-600 font-mono">
          First inference compiles XLA kernels — may take up to 60 s.
          Subsequent predictions are fast.
        </p>
      </div>
    </div>
  );
}