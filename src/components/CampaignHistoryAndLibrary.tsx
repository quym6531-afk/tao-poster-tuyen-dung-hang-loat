import React from 'react';
import { Campaign, GeneratedAsset } from '../types';
import { CampaignExporter } from '../utils/exportZip';
import { FolderOpen, Download, Trash2, Plus, Image as ImageIcon, Layers } from 'lucide-react';

interface CampaignHistoryViewProps {
  campaigns: Campaign[];
  activeCampaignId: string;
  onSelectCampaign: (campaignId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onCreateNew: () => void;
}

export const CampaignHistoryView: React.FC<CampaignHistoryViewProps> = ({
  campaigns,
  activeCampaignId,
  onSelectCampaign,
  onDeleteCampaign,
  onCreateNew,
}) => {
  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Lịch sử Chiến dịch Tuyển dụng</h1>
          <p className="text-sm text-slate-400 mt-1">
            Lưu trữ đầy đủ nội dung đầu vào, dữ liệu trích xuất, 10 concept, 10 poster và 10 bài đăng của từng đợt tuyển dụng.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo chiến dịch mới
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#0F172A] border border-slate-800 text-center space-y-4">
          <FolderOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Chưa có chiến dịch nào</h3>
            <p className="text-xs text-slate-400">
              Hãy tạo chiến dịch đầu tiên để AI sản xuất 10 poster và 10 bài đăng tuyển dụng.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer"
          >
            Tạo chiến dịch đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp) => {
            const isSelected = camp.id === activeCampaignId;
            return (
              <div
                key={camp.id}
                className={`p-6 rounded-xl bg-[#0F172A] border transition-colors ${
                  isSelected ? 'border-blue-500/70' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono-num text-blue-400 font-semibold">
                        {new Date(camp.createdAt).toLocaleString('vi-VN')}
                      </span>
                      <span>·</span>
                      <span>Ngành: {camp.jobData.nganh_nghe}</span>
                      <span>·</span>
                      <span className="font-mono-num">Tỷ lệ {camp.aspectRatio}</span>
                      <span>·</span>
                      <span className="font-mono-num text-emerald-400">
                        {camp.posters.length} Poster & {camp.socialPosts.length} Bài viết
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{camp.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {camp.rawInput}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectCampaign(camp.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      Mở chiến dịch
                    </button>

                    <button
                      type="button"
                      onClick={() => CampaignExporter.downloadFullCampaignZip(camp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Tải ZIP
                    </button>

                    {campaigns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteCampaign(camp.id)}
                        className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Xóa chiến dịch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface LibraryAndSettingsViewProps {
  mode: 'library' | 'settings';
  assets: GeneratedAsset[];
  campaigns: Campaign[];
  serverStatus: {
    demoMode: boolean;
    hasGeminiKey: boolean;
    imageProvider: string;
    imageModel: string;
    storageProvider: string;
  };
}

export const LibraryAndSettingsView: React.FC<LibraryAndSettingsViewProps> = ({
  mode,
  assets,
  campaigns,
  serverStatus,
}) => {
  if (mode === 'library') {
    return (
      <div className="space-y-8 pb-16">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-bold text-white">Thư viện Tài nguyên & Concept AI</h1>
          <p className="text-sm text-slate-400 mt-1">
            Toàn bộ hình ảnh bối cảnh ngành nghề và các Concept nghệ thuật đã được sinh ra trong hệ thống.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {assets.slice(0, 16).map((asset) => (
            <div
              key={asset.id}
              className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div className="aspect-[4/3] bg-slate-900 overflow-hidden">
                <img
                  src={asset.url}
                  alt="Generated recruitment background"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1 text-blue-400 font-medium">
                    <ImageIcon className="w-3 h-3" /> {asset.provider}
                  </span>
                  <span className="font-mono-num">
                    {new Date(asset.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {asset.prompt || 'Bối cảnh nhiếp ảnh thương mại tuyển dụng'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white">Cấu hình Hệ thống & Kiến trúc AI</h1>
        <p className="text-sm text-slate-400 mt-1">
          Thông tin kết nối AI Provider, Database Schema và trạng thái vận hành Server-Side bảo mật.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-[#0F172A] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Layers className="w-4 h-4 text-blue-400" />
            Trạng thái AI & ImageGenerationService
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Chế độ hoạt động:</span>
              <span className="font-mono-num font-semibold text-emerald-400">
                {serverStatus.hasGeminiKey ? 'LIVE GEMINI AI + STUDIO' : 'DEMO_MODE=true (Active)'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Nhà cung cấp tạo ảnh (IMAGE_PROVIDER):</span>
              <span className="font-mono-num text-white">{serverStatus.imageProvider}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Model tạo ảnh (IMAGE_MODEL):</span>
              <span className="font-mono-num text-white">{serverStatus.imageModel}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Bảo mật API Key:</span>
              <span className="text-emerald-400 font-medium">100% Server-Side (Express Proxy)</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[#0F172A] border border-slate-800 space-y-4">
          <div className="text-sm font-bold text-white">
            Thống kê Cơ sở dữ liệu (8 Bảng chuẩn UUID)
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">campaigns</span>
              <span className="text-lg font-mono-num font-bold text-white">{campaigns.length}</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">posters</span>
              <span className="text-lg font-mono-num font-bold text-blue-400">
                {campaigns.reduce((acc, c) => acc + c.posters.length, 0)}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">social_posts</span>
              <span className="text-lg font-mono-num font-bold text-emerald-400">
                {campaigns.reduce((acc, c) => acc + c.socialPosts.length, 0)}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">generated_assets</span>
              <span className="text-lg font-mono-num font-bold text-amber-400">{assets.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
