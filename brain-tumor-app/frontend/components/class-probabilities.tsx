'use client';

interface ClassProbabilitiesProps {
  data: Array<{ label: string; probability: number }>;
  topK?: number;
}

export function ClassProbabilities({
  data,
  topK = 5,
}: ClassProbabilitiesProps) {
  const sortedData = [...data]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, topK);

  const getSeverityColor = (probability: number) => {
    if (probability > 0.7) return 'bg-red-500/20 border-red-500/50';
    if (probability > 0.4) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-green-500/20 border-green-500/50';
  };

  const getSeverityTextColor = (probability: number) => {
    if (probability > 0.7) return 'text-red-400';
    if (probability > 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">
        Classification Results
      </h3>

      <div className="space-y-2">
        {sortedData.map((item, idx) => (
          <div
            key={item.label}
            className="animate-float-up"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div
              className={`
                p-3 rounded-lg border transition-all
                ${getSeverityColor(item.probability)}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-200">
                  {item.label}
                </span>
                <span
                  className={`text-sm font-bold ${getSeverityTextColor(
                    item.probability
                  )}`}
                >
                  {(item.probability * 100).toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getSeverityTextColor(
                    item.probability
                  ).replace('text-', 'bg-')}`}
                  style={{ width: `${item.probability * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
