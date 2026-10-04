import React, { useState } from 'react';
import { PosterRecord, CreativeConcept, PosterLayoutTemplate } from '../types';
import { PosterCanvasCard } from './PosterCanvasCard';
import { X, Save, RotateCcw } from 'lucide-react';

interface PosterEditorModalProps {
  poster: PosterRecord;
  concept: CreativeConcept;
  onClose: () => void;
  onSave: (updatedPoster: PosterRecord) => void;
}

const AVAILABLE_FONTS = [
  'Be Vietnam Pro',
  'Plus Jakarta Sans',
  'Syne',
  'Playfair Display',
];

const AVAILABLE_LAYOUTS: Array<{ value: PosterLayoutTemplate; label: string }> = [
  { value: 'corporate-split', label: '01. Chuyên nghiệp Doanh nghiệp' },
  { value: 'modern-dynamic', label: '02. Trẻ trung Năng động' },
  { value: 'cinematic-bottom', label: '03. Điện ảnh Chiều sâu' },
  { value: 'luxury-frame', label: '04. Đẳng cấp Khung viền Vàng' },
  { value: 'minimal-swiss', label: '05. Tối giản Thụy Sĩ (Sáng)' },
  { value: 'lifestyle-card', label: '06. Thẻ nổi Lifestyle' },
  { value: 'editorial-magazine', label: '07. Bìa Tạp chí Editorial' },
  { value: 'social-impact', label: '08. Tâm điểm Mạng xã hội' },
  { value: 'human-centric', label: '09. Ấm áp Văn hóa Đội ngũ' },
  { value: 'high-conversion', label: '10. Chuyển đổi cao Thu nhập' },
];

export const PosterEditorModal: React.FC<PosterEditorModalProps> = ({
  poster,
  concept,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<PosterRecord>(() => JSON.parse(JSON.stringify(poster)));

  const handleReset = () => {
    setDraft(JSON.parse(JSON.stringify(poster)));
  };

  const handlePointChange = (idx: number, val: string) => {
    const updated = [...draft.diem_hap_dan];
    updated[idx] = val;
    setDraft({ ...draft, diem_hap_dan: updated });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="w-full max-w-6xl bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h2 className="text-base font-bold text-white">
              Trình chỉnh sửa Poster #{String(poster.index).padStart(2, '0')} — {concept.ten_concept}
            </h2>
            <p className="text-xs text-slate-400">
              Chỉnh sửa trực tiếp nội dung tiếng Việt, bố cục, phông chữ và màu sắc trên Canvas thời gian thực
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi phục gốc
            </button>
            <button
              type="button"
              onClick={() => onSave({ ...draft, updatedAt: new Date().toISOString() })}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Lưu thay đổi
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left: Live Canvas Preview */}
          <div className="lg:col-span-5 bg-[#090D16] p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="w-full max-w-sm">
              <PosterCanvasCard poster={draft} concept={concept} />
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Xem trước trực tiếp chuẩn tỷ lệ {draft.aspectRatio} · Không biến dạng dấu tiếng Việt
            </p>
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-7 p-6 space-y-6 overflow-y-auto">
            {/* Section 1: Core Recruitment Copy */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">
                1. Nội dung chính trên Poster
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Tiêu đề tuyển dụng</label>
                  <input
                    type="text"
                    value={draft.tieu_de}
                    onChange={(e) => setDraft({ ...draft, tieu_de: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Vị trí công việc</label>
                  <input
                    type="text"
                    value={draft.vi_tri}
                    onChange={(e) => setDraft({ ...draft, vi_tri: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Phụ đề thu hút</label>
                  <input
                    type="text"
                    value={draft.phu_de}
                    onChange={(e) => setDraft({ ...draft, phu_de: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Mức lương / Thu nhập</label>
                  <input
                    type="text"
                    placeholder="Để trống nếu không hiển thị"
                    value={draft.luong}
                    onChange={(e) => setDraft({ ...draft, luong: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Địa điểm làm việc</label>
                  <input
                    type="text"
                    value={draft.dia_diem}
                    onChange={(e) => setDraft({ ...draft, dia_diem: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Nút kêu gọi (CTA)</label>
                  <input
                    type="text"
                    value={draft.cta}
                    onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Key Highlights */}
            <div className="border-t border-slate-800 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">
                2. Điểm hấp dẫn / Quyền lợi chính (Tối đa 3 dòng)
              </h3>
              <div className="space-y-2.5">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Điểm nổi bật #${idx + 1}`}
                    value={draft.diem_hap_dan[idx] || ''}
                    onChange={(e) => handlePointChange(idx, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                ))}
              </div>
            </div>

            {/* Section 3: Company & Contact Info */}
            <div className="border-t border-slate-800 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">
                3. Thông tin công ty & Liên hệ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Tên công ty</label>
                  <input
                    type="text"
                    value={draft.ten_cong_ty}
                    onChange={(e) => setDraft({ ...draft, ten_cong_ty: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Hotline</label>
                  <input
                    type="text"
                    value={draft.hotline}
                    onChange={(e) => setDraft({ ...draft, hotline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Website</label>
                  <input
                    type="text"
                    value={draft.website}
                    onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Typography & Layout Styling */}
            <div className="border-t border-slate-800 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">
                4. Bố cục, Phông chữ & Màu sắc
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Mẫu Bố cục (Layout Template)</label>
                  <select
                    value={draft.layoutTemplate}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        layoutTemplate: e.target.value as PosterLayoutTemplate,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {AVAILABLE_LAYOUTS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Font chữ tiếng Việt</label>
                  <select
                    value={draft.typography.fontFamily}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: { ...draft.typography, fontFamily: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Vị trí khối chữ</label>
                  <select
                    value={draft.typography.position}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...draft.typography,
                          position: e.target.value as PosterRecord['typography']['position'],
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="bottom">Phía dưới (Chuẩn quảng cáo)</option>
                    <option value="center">Trung tâm poster</option>
                    <option value="top">Phía trên (Editorial)</option>
                    <option value="split">Phân mảng (Split)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Căn lề chữ</label>
                  <select
                    value={draft.typography.align}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...draft.typography,
                          align: e.target.value as 'left' | 'center' | 'right',
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="left">Căn trái</option>
                    <option value="center">Căn giữa</option>
                    <option value="right">Căn phải</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Kích thước chữ ({Math.round(draft.typography.titleSize * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.75"
                    max="1.35"
                    step="0.05"
                    value={draft.typography.titleSize}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...draft.typography,
                          titleSize: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Độ đậm lớp phủ nền ({Math.round(draft.typography.overlayOpacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.35"
                    max="0.98"
                    step="0.03"
                    value={draft.typography.overlayOpacity}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...draft.typography,
                          overlayOpacity: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-300 mb-1">Màu điểm nhấn</label>
                    <input
                      type="color"
                      value={draft.typography.accentColor}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          typography: { ...draft.typography, accentColor: e.target.value },
                        })
                      }
                      className="w-full h-9 bg-slate-900 border border-slate-700 rounded-md cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-300 mb-1">Màu chữ chính</label>
                    <input
                      type="color"
                      value={draft.typography.textColor}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          typography: { ...draft.typography, textColor: e.target.value },
                        })
                      }
                      className="w-full h-9 bg-slate-900 border border-slate-700 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
