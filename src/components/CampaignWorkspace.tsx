import React, { useState } from 'react';
import {
  Campaign,
  PosterRecord,
  CreativeConcept,
  SocialPostRecord,
  AspectRatioOption,
  BrandKit,
} from '../types';
import { DEMO_PRESETS } from '../data/demoPresets';
import { PosterCanvasCard } from './PosterCanvasCard';
import { FullscreenPosterModal } from './FullscreenPosterModal';
import { PosterEditorModal } from './PosterEditorModal';
import { CampaignExporter } from '../utils/exportZip';
import {
  Sparkles,
  Upload,
  Eye,
  Edit3,
  RefreshCw,
  Download,
  Copy,
  Check,
  Archive,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react';

interface CampaignWorkspaceProps {
  activeCampaign: Campaign;
  brandKit: BrandKit;
  useBrandKit: boolean;
  setUseBrandKit: (val: boolean) => void;
  onGenerateCampaign: (params: {
    rawInput: string;
    aspectRatio: AspectRatioOption;
    stylePreference: string;
    language: string;
    referenceImageUrl?: string;
  }) => Promise<void>;
  onUpdatePoster: (updatedPoster: PosterRecord) => void;
  onRegenerateSinglePoster: (
    posterId: string,
    mode: 'all' | 'image' | 'post'
  ) => Promise<void>;
  onDeletePoster: (posterId: string) => void;
  onSimulatePoster4Error: () => void;
}

export const CampaignWorkspace: React.FC<CampaignWorkspaceProps> = ({
  activeCampaign,
  brandKit,
  useBrandKit,
  setUseBrandKit,
  onGenerateCampaign,
  onUpdatePoster,
  onRegenerateSinglePoster,
  onDeletePoster,
  onSimulatePoster4Error,
}) => {
  const [rawInput, setRawInput] = useState(activeCampaign.rawInput);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(activeCampaign.aspectRatio);
  const [stylePreference, setStylePreference] = useState(activeCampaign.stylePreference || 'AI tự lựa chọn');
  const [language, setLanguage] = useState(activeCampaign.language || 'Tiếng Việt');
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | undefined>(
    activeCampaign.referenceImageUrl
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Modals state
  const [fullscreenPosterId, setFullscreenPosterId] = useState<string | null>(null);
  const [editorPosterId, setEditorPosterId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [regeneratingPosterId, setRegeneratingPosterId] = useState<string | null>(null);
  const [zipExportStatus, setZipExportStatus] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Chỉ hỗ trợ định dạng ảnh PNG, JPG hoặc WebP.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Kích thước ảnh không được vượt quá 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          const resp = await fetch('/api/upload-reference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl: reader.result,
              mimeType: file.type,
              sizeBytes: file.size,
            }),
          });
          if (resp.ok) {
            setReferenceImageUrl(reader.result);
          } else {
            const err = await resp.json();
            setUploadError(err.error || 'Lỗi kiểm tra ảnh tải lên.');
          }
        } catch {
          setReferenceImageUrl(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;
    await onGenerateCampaign({
      rawInput,
      aspectRatio,
      stylePreference,
      language,
      referenceImageUrl,
    });
  };

  const handleCopySinglePost = (post: SocialPostRecord) => {
    navigator.clipboard.writeText(post.facebookContent);
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  const handleSingleRegenerate = async (posterId: string, mode: 'all' | 'image' | 'post') => {
    setRegeneratingPosterId(posterId);
    await onRegenerateSinglePoster(posterId, mode);
    setRegeneratingPosterId(null);
  };

  const handleExportAllZip = async () => {
    try {
      setZipExportStatus('Đang chuẩn bị 10 poster & 10 bài viết...');
      await CampaignExporter.downloadFullCampaignZip(activeCampaign, (msg) => {
        setZipExportStatus(msg);
      });
    } finally {
      setTimeout(() => setZipExportStatus(null), 1500);
    }
  };

  const fullscreenPoster = activeCampaign.posters.find((p) => p.id === fullscreenPosterId);
  const fullscreenConcept = fullscreenPoster
    ? activeCampaign.concepts.find((c) => c.id === fullscreenPoster.conceptId) ||
      activeCampaign.concepts[fullscreenPoster.index - 1]
    : undefined;
  const fullscreenPost = fullscreenPoster
    ? activeCampaign.socialPosts.find((s) => s.posterId === fullscreenPoster.id) ||
      activeCampaign.socialPosts[fullscreenPoster.index - 1]
    : undefined;

  const editorPoster = activeCampaign.posters.find((p) => p.id === editorPosterId);
  const editorConcept = editorPoster
    ? activeCampaign.concepts.find((c) => c.id === editorPoster.conceptId) ||
      activeCampaign.concepts[editorPoster.index - 1]
    : undefined;

  return (
    <div className="space-y-12 pb-16">
      {/* =====================================================================
          SECTION 1: MAIN CREATION FORM (GIAO DIỆN CHÍNH)
      ====================================================================== */}
      <section className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              AI TẠO POSTER TUYỂN DỤNG
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Nhập một lần – AI tạo 10 poster và 10 bài tuyển dụng.
            </p>
          </div>

          {/* Preset Quick Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Mẫu nhanh:</span>
            <select
              onChange={(e) => {
                const found = DEMO_PRESETS.find((p) => p.id === e.target.value);
                if (found) {
                  setRawInput(found.rawInput);
                  setAspectRatio(found.aspectRatio);
                }
              }}
              defaultValue=""
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                -- Chọn dữ liệu mẫu (8 ngành nghề) --
              </option>
              {DEMO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.industry})
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleTriggerGenerate} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Recruitment Text Input */}
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Ô nhập nội dung tuyển dụng
                </label>
                <span className="text-xs text-slate-500">
                  AI tự trích xuất vị trí, lương, địa điểm (không tự bịa số liệu)
                </span>
              </div>
              <textarea
                rows={6}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={`Ví dụ:\nCông ty ABC tuyển 10 nhân viên kinh doanh tại Hà Nội.\nThu nhập 10–20 triệu/tháng.\nKhông yêu cầu kinh nghiệm.\nMôi trường trẻ, năng động.`}
                className="w-full bg-[#090D16] border border-slate-700/80 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Right: Optional Reference Image Upload */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Tải ảnh tham khảo (Tùy chọn)
                </label>

                {referenceImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-blue-500/50 bg-slate-900 h-40 flex items-center justify-center">
                    <img
                      src={referenceImageUrl}
                      alt="Ảnh tham khảo"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setReferenceImageUrl(undefined)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-950/80 text-slate-300 hover:text-white rounded-full cursor-pointer"
                      title="Xóa ảnh tham khảo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-3 py-1.5 text-[11px] text-emerald-400">
                      ✓ AI sẽ giữ đối tượng chính & kết hợp bối cảnh
                    </div>
                  </div>
                ) : (
                  <label className="h-40 border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl bg-[#090D16]/60 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-blue-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-200">
                      Bấm để tải ảnh tham khảo
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Hoặc bỏ trống để AI tự tạo 10 bối cảnh theo nghề (PNG, JPG, WebP ≤ 8MB)
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {uploadError && (
                  <p className="text-xs text-red-400 mt-1.5">{uploadError}</p>
                )}
              </div>

              {/* Brand Kit Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900/70 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBrandKit}
                  onChange={(e) => setUseBrandKit(e.target.checked)}
                  className="rounded accent-blue-600"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    Đồng bộ Brand Kit ({brandKit.ten_cong_ty.slice(0, 26)}...)
                  </span>
                  <span className="text-slate-500">
                    Chỉ bổ sung thông tin nếu ô nhập liệu để trống
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Options Row: Số lượng poster, Tỷ lệ, Phong cách, Ngôn ngữ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Số lượng poster</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-sm font-mono-num font-bold text-white flex items-center justify-between">
                <span>10 Poster + 10 Bài viết</span>
                <span className="text-xs text-blue-400">Mặc định</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Tỷ lệ khung hình</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['1:1', '4:5', '9:16'] as AspectRatioOption[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 text-xs font-mono-num font-semibold rounded-md transition-colors cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    [{ratio}]
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Phong cách thiết kế</label>
              <select
                value={stylePreference}
                onChange={(e) => setStylePreference(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="AI tự lựa chọn">AI tự lựa chọn (Đa dạng 10 Concept)</option>
                <option value="Chuyên nghiệp doanh nghiệp">Ưu tiên Doanh nghiệp & Hiện đại</option>
                <option value="Trẻ trung năng động">Ưu tiên Trẻ trung GenZ & Sáng tạo</option>
                <option value="Cao cấp & Điện ảnh">Ưu tiên Cao cấp & Cinematic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Ngôn ngữ</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Tiếng Việt">Tiếng Việt (Chuẩn dấu 100%)</option>
                <option value="Song ngữ Việt - Anh">Song ngữ Việt - Anh</option>
              </select>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base tracking-wide shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              ✨ TẠO 10 POSTER TUYỂN DỤNG
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================================
          SECTION 2: AI STRUCTURED EXTRACTION & QA SUMMARY BAR
      ====================================================================== */}
      <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">
              Kết quả AI Phân tích Nội dung (<code className="text-blue-400">PhanTichTuyenDungAI</code>)
            </h2>
            <p className="text-xs text-slate-400">
              Đối tượng mục tiêu: {activeCampaign.jobData.doi_tuong_ung_vien}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-mono-num text-emerald-400 font-semibold">
              Độ khác biệt 10 Concept: {activeCampaign.diversityAuditScore}/100
            </span>
            <button
              type="button"
              onClick={onSimulatePoster4Error}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300 underline cursor-pointer"
              title="Kiểm thử tính năng xử lý lỗi độc lập trên Poster số 04"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Kiểm thử lỗi Poster 04
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <span className="text-slate-500 block">Vị trí tuyển dụng</span>
            <span className="text-white font-semibold mt-0.5 block truncate">
              {activeCampaign.jobData.vi_tri || '(Để trống)'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <span className="text-slate-500 block">Ngành nghề suy luận</span>
            <span className="text-blue-300 font-semibold mt-0.5 block truncate">
              {activeCampaign.jobData.nganh_nghe}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <span className="text-slate-500 block">Số lượng</span>
            <span className="text-white font-mono-num font-semibold mt-0.5 block">
              {activeCampaign.jobData.so_luong || '(Không nêu)'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <span className="text-slate-500 block">Mức lương</span>
            <span className="text-amber-300 font-semibold mt-0.5 block truncate">
              {activeCampaign.jobData.luong || '(Để trống)'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <span className="text-slate-500 block">Địa điểm</span>
            <span className="text-white font-semibold mt-0.5 block truncate">
              {activeCampaign.jobData.dia_diem || '(Để trống)'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <span className="text-slate-500 block">Kinh nghiệm</span>
            <span className="text-emerald-300 font-semibold mt-0.5 block truncate">
              {activeCampaign.jobData.kinh_nghiem || '(Không nêu)'}
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: RESULTS HEADER & BATCH EXPORT ACTIONS (TRANG KẾT QUẢ)
      ====================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-white">
                🎉 Đã tạo {activeCampaign.posters.length} bộ tuyển dụng
              </h2>
              <span className="text-xs font-mono-num text-slate-400">
                ({activeCampaign.aspectRatio})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Mỗi bộ gồm 1 Poster thiết kế riêng + 1 Concept bối cảnh + 1 Bài đăng mạng xã hội tương ứng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                CampaignExporter.downloadAllPostsText(
                  activeCampaign.socialPosts,
                  activeCampaign.name
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              Tải toàn bộ 10 bài viết (.txt)
            </button>

            <button
              type="button"
              disabled={Boolean(zipExportStatus)}
              onClick={handleExportAllZip}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <Archive className="w-4 h-4" />
              {zipExportStatus || 'Tải toàn bộ chiến dịch (campaign.zip)'}
            </button>
          </div>
        </div>

        {/* Status checklist strip */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F172A] border border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium mr-2">Trạng thái 10 Poster:</span>
          {activeCampaign.posters.map((p) => {
            const pad = String(p.index).padStart(2, '0');
            const isFailed = p.status === 'failed';
            return (
              <span
                key={p.id}
                onClick={() =>
                  isFailed
                    ? handleSingleRegenerate(p.id, 'all')
                    : setFullscreenPosterId(p.id)
                }
                className={`font-mono-num cursor-pointer px-2 py-0.5 rounded transition-colors ${
                  isFailed
                    ? 'bg-red-950/70 text-red-300 border border-red-500/40'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Poster {pad} {isFailed ? '✕ [Thử lại]' : '✓'}
              </span>
            );
          })}
        </div>

        {/* ===================================================================
            RESPONSIVE POSTER GRID:
            Desktop (lg): 3 posters / row
            Tablet (sm/md): 2 posters / row
            Mobile: 1 poster / row
        ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCampaign.posters.map((poster, idx) => {
            const concept: CreativeConcept =
              activeCampaign.concepts.find((c) => c.id === poster.conceptId) ||
              activeCampaign.concepts[idx];
            const post: SocialPostRecord =
              activeCampaign.socialPosts.find((s) => s.posterId === poster.id) ||
              activeCampaign.socialPosts[idx];
            const padIdx = String(poster.index).padStart(2, '0');
            const isRegenerating = regeneratingPosterId === poster.id;

            return (
              <div
                key={poster.id}
                className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between transition-colors hover:border-slate-700"
              >
                {/* Card Header */}
                <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-xs font-mono-num font-bold text-blue-400">
                      POSTER {padIdx}
                    </span>
                    <span className="text-xs text-slate-500 mx-1.5">·</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {concept?.phong_cach}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-num text-emerald-400 shrink-0">
                    QA {poster.qualityAudit.totalScore}đ
                  </span>
                </div>

                {/* Canvas Poster Preview */}
                <div className="p-4 bg-[#090D16] relative">
                  <PosterCanvasCard
                    poster={poster}
                    concept={concept}
                    onClick={() => setFullscreenPosterId(poster.id)}
                    onRetry={() => handleSingleRegenerate(poster.id, 'all')}
                  />
                  {isRegenerating && (
                    <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang tạo lại Poster {padIdx}...
                      </div>
                    </div>
                  )}
                </div>

                {/* Concept & Post Snippet */}
                <div className="px-4 py-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-xs text-slate-300 font-medium truncate">
                    Góc tiếp cận: {concept?.goc_marketing}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {post?.hook} — {post?.gioi_thieu_vi_tri}
                  </p>
                </div>

                {/* 5 Required Action Buttons: [Xem] [Chỉnh sửa] [Tạo lại] [Tải xuống] [Copy bài viết] */}
                <div className="p-3 bg-slate-900/70 border-t border-slate-800 grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFullscreenPosterId(poster.id)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Xem toàn màn hình"
                  >
                    <Eye className="w-3.5 h-3.5 mb-1 text-blue-400" />
                    <span className="truncate">Xem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditorPosterId(poster.id)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Chỉnh sửa poster"
                  >
                    <Edit3 className="w-3.5 h-3.5 mb-1 text-emerald-400" />
                    <span className="truncate">Chỉnh sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSingleRegenerate(poster.id, 'all')}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Tạo lại riêng poster này"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mb-1 text-amber-400" />
                    <span className="truncate">Tạo lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => CampaignExporter.downloadSinglePoster(poster, concept, 'png')}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Tải xuống PNG"
                  >
                    <Download className="w-3.5 h-3.5 mb-1 text-purple-400" />
                    <span className="truncate">Tải xuống</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopySinglePost(post)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Copy bài viết tuyển dụng"
                  >
                    {copiedPostId === post?.id ? (
                      <Check className="w-3.5 h-3.5 mb-1 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 mb-1 text-sky-400" />
                    )}
                    <span className="truncate">
                      {copiedPostId === post?.id ? 'Đã copy' : 'Copy bài'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fullscreen Modal */}
      {fullscreenPoster && fullscreenConcept && fullscreenPost && (
        <FullscreenPosterModal
          poster={fullscreenPoster}
          concept={fullscreenConcept}
          post={fullscreenPost}
          jobData={activeCampaign.jobData}
          onClose={() => setFullscreenPosterId(null)}
          onOpenEditor={() => {
            const id = fullscreenPoster.id;
            setFullscreenPosterId(null);
            setEditorPosterId(id);
          }}
          onRegenerateAll={() => handleSingleRegenerate(fullscreenPoster.id, 'all')}
          onRegenerateImageOnly={() => handleSingleRegenerate(fullscreenPoster.id, 'image')}
          onRegeneratePostOnly={() => handleSingleRegenerate(fullscreenPoster.id, 'post')}
          onDeletePoster={() => {
            onDeletePoster(fullscreenPoster.id);
            setFullscreenPosterId(null);
          }}
        />
      )}

      {/* Editor Modal */}
      {editorPoster && editorConcept && (
        <PosterEditorModal
          poster={editorPoster}
          concept={editorConcept}
          onClose={() => setEditorPosterId(null)}
          onSave={(updated) => {
            onUpdatePoster(updated);
            setEditorPosterId(null);
          }}
        />
      )}
    </div>
  );
};
