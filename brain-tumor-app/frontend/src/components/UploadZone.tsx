'use client';

import { useCallback, useState, useRef } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  error?: string | null;
}

const MODEL_SPECS = [
  ['Architecture', 'EfficientNetV2-L'],
  ['Input Size',   '224 × 224 px'],
  ['Parameters',   '~119M'],
  ['Backbone',     'ImageNet pretrained'],
  ['Training',     '2-phase fine-tuning'],
  ['Precision',    'Mixed float16'],
];

const CLASSES = [
  { name: 'Glioma',     dot: 'bg-red-500',     severity: 'High'   },
  { name: 'Meningioma', dot: 'bg-orange-500',   severity: 'Medium' },
  { name: 'No Tumour',  dot: 'bg-emerald-500',  severity: 'None'   },
  { name: 'Pituitary',  dot: 'bg-orange-400',   severity: 'Medium' },
];

export default function UploadZone({ onFileSelect, disabled, error }: UploadZoneProps) {
  const [isDrag, setIsDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDrag(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) onFileSelect(file);
  }, [onFileSelect, disabled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  }, [onFileSelect]);

  const zoneClass = [
    'relative rounded-2xl border-2 border-dashed transition-all duration-300',
    'flex flex-col items-center justify-center text-center p-10 min-h-80 overflow-hidden',
    isDrag    ? 'border-accent-cyan bg-accent-cyan/5 glow-cyan scale-[1.01] cursor-copy'
    : disabled ? 'border-bg-border opacity-40 cursor-not-allowed'
               : 'border-bg-border hover:border-accent-cyan/40 hover:bg-white/[0.01] cursor-pointer',
  ].join(' ');

  return (
    <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* ── Drop zone ── */}
      <div
        className="lg:col-span-2"
        onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
        onDragLeave={() => setIsDrag(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
        />

        <div className={zoneClass}>
          {/* Corner brackets */}
          {['tl','tr','bl','br'].map(c => (
            <span key={c} className={[
              'absolute w-4 h-4 border-accent-cyan/40',
              c === 'tl' ? 'top-3 left-3  border-t-2 border-l-2' : '',
              c === 'tr' ? 'top-3 right-3 border-t-2 border-r-2' : '',
              c === 'bl' ? 'bottom-3 left-3  border-b-2 border-l-2' : '',
              c === 'br' ? 'bottom-3 right-3 border-b-2 border-r-2' : '',
            ].join(' ')} />
          ))}

          {/* Icon */}
          <div className={`relative w-20 h-20 mb-6 transition-all duration-300 ${isDrag ? 'scale-110' : ''}`}>
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isDrag ? 'bg-accent-cyan/15' : 'bg-bg-elevated'}`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className={`w-8 h-8 transition-colors ${isDrag ? 'text-accent-cyan' : 'text-slate-500'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {isDrag ? (
            <>
              <p className="font-display text-2xl font-bold text-accent-cyan mb-1">Drop to analyze</p>
              <p className="text-slate-500 text-sm font-mono">Release MRI scan…</p>
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-bold text-white mb-2">Upload MRI Scan</p>
              <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
                Drag & drop your brain MRI image, or click to browse.<br />
                JPEG · PNG · WEBP supported.
              </p>
              <button
                onClick={e => { e.stopPropagation(); !disabled && inputRef.current?.click(); }}
                disabled={disabled}
                className={[
                  'px-6 py-2.5 rounded-lg font-mono text-sm font-medium border transition-all duration-200',
                  disabled
                    ? 'border-bg-border text-slate-600 cursor-not-allowed'
                    : 'border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan hover:text-bg-base active:scale-95',
                ].join(' ')}
              >
                Browse Files
              </button>
            </>
          )}

          {/* Error banner */}
          {error && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 text-sm font-mono truncate">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Info sidebar ── */}
      <div className="space-y-3">
        <div className="p-5 rounded-xl border border-bg-border bg-bg-surface">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Model Info</p>
          <div className="space-y-3">
            {MODEL_SPECS.map(([k, v]) => (
              <div key={k} className="flex justify-between items-baseline gap-2">
                <span className="text-xs font-mono text-slate-600 shrink-0">{k}</span>
                <span className="text-xs font-mono text-slate-300 text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-bg-border bg-bg-surface">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Detectable Classes</p>
          <div className="space-y-2.5">
            {CLASSES.map(({ name, dot, severity }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span className="text-xs font-mono text-slate-400">{name}</span>
                </div>
                <span className={[
                  'text-xs font-mono px-1.5 py-0.5 rounded border',
                  severity === 'None'   ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                  severity === 'High'   ? 'text-red-400     border-red-500/20     bg-red-500/5'     :
                                          'text-orange-400  border-orange-500/20  bg-orange-500/5',
                ].join(' ')}>{severity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-400/80 font-mono leading-relaxed">
            ⚠ Research only. Not a substitute for professional medical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}