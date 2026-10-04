import { PosterRecord, CreativeConcept, AspectRatioOption } from '../../types';

export type ExportImageFormat = 'png' | 'jpeg' | 'webp';

export class PosterComposer {
  static getDimensions(aspectRatio: AspectRatioOption): { width: number; height: number } {
    switch (aspectRatio) {
      case '1:1':
        return { width: 1080, height: 1080 };
      case '4:5':
        return { width: 1080, height: 1350 };
      case '9:16':
        return { width: 1080, height: 1920 };
      default:
        return { width: 1080, height: 1350 };
    }
  }

  private static loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  private static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  private static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * Renders a PosterRecord and CreativeConcept onto an HTMLCanvasElement
   * with 10 distinct compositions so every poster looks uniquely art-directed.
   */
  static async renderToCanvas(
    canvas: HTMLCanvasElement,
    poster: PosterRecord,
    concept: CreativeConcept
  ): Promise<void> {
    const { width, height } = this.getDimensions(poster.aspectRatio);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Fill base background color
    ctx.fillStyle = concept.mau_sac.primary || '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // 2. Load and draw background image with concept-specific crop/framing
    const bgImg = await this.loadImage(poster.backgroundImageUrl);
    if (bgImg) {
      ctx.save();
      // Slight distinct framing per concept index so even shared studio photos look different in angle/crop
      const zoomVariants = [1.0, 1.08, 1.04, 1.12, 1.02, 1.06, 1.1, 1.05, 1.03, 1.09];
      const panXVariants = [0, -0.03, 0.02, -0.02, 0.03, 0, -0.04, 0.02, -0.01, 0.03];
      const zoom = zoomVariants[(poster.index - 1) % zoomVariants.length];
      const panX = panXVariants[(poster.index - 1) % panXVariants.length];

      const imgRatio = bgImg.width / bgImg.height;
      const canvasRatio = width / height;
      let drawW = width * zoom;
      let drawH = height * zoom;

      if (imgRatio > canvasRatio) {
        drawH = height * zoom;
        drawW = drawH * imgRatio;
      } else {
        drawW = width * zoom;
        drawH = drawW / imgRatio;
      }

      const offsetX = (width - drawW) / 2 + width * panX;
      const offsetY = (height - drawH) / 2;

      // For minimal-swiss, place image in bottom 58% frame
      if (poster.layoutTemplate === 'minimal-swiss') {
        ctx.beginPath();
        ctx.rect(56, height * 0.44, width - 112, height * 0.46);
        ctx.clip();
      }

      ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
      ctx.restore();
    }

    // 3. Draw template-specific art direction overlay / scrim
    const opacity = poster.typography.overlayOpacity ?? 0.88;
    const accent = poster.typography.accentColor || concept.mau_sac.accent || '#3B82F6';
    const textColor = poster.typography.textColor || concept.mau_sac.text || '#FFFFFF';
    const font = poster.typography.fontFamily || 'Be Vietnam Pro';
    const scale = poster.typography.titleSize || 1.0;

    ctx.save();
    switch (poster.layoutTemplate) {
      case 'corporate-split': {
        // Diagonal corporate gradient + left structural bar
        const grad = ctx.createLinearGradient(0, height * 0.25, 0, height);
        grad.addColorStop(0, 'rgba(15, 23, 42, 0.15)');
        grad.addColorStop(0.45, `rgba(15, 23, 42, ${Math.min(0.95, opacity)})`);
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Left vertical accent stripe
        ctx.fillStyle = accent;
        ctx.fillRect(0, height * 0.48, 16, height * 0.42);
        break;
      }

      case 'modern-dynamic': {
        // Energetic angled polygon block at bottom
        const grad = ctx.createLinearGradient(0, height * 0.3, width, height);
        grad.addColorStop(0, 'rgba(6, 78, 59, 0.1)');
        grad.addColorStop(0.5, `rgba(6, 78, 59, ${opacity})`);
        grad.addColorStop(1, 'rgba(4, 47, 46, 0.96)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(width - 280, 0);
        ctx.lineTo(width, 0);
        ctx.lineTo(width, 280);
        ctx.closePath();
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }

      case 'cinematic-bottom': {
        // Deep vignette top + bottom cinematic letterbox feel
        const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.28);
        topGrad.addColorStop(0, 'rgba(9, 13, 22, 0.85)');
        topGrad.addColorStop(1, 'rgba(9, 13, 22, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, height * 0.28);

        const botGrad = ctx.createLinearGradient(0, height * 0.38, 0, height);
        botGrad.addColorStop(0, 'rgba(9, 13, 22, 0)');
        botGrad.addColorStop(0.45, `rgba(9, 13, 22, ${opacity})`);
        botGrad.addColorStop(1, 'rgba(9, 13, 22, 0.98)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, height * 0.38, width, height * 0.62);
        break;
      }

      case 'luxury-frame': {
        const grad = ctx.createLinearGradient(0, height * 0.2, 0, height);
        grad.addColorStop(0, 'rgba(24, 24, 27, 0.25)');
        grad.addColorStop(0.5, `rgba(24, 24, 27, ${opacity})`);
        grad.addColorStop(1, 'rgba(9, 9, 11, 0.97)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Double gold frame
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.strokeRect(36, 36, width - 72, height - 72);
        ctx.lineWidth = 1;
        ctx.strokeRect(48, 48, width - 96, height - 96);
        break;
      }

      case 'minimal-swiss': {
        // Clean Swiss light canvas top, framed photo bottom
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, width, height * 0.44);
        ctx.fillRect(0, height * 0.9, width, height * 0.1);
        ctx.fillRect(0, 0, 56, height);
        ctx.fillRect(width - 56, 0, 56, height);

        // Swiss grid lines
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(56, height * 0.42);
        ctx.lineTo(width - 56, height * 0.42);
        ctx.stroke();
        break;
      }

      case 'lifestyle-card': {
        // Floating frosted card at bottom
        const cardMargin = 48;
        const cardH = height * 0.50;
        const cardY = height - cardH - cardMargin;
        ctx.fillStyle = `rgba(19, 78, 74, ${Math.min(0.94, opacity)})`;
        this.drawRoundedRect(ctx, cardMargin, cardY, width - cardMargin * 2, cardH, 28);
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      }

      case 'editorial-magazine': {
        // Top masthead + bottom info bar
        const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.42);
        topGrad.addColorStop(0, `rgba(30, 27, 75, ${opacity})`);
        topGrad.addColorStop(1, 'rgba(30, 27, 75, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, height * 0.42);

        const botGrad = ctx.createLinearGradient(0, height * 0.55, 0, height);
        botGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
        botGrad.addColorStop(0.4, `rgba(30, 27, 75, ${opacity})`);
        botGrad.addColorStop(1, 'rgba(15, 23, 42, 0.96)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, height * 0.55, width, height * 0.45);
        break;
      }

      case 'social-impact': {
        // Bold center/bottom scrim with geometric border
        const grad = ctx.createRadialGradient(
          width / 2,
          height * 0.35,
          width * 0.1,
          width / 2,
          height * 0.5,
          width * 0.95
        );
        grad.addColorStop(0, 'rgba(59, 7, 100, 0.35)');
        grad.addColorStop(1, `rgba(30, 10, 60, ${Math.min(0.95, opacity)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'human-centric': {
        // Warm organic bottom scrim
        const grad = ctx.createLinearGradient(0, height * 0.32, 0, height);
        grad.addColorStop(0, 'rgba(67, 20, 7, 0)');
        grad.addColorStop(0.45, `rgba(67, 20, 7, ${opacity})`);
        grad.addColorStop(1, 'rgba(41, 12, 4, 0.97)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }

      case 'high-conversion':
      default: {
        // High-contrast conversion scrim with top header bar
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, width, 14);

        const grad = ctx.createLinearGradient(0, height * 0.3, 0, height);
        grad.addColorStop(0, 'rgba(69, 10, 10, 0.1)');
        grad.addColorStop(0.45, `rgba(69, 10, 10, ${opacity})`);
        grad.addColorStop(1, 'rgba(28, 5, 5, 0.98)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        break;
      }
    }
    ctx.restore();

    // 4. Draw Company Header & Concept Number Badge
    const padX = poster.layoutTemplate === 'lifestyle-card' ? 84 : 68;
    const isLightMode = poster.layoutTemplate === 'minimal-swiss';
    const primaryText = isLightMode ? '#0F172A' : textColor;
    const mutedText = isLightMode ? '#475569' : 'rgba(248, 250, 252, 0.82)';

    // Top bar: Company name (if available) + Concept Tag
    const headerY = poster.layoutTemplate === 'luxury-frame' ? 88 : 64;

    if (poster.ten_cong_ty) {
      ctx.save();
      ctx.font = `700 24px "${font}", sans-serif`;
      ctx.fillStyle = isLightMode ? '#0F172A' : '#FFFFFF';
      ctx.textAlign = 'left';
      // Small brand pill background for dark images
      if (!isLightMode) {
        const compWidth = ctx.measureText(poster.ten_cong_ty.toUpperCase()).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        this.drawRoundedRect(ctx, padX, headerY - 28, Math.min(compWidth + 36, width - padX * 2 - 160), 44, 8);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
      }
      ctx.fillText(poster.ten_cong_ty.toUpperCase().slice(0, 36), padX + (isLightMode ? 0 : 18), headerY);
      ctx.restore();
    }

    // Quantity badge on top right if so_luong exists
    if (poster.so_luong) {
      ctx.save();
      const qtyLabel = `SỐ LƯỢNG: ${poster.so_luong}`;
      ctx.font = `700 22px "${font}", sans-serif`;
      const qW = ctx.measureText(qtyLabel).width + 36;
      ctx.fillStyle = accent;
      this.drawRoundedRect(ctx, width - padX - qW, headerY - 28, qW, 44, 8);
      ctx.fill();
      ctx.fillStyle = '#090D16';
      ctx.textAlign = 'center';
      ctx.fillText(qtyLabel, width - padX - qW / 2, headerY + 2);
      ctx.restore();
    }

    // 5. Determine Content Y Anchor based on template & user typography position
    let contentStartY = height * 0.52;
    if (poster.layoutTemplate === 'minimal-swiss') {
      contentStartY = 140;
    } else if (poster.layoutTemplate === 'editorial-magazine') {
      contentStartY = 150;
    } else if (poster.typography.position === 'top') {
      contentStartY = 150;
    } else if (poster.typography.position === 'center') {
      contentStartY = height * 0.38;
    } else if (poster.layoutTemplate === 'lifestyle-card') {
      contentStartY = height * 0.51;
    }

    const align = poster.typography.align || 'left';
    const textX =
      align === 'center' ? width / 2 : align === 'right' ? width - padX : padX;
    const maxTextWidth = width - padX * 2;

    // 6. Draw Kicker / Title (e.g., TUYỂN DỤNG NHÂN SỰ)
    ctx.save();
    ctx.textAlign = align;
    ctx.font = `700 ${Math.round(26 * scale)}px "${font}", sans-serif`;
    ctx.fillStyle = accent;
    ctx.fillText(poster.tieu_de.toUpperCase(), textX, contentStartY);

    // 7. Draw Main Job Position (VỊ TRÍ TUYỂN DỤNG) - Largest focal element
    const posFontSize = Math.round(62 * scale);
    ctx.font = `800 ${posFontSize}px "${font}", sans-serif`;
    ctx.fillStyle = primaryText;

    const posLines = this.wrapText(ctx, poster.vi_tri.toUpperCase(), maxTextWidth);
    let cursorY = contentStartY + posFontSize + 10;
    posLines.slice(0, 2).forEach((line) => {
      ctx.fillText(line, textX, cursorY);
      cursorY += posFontSize * 1.12;
    });

    // Subtitle
    if (poster.phu_de) {
      ctx.font = `500 ${Math.round(26 * scale)}px "${font}", sans-serif`;
      ctx.fillStyle = mutedText;
      ctx.fillText(poster.phu_de, textX, cursorY + 4);
      cursorY += 48;
    } else {
      cursorY += 20;
    }

    // If minimal-swiss or editorial-magazine, jump remaining details to bottom bar
    if (poster.layoutTemplate === 'minimal-swiss') {
      cursorY = height * 0.94;
      // Draw Salary & Location inside top Swiss block before photo
      let swissY = contentStartY + posLines.length * (posFontSize * 1.1) + 52;
      if (poster.luong) {
        ctx.font = `800 38px "${font}", sans-serif`;
        ctx.fillStyle = accent;
        ctx.fillText(`THU NHẬP: ${poster.luong.toUpperCase()}`, textX, swissY);
        swissY += 46;
      }
      if (poster.dia_diem) {
        ctx.font = `600 26px "${font}", sans-serif`;
        ctx.fillStyle = '#334155';
        ctx.fillText(`Địa điểm: ${poster.dia_diem}`, textX, swissY);
      }
    } else {
      if (poster.layoutTemplate === 'editorial-magazine') {
        cursorY = height * 0.64;
      }

      // 8. Draw Salary Highlight Box (Only if user provided salary)
      if (poster.luong) {
        const salLabel = `THU NHẬP: ${poster.luong.toUpperCase()}`;
        ctx.font = `800 ${Math.round(34 * scale)}px "${font}", sans-serif`;
        const salMetrics = ctx.measureText(salLabel);
        const boxW = Math.min(salMetrics.width + 48, maxTextWidth);
        const boxH = 62;
        const boxX =
          align === 'center'
            ? (width - boxW) / 2
            : align === 'right'
            ? width - padX - boxW
            : padX;

        ctx.fillStyle = accent;
        this.drawRoundedRect(ctx, boxX, cursorY - 12, boxW, boxH, 12);
        ctx.fill();

        ctx.fillStyle = '#090D16';
        ctx.textAlign = 'center';
        ctx.fillText(salLabel, boxX + boxW / 2, cursorY + 31);
        ctx.textAlign = align;
        cursorY += 84;
      }

      // 9. Draw Key Benefits / Highlights (Max 3 concise points)
      ctx.font = `500 ${Math.round(25 * scale)}px "${font}", sans-serif`;
      ctx.fillStyle = primaryText;
      poster.diem_hap_dan.slice(0, 3).forEach((point) => {
        const bulletLine = `✓  ${point}`;
        const wrapped = this.wrapText(ctx, bulletLine, maxTextWidth);
        ctx.fillText(wrapped[0], textX, cursorY);
        cursorY += 38;
      });

      // 10. Draw Location & Contact / CTA Footer Bar
      const footerY = height - (poster.layoutTemplate === 'luxury-frame' ? 84 : 64);

      // CTA Button on Left/Center
      ctx.font = `800 26px "${font}", sans-serif`;
      const ctaText = poster.cta.toUpperCase();
      const ctaW = ctx.measureText(ctaText).width + 52;
      const ctaH = 56;
      const ctaX = align === 'center' ? (width - ctaW) / 2 : padX;

      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this.drawRoundedRect(ctx, ctaX, footerY - 40, ctaW, ctaH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(ctaText, ctaX + ctaW / 2, footerY - 3);

      // Location & Hotline on Right (if left aligned) or below
      if (align !== 'center') {
        ctx.textAlign = 'right';
        ctx.font = `600 23px "${font}", sans-serif`;
        ctx.fillStyle = accent;
        const rightMeta: string[] = [];
        if (poster.dia_diem) rightMeta.push(`📍 ${poster.dia_diem}`);
        if (poster.hotline) rightMeta.push(`📞 ${poster.hotline}`);
        if (poster.website && rightMeta.length < 2) rightMeta.push(`🌐 ${poster.website}`);

        if (rightMeta.length > 0) {
          ctx.fillText(rightMeta[0].slice(0, 35), width - padX, footerY - 18);
        }
        if (rightMeta.length > 1) {
          ctx.fillStyle = mutedText;
          ctx.font = `500 21px "${font}", sans-serif`;
          ctx.fillText(rightMeta[1].slice(0, 38), width - padX, footerY + 12);
        }
      } else if (poster.dia_diem || poster.hotline) {
        ctx.textAlign = 'center';
        ctx.font = `600 22px "${font}", sans-serif`;
        ctx.fillStyle = mutedText;
        const combined = [poster.dia_diem, poster.hotline, poster.website].filter(Boolean).join('  ·  ');
        ctx.fillText(combined.slice(0, 55), width / 2, footerY + 34);
      }
    }

    ctx.restore();
  }

  /**
   * Exports a poster directly to a Blob or DataURL in PNG, JPEG, or WebP format
   */
  static async exportToDataUrl(
    poster: PosterRecord,
    concept: CreativeConcept,
    format: ExportImageFormat = 'png'
  ): Promise<string> {
    const offscreen = document.createElement('canvas');
    await this.renderToCanvas(offscreen, poster, concept);
    const mimeType = `image/${format}`;
    return offscreen.toDataURL(mimeType, 0.95);
  }
}
