import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export interface PipelineProgressState {
  active: boolean;
  stepIndex: number; // 0 to 6
  imageProgress: number; // 0 to 100
  composerProgress: number; // 0 to 100
  completed: boolean;
}

interface PipelineProgressModalProps {
  progress: PipelineProgressState;
}

export const PipelineProgressModal: React.FC<PipelineProgressModalProps> = ({ progress }) => {
  if (!progress.active) return null;

  const steps = [
    { id: 0, label: 'Đang phân tích nội dung tuyển dụng (PhanTichTuyenDungAI)...' },
    { id: 1, label: 'Đang xây dựng 10 concept sáng tạo khác biệt (TaoConceptAI)...' },
    {
      id: 2,
      label: 'Đang tạo 10 bối cảnh hình ảnh theo ngành nghề (ImageGenerationService)...',
      barValue: progress.imageProgress,
    },
    {
      id: 3,
      label: 'Đang thiết kế 10 poster chuẩn tiếng Việt (PosterComposer)...',
      barValue: progress.composerProgress,
    },
    { id: 4, label: 'Đang viết 10 bài đăng tuyển dụng đa kênh (TaoBaiDangAI)...' },
    { id: 5, label: 'Đang kiểm tra chất lượng & độ khác biệt (KiemTraChatLuongAI)...' },
  ];

  const renderAsciiBar = (percent: number) => {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return `${'█'.repeat(Math.max(0, filled))}${'░'.repeat(Math.max(0, empty))} ${percent}%`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0F172A] border border-slate-800 rounded-xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">
              Nhà máy AI đang sản xuất bộ chiến dịch tuyển dụng
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tự động hóa vai trò: Nhà tuyển dụng · Copywriter · Art Director · Graphic Designer
            </p>
          </div>
          <span className="font-mono-num text-xs font-semibold text-blue-400">
            {progress.completed ? '100%' : `Bước ${Math.min(progress.stepIndex + 1, 6)}/6`}
          </span>
        </div>

        <div className="space-y-4">
          {steps.map((step) => {
            const isDone = progress.stepIndex > step.id || progress.completed;
            const isCurrent = progress.stepIndex === step.id && !progress.completed;

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-lg border transition-colors ${
                  isDone
                    ? 'bg-slate-900/60 border-emerald-500/30 text-slate-200'
                    : isCurrent
                    ? 'bg-blue-950/30 border-blue-500/50 text-white'
                    : 'bg-slate-900/20 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{step.label}</span>
                  {isDone && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 shrink-0">
                      <Check className="w-4 h-4" /> Hoàn tất
                    </span>
                  )}
                  {isCurrent && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                  )}
                </div>

                {typeof step.barValue === 'number' && (isCurrent || isDone) && (
                  <div className="mt-2.5 flex items-center justify-between gap-4">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-200"
                        style={{ width: `${isDone ? 100 : step.barValue}%` }}
                      />
                    </div>
                    <span className="font-mono-num text-xs text-blue-300 shrink-0">
                      {renderAsciiBar(isDone ? 100 : step.barValue)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {progress.completed && (
          <div className="mt-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-center">
            <p className="text-base font-bold text-emerald-300">
              🎉 Đã tạo xong 10 poster và 10 bài đăng tuyển dụng!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
