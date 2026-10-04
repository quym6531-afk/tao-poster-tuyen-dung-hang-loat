import React, { useEffect, useRef, useState } from 'react';
import { PosterRecord, CreativeConcept } from '../types';
import { PosterComposer } from '../services/poster-composer/PosterComposer';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface PosterCanvasCardProps {
  poster: PosterRecord;
  concept: CreativeConcept;
  className?: string;
  onClick?: () => void;
  onRetry?: () => void;
}

export const PosterCanvasCard: React.FC<PosterCanvasCardProps> = ({
  poster,
  concept,
  className = '',
  onClick,
  onRetry,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function render() {
      if (!canvasRef.current || poster.status === 'failed') {
        setIsRendering(false);
        return;
      }
      setIsRendering(true);
      await PosterComposer.renderToCanvas(canvasRef.current, poster, concept);
      if (mounted) {
        setIsRendering(false);
      }
    }
    render();
    return () => {
      mounted = false;
    };
  }, [poster, concept]);

  const aspectClass =
    poster.aspectRatio === '1:1'
      ? 'aspect-square'
      : poster.aspectRatio === '9:16'
      ? 'aspect-[9/16]'
      : 'aspect-[4/5]';

  if (poster.status === 'failed') {
    return (
      <div
        className={`relative w-full ${aspectClass} bg-slate-900/90 border border-red-500/40 rounded-lg flex flex-col items-center justify-center p-6 text-center ${className}`}
      >
        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm font-semibold text-slate-100 mb-1">
          Poster {String(poster.index).padStart(2, '0')} gặp sự cố kết xuất
        </p>
        <p className="text-xs text-slate-400 mb-4 max-w-xs">
          {poster.errorMessage || 'Quá thời gian phản hồi từ dịch vụ tạo ảnh. 9 poster còn lại vẫn hoạt động bình thường.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại poster {String(poster.index).padStart(2, '0')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative w-full ${aspectClass} bg-slate-900 rounded-lg overflow-hidden select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain block transition-transform duration-200 group-hover:scale-[1.01]"
      />
      {isRendering && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Đang dựng chữ tiếng Việt...</span>
          </div>
        </div>
      )}
    </div>
  );
};
