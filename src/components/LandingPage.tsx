import React from 'react';
import { GENERATED_STUDIO_IMAGES, DEMO_PRESETS } from '../data/demoPresets';
import { ArrowRight, CheckCircle2, Layers, Sparkles, Download } from 'lucide-react';

interface LandingPageProps {
  onStartCreate: (presetInput?: string) => void;
  onExploreCampaigns: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCreate,
  onExploreCampaigns,
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative rounded-2xl border border-slate-800 bg-[#0F172A] overflow-hidden p-8 md:p-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs font-medium text-blue-400 tracking-wide">
              Nhà máy sản xuất nội dung tuyển dụng bằng AI · Chuẩn tiếng Việt 100%
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Biến một nội dung tuyển dụng thành 10 poster chuyên nghiệp bằng AI.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Không cần designer. Không cần tự viết content. Chỉ cần nhập thông tin tuyển dụng — AI đồng thời đảm nhiệm vai trò Nhà tuyển dụng, Art Director, Graphic Designer và Copywriter để xuất bản trọn bộ 10 poster kèm 10 bài đăng khác biệt.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onStartCreate()}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-600/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                ✨ Tạo poster miễn phí
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onExploreCampaigns}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Xem chiến dịch mẫu (10 Poster)
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <span>10 Concept độc lập</span>
              <span>·</span>
              <span>Không lỗi dấu tiếng Việt</span>
              <span>·</span>
              <span>Không tự bịa SĐT / Mức lương</span>
              <span>·</span>
              <span>Xuất ZIP 10 Poster + 10 Bài viết</span>
            </div>
          </div>

          {/* Right: Visual Showcase Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            <div className="space-y-3.5">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900">
                <img
                  src={GENERATED_STUDIO_IMAGES.sales}
                  alt="Tuyển dụng Nhân viên kinh doanh"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-blue-400 uppercase">Concept 01 · Corporate</span>
                  <p className="text-sm font-extrabold text-white leading-tight mt-0.5">
                    NHÂN VIÊN KINH DOANH
                  </p>
                  <p className="text-xs font-mono-num text-amber-400 font-bold mt-1">
                    Thu nhập: 12 - 25 Triệu
                  </p>
                </div>
              </div>

              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900">
                <img
                  src={GENERATED_STUDIO_IMAGES.chef}
                  alt="Tuyển dụng Đầu bếp"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-3.5 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Concept 03 · Ẩm thực F&B</span>
                  <p className="text-xs font-bold text-white">BẾP TRƯỞNG NHÀ HÀNG</p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 pt-6">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900">
                <img
                  src={GENERATED_STUDIO_IMAGES.industrial}
                  alt="Tuyển dụng Kỹ thuật viên"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-3.5 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Concept 06 · Kỹ thuật</span>
                  <p className="text-xs font-bold text-white">KỸ SƯ VẬN HÀNH MÁY</p>
                </div>
              </div>

              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900">
                <img
                  src={GENERATED_STUDIO_IMAGES.tech}
                  alt="Tuyển dụng Lập trình viên"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">Concept 08 · Tech Studio</span>
                  <p className="text-sm font-extrabold text-white leading-tight mt-0.5">
                    FULL-STACK DEVELOPER
                  </p>
                  <p className="text-xs font-mono-num text-emerald-400 font-bold mt-1">
                    Up to $2,000 + ESOP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Capabilities Bento Grid */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-white">
            Quy trình 6 bước tự động hóa hoàn toàn
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Mỗi chiến dịch được AI tách lớp xử lý giữa Bối cảnh Nhiếp ảnh và Hệ thống Dựng chữ Vector Tiếng Việt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 p-6 rounded-xl bg-[#0F172A] border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono-num text-blue-400 font-semibold">
                01. AI phân tích tuyển dụng & Hiểu đúng ngữ cảnh ngành nghề
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                Trích xuất chính xác — Tuyệt đối không tự bịa đặt thông tin
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Hệ thống <code className="text-blue-300">PhanTichTuyenDungAI</code> tự động bóc tách Vị trí, Ngành nghề, Mức lương, Địa điểm, Yêu cầu và Quyền lợi. Nếu bạn không nhập Số điện thoại hoặc Lương, ứng dụng giữ trống chứ không tự ý điền số giả. Đồng thời tự động suy luận bối cảnh: Tuyển Đầu bếp có gian bếp hiện đại, tuyển Kỹ thuật có nhà máy cơ khí, tuyển Sales có văn phòng & khách hàng.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-400">
              <span>✓ Bảo toàn SĐT & Mức lương</span>
              <span>✓ Nhận diện 8+ nhóm ngành cốt lõi</span>
              <span>✓ Phân tích ảnh tham chiếu upload</span>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#0F172A] border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono-num text-emerald-400 font-semibold">
                02. 10 Concept khác nhau 100%
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                Không nhân bản 1 ảnh đổi màu
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Mỗi poster sở hữu một hướng tiếp cận riêng: Corporate, GenZ Dynamic, Cinematic, Executive Luxury, Minimalist Swiss, Lifestyle, Editorial, Social Stop-Scroll, Human Culture và High-Conversion.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-emerald-400 font-medium">
              Kiểm định độ khác biệt KiemTraDoKhacBietAI ≥ 85 điểm
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#0F172A] border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono-num text-amber-400 font-semibold">
                03. Chữ tiếng Việt sắc nét
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                PosterComposer HTML5 Canvas
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                AI chỉ tạo hình nền bối cảnh và nhân vật không chứa chữ rác. Toàn bộ Typography tiếng Việt được dựng bằng Canvas độ phân giải cao (1080×1350, 1080×1080, 1080×1920).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
              Hỗ trợ xuất PNG · JPG · WebP
            </div>
          </div>

          <div className="md:col-span-2 p-6 rounded-xl bg-[#0F172A] border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono-num text-purple-400 font-semibold">
                04. 10 Bài viết đa kênh & Đóng gói chiến dịch ZIP
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                Sẵn sàng đăng tải ngay lên Facebook, Zalo và LinkedIn
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Tương ứng với 10 góc độ marketing trên poster là 10 bài viết độc lập theo cấu trúc chuẩn: HOOK → GIỚI THIỆU VỊ TRÍ → MỨC LƯƠNG → QUYỀN LỢI → YÊU CẦU → ĐỊA ĐIỂM → CTA → HASHTAG. Tải trọn bộ <code className="text-purple-300">campaign.zip</code> chỉ với 1 cú nhấp chuột.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 text-slate-200">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Chỉnh sửa từng poster trực tiếp
              </span>
              <span className="inline-flex items-center gap-1 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tạo lại độc lập từng ảnh/bài viết
              </span>
              <span className="inline-flex items-center gap-1 text-slate-200">
                <Download className="w-3.5 h-3.5 text-amber-400" /> Tải lẻ hoặc tải toàn bộ ZIP
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Quick Start with 8 Vietnamese Industry Presets */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Thử ngay với 8 kịch bản tuyển dụng mẫu tại Việt Nam
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Chọn một ngành nghề bên dưới để nạp dữ liệu vào trình tạo chiến dịch và kiểm chứng khả năng suy luận bối cảnh của AI.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEMO_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onStartCreate(preset.rawInput)}
              className="p-5 rounded-xl bg-[#0F172A] border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="text-xs text-blue-400 font-medium mb-1">
                  {preset.industry} · Tỷ lệ {preset.aspectRatio}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                  {preset.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {preset.rawInput}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400">
                <span>Nạp mẫu này</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
