export interface ClassProbability {
  name: string;
  probability: number;
  percentage: number;
}

export interface PredictionResponse {
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

// No timeout — first inference takes ~60s due to XLA compilation
export async function predictImage(
  apiUrl: string,
  imageFile: File
): Promise<PredictionResponse> {
  const form = new FormData();
  form.append('file', imageFile);

  const response = await fetch(`${apiUrl}/predict`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Prediction failed: ${response.statusText}`);
  }

  return response.json();
}

export function validateImageFile(file: File): string | null {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image (JPEG, PNG, WebP)';
  }
  if (file.size > maxSize) {
    return 'File size must be less than 20MB';
  }
  return null;
}
