'use client';

import { useState, useEffect } from 'react';
import { ApiStatusBar } from '@/components/api-status-bar';
import { UploadZone } from '@/components/upload-zone';
import { LoadingState } from '@/components/loading-state';
import { ResultsPanel } from '@/components/results-panel';
import { MedicalDisclaimer } from '@/components/medical-disclaimer';
import { useHealthCheck } from '@/hooks/use-health-check';
import { useImageUpload } from '@/hooks/use-image-upload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Page() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const healthStatus = useHealthCheck(API_URL);
  const uploadState = useImageUpload(API_URL);

  const handleImageSelected = (file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
    uploadState.uploadImage(file);
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    uploadState.reset();
  };

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-accent/5 via-transparent to-transparent animate-scan-lines" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-accent/10 border border-cyan-accent flex items-center justify-center">
                <div className="w-4 h-4 bg-cyan-accent rounded-sm animate-pulse-glow" />
              </div>
              <h1 className="text-lg font-bold text-cyan-accent">
                Medical AI Diagnostics
              </h1>
            </div>
            <ApiStatusBar apiUrl={API_URL} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Medical Disclaimer */}
        <div className="mb-8">
          <MedicalDisclaimer />
        </div>

        {uploadState.result ? (
          // Results View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-100">Analysis Complete</h2>
              <button
                onClick={handleReset}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all
                  bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-cyan-accent
                  border border-slate-700 hover:border-cyan-accent/50
                `}
              >
                Analyze Another
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Original Image */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-sm font-semibold text-gray-300">
                  Input Image
                </h3>
                <div className="relative rounded-lg overflow-hidden border border-slate-700 aspect-square bg-slate-900">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Original X-ray"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="lg:col-span-2">
                <ResultsPanel result={uploadState.result} />
              </div>
            </div>
          </div>
        ) : uploadState.isLoading ? (
          // Loading View
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-100">
              Processing Your Image
            </h2>
            <LoadingState stage={uploadState.stage} />
          </div>
        ) : uploadState.error ? (
          // Error View
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-100">Upload Error</h2>
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
              <p className="text-sm text-red-400">{uploadState.error}</p>
            </div>
            <button
              onClick={handleReset}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-cyan-accent
                border border-slate-700 hover:border-cyan-accent/50
              `}
            >
              Try Again
            </button>
          </div>
        ) : (
          // Initial Upload View
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-100">
                X-ray Analysis
              </h2>
              <p className="text-gray-400">
                Upload a medical X-ray image for AI-powered diagnostic analysis.
                The system will provide classification results and visualization
                of model decision regions.
              </p>
            </div>

            <UploadZone onImageSelected={handleImageSelected} />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Fast Analysis',
                  description: 'Get results in seconds with deep learning models',
                },
                {
                  title: 'Interpretable',
                  description: 'View GradCAM visualizations for model decisions',
                },
                {
                  title: 'Secure',
                  description: 'Your data is processed privately on your server',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900 transition-all"
                >
                  <h3 className="font-semibold text-gray-200 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <h3 className="font-semibold text-gray-200 mb-2">Requirements:</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Supported formats: JPEG, PNG, WebP</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Recommended: Clear, high-resolution X-ray images</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-gray-500 text-center">
            Medical AI Diagnostics • For research and educational purposes only
          </p>
        </div>
      </footer>
    </main>
  );
}
