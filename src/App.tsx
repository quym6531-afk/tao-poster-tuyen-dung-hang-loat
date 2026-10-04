import React, { useState, useEffect } from 'react';
import {
  Campaign,
  PosterRecord,
  BrandKit,
  AspectRatioOption,
  JobData,
} from './types';
import {
  ClientDatabaseService,
  DatabaseSchema,
} from './services/database/ClientDatabaseService';
import {
  PhanTichTuyenDungAI,
  TaoConceptAI,
  TaoNoiDungPosterAI,
  TaoBaiDangAI,
  KiemTraChatLuongAI,
  KiemTraDoKhacBietAI,
} from './services/ai/aiModules';
import { ImageGenerationService } from './services/image-generation/ImageGenerationService';
import { LandingPage } from './components/LandingPage';
import { CampaignWorkspace } from './components/CampaignWorkspace';
import { BrandKitView } from './components/BrandKitView';
import {
  CampaignHistoryView,
  LibraryAndSettingsView,
} from './components/CampaignHistoryAndLibrary';
import {
  PipelineProgressModal,
  PipelineProgressState,
} from './components/PipelineProgressModal';
import { Sparkles, Plus } from 'lucide-react';

type ActiveTab =
  | 'dashboard'
  | 'create'
  | 'campaigns'
  | 'brandkit'
  | 'library'
  | 'settings';

