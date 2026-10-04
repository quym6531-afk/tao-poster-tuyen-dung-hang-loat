import React, { useState } from 'react';
import {
  PosterRecord,
  CreativeConcept,
  SocialPostRecord,
  JobData,
} from '../types';
import { PosterCanvasCard } from './PosterCanvasCard';
import { CampaignExporter } from '../utils/exportZip';
import { ExportImageFormat } from '../services/poster-composer/PosterComposer';
import {
  X,
  Download,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  Trash2,
} from 'lucide-react';

interface FullscreenPosterModalProps {
  poster: PosterRecord;
  concept: CreativeConcept;
  post: SocialPostRecord;
  jobData: JobData;
  onClose: () => void;
  onOpenEditor: () => void;
  onRegenerateAll: () => void;
  onRegenerateImageOnly: () => void;
  onRegeneratePostOnly: () => void;
  onDeletePoster: () => void;
}

export const FullscreenPosterModal: React.FC<FullscreenPosterModalProps> = ({
  poster,
  concept,
  post,
  jobData,
  onClose,
  onOpenEditor,
  onRegenerateAll,
  onRegenerateImageOnly,
  onRegeneratePostOnly,
  onDeletePoster,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'zalo' | 'linkedin'>('facebook');
  const [exportFormat, setExportFormat] = useState<ExportImageFormat>('png');
  const [copied, setCopied] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const activePostText =
    selectedPlatform === 'facebook'
      ? post.facebookContent
      : selectedPlatform === 'zalo'
      ? post.zaloContent
      : post.linkedinContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(activePostText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    await CampaignExporter.downloadSinglePoster(poster, concept, exportFormat);
  };

  const triggerAction = async (fn: () => void) => {
    setIsBusy(true);
    await Promise.resolve(fn());
    setTimeout(() => setIsBusy(false), 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="w-full max-w-6xl bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>POSTER #{String(poster.index).padStart(2, '0')}</span>
              <span>·</span>
              <span>{concept.phong_cach}</span>
              <span>·</span>
              <span className="font-mono-num text-emerald-400">
                Điểm QA: {poster.qualityAudit.totalScore}/100
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">{concept.ten_concept}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format selector + Download button */}
            <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700">
              {(['png', 'jpeg', 'webp'] as ExportImageFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setExportFormat(fmt)}
                  className={`px-2 py-1 text-xs font-mono-num uppercase rounded transition-colors cursor-pointer ${
                    exportFormat === fmt
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt === 'jpeg' ? 'JPG' : fmt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Tải ảnh
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã copy bài viết' : 'Copy bài viết'}
            </button>

            <button
              type="button"
              onClick={onOpenEditor}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Chỉnh sửa
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-md cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left: High-res Poster View + Granular Regeneration Controls */}
          <div className="lg:col-span-5 bg-[#090D16] p-6 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="w-full max-w-sm my-auto">
              <PosterCanvasCard poster={poster} concept={concept} />
            </div>

            {/* Granular Regeneration Bar */}
            <div className="w-full mt-6 pt-4 border-t border-slate-800/80">
              <p className="text-xs text-slate-400 mb-2.5 text-center">
                Tạo lại độc lập (Không ảnh hưởng 9 poster còn lại):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => triggerAction(onRegenerateAll)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isBusy ? 'animate-spin' : ''}`} />
                  Tạo lại
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => triggerAction(onRegenerateImageOnly)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Tạo lại ảnh
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => triggerAction(onRegeneratePostOnly)}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Tạo lại bài viết
                </button>
                <button
                  type="button"
                  onClick={onDeletePoster}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-red-300 bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa
                </button>
              </div>
            </div>
          </div>

          {/* Right: Concept Details, Job Info & Social Media Post */}
          <div className="lg:col-span-7 p-6 space-y-6 overflow-y-auto">
            {/* 1. Concept Architecture */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
                Chi tiết Concept & Định hướng Nghệ thuật
              </h3>
              <p className="text-sm text-slate-200 mb-3">{concept.y_tuong}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div>
                  <span className="text-slate-500">Góc Marketing:</span>{' '}
                  <span className="text-slate-200 font-medium">{concept.goc_marketing}</span>
                </div>
                <div>
                  <span className="text-slate-500">Bối cảnh:</span>{' '}
                  <span className="text-slate-200">{concept.boi_canh}</span>
                </div>
                <div>
                  <span className="text-slate-500">Nhân vật:</span>{' '}
                  <span className="text-slate-200">{concept.nhan_vat}</span>
                </div>
                <div>
                  <span className="text-slate-500">Góc máy & Ánh sáng:</span>{' '}
                  <span className="text-slate-200">
                    {concept.goc_may} · {concept.anh_sang}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Social Media Copywriting */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Bài đăng tuyển dụng tương ứng (#{String(post.index).padStart(2, '0')})
                  </h3>
                  <p className="text-xs text-slate-400">{post.goc_tiep_can}</p>
                </div>

                {/* Platform Segmented Control */}
                <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                  {(['facebook', 'zalo', 'linkedin'] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setSelectedPlatform(plat)}
                      className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                        selectedPlatform === plat
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <pre className="w-full bg-[#090D16] border border-slate-800 rounded-lg p-4 text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto">
                  {activePostText}
                </pre>
              </div>
            </div>

            {/* 3. Extracted Job Data Summary */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Dữ liệu tuyển dụng gốc đã trích xuất (Không tự bịa thông tin)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded">
                  <span className="text-slate-500 block">Vị trí:</span>
                  <span className="text-slate-200 font-medium">{jobData.vi_tri || '—'}</span>
                </div>
                <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded">
                  <span className="text-slate-500 block">Ngành nghề:</span>
                  <span className="text-slate-200 font-medium">{jobData.nganh_nghe || '—'}</span>
                </div>
                <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded">
                  <span className="text-slate-500 block">Mức lương:</span>
                  <span className="text-slate-200 font-medium">{jobData.luong || '(Để trống)'}</span>
                </div>
                <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded">
                  <span className="text-slate-500 block">Địa điểm:</span>
                  <span className="text-slate-200 font-medium">{jobData.dia_diem || '(Để trống)'}</span>
                </div>
                <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded">
                  <span className="text-slate-500 block">Số lượng:</span>
                  <span className="text-slate-200 font-medium">{jobData.so_luong || '(Để trống)'}</span>
                </div>
                <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded">
                  <span className="text-slate-500 block">Hotline:</span>
                  <span className="text-slate-200 font-medium">
                    {jobData.lien_he.hotline || '(Để trống)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
