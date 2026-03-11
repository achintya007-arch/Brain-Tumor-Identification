'use client';

interface ClassProbability {
  name: string;
  probability: number;
  percentage: number;
}

interface PredictionResult {
  prediction: string;
  confidence: number;
  severity: 'none' | 'medium' | 'high';
  description: string;
  color: string;
  probabilities: ClassProbability[];
  original_image: string;
  heatmap_image: string;
  overlay_image: string;
}

interface ResultsPanelProps {
  result: PredictionResult;
}

const SEVERITY_STYLES = {
  high:   { badge: 'DETECTED', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  medium: { badge: 'DETECTED', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
  none:   { badge: 'CLEAR',    color: 'bg-green-500/20 text-green-400 border-green-500/50' },
};

export function ResultsPanel({ result }: ResultsPanelProps) {
  const badge = SEVERITY_STYLES[result.severity] ?? SEVERITY_STYLES.medium;
  const predLabel = result.prediction.charAt(0).toUpperCase() + result.prediction.slice(1);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Prediction header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: result.color }}>
              {predLabel}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{result.description}</p>
          </div>
          <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${badge.color}`}>
            {badge.badge}
          </div>
        </div>

        {/* Confidence bar */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-cyan-400">
            {result.confidence.toFixed(1)}%
          </span>
          <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${result.confidence}%`, backgroundColor: result.color }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700" />

      {/* All class probabilities */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Class Probabilities
        </h3>
        {[...result.probabilities]
          .sort((a, b) => b.probability - a.probability)
          .map((cls) => (
            <div key={cls.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 capitalize">{cls.name}</span>
                <span className="text-gray-400">{cls.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${cls.percentage}%`,
                    backgroundColor: cls.name === result.prediction ? result.color : '#475569',
                  }}
                />
              </div>
            </div>
          ))}
      </div>

      <div className="border-t border-slate-700" />

      {/* Grad-CAM images */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Grad-CAM Visualisation
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Original',  src: result.original_image },
            { label: 'Heatmap',   src: result.heatmap_image  },
            { label: 'Overlay',   src: result.overlay_image  },
          ].map(({ label, src }) => (
            <div key={label} className="space-y-1">
              <div className="rounded-lg overflow-hidden border border-slate-700 aspect-square bg-slate-900">
                <img
                  src={`data:image/png;base64,${src}`}
                  alt={label}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-center text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
