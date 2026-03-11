'use client';

interface GradCAMVisualizationProps {
  originalImage: string;
  gradcamImage: string;
  title?: string;
}

export function GradCAMVisualization({
  originalImage,
  gradcamImage,
  title = 'Model Attribution Analysis',
}: GradCAMVisualizationProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">{title}</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Original Image */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Original X-ray</p>
          <div className="relative rounded-lg overflow-hidden border border-slate-700 aspect-square">
            <img
              src={originalImage}
              alt="Original X-ray"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* GradCAM Overlay */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Attribution Map</p>
          <div className="relative rounded-lg overflow-hidden border border-cyan-accent/30 aspect-square bg-slate-900">
            <img
              src={gradcamImage}
              alt="GradCAM visualization"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-accent/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        The attribution map shows areas the model focuses on for its prediction.
        Warmer colors indicate higher importance.
      </p>
    </div>
  );
}
