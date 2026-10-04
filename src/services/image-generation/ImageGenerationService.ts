import { CreativeConcept, JobData } from '../../types';
import { GENERATED_STUDIO_IMAGES } from '../../data/demoPresets';
import { TaoPromptAnhAI } from '../ai/aiModules';

export interface ImageGenerationRequest {
  concept: CreativeConcept;
  job: JobData;
  aspectRatio: '1:1' | '4:5' | '9:16';
  referenceImageUrl?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  provider: 'gemini' | 'openai' | 'imagen' | 'flux' | 'stability' | 'demo_studio';
  modelUsed: string;
}

export class ImageGenerationService {
  static getFallbackImageForJob(job: JobData, conceptIndex: number): string {
    const scenes = TaoPromptAnhAI.getIndustryScenes(job);
    const scene = scenes[(conceptIndex - 1) % scenes.length];
    return GENERATED_STUDIO_IMAGES[scene.fallbackCategory] || GENERATED_STUDIO_IMAGES.sales;
  }

  static async generateImageForConcept(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (req.referenceImageUrl && (req.concept.index === 1 || req.concept.index === 4 || req.concept.index === 9)) {
      return {
        imageUrl: req.referenceImageUrl,
        provider: 'demo_studio',
        modelUsed: 'reference-image-composer',
      };
    }

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: req.concept.prompt_tao_anh,
          aspectRatio: req.aspectRatio,
          conceptIndex: req.concept.index,
          industry: req.job.nganh_nghe,
          position: req.job.vi_tri,
          referenceImageUrl: req.referenceImageUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          return {
            imageUrl: data.imageUrl,
            provider: data.provider || 'demo_studio',
            modelUsed: data.modelUsed || 'studio-engine',
          };
        }
      }
    } catch {
      // Fallback cleanly to local high-res studio photography
    }

    return {
      imageUrl: this.getFallbackImageForJob(req.job, req.concept.index),
      provider: 'demo_studio',
      modelUsed: 'studio-highres-v1',
    };
  }
}
