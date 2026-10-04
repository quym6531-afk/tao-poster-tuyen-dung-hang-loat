import JSZip from 'jszip';
import { Campaign, PosterRecord, CreativeConcept, SocialPostRecord } from '../types';
import { PosterComposer, ExportImageFormat } from '../services/poster-composer/PosterComposer';

export class CampaignExporter {
  static async downloadSinglePoster(
    poster: PosterRecord,
    concept: CreativeConcept,
    format: ExportImageFormat = 'png'
  ): Promise<void> {
    const dataUrl = await PosterComposer.exportToDataUrl(poster, concept, format);
    const link = document.createElement('a');
    const padIdx = String(poster.index).padStart(2, '0');
    link.download = `poster-${padIdx}.${format === 'jpeg' ? 'jpg' : format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static downloadAllPostsText(posts: SocialPostRecord[], campaignName: string): void {
    const content = posts
      .map((p) => {
        const padIdx = String(p.index).padStart(2, '0');
        return [
          `==========================================================`,
          `BÀI ĐĂNG TUYỂN DỤNG #${padIdx} - GÓC TIẾP CẬN: ${p.goc_tiep_can.toUpperCase()}`,
          `==========================================================`,
          ``,
          `--- [PHIÊN BẢN FACEBOOK] ---`,
          p.facebookContent,
          ``,
          `--- [PHIÊN BẢN ZALO] ---`,
          p.zaloContent,
          ``,
          `--- [PHIÊN BẢN LINKEDIN] ---`,
          p.linkedinContent,
          `\n`,
        ].join('\n');
      })
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `10-bai-dang-tuyen-dung-${campaignName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async downloadFullCampaignZip(
    campaign: Campaign,
    onProgress?: (step: string) => void
  ): Promise<void> {
    const zip = new JSZip();
    const posterFolder = zip.folder('poster');
    const contentFolder = zip.folder('content');

    // Render all 10 posters into /poster/poster-XX.png
    for (let i = 0; i < campaign.posters.length; i++) {
      const poster = campaign.posters[i];
      const concept =
        campaign.concepts.find((c) => c.id === poster.conceptId) || campaign.concepts[i];
      const padIdx = String(poster.index).padStart(2, '0');

      if (onProgress) {
        onProgress(`Đang kết xuất poster-${padIdx}.png (${i + 1}/${campaign.posters.length})...`);
      }

      if (poster.status === 'completed' && concept) {
        const dataUrl = await PosterComposer.exportToDataUrl(poster, concept, 'png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        posterFolder?.file(`poster-${padIdx}.png`, base64Data, { base64: true });
      }
    }

    // Add all 10 social posts into /content/post-XX.txt
    for (const post of campaign.socialPosts) {
      const padIdx = String(post.index).padStart(2, '0');
      const textContent = [
        `GÓC TIẾP CẬN: ${post.goc_tiep_can}`,
        ``,
        `=== BÀI ĐĂNG FACEBOOK ===`,
        post.facebookContent,
        ``,
        `=== BÀI ĐĂNG ZALO ===`,
        post.zaloContent,
        ``,
        `=== BÀI ĐĂNG LINKEDIN ===`,
        post.linkedinContent,
      ].join('\n');
      contentFolder?.file(`post-${padIdx}.txt`, textContent);
    }

    // Add /campaign.json
    const cleanMetadata = {
      id: campaign.id,
      name: campaign.name,
      createdAt: campaign.createdAt,
      aspectRatio: campaign.aspectRatio,
      diversityAuditScore: campaign.diversityAuditScore,
      jobData: campaign.jobData,
      concepts: campaign.concepts,
      posters: campaign.posters.map((p) => ({
        ...p,
        // Keep metadata readable
        backgroundImageUrl: p.backgroundImageUrl.slice(0, 120),
      })),
      socialPosts: campaign.socialPosts,
    };

    zip.file('campaign.json', JSON.stringify(cleanMetadata, null, 2));

    if (onProgress) {
      onProgress('Đang đóng gói file campaign.zip...');
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'campaign.zip';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
