import React, { useState } from 'react';
import { BrandKit } from '../types';
import { Save, Check, Upload, Building2 } from 'lucide-react';

interface BrandKitViewProps {
  brandKit: BrandKit;
  onSaveBrandKit: (updated: BrandKit) => void;
}

export const BrandKitView: React.FC<BrandKitViewProps> = ({ brandKit, onSaveBrandKit }) => {
  const [draft, setDraft] = useState<BrandKit>(() => ({ ...brandKit }));
  const [savedNotice, setSavedNotice] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft({ ...draft, logo: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBrandKit({ ...draft, updatedAt: new Date().toISOString() });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Hồ sơ Thương hiệu (Brand Kit)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Lưu trữ nhận diện thương hiệu doanh nghiệp để tự động đồng bộ vào các chiến dịch tuyển dụng mới.
          </p>
        </div>
        {savedNotice && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
            <Check className="w-4 h-4" />
            Đã lưu Brand Kit thành công!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Tên công ty / Thương hiệu tuyển dụng
            </label>
            <input
              type="text"
              value={draft.ten_cong_ty}
              onChange={(e) => setDraft({ ...draft, ten_cong_ty: e.target.value })}
              placeholder="Ví dụ: Công ty Cổ phần Công nghệ NovaViet"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Hotline Tuyển dụng
            </label>
            <input
              type="text"
              value={draft.hotline}
              onChange={(e) => setDraft({ ...draft, hotline: e.target.value })}
              placeholder="Ví dụ: 0988.686.888"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Email Nhân sự (HR)
            </label>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              placeholder="Ví dụ: tuyendung@novaviet.vn"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Website
            </label>
            <input
              type="text"
              value={draft.website}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })}
              placeholder="Ví dụ: novaviet.vn"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Font chữ chủ đạo
            </label>
            <select
              value={draft.font}
              onChange={(e) => setDraft({ ...draft, font: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Be Vietnam Pro">Be Vietnam Pro (Chuẩn hiện đại)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Doanh nghiệp)</option>
              <option value="Syne">Syne (Sáng tạo trẻ trung)</option>
              <option value="Playfair Display">Playfair Display (Sang trọng cao cấp)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Địa chỉ văn phòng / chi nhánh
            </label>
            <input
              type="text"
              value={draft.dia_chi}
              onChange={(e) => setDraft({ ...draft, dia_chi: e.target.value })}
              placeholder="Ví dụ: Tầng 12, Tòa nhà PeakView, Đống Đa, Hà Nội"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Màu thương hiệu chính (Primary)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={draft.mau_chinh}
                onChange={(e) => setDraft({ ...draft, mau_chinh: e.target.value })}
                className="w-12 h-10 bg-slate-900 border border-slate-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={draft.mau_chinh}
                onChange={(e) => setDraft({ ...draft, mau_chinh: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono-num text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Màu điểm nhấn (Secondary / Accent)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={draft.mau_phu}
                onChange={(e) => setDraft({ ...draft, mau_phu: e.target.value })}
                className="w-12 h-10 bg-slate-900 border border-slate-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={draft.mau_phu}
                onChange={(e) => setDraft({ ...draft, mau_phu: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono-num text-white"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Logo công ty (Tùy chọn)
            </label>
            <div className="flex items-center gap-4">
              {draft.logo ? (
                <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                  <img
                    src={draft.logo}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Tải lên Logo (PNG/JPG)
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              {draft.logo && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, logo: '' })}
                  className="text-xs text-red-400 hover:underline cursor-pointer"
                >
                  Xóa logo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
              className="rounded accent-blue-600"
            />
            Tự động điền thông tin liên hệ từ Brand Kit nếu nội dung nhập vào bị khuyết
          </label>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Lưu Brand Kit
          </button>
        </div>
      </form>
    </div>
  );
};
