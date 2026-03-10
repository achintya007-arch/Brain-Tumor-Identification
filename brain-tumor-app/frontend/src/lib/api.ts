const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ClassProbability {
  name: string;
  probability: number;
  percentage: number;
}

export interface PredictionResult {
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

export async function predictImage(file: File): Promise<PredictionResult> {
  const form = new FormData();
  form.append('file', file);

  // No timeout on predict — first inference can take 60 s (XLA compilation)
  const res = await fetch(`${API_BASE}/predict`, { method: 'POST', body: form });

  if (!res.ok) {
    let detail = 'Prediction failed';
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    // 8 s timeout — generous enough to survive server startup / XLA compilation
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const body = await res.json();
    // Only report online when the model is actually loaded
    return body.model_loaded === true;
  } catch {
    return false;
  }
}