export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type AspectRatioOption = '1:1' | '4:5' | '9:16';

export type PosterLayoutTemplate =
  | 'corporate-split'
  | 'modern-dynamic'
  | 'cinematic-bottom'
  | 'luxury-frame'
  | 'minimal-swiss'
  | 'lifestyle-card'
  | 'editorial-magazine'
  | 'social-impact'
  | 'human-centric'
  | 'high-conversion';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface BrandKit {
  id: string;
  userId: string;
  ten_cong_ty: string;
  logo: string; // Data URL or SVG or URL
  mau_chinh: string;
  mau_phu: string;
  font: string;
  website: string;
  hotline: string;
  email: string;
  dia_chi: string;
  isDefault: boolean;
  updatedAt: string;
}

export interface ContactInfo {
  hotline?: string;
  email?: string;
  website?: string;
  dia_chi?: string;
}

export interface JobData {
  id: string;
  campaignId: string;
  ten_cong_ty: string;
  vi_tri: string;
  nganh_nghe: string;
  so_luong: string;
  dia_diem: string;
  luong: string;
  kinh_nghiem: string;
  yeu_cau: string[];
  quyen_loi: string[];
  mo_ta: string;
  lien_he: ContactInfo;
  doi_tuong_ung_vien: string;
}

export interface CreativeConcept {
  id: string;
  campaignId: string;
  index: number; // 1 to 10
  ten_concept: string;
  y_tuong: string;
  boi_canh: string;
  nhan_vat: string;
  goc_may: string;
  anh_sang: string;
  mau_sac: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    overlayBg: string;
  };
  bo_cuc: PosterLayoutTemplate;
  phong_cach: string;
  goc_marketing: string;
  prompt_tao_anh: string;
}

export interface PosterTypographyConfig {
  fontFamily: string;
  titleSize: number; // Scale multiplier 0.7 to 1.5
  position: 'top' | 'center' | 'bottom' | 'split';
  textColor: string;
  accentColor: string;
  overlayOpacity: number; // 0.2 to 0.95
  align: 'left' | 'center' | 'right';
}

export interface QualityAuditResult {
  totalScore: number; // 0-100
  passed: boolean;
  criteria: {
    dung_nganh_nghe: boolean;
    dung_vi_tri: boolean;
    du_khoang_trong_chu: boolean;
    chu_de_doc: boolean;
    tieng_viet_chuan: boolean;
    thong_tin_chinh_xac: boolean;
    khac_biet_9_poster: boolean;
  };
  distinctnessScore: number; // 0-100
  notes: string;
}

export interface PosterRecord {
  id: string;
  campaignId: string;
  conceptId: string;
  index: number; // 1 to 10
  status: ProcessingStatus;
  errorMessage?: string;
  // Content strictly for the poster overlay (short, punchy, accurate)
  tieu_de: string;
  phu_de: string;
  vi_tri: string;
  diem_hap_dan: string[];
  luong: string;
  dia_diem: string;
  so_luong: string;
  kinh_nghiem: string;
  cta: string;
  ten_cong_ty: string;
  hotline: string;
  website: string;
  email: string;
  logo: string;
  // Visual & Layout
  backgroundImageUrl: string;
  imageProvider: string;
  aspectRatio: AspectRatioOption;
  layoutTemplate: PosterLayoutTemplate;
  typography: PosterTypographyConfig;
  qualityAudit: QualityAuditResult;
  updatedAt: string;
}

export interface SocialPostRecord {
  id: string;
  campaignId: string;
  posterId: string;
  index: number; // 1 to 10
  status: ProcessingStatus;
  goc_tiep_can: string;
  hook: string;
  gioi_thieu_vi_tri: string;
  muc_luong: string;
  quyen_loi: string[];
  yeu_cau: string[];
  dia_diem: string;
  cta: string;
  hashtags: string[];
  // Platform tailored versions
  facebookContent: string;
  zaloContent: string;
  linkedinContent: string;
  updatedAt: string;
}

export interface GeneratedAsset {
  id: string;
  campaignId: string;
  posterId?: string;
  type: 'reference_upload' | 'ai_background' | 'rendered_poster';
  url: string;
  mimeType: string;
  prompt?: string;
  provider: string;
  createdAt: string;
}

export interface ReferenceImageAnalysis {
  hasPerson: boolean;
  hasLogo: boolean;
  hasProductOrWorkspace: boolean;
  dominantColors: string[];
  subjectDescription: string;
  preservationStrategy: string;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  rawInput: string;
  referenceImageUrl?: string;
  referenceAnalysis?: ReferenceImageAnalysis;
  aspectRatio: AspectRatioOption;
  stylePreference: string;
  language: string;
  posterCount: number;
  brandKitId?: string;
  status: ProcessingStatus;
  jobData: JobData;
  concepts: CreativeConcept[];
  posters: PosterRecord[];
  socialPosts: SocialPostRecord[];
  diversityAuditScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface DemoPreset {
  id: string;
  title: string;
  industry: string;
  badge: string;
  rawInput: string;
  aspectRatio: AspectRatioOption;
}
