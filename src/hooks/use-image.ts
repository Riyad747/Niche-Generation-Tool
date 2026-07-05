'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface ImageAnalysisDto {
  id: string;
  visualStyle: string;
  composition: string;
  colorPalette: string[];
  commercialIntent: number;
  categoryFit: string;
  aiReproducibility: number;
  vectorSuitability: number;
  approvalProbability: number;
  relatedNiches: string[];
  keywords: string[];
  titles: string[];
  promptVariations: string[];
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useAnalyzeImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const dataUrl = await fileToDataUrl(file);
      return apiFetch<ImageAnalysisDto>('/api/images/analyze', {
        method: 'POST',
        body: JSON.stringify({ dataUrl, fileName: file.name }),
      });
    },
  });
}