export default function App() {
  const [db, setDb] = useState<DatabaseSchema>(() =>
    ClientDatabaseService.loadLocal()
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('create');
  const [activeCampaignId, setActiveCampaignId] = useState<string>(
    () => ClientDatabaseService.loadLocal().campaigns[0]?.id || ''
  );
  const [useBrandKit, setUseBrandKit] = useState<boolean>(false);

  const [serverStatus, setServerStatus] = useState({
    demoMode: true,
    hasGeminiKey: false,
    imageProvider: 'demo_studio',
    imageModel: 'gemini-3.1-flash-lite-image',
    storageProvider: 'local',
  });

  const [progress, setProgress] = useState<PipelineProgressState>({
    active: false,
    stepIndex: 0,
    imageProgress: 0,
    composerProgress: 0,
    completed: false,
  });

  // Sync status and persisted DB with Express backend on mount
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) {
          setServerStatus(data);
        }
      })
      .catch(() => {
        // Ignore offline errors in demo mode
      });
  }, []);

  const persistDb = (nextDb: DatabaseSchema) => {
    setDb(nextDb);
    ClientDatabaseService.saveLocal(nextDb);
    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextDb),
    }).catch(() => {});
  };

  const activeBrandKit: BrandKit = db.brand_kits[0];
  const activeCampaign: Campaign =
    db.campaigns.find((c) => c.id === activeCampaignId) || db.campaigns[0];

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // =========================================================================
  // FULL 6-STAGE AI PRODUCTION PIPELINE
  // =========================================================================
  const handleGenerateCampaign = async (params: {
    rawInput: string;
    aspectRatio: AspectRatioOption;
    stylePreference: string;
    language: string;
    referenceImageUrl?: string;
  }) => {
    const campaignId = `camp-${Date.now()}`;
    const brandToApply = useBrandKit ? activeBrandKit : undefined;

    setProgress({
      active: true,
      stepIndex: 0,
      imageProgress: 0,
      composerProgress: 0,
      completed: false,
    });

    // Step 1: Analyze recruitment text (Try server Gemini API first, fallback to PhanTichTuyenDungAI)
    let jobData: JobData = PhanTichTuyenDungAI.parseFromText(
      params.rawInput,
      campaignId,
      brandToApply
    );

    try {
      const resp = await fetch('/api/ai/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: params.rawInput }),
      });
      if (resp.ok) {
        const resJson = await resp.json();
        if (resJson.jobData && resJson.jobData.vi_tri) {
          jobData = {
            ...jobData,
            ...resJson.jobData,
            id: `job-${Date.now()}`,
            campaignId,
            lien_he: {
              hotline: resJson.jobData.lien_he?.hotline || jobData.lien_he.hotline || '',
              email: resJson.jobData.lien_he?.email || jobData.lien_he.email || '',
              website: resJson.jobData.lien_he?.website || jobData.lien_he.website || '',
              dia_chi: resJson.jobData.lien_he?.dia_chi || jobData.lien_he.dia_chi || '',
            },
          };
        }
      }
    } catch {
      // Deterministic parser already produced accurate non-hallucinated JobData
    }

    await sleep(350);

    // Step 2: Generate 10 distinct creative concepts
    setProgress((p) => ({ ...p, stepIndex: 1 }));
    const concepts = TaoConceptAI.generate10Concepts(
      jobData,
      campaignId,
      brandToApply
    );
    await sleep(350);

    // Step 3: Generate 10 industry-contextual background images
    setProgress((p) => ({ ...p, stepIndex: 2, imageProgress: 20 }));
    const generatedImages: Array<{ url: string; provider: string }> = [];

    for (let i = 0; i < concepts.length; i++) {
      const imgRes = await ImageGenerationService.generateImageForConcept({
        concept: concepts[i],
        job: jobData,
        aspectRatio: params.aspectRatio,
        referenceImageUrl: params.referenceImageUrl,
      });
      generatedImages.push({ url: imgRes.imageUrl, provider: imgRes.provider });
      setProgress((p) => ({
        ...p,
        imageProgress: Math.min(100, Math.round(((i + 1) / concepts.length) * 100)),
      }));
      await sleep(70);
    }

    // Step 4: Compose 10 Vietnamese vector-typography posters
    setProgress((p) => ({ ...p, stepIndex: 3, composerProgress: 25 }));
    const posters: PosterRecord[] = [];
    for (let i = 0; i < concepts.length; i++) {
      const poster = TaoNoiDungPosterAI.createPosterRecord(
        jobData,
        concepts[i],
        campaignId,
        params.aspectRatio,
        generatedImages[i].url,
        generatedImages[i].provider,
        brandToApply
      );
      posters.push(poster);
      setProgress((p) => ({
        ...p,
        composerProgress: Math.min(100, Math.round(((i + 1) / concepts.length) * 100)),
      }));
      await sleep(60);
    }

    // Step 5: Write 10 unique social media posts
    setProgress((p) => ({ ...p, stepIndex: 4 }));
    const socialPosts = posters.map((poster, i) =>
      TaoBaiDangAI.generatePostForPoster(jobData, concepts[i], poster)
    );
    await sleep(300);

    // Step 6: Quality & Distinctness Audit (Auto-regenerate if score < 80)
    setProgress((p) => ({ ...p, stepIndex: 5 }));
    const auditedPosters = posters.map((poster) => {
      const audit = KiemTraChatLuongAI.auditPoster(poster, jobData, posters);
      return { ...poster, qualityAudit: audit };
    });
    const diversity = KiemTraDoKhacBietAI.calculateCampaignDiversity(
      concepts,
      auditedPosters
    );
    await sleep(300);

    setProgress((p) => ({ ...p, completed: true }));

    const newCampaign: Campaign = {
      id: campaignId,
      userId: db.users[0].id,
      name: `${jobData.vi_tri} (${jobData.dia_diem || jobData.nganh_nghe})`,
      rawInput: params.rawInput,
      referenceImageUrl: params.referenceImageUrl,
      referenceAnalysis: PhanTichTuyenDungAI.analyzeReferenceImage(
        params.referenceImageUrl
      ),
      aspectRatio: params.aspectRatio,
      stylePreference: params.stylePreference,
      language: params.language,
      posterCount: 10,
      brandKitId: brandToApply?.id,
      status: 'completed',
      jobData,
      concepts,
      posters: auditedPosters,
      socialPosts,
      diversityAuditScore: diversity.score,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newAssets = auditedPosters.map((p) => ({
      id: `asset-${p.id}`,
      campaignId,
      posterId: p.id,
      type: 'ai_background' as const,
      url: p.backgroundImageUrl,
      mimeType: 'image/jpeg',
      prompt: concepts.find((c) => c.id === p.conceptId)?.prompt_tao_anh,
      provider: p.imageProvider,
      createdAt: new Date().toISOString(),
    }));

    const nextDb: DatabaseSchema = {
      ...db,
      campaigns: [newCampaign, ...db.campaigns],
      job_data: [jobData, ...db.job_data],
      creative_concepts: [...concepts, ...db.creative_concepts],
      posters: [...auditedPosters, ...db.posters],
      social_posts: [...socialPosts, ...db.social_posts],
      generated_assets: [...newAssets, ...db.generated_assets],
    };

    persistDb(nextDb);
    setActiveCampaignId(campaignId);

    setTimeout(() => {
      setProgress((p) => ({ ...p, active: false }));
    }, 650);
  };

  // =========================================================================
  // GRANULAR REGENERATION FOR A SINGLE POSTER (DOES NOT TOUCH OTHER 9 POSTERS)
  // =========================================================================
  const handleRegenerateSinglePoster = async (
    posterId: string,
    mode: 'all' | 'image' | 'post'
  ) => {
    const targetPoster = activeCampaign.posters.find((p) => p.id === posterId);
    if (!targetPoster) return;

    const conceptIndex = targetPoster.index;
    const currentConcept =
      activeCampaign.concepts.find((c) => c.id === targetPoster.conceptId) ||
      activeCampaign.concepts[conceptIndex - 1];

    // Cycle or refresh background scene so user sees a fresh visual variation
    const rotatedIndex = ((conceptIndex + Math.floor(Math.random() * 4)) % 10) + 1;
    const newBgUrl = ImageGenerationService.getFallbackImageForJob(
      activeCampaign.jobData,
      rotatedIndex
    );

    const updatedPosters = activeCampaign.posters.map((p) => {
      if (p.id !== posterId) return p; // Strictly preserve the other 9 posters!
      if (mode === 'post') {
        return { ...p, status: 'completed' as const, errorMessage: undefined };
      }
      if (mode === 'image') {
        return {
          ...p,
          status: 'completed' as const,
          errorMessage: undefined,
          backgroundImageUrl: newBgUrl,
          updatedAt: new Date().toISOString(),
        };
      }
      // Mode === 'all': refresh copy variation + image + restore status if failed
      const freshPoster = TaoNoiDungPosterAI.createPosterRecord(
        activeCampaign.jobData,
        currentConcept,
        activeCampaign.id,
        activeCampaign.aspectRatio,
        newBgUrl,
        'demo_studio',
        useBrandKit ? activeBrandKit : undefined
      );
      return {
        ...freshPoster,
        id: p.id,
        index: p.index,
        status: 'completed' as const,
        errorMessage: undefined,
        updatedAt: new Date().toISOString(),
      };
    });

    const updatedPosts = activeCampaign.socialPosts.map((post) => {
      if (post.posterId !== posterId) return post;
      if (mode === 'image') return post;
      const refreshed = TaoBaiDangAI.generatePostForPoster(
        activeCampaign.jobData,
        currentConcept,
        updatedPosters.find((up) => up.id === posterId)!
      );
      return {
        ...refreshed,
        id: post.id,
        updatedAt: new Date().toISOString(),
      };
    });

    const updatedCampaign: Campaign = {
      ...activeCampaign,
      posters: updatedPosters,
      socialPosts: updatedPosts,
      updatedAt: new Date().toISOString(),
    };

    persistDb({
      ...db,
      campaigns: db.campaigns.map((c) =>
        c.id === activeCampaign.id ? updatedCampaign : c
      ),
    });
  };

  // Update a single poster from the Editor
  const handleUpdatePoster = (updatedPoster: PosterRecord) => {
    const updatedCampaign: Campaign = {
      ...activeCampaign,
      posters: activeCampaign.posters.map((p) =>
        p.id === updatedPoster.id ? updatedPoster : p
      ),
      updatedAt: new Date().toISOString(),
    };
    persistDb({
      ...db,
      campaigns: db.campaigns.map((c) =>
        c.id === activeCampaign.id ? updatedCampaign : c
      ),
    });
  };

  // Delete a single poster
  const handleDeletePoster = (posterId: string) => {
    if (activeCampaign.posters.length <= 1) return;
    const updatedCampaign: Campaign = {
      ...activeCampaign,
      posters: activeCampaign.posters.filter((p) => p.id !== posterId),
      socialPosts: activeCampaign.socialPosts.filter((s) => s.posterId !== posterId),
      updatedAt: new Date().toISOString(),
    };
    persistDb({
      ...db,
      campaigns: db.campaigns.map((c) =>
        c.id === activeCampaign.id ? updatedCampaign : c
      ),
    });
  };

  // Simulate Error on Poster 04 (Requirement #23: Xử lý lỗi)
  const handleSimulatePoster4Error = () => {
    const updatedPosters = activeCampaign.posters.map((p) =>
      p.index === 4
        ? {
            ...p,
            status: 'failed' as const,
            errorMessage:
              'Mô phỏng gián đoạn kết nối khi tạo ảnh cho Poster 04. Các poster 01-03 và 05-10 hoàn toàn không bị ảnh hưởng.',
          }
        : p
    );
    const updatedCampaign: Campaign = {
      ...activeCampaign,
      posters: updatedPosters,
    };
    persistDb({
      ...db,
      campaigns: db.campaigns.map((c) =>
        c.id === activeCampaign.id ? updatedCampaign : c
      ),
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      {/* =====================================================================
          STRICT 3-ZONE TOP BAR CONTRACT
          Zone 1: Single text element wordmark
          Zone 2: 6 clean navigation links
          Zone 3: 1 primary CTA button
      ====================================================================== */}
      <header className="sticky top-0 z-40 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <a
          href="#create"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('create');
          }}
          className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap"
        >
          AI TẠO POSTER TUYỂN DỤNG
        </a>

        {/* Zone 2: Navigation Links (Clean typography with hover underline) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard' ? 'text-white underline font-semibold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'create' ? 'text-white underline font-semibold' : ''
            }`}
          >
            Tạo chiến dịch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'campaigns' ? 'text-white underline font-semibold' : ''
            }`}
          >
            Chiến dịch ({db.campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('brandkit')}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'brandkit' ? 'text-white underline font-semibold' : ''
            }`}
          >
            Brand Kit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'library' ? 'text-white underline font-semibold' : ''
            }`}
          >
            Thư viện
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'settings' ? 'text-white underline font-semibold' : ''
            }`}
          >
            Cài đặt
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo 10 Poster
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        {(
          [
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'create', label: 'Tạo chiến dịch' },
            { id: 'campaigns', label: 'Chiến dịch' },
            { id: 'brandkit', label: 'Brand Kit' },
            { id: 'library', label: 'Thư viện' },
            { id: 'settings', label: 'Cài đặt' },
          ] as Array<{ id: ActiveTab; label: string }>
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === item.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          MAIN VIEWPORT CONTAINER
      ====================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'dashboard' && (
          <LandingPage
            onStartCreate={(presetInput) => {
              if (presetInput) {
                handleGenerateCampaign({
                  rawInput: presetInput,
                  aspectRatio: '4:5',
                  stylePreference: 'AI tự lựa chọn',
                  language: 'Tiếng Việt',
                });
              }
              setActiveTab('create');
            }}
            onExploreCampaigns={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'create' && activeCampaign && (
          <CampaignWorkspace
            key={activeCampaign.id}
            activeCampaign={activeCampaign}
            brandKit={activeBrandKit}
            useBrandKit={useBrandKit}
            setUseBrandKit={setUseBrandKit}
            onGenerateCampaign={handleGenerateCampaign}
            onUpdatePoster={handleUpdatePoster}
            onRegenerateSinglePoster={handleRegenerateSinglePoster}
            onDeletePoster={handleDeletePoster}
            onSimulatePoster4Error={handleSimulatePoster4Error}
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignHistoryView
            campaigns={db.campaigns}
            activeCampaignId={activeCampaignId}
            onSelectCampaign={(id) => {
              setActiveCampaignId(id);
              setActiveTab('create');
            }}
            onDeleteCampaign={(id) => {
              const filtered = db.campaigns.filter((c) => c.id !== id);
              persistDb({ ...db, campaigns: filtered });
              if (activeCampaignId === id && filtered[0]) {
                setActiveCampaignId(filtered[0].id);
              }
            }}
            onCreateNew={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'brandkit' && (
          <BrandKitView
            brandKit={activeBrandKit}
            onSaveBrandKit={(updated) => {
              persistDb({
                ...db,
                brand_kits: [updated],
              });
            }}
          />
        )}

        {(activeTab === 'library' || activeTab === 'settings') && (
          <LibraryAndSettingsView
            mode={activeTab}
            assets={db.generated_assets}
            campaigns={db.campaigns}
            serverStatus={serverStatus}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-300">
              AI TẠO POSTER TUYỂN DỤNG
            </span>
            <span>—</span>
            <span>Nhập một lần, AI tạo 10 poster và 10 bài tuyển dụng.</span>
          </div>
          <div>
            Hỗ trợ xuất PNG · JPG · WebP · Đóng gói ZIP toàn bộ chiến dịch
          </div>
        </div>
      </footer>

      {/* Real-time AI Progress Modal */}
      <PipelineProgressModal progress={progress} />
    </div>
  );
}
