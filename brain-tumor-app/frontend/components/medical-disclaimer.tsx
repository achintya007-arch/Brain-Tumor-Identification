'use client';

import { AlertCircle } from 'lucide-react';

export function MedicalDisclaimer() {
  return (
    <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-300 space-y-1">
          <p className="font-semibold text-yellow-400">Medical Disclaimer</p>
          <p>
            This tool is for educational and research purposes only. It is not a
            medical device and should not be used for diagnostic purposes. Always
            consult with a qualified healthcare professional for medical diagnosis
            and treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
