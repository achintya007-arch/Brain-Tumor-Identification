'use client';

import { useState } from 'react';
import { predictImage, validateImageFile, PredictionResponse } from '@/lib/prediction-utils';

export interface UploadState {
  isLoading: boolean;
  error: string | null;
  stage: 'preprocessing' | 'inference' | 'analyzing';
  result: PredictionResponse | null;
  preview: string | null;
}

export function useImageUpload(apiUrl: string = 'http://localhost:8000') {
  const [state, setState] = useState<UploadState>({
    isLoading: false,
    error: null,
    stage: 'preprocessing',
    result: null,
    preview: null,
  });

  const uploadImage = async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    setState({ isLoading: true, error: null, stage: 'preprocessing', result: null, preview: null });

    try {
      await new Promise((r) => setTimeout(r, 400));
      setState((prev) => ({ ...prev, stage: 'inference' }));

      const response = await predictImage(apiUrl, file);

      setState((prev) => ({ ...prev, stage: 'analyzing' }));
      await new Promise((r) => setTimeout(r, 400));

      setState({
        isLoading: false,
        error: null,
        stage: 'analyzing',
        result: response,
        preview: `data:image/png;base64,${response.original_image}`,
      });
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process image',
        stage: 'preprocessing',
        result: null,
        preview: null,
      });
    }
  };

  const reset = () => {
    setState({ isLoading: false, error: null, stage: 'preprocessing', result: null, preview: null });
  };

  return { ...state, uploadImage, reset };
}
