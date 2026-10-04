import {
  User,
  BrandKit,
  Campaign,
  JobData,
  CreativeConcept,
  PosterRecord,
  SocialPostRecord,
  GeneratedAsset,
} from '../../types';
import { DEMO_PRESETS } from '../../data/demoPresets';
import {
  PhanTichTuyenDungAI,
  TaoConceptAI,
  TaoNoiDungPosterAI,
  TaoBaiDangAI,
} from '../ai/aiModules';
import { ImageGenerationService } from '../image-generation/ImageGenerationService';

export interface DatabaseSchema {
  users: User[];
  brand_kits: BrandKit[];
  campaigns: Campaign[];
  job_data: JobData[];
  creative_concepts: CreativeConcept[];
  posters: PosterRecord[];
  social_posts: SocialPostRecord[];
  generated_assets: GeneratedAsset[];
}

const STORAGE_KEY = 'ai_recruitment_factory_db_v1';

export class ClientDatabaseService {
  static createInitialSeed(): DatabaseSchema {
    const defaultUser: User = {
      id: 'user-default-01',
      name: 'Trần Minh Quân (HR Director)',
      email: 'hr@novaviet.vn',
      role: 'Enterprise Admin',
      createdAt: new Date().toISOString(),
    };

    const defaultBrandKit: BrandKit = {
      id: 'brand-default-01',
      userId: defaultUser.id,
      ten_cong_ty: 'Công ty Cổ phần Công nghệ & Thương mại NovaViet',
      logo: '',
      mau_chinh: '#0F172A',
      mau_phu: '#3B82F6',
      font: 'Be Vietnam Pro',
      website: 'novaviet.vn',
      hotline: '0988.686.888',
      email: 'tuyendung@novaviet.vn',
      dia_chi: 'Tầng 12, Tòa nhà PeakView, Đống Đa, Hà Nội',
      isDefault: true,
      updatedAt: new Date().toISOString(),
    };

    // Build a pre-populated initial campaign so user can inspect immediately or create a new one
    const preset = DEMO_PRESETS[0];
    const campaignId = 'camp-demo-initial-01';
    const jobData = PhanTichTuyenDungAI.parseFromText(preset.rawInput, campaignId, defaultBrandKit);
    const concepts = TaoConceptAI.generate10Concepts(jobData, campaignId, defaultBrandKit);

    const posters: PosterRecord[] = concepts.map((concept) => {
      const bgUrl = ImageGenerationService.getFallbackImageForJob(jobData, concept.index);
      return TaoNoiDungPosterAI.createPosterRecord(
        jobData,
        concept,
        campaignId,
        preset.aspectRatio,
        bgUrl,
        'demo_studio',
        defaultBrandKit
      );
    });

    const socialPosts: SocialPostRecord[] = posters.map((poster, i) =>
      TaoBaiDangAI.generatePostForPoster(jobData, concepts[i], poster)
    );

    const initialCampaign: Campaign = {
      id: campaignId,
      userId: defaultUser.id,
      name: `${jobData.vi_tri} (${jobData.dia_diem || 'Toàn quốc'})`,
      rawInput: preset.rawInput,
      aspectRatio: preset.aspectRatio,
      stylePreference: 'AI tự lựa chọn',
      language: 'Tiếng Việt',
      posterCount: 10,
      brandKitId: defaultBrandKit.id,
      status: 'completed',
      jobData,
      concepts,
      posters,
      socialPosts,
      diversityAuditScore: 98,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      users: [defaultUser],
      brand_kits: [defaultBrandKit],
      campaigns: [initialCampaign],
      job_data: [jobData],
      creative_concepts: concepts,
      posters,
      social_posts: socialPosts,
      generated_assets: posters.map((p) => ({
        id: `asset-${p.id}`,
        campaignId,
        posterId: p.id,
        type: 'ai_background',
        url: p.backgroundImageUrl,
        mimeType: 'image/jpeg',
        prompt: concepts.find((c) => c.id === p.conceptId)?.prompt_tao_anh,
        provider: p.imageProvider,
        createdAt: new Date().toISOString(),
      })),
    };
  }

  static loadLocal(): DatabaseSchema {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DatabaseSchema;
        if (parsed.campaigns && parsed.brand_kits) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    const seeded = this.createInitialSeed();
    this.saveLocal(seeded);
    return seeded;
  }

  static saveLocal(db: DatabaseSchema): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore quota errors
    }
  }
}
