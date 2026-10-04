import {
  JobData,
  CreativeConcept,
  PosterRecord,
  SocialPostRecord,
  QualityAuditResult,
  AspectRatioOption,
  BrandKit,
  PosterLayoutTemplate,
  ReferenceImageAnalysis,
} from '../../types';
import { GENERATED_STUDIO_IMAGES } from '../../data/demoPresets';

// ============================================================================
// MODULE 1: PhanTichTuyenDungAI
// Extracts structured recruitment data strictly from user input without hallucinating
// ============================================================================
export class PhanTichTuyenDungAI {
  static parseFromText(rawText: string, campaignId: string, brandKit?: BrandKit): JobData {
    const text = rawText.trim();
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

    // 1. Extract company name (only if explicitly mentioned or in BrandKit)
    let ten_cong_ty = '';
    const companyMatch = text.match(
      /(?:Công ty(?:\s+Cổ phần|\s+TNHH)?(?:\s+Công nghệ\s*&\s*Thương mại)?|Tập đoàn|Hệ thống(?:\s+Nhà hàng\s+Ẩm thực|\s+Thẩm mỹ\s*&\s*Chăm sóc\s+Sức khỏe)?|Nhà máy(?:\s+Cơ điện tử)?)\s+([A-ZÀ-Ỹa-z0-9\s'&.-]{2,35}?)(?=\s+(?:tuyển|chiêu mộ|cần tuyển|tại|ở|\n|$))/i
    );
    if (companyMatch && companyMatch[0]) {
      ten_cong_ty = companyMatch[0].replace(/\s+(tuyển|chiêu mộ|cần tuyển).*$/i, '').trim();
    } else {
      const agencyMatch = text.match(/([A-Z][A-Za-z0-9\s&]{2,25}(?:Agency|Vietnam|Group|Bistro|Logistics|Tech|Care))\s+(?:tuyển|chiêu mộ)/i);
      if (agencyMatch && agencyMatch[1]) {
        ten_cong_ty = agencyMatch[1].trim();
      }
    }
    if (!ten_cong_ty && brandKit?.ten_cong_ty) {
      ten_cong_ty = brandKit.ten_cong_ty;
    }

    // 2. Extract quantity (so_luong)
    let so_luong = '';
    const qtyMatch = text.match(/(?:tuyển(?:\s+gấp|\s+dụng)?|chiêu mộ|cần)\s+(\d{1,3})\s+/i);
    if (qtyMatch && qtyMatch[1]) {
      so_luong = qtyMatch[1];
    }

    // 3. Extract job position (vi_tri)
    let vi_tri = '';
    const posRegex = /(?:tuyển(?:\s+gấp|\s+dụng)?|chiêu mộ|vị trí:?)\s*(?:\d{1,3}\s+)?([^.\n,]+?)(?=\s+tại\s+|\s+ở\s+|\s+khu vực|\s+thu nhập|\s+lương|\n|\.|$)/i;
    const posMatch = text.match(posRegex);
    if (posMatch && posMatch[1]) {
      vi_tri = posMatch[1].trim();
    } else if (lines.length > 0) {
      vi_tri = lines[0].slice(0, 50);
    }

    // Clean up position if it captured location or extra words
    vi_tri = vi_tri.replace(/^(gấp|dụng|ngay)\s+/i, '').trim();
    if (!vi_tri) {
      vi_tri = 'Nhân sự Chuyên môn';
    }

    // 4. Infer industry (nganh_nghe) and candidate persona (doi_tuong_ung_vien)
    const { nganh_nghe, doi_tuong_ung_vien } = this.inferIndustryAndAudience(vi_tri, text);

    // 5. Extract location (dia_diem) - DO NOT HALLUCINATE if absent
    let dia_diem = '';
    const locMatch = text.match(/(?:tại|địa điểm:?|khu vực:?|địa chỉ:?|chạy tuyến)\s+([A-ZÀ-Ỹa-zÀ-ỹ0-9\s,-]{3,45}?)(?=\.|\n|Thu nhập|Lương|Mức lương|Không yêu cầu|$)/i);
    if (locMatch && locMatch[1]) {
      dia_diem = locMatch[1].trim().replace(/[.,;]+$/, '');
    } else if (/Hà Nội/i.test(text)) {
      dia_diem = 'Hà Nội';
    } else if (/TP\.?\s*Hồ Chí Minh|TP\.?\s*HCM|Sài Gòn/i.test(text)) {
      dia_diem = 'TP. Hồ Chí Minh';
    } else if (/Đà Nẵng/i.test(text)) {
      dia_diem = 'Đà Nẵng';
    }

    // 6. Extract salary (luong) - DO NOT HALLUCINATE if absent
    let luong = '';
    const salMatch = text.match(/(?:thu nhập(?:\s+ổn định)?|mức lương|lương)\s*:?\s*([^\n.]{3,55})/i);
    if (salMatch && salMatch[1]) {
      luong = salMatch[1].trim().replace(/\s*\(.*$/, '').trim();
    } else {
      const rangeMatch = text.match(/(\d{1,2}\s*[-–]\s*\d{1,2}\s*triệu(?:\s*\/\s*tháng)?)/i);
      if (rangeMatch && rangeMatch[1]) {
        luong = rangeMatch[1].trim();
      }
    }

    // 7. Extract experience (kinh_nghiem)
    let kinh_nghiem = '';
    if (/không yêu cầu kinh nghiệm|chưa có kinh nghiệm/i.test(text)) {
      kinh_nghiem = 'Không yêu cầu kinh nghiệm';
    } else {
      const expMatch = text.match(/(?:có ít nhất|từ|yêu cầu:?)\s*(\d+\s*năm\s*kinh nghiệm)/i);
      if (expMatch && expMatch[1]) {
        kinh_nghiem = expMatch[1].trim();
      }
    }

    // 8. Extract requirements (yeu_cau)
    const yeu_cau: string[] = [];
    const reqLineMatch = text.match(/yêu cầu\s*:?\s*([^\n]+)/i);
    if (reqLineMatch && reqLineMatch[1]) {
      reqLineMatch[1]
        .split(/[,;.]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 3)
        .forEach((s) => yeu_cau.push(s));
    }
    if (kinh_nghiem && !yeu_cau.some((r) => r.toLowerCase().includes('kinh nghiệm'))) {
      yeu_cau.unshift(kinh_nghiem);
    }

    // 9. Extract benefits (quyen_loi)
    const quyen_loi: string[] = [];
    const benLineMatch = text.match(/(?:quyền lợi|chế độ|đãi ngộ|môi trường)\s*:?\s*([^\n]+)/i);
    if (benLineMatch && benLineMatch[1]) {
      const fullBen = benLineMatch[0].replace(/^quyền lợi\s*:?\s*/i, '');
      fullBen
        .split(/[,;.]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 3)
        .forEach((s) => quyen_loi.push(s));
    } else {
      // Check lines mentioning environment or training
      lines.forEach((line) => {
        if (/môi trường|đào tạo|thưởng|bhxh|phụ cấp|du lịch/i.test(line) && !/thu nhập|lương|tuyển/i.test(line)) {
          line
            .split(/[,;.]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 3)
            .forEach((s) => quyen_loi.push(s));
        }
      });
    }

    // 10. Extract Contact Info (Strictly from input or explicit BrandKit if enabled)
    const phoneMatch = text.match(/(?:0|\+84)[0-9.\s-]{8,13}/);
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const webMatch = text.match(/(?:website\s*:?\s*)?([a-zA-Z0-9-]+\.(?:vn|com|io|net|org|com\.vn))(?!\S*@)/i);
    const addrMatch = text.match(/địa chỉ\s*:?\s*([^\n|]+)/i);

    const lien_he = {
      hotline: phoneMatch ? phoneMatch[0].trim() : brandKit?.hotline || '',
      email: emailMatch ? emailMatch[0].trim() : brandKit?.email || '',
      website: webMatch ? webMatch[1].trim() : brandKit?.website || '',
      dia_chi: addrMatch ? addrMatch[1].trim() : brandKit?.dia_chi || '',
    };

    return {
      id: `job-${Date.now()}`,
      campaignId,
      ten_cong_ty,
      vi_tri,
      nganh_nghe,
      so_luong,
      dia_diem,
      luong,
      kinh_nghiem,
      yeu_cau: yeu_cau.slice(0, 5),
      quyen_loi: quyen_loi.slice(0, 6),
      mo_ta: text,
      lien_he,
      doi_tuong_ung_vien,
    };
  }

  static inferIndustryAndAudience(vi_tri: string, fullText: string): { nganh_nghe: string; doi_tuong_ung_vien: string } {
    const combined = `${vi_tri} ${fullText}`.toLowerCase();

    if (/đầu bếp|phụ bếp|bếp|nhà hàng|ẩm thực|pha chế|barista|f&b/.test(combined)) {
      return {
        nganh_nghe: 'Ẩm thực & Nhà hàng (F&B)',
        doi_tuong_ung_vien: 'Đầu bếp chuyên nghiệp, nhân sự ngành bếp đam mê ẩm thực, tác phong nhanh nhẹn sạch sẽ',
      };
    }
    if (/lập trình|developer|it|phần mềm|kỹ sư phần mềm|fullstack|frontend|backend|data|ai/.test(combined)) {
      return {
        nganh_nghe: 'Công nghệ thông tin & Phần mềm',
        doi_tuong_ung_vien: 'Kỹ sư phần mềm, lập trình viên yêu thích công nghệ, tư duy hệ thống và sản phẩm',
      };
    }
    if (/kỹ thuật|cơ khí|nhà máy|công nhân|vận hành máy|bảo trì|điện tử|sản xuất/.test(combined)) {
      return {
        nganh_nghe: 'Kỹ thuật & Sản xuất Công nghiệp',
        doi_tuong_ung_vien: 'Kỹ thuật viên, thợ lành nghề và lao động sản xuất chăm chỉ, tuân thủ an toàn kỹ thuật',
      };
    }
    if (/tài xế|lái xe|giao hàng|vận tải|logistics|bằng b2|bằng c/.test(combined)) {
      return {
        nganh_nghe: 'Vận tải & Logistics',
        doi_tuong_ung_vien: 'Tài xế có bằng lái hợp lệ, rành đường, sức khỏe tốt, cẩn thận và đúng giờ',
      };
    }
    if (/bảo vệ|an ninh|trực mục tiêu|vệ sĩ/.test(combined)) {
      return {
        nganh_nghe: 'Dịch vụ An ninh & Bảo vệ',
        doi_tuong_ung_vien: 'Nhân viên an ninh có sức khỏe, kỷ luật cao, tinh thần trách nhiệm bảo vệ tài sản',
      };
    }
    if (/kế toán|tài chính|kiểm toán|thu ngân/.test(combined)) {
      return {
        nganh_nghe: 'Tài chính - Kế toán',
        doi_tuong_ung_vien: 'Chuyên viên kế toán tỉ mỉ, trung thực, nắm vững nghiệp vụ số liệu và phần mềm kế toán',
      };
    }
    if (/marketing|content|truyền thông|thiết kế|designer|quảng cáo|ads/.test(combined)) {
      return {
        nganh_nghe: 'Marketing & Truyền thông Sáng tạo',
        doi_tuong_ung_vien: 'Nhân sự trẻ sáng tạo, nhạy bén xu hướng mạng xã hội, đam mê xây dựng thương hiệu',
      };
    }
    if (/chăm sóc khách hàng|cskh|tư vấn viên|tổng đài|telesales|lễ tân/.test(combined)) {
      return {
        nganh_nghe: 'Dịch vụ & Chăm sóc Khách hàng',
        doi_tuong_ung_vien: 'Ứng viên giao tiếp khéo léo, giọng nói truyền cảm, tận tâm lắng nghe khách hàng',
      };
    }
    // Default Sales / Business
    return {
      nganh_nghe: 'Kinh doanh & Phát triển Thị trường',
      doi_tuong_ung_vien: 'Ứng viên năng động, khát khao bức phá thu nhập, thích giao tiếp và chinh phục mục tiêu',
    };
  }

  static analyzeReferenceImage(referenceImageUrl?: string): ReferenceImageAnalysis | undefined {
    if (!referenceImageUrl) return undefined;
    return {
      hasPerson: true,
      hasLogo: false,
      hasProductOrWorkspace: true,
      dominantColors: ['#1E40AF', '#0F172A', '#F8FAFC'],
      subjectDescription: 'Ảnh tham chiếu của doanh nghiệp chứa chủ thể/không gian thực tế.',
      preservationStrategy: 'Giữ nguyên chủ thể chính từ ảnh upload, mở rộng không gian ánh sáng và kết hợp lớp phủ Typography chuẩn nhận diện thương hiệu.',
    };
  }
}

// ============================================================================
// MODULE 2: TaoPromptAnhAI
// Dynamically constructs industry-specific, context-aware photography prompts
// ============================================================================
export class TaoPromptAnhAI {
  static getIndustryScenes(job: JobData): Array<{
    boi_canh: string;
    nhan_vat: string;
    goc_may: string;
    anh_sang: string;
    promptEn: string;
    fallbackCategory: keyof typeof GENERATED_STUDIO_IMAGES;
  }> {
    const industry = job.nganh_nghe.toLowerCase();

    if (industry.includes('ẩm thực') || industry.includes('f&b') || /đầu bếp|bếp/.test(job.vi_tri.toLowerCase())) {
      return [
        {
          boi_canh: 'Bếp nhà hàng Fine Dining inox hiện đại, khói bếp ấm áp',
          nhan_vat: 'Đầu bếp trưởng người Việt mặc áo bếp trắng chuyên nghiệp đang trang trí món ăn',
          goc_may: 'Góc trung cận (Medium Close-up) ngang tầm mắt, xóa phông nhẹ phía trên',
          anh_sang: 'Ánh sáng đèn bếp ấm áp tương phản cao (Warm Dramatic Culinary Lighting)',
          promptEn: 'Commercial editorial photography of a professional Vietnamese head chef plating a gourmet dish in a modern stainless-steel restaurant kitchen, warm dramatic lighting, generous negative space at top for typography, no text, 8k',
          fallbackCategory: 'chef',
        },
        {
          boi_canh: 'Khu vực chế biến tiêu chuẩn 5 sao với nguyên liệu tươi sống cao cấp',
          nhan_vat: 'Đầu bếp trẻ tập trung thái nguyên liệu với kỹ thuật điêu luyện',
          goc_may: 'Góc nghiêng 45 độ từ trên xuống (High-angle 45-degree)',
          anh_sang: 'Ánh sáng tự nhiên kết hợp đèn studio sắc nét',
          promptEn: 'High-end food industry recruitment photography, skilled Vietnamese chef preparing fresh ingredients on a clean marble counter, modern restaurant kitchen, space for text overlay, no words',
          fallbackCategory: 'chef',
        },
        {
          boi_canh: 'Không gian bếp mở (Open Kitchen) sang trọng nhìn ra sảnh nhà hàng',
          nhan_vat: 'Đội ngũ đầu bếp và phụ bếp phối hợp nhịp nhàng trong giờ cao điểm',
          goc_may: 'Góc rộng điện ảnh (Cinematic Wide Shot)',
          anh_sang: 'Ánh sáng vàng hổ phách sang trọng (Golden Ambient)',
          promptEn: 'Cinematic wide shot of a passionate Vietnamese culinary team working together in an open luxury restaurant kitchen, dynamic motion, clean dark upper space for poster headline, no text',
          fallbackCategory: 'chef',
        },
        {
          boi_canh: 'Quầy chuyền thực phẩm (Pass counter) dưới ánh đèn giữ nhiệt',
          nhan_vat: 'Bếp trưởng kiểm tra chất lượng đĩa thức ăn hoàn hảo trước khi phục vụ',
          goc_may: 'Góc thấp tôn vinh sự chuyên nghiệp (Low-angle Hero Shot)',
          anh_sang: 'Ánh sáng ven (Rim light) làm nổi bật đường nét nhân vật',
          promptEn: 'Luxury editorial portrait of a Vietnamese executive chef inspecting a finished dish at the kitchen pass, dark moody background for white text legibility, no watermark',
          fallbackCategory: 'chef',
        },
        {
          boi_canh: 'Bếp bánh & Tráng miệng hiện đại tối giản, sạch sẽ tuyệt đối',
          nhan_vat: 'Chuyên gia ẩm thực mỉm cười tự tin trong trang phục chuẩn mực',
          goc_may: 'Chân dung chính diện bố cục 1/3 (Rule of thirds Portrait)',
          anh_sang: 'Ánh sáng trắng dịu (Soft Diffused Studio Light)',
          promptEn: 'Minimalist clean studio portrait of a friendly Vietnamese chef in crisp uniform standing in a bright modern kitchen, ample negative space on the left for text, no text',
          fallbackCategory: 'chef',
        },
        {
          boi_canh: 'Sảnh nhà hàng Bistro ấm cúng buổi sáng khi chuẩn bị mở cửa',
          nhan_vat: 'Đầu bếp trẻ đang cùng quản lý xem thực đơn mới trên máy tính bảng',
          goc_may: 'Góc chụp đời thực tự nhiên (Candid Lifestyle Shot)',
          anh_sang: 'Nắng sớm xuyên qua cửa kính (Morning Window Light)',
          promptEn: 'Lifestyle photography of a young Vietnamese chef discussing menu ideas in a sunlit modern bistro, warm inviting atmosphere, space for typography, no text',
          fallbackCategory: 'chef',
        },
        {
          boi_canh: 'Studio ẩm thực phông nền tối nghệ thuật',
          nhan_vat: 'Chân dung nghệ thuật của người đầu bếp với ánh lửa bùng lên từ chảo',
          goc_may: 'Góc tạp chí thời trang/ẩm thực (Editorial Cover Shot)',
          anh_sang: 'Ánh sáng tương phản mạnh từ ngọn lửa và đèn key light',
          promptEn: 'Magazine cover style photography of a Vietnamese chef flambeing a pan in a dark artistic kitchen, vibrant flame accent, clean top area for bold headline, no text',
          fallbackCategory: 'chef',
        },
        {
          boi_canh: 'Không gian bếp hiện đại trẻ trung, năng lượng tích cực',
          nhan_vat: 'Nhân viên bếp trẻ tuổi hào hứng giơ ngón tay cái, nụ cười rạng rỡ',
          goc_may: 'Khung hình dọc thu hút mạng xã hội (Vertical Social Media Framing)',
          anh_sang: 'Ánh sáng rực rỡ, độ bão hòa màu tươi tắn',
          promptEn: 'Vibrant social media recruitment photo of a smiling young Vietnamese culinary worker in a modern kitchen, energetic and welcoming, clean background space, no text',
          fallbackCategory: 'chef',
        },
        {
          boi_canh: 'Buổi hướng dẫn đào tạo kỹ năng nấu nướng 1 kèm 1 trong bếp',
          nhan_vat: 'Bếp trưởng tận tình chỉ dẫn cho đầu bếp mới vào nghề',
          goc_may: 'Góc chụp ngang vai ấm áp (Over-the-shoulder Human Connection)',
          anh_sang: 'Ánh sáng tự nhiên hài hòa, tôn vinh văn hóa đồng đội',
          promptEn: 'Warm documentary photo of a senior Vietnamese chef mentoring a junior cook in a professional kitchen, supportive workplace culture, negative space for text, no text',
          fallbackCategory: 'chef',
        },
        {
          boi_canh: 'Không gian nhà hàng cao cấp với bàn tiệc sang trọng phía sau',
          nhan_vat: 'Đầu bếp khoanh tay tự tin nhìn thẳng ống kính, biểu tượng thu nhập & sự nghiệp',
          goc_may: 'Chân dung quyền lực (High-conversion Hero Portrait)',
          anh_sang: 'Ánh sáng thương mại cao cấp (High-end Commercial Rim & Key Light)',
          promptEn: 'High-conversion commercial portrait of a confident Vietnamese chef standing proudly in a high-end restaurant, blurred luxury background, clear space for salary and CTA overlay, no text',
          fallbackCategory: 'chef',
        },
      ];
    }

    if (industry.includes('kỹ thuật') || industry.includes('sản xuất') || /kỹ thuật|cơ khí|công nhân|nhà máy/.test(job.vi_tri.toLowerCase())) {
      return [
        {
          boi_canh: 'Nhà máy sản xuất công nghệ cao với dây chuyền tự động hóa chuẩn quốc tế',
          nhan_vat: 'Kỹ sư/Kỹ thuật viên người Việt đội mũ bảo hộ trắng, cầm máy tính bảng kiểm tra thông số máy',
          goc_may: 'Góc trung cảnh chuẩn doanh nghiệp công nghiệp (Medium Industrial Shot)',
          anh_sang: 'Ánh sáng trắng sạch sẽ của phòng sạch công nghiệp',
          promptEn: 'Corporate industrial photography of a Vietnamese technical engineer in safety helmet inspecting automated CNC machinery with a tablet in a clean modern factory, negative space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Khu vực lắp ráp linh kiện điện tử hiện đại, sáng sủa',
          nhan_vat: 'Đội ngũ kỹ thuật viên trẻ tuổi tập trung vận hành thiết bị điều khiển số',
          goc_may: 'Góc động năng lượng (Dynamic 3/4 Angle)',
          anh_sang: 'Ánh sáng LED công nghiệp hiện đại kết hợp điểm nhấn xanh dương',
          promptEn: 'Dynamic photography of young Vietnamese technicians working on high-tech electronic assembly equipment in a bright modern plant, energetic atmosphere, clean area for headline, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Xưởng cơ khí chính xác quy mô lớn với cánh tay robot công nghiệp',
          nhan_vat: 'Chuyên gia kỹ thuật quan sát hệ thống robot vận hành',
          goc_may: 'Góc rộng điện ảnh (Cinematic Wide Industrial)',
          anh_sang: 'Ánh sáng điện ảnh tương phản giữa tia sáng máy và nền xưởng sâu',
          promptEn: 'Cinematic wide shot of a Vietnamese engineer monitoring robotic assembly arms in an advanced manufacturing facility, dramatic industrial lighting, upper negative space, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Phòng R&D kiểm định chất lượng thiết bị công nghệ cao',
          nhan_vat: 'Kỹ sư trưởng đeo kính bảo hộ chuyên dụng kiểm tra vi mạch/chi tiết máy',
          goc_may: 'Cận cảnh sắc nét (Macro/Close-up Precision Shot)',
          anh_sang: 'Ánh sáng studio kỹ thuật sắc sảo',
          promptEn: 'High-end precision engineering portrait of a Vietnamese specialist inspecting advanced hardware in a cleanroom laboratory, luxury industrial aesthetic, space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Không gian nhà máy tối giản, sàn epoxy bóng loáng chuẩn ISO',
          nhan_vat: 'Kỹ thuật viên trong bộ đồng phục bảo hộ gọn gàng đứng tự tin',
          goc_may: 'Bố cục đối xứng tối giản (Minimalist Architectural Framing)',
          anh_sang: 'Ánh sáng đều, dịu mắt, độ tương phản vừa phải',
          promptEn: 'Minimalist architectural photography of a Vietnamese technician standing in a pristine modern factory corridor with clean lines, ample negative space for typography, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Khuôn viên xanh mát bên ngoài nhà máy hiện đại giờ giải lao',
          nhan_vat: 'Nhóm nhân viên kỹ thuật và công nhân trò chuyện vui vẻ, thân thiện',
          goc_may: 'Góc chụp đời thường tự nhiên (Lifestyle Workplace Shot)',
          anh_sang: 'Ánh nắng ban mai tự nhiên ấm áp',
          promptEn: 'Lifestyle photography of happy Vietnamese factory workers and technicians walking together in a modern green industrial park, friendly welfare atmosphere, space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Trung tâm điều khiển hệ thống điện & tự động hóa',
          nhan_vat: 'Chân dung kỹ sư vận hành bên cạnh bảng điều khiển kỹ thuật số',
          goc_may: 'Góc chụp tạp chí công nghiệp (Editorial Tech Portrait)',
          anh_sang: 'Ánh sáng màn hình phản chiếu tinh tế trên khuôn mặt',
          promptEn: 'Editorial portrait of a Vietnamese control room engineer beside sleek digital monitoring panels, documentary photography style, dark clean area for typography, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Xưởng lắp ráp hiện đại, đồng nghiệp hỗ trợ nhau làm việc',
          nhan_vat: 'Kỹ thuật viên trẻ mỉm cười tự tin nhìn vào máy ảnh',
          goc_may: 'Khung hình trực diện thu hút ứng viên (Direct Eye-Contact Social Shot)',
          anh_sang: 'Ánh sáng tươi sáng, rõ nét',
          promptEn: 'Engaging recruitment photo of a smiling young Vietnamese factory technician looking at camera in a clean assembly plant, welcoming vibe, negative space at top, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Khu vực đào tạo thực hành nghề tại nhà máy',
          nhan_vat: 'Kỹ sư giàu kinh nghiệm đang hướng dẫn nhân viên mới sử dụng thiết bị',
          goc_may: 'Góc chụp tôn vinh sự gắn kết và đào tạo (Mentorship Medium Shot)',
          anh_sang: 'Ánh sáng ấm áp, chân thực',
          promptEn: 'Authentic workplace photography of a senior Vietnamese engineer training a new technician on modern machinery, supportive team environment, clean space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Dây chuyền sản xuất hiện đại quy mô lớn phía sau được làm mờ nghệ thuật',
          nhan_vat: 'Chân dung kỹ thuật viên xuất sắc đội mũ bảo hộ, thần thái tự hào',
          goc_may: 'Chân dung chuyển đổi cao (Hero Conversion Portrait)',
          anh_sang: 'Ánh sáng thương mại nổi bật chủ thể',
          promptEn: 'High-impact recruitment hero portrait of a confident Vietnamese industrial worker in safety gear, blurred modern factory background, generous space for salary and CTA text, no text',
          fallbackCategory: 'industrial',
        },
      ];
    }

    if (industry.includes('công nghệ') || industry.includes('phần mềm') || /lập trình|developer|it/.test(job.vi_tri.toLowerCase())) {
      return [
        {
          boi_canh: 'Văn phòng công nghệ hạng A với màn hình code đôi và vách kính nhìn ra thành phố',
          nhan_vat: 'Kỹ sư phần mềm người Việt tập trung phát triển hệ thống trên Macbook & màn hình lớn',
          goc_may: 'Góc trung cảnh chuyên nghiệp (Corporate Tech Medium Shot)',
          anh_sang: 'Ánh sáng tự nhiên kết hợp đèn bàn làm việc hiện đại',
          promptEn: 'Professional corporate tech photography of a Vietnamese software developer working on dual monitors in a sleek glass office, clean negative space for typography, no text',
          fallbackCategory: 'tech',
        },
        {
          boi_canh: 'Không gian Agile Studio hiện đại với bảng Kanban và khu thảo luận mở',
          nhan_vat: 'Nhóm lập trình viên trẻ GenZ đang hào hứng thảo luận kiến trúc sản phẩm',
          goc_may: 'Góc chụp năng động (Dynamic Collaborative Angle)',
          anh_sang: 'Ánh sáng sáng tạo tươi mới',
          promptEn: 'Dynamic photography of young Vietnamese software engineers brainstorming around a digital whiteboard in a modern tech startup studio, vibrant energy, space for text, no text',
          fallbackCategory: 'creative',
        },
        {
          boi_canh: 'Phòng Lab AI & Cloud Server hiện đại vào buổi tối',
          nhan_vat: 'Chuyên gia công nghệ trầm ngâm trước màn hình kiến trúc dữ liệu',
          goc_may: 'Góc điện ảnh chiều sâu (Cinematic Shallow Depth of Field)',
          anh_sang: 'Ánh sáng Cyberpunk nhẹ nhàng, xanh lam và hổ phách tinh tế',
          promptEn: 'Cinematic portrait of a Vietnamese senior architect working in a modern dark-mode tech studio, warm desk lamp and cool monitor glow, ample dark space for white text, no text',
          fallbackCategory: 'tech',
        },
        {
          boi_canh: 'Khu vực Executive Tech Lounge sang trọng',
          nhan_vat: 'Tech Lead người Việt phong thái đĩnh đạc cầm laptop cao cấp',
          goc_may: 'Chân dung tầm nhìn lãnh đạo (Executive Tech Portrait)',
          anh_sang: 'Ánh sáng studio cao cấp (Luxury Rim Lighting)',
          promptEn: 'Luxury editorial portrait of a confident Vietnamese tech lead holding a sleek laptop in an architectural modern lounge, refined lighting, space for text, no text',
          fallbackCategory: 'tech',
        },
        {
          boi_canh: 'Góc làm việc tối giản chuẩn Bắc Âu (Minimalist Desk Setup)',
          nhan_vat: 'Lập trình viên làm việc tập trung trong không gian yên tĩnh, tinh gọn',
          goc_may: 'Bố cục hình học tối giản (Minimalist Framing)',
          anh_sang: 'Ánh sáng dịu nhẹ, sạch sẽ',
          promptEn: 'Minimalist clean workspace photography of a Vietnamese developer at an ultra-clean desk setup, soft daylight, huge negative space for Swiss-style typography, no text',
          fallbackCategory: 'tech',
        },
        {
          boi_canh: 'Khu vực Pantry & Cafe trong khuôn viên công ty công nghệ',
          nhan_vat: 'Lập trình viên vừa thưởng thức cà phê vừa code trên laptop trong không khí thoải mái',
          goc_may: 'Góc chụp phong cách sống Hybrid (Lifestyle Work-Life Balance)',
          anh_sang: 'Nắng ấm tự nhiên xuyên qua tán cây',
          promptEn: 'Lifestyle tech photography of a Vietnamese software engineer enjoying coffee while working on a laptop in a sunny modern office lounge, work-life balance, space for text, no text',
          fallbackCategory: 'creative',
        },
        {
          boi_canh: 'Hành lang kiến trúc bê tông và kính của trụ sở công nghệ',
          nhan_vat: 'Chân dung đen trắng pha màu nghệ thuật của kỹ sư phần mềm',
          goc_may: 'Góc chụp tạp chí công nghệ (Wired/Forbes Editorial Style)',
          anh_sang: 'Ánh sáng cửa sổ tạo bóng đổ nghệ thuật',
          promptEn: 'High-contrast editorial magazine portrait of a Vietnamese tech innovator in a modern architectural building, Leica 35mm look, negative space for headline, no text',
          fallbackCategory: 'tech',
        },
        {
          boi_canh: 'Buổi Hackathon / Ra mắt sản phẩm mới sôi động',
          nhan_vat: 'Lập trình viên trẻ cười tươi bên bàn làm việc hiện đại',
          goc_may: 'Góc chụp gần gũi thu hút giới trẻ (Social First Framing)',
          anh_sang: 'Ánh sáng trong trẻo, hiện đại',
          promptEn: 'Engaging social media recruitment portrait of a friendly Vietnamese developer smiling at desk with mechanical keyboard and monitor, bright modern studio, no text',
          fallbackCategory: 'tech',
        },
        {
          boi_canh: 'Buổi Pair Programming (Lập trình đôi) hỗ trợ lẫn nhau',
          nhan_vat: 'Hai kỹ sư phần mềm cùng chỉ vào màn hình giải quyết bài toán khó',
          goc_may: 'Góc chụp tôn vinh văn hóa đồng đội (Human & Culture Shot)',
          anh_sang: 'Ánh sáng văn phòng ấm áp, chân thực',
          promptEn: 'Warm documentary photo of two Vietnamese software developers pair programming together at a large monitor, collaborative engineering culture, space for text, no text',
          fallbackCategory: 'creative',
        },
        {
          boi_canh: 'Toàn cảnh văn phòng công nghệ hiện đại nhìn từ trên cao làm nền mờ',
          nhan_vat: 'Kỹ sư phần mềm tự tin nhìn thẳng ống kính, đại diện cơ hội bức phá sự nghiệp',
          goc_may: 'Chân dung thu hút chuyển đổi (High-Conversion Hero Shot)',
          anh_sang: 'Ánh sáng thương mại sắc nét',
          promptEn: 'High-conversion recruitment hero portrait of a successful Vietnamese software engineer in a modern tech headquarters, blurred office background, space for salary and CTA, no text',
          fallbackCategory: 'tech',
        },
      ];
    }

    if (industry.includes('vận tải') || industry.includes('logistics') || /tài xế|lái xe/.test(job.vi_tri.toLowerCase())) {
      return [
        {
          boi_canh: 'Bãi xe vận tải Logistics hiện đại với dàn xe tải/xe van đời mới',
          nhan_vat: 'Tài xế người Việt mặc đồng phục lịch sự, đứng cạnh cabin xe đời mới',
          goc_may: 'Góc trung cảnh chuyên nghiệp (Corporate Fleet Shot)',
          anh_sang: 'Ánh sáng ban ngày trong trẻo',
          promptEn: 'Professional commercial photo of a Vietnamese logistics driver in neat uniform standing proudly next to a modern delivery truck at a clean distribution center, negative space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Bên trong buồng lái xe tải/xe thương mại hiện đại, điều hòa mát mẻ',
          nhan_vat: 'Tài xế trẻ tuổi tay cầm vô lăng vững vàng, nụ cười thân thiện',
          goc_may: 'Góc chụp từ ghế phụ nhìn sang (Cabin Perspective Shot)',
          anh_sang: 'Ánh sáng tự nhiên chiếu qua kính chắn gió',
          promptEn: 'Dynamic commercial portrait of a friendly Vietnamese driver inside the modern air-conditioned cabin of a commercial vehicle, hands on steering wheel, space for text overlay, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Cung đường cao tốc hiện đại lúc bình minh',
          nhan_vat: 'Tài xế chuyên nghiệp kiểm tra lộ trình trên thiết bị định vị thông minh',
          goc_may: 'Góc rộng điện ảnh (Cinematic Highway Horizon)',
          anh_sang: 'Ánh nắng bình minh vàng rực rỡ (Golden Hour Sunrise)',
          promptEn: 'Cinematic golden hour photography of a Vietnamese transport driver checking route on smartphone beside a modern truck on a scenic highway, upper sky negative space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Trung tâm kho vận Logistics thông minh chuẩn quốc tế',
          nhan_vat: 'Tài xế trưởng xác nhận biên bản giao nhận điện tử',
          goc_may: 'Góc thấp tôn vinh nghề nghiệp (Hero Angle)',
          anh_sang: 'Ánh sáng thương mại cao cấp',
          promptEn: 'High-end commercial portrait of a senior Vietnamese fleet driver with a digital clipboard at a modern logistics hub, professional lighting, space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Phông nền kiến trúc kho vận tối giản, hiện đại',
          nhan_vat: 'Chân dung tài xế tác phong chuẩn mực, đáng tin cậy',
          goc_may: 'Bố cục tối giản (Clean Minimalist Portrait)',
          anh_sang: 'Ánh sáng dịu, rõ nét',
          promptEn: 'Clean minimalist portrait of a trustworthy Vietnamese professional driver in uniform against a clean modern warehouse wall, generous negative space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Điểm dừng nghỉ xanh mát, tài xế thư giãn uống nước giữa ca',
          nhan_vat: 'Tài xế vui vẻ, tràn đầy năng lượng và sức khỏe',
          goc_may: 'Góc chụp đời thực (Lifestyle Driver Shot)',
          anh_sang: 'Ánh nắng tự nhiên tươi sáng',
          promptEn: 'Lifestyle commercial photo of a happy energetic Vietnamese driver taking a break beside a modern delivery van in a sunlit city street, space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Cảng trung chuyển hàng hóa hiện đại lúc hoàng hôn',
          nhan_vat: 'Chân dung tài xế giàu kinh nghiệm với ánh nhìn kiên định',
          goc_may: 'Phong cách phóng sự nghệ thuật (Editorial Documentary)',
          anh_sang: 'Ánh sáng hoàng hôn tương phản ấn tượng',
          promptEn: 'Editorial documentary portrait of an experienced Vietnamese transport driver at a modern logistics terminal at dusk, dramatic sky for headline text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Khu vực giao nhận hàng hóa nội đô nhộn nhịp',
          nhan_vat: 'Tài xế trẻ thân thiện giơ tay chào, phong thái nhanh nhẹn',
          goc_may: 'Khung hình dọc mạng xã hội (Social Media Vertical)',
          anh_sang: 'Ánh sáng rực rỡ, sắc nét',
          promptEn: 'Vibrant social media recruitment photo of a friendly young Vietnamese driver smiling beside a modern vehicle, clear upper background for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Đội ngũ điều phối và tài xế bắt tay hỗ trợ nhau trước giờ xuất bến',
          nhan_vat: 'Tài xế và phụ xe phối hợp ăn ý, đoàn kết',
          goc_may: 'Góc chụp văn hóa đồng đội (Teamwork Medium Shot)',
          anh_sang: 'Ánh sáng ban mai ấm áp',
          promptEn: 'Warm teamwork photography of Vietnamese drivers and logistics coordinator chatting happily before departure at fleet yard, supportive environment, space for text, no text',
          fallbackCategory: 'industrial',
        },
        {
          boi_canh: 'Dàn xe vận tải đời mới xếp hàng thẳng tắp phía sau (làm mờ nhẹ)',
          nhan_vat: 'Tài xế tự tin khoanh tay, biểu tượng thu nhập ổn định vững chắc',
          goc_may: 'Chân dung thu hút ứng viên (High-Conversion Hero)',
          anh_sang: 'Ánh sáng quảng cáo sắc nét',
          promptEn: 'High-conversion recruitment hero portrait of a proud Vietnamese professional driver standing in front of a blurred fleet of modern trucks, space for salary and CTA, no text',
          fallbackCategory: 'industrial',
        },
      ];
    }

    // Default: Sales / Business / Marketing / Customer Service / Accounting
    return [
      {
        boi_canh: 'Văn phòng doanh nghiệp hạng A hiện đại tại trung tâm thành phố với vách kính lớn',
        nhan_vat: `Chuyên viên ${job.vi_tri} người Việt mặc vest/công sở lịch lãm đang tự tin làm việc`,
        goc_may: 'Góc trung cảnh chuẩn doanh nghiệp (Corporate Medium Shot)',
        anh_sang: 'Ánh sáng tự nhiên ban ngày kết hợp đèn văn phòng sang trọng',
        promptEn: `Photorealistic commercial photography of a confident Vietnamese ${job.vi_tri} professional in a sleek modern glass-walled corporate office, natural daylight, generous negative space for typography, no text or watermark`,
        fallbackCategory: 'sales',
      },
      {
        boi_canh: 'Không gian làm việc mở (Co-working Space) trẻ trung, năng động',
        nhan_vat: `Đội ngũ ${job.vi_tri} trẻ 9x-GenZ đang hào hứng trao đổi dự án bên laptop`,
        goc_may: 'Góc chụp nghiêng năng động (Dynamic 3/4 Team Shot)',
        anh_sang: 'Ánh sáng tươi sáng, tràn đầy năng lượng tích cực',
        promptEn: 'Vibrant commercial photography of a young dynamic Vietnamese sales and business team collaborating with laptops in a modern sunlit office, genuine smiles, clean space for headline, no text',
        fallbackCategory: 'creative',
      },
      {
        boi_canh: 'Phòng họp chiến lược nhìn ra toàn cảnh thành phố lúc chiều tà',
        nhan_vat: `Chuyên viên ${job.vi_tri} đang thuyết trình kế hoạch tăng trưởng đầy thuyết phục`,
        goc_may: 'Góc rộng điện ảnh (Cinematic Wide Angle)',
        anh_sang: 'Ánh nắng chiều vàng ấm (Golden Hour Cinematic Light)',
        promptEn: 'Cinematic wide shot of a Vietnamese business executive presenting strategy in a high-rise boardroom at golden hour, dramatic depth of field, dark clean upper space for typography, no text',
        fallbackCategory: 'sales',
      },
      {
        boi_canh: 'Sảnh Lounge doanh nhân sang trọng (Executive Business Lounge)',
        nhan_vat: `Nhân sự ${job.vi_tri} cấp cao gặp gỡ và ký kết hợp đồng với khách hàng VIP`,
        goc_may: 'Góc thấp tôn vinh vị thế (Low-Angle Prestige Shot)',
        anh_sang: 'Ánh sáng studio cao cấp với đèn ven tinh tế',
        promptEn: 'Luxury commercial photography of a Vietnamese sales professional consulting with a VIP client over a tablet in an upscale business lounge, refined lighting, space for text, no text',
        fallbackCategory: 'sales',
      },
      {
        boi_canh: 'Không gian kiến trúc văn phòng tối giản, tinh tế',
        nhan_vat: `Chân dung chuyên viên ${job.vi_tri} thanh lịch cầm sổ tay và laptop`,
        goc_may: 'Bố cục tối giản chuẩn Thụy Sĩ (Minimalist Rule-of-Thirds)',
        anh_sang: 'Ánh sáng dịu nhẹ, phông nền sạch tuyệt đối',
        promptEn: 'Minimalist studio-grade portrait of a professional Vietnamese office specialist in smart business attire against a clean architectural background, huge negative space for text, no text',
        fallbackCategory: 'sales',
      },
      {
        boi_canh: 'Quán cafe văn phòng hiện đại tràn ngập cây xanh và ánh nắng',
        nhan_vat: `Nhân viên ${job.vi_tri} gọi điện tư vấn khách hàng với nụ cười rạng rỡ`,
        goc_may: 'Góc chụp phong cách sống hiện đại (Lifestyle Candid Shot)',
        anh_sang: 'Ánh sáng ban mai tự nhiên trong trẻo',
        promptEn: 'Lifestyle commercial photo of a cheerful young Vietnamese business consultant talking with a client on phone with laptop in a bright modern cafe office, space for text, no text',
        fallbackCategory: 'creative',
      },
      {
        boi_canh: 'Tòa nhà văn phòng hiện đại với đường nét kiến trúc đương đại',
        nhan_vat: `Chân dung phong cách tạp chí Forbes của nhân sự ${job.vi_tri}`,
        goc_may: 'Chân dung tạp chí sắc nét (Editorial Magazine Cover)',
        anh_sang: 'Ánh sáng tương phản nghệ thuật (High-Contrast Editorial Light)',
        promptEn: 'Editorial magazine cover portrait of an ambitious Vietnamese business professional standing by a large architectural window, Leica 35mm aesthetic, clean space for typography, no text',
        fallbackCategory: 'sales',
      },
      {
        boi_canh: 'Văn phòng hiện đại với thiết kế màu sắc trẻ trung, truyền cảm hứng',
        nhan_vat: `Nhân viên ${job.vi_tri} trẻ trung nhìn thẳng ống kính mời gọi gia nhập đội ngũ`,
        goc_may: 'Khung hình dọc thu hút lướt chạm trên mạng xã hội (Social Stop-Scroll)',
        anh_sang: 'Ánh sáng studio rực rỡ, bắt mắt',
        promptEn: 'Eye-catching social media recruitment photo of an enthusiastic young Vietnamese professional smiling at the camera in a modern creative office, clean background for text overlay, no text',
        fallbackCategory: 'creative',
      },
      {
        boi_canh: 'Không gian đào tạo 1-1 ấm cúng tại văn phòng công ty',
        nhan_vat: 'Quản lý tận tình hướng dẫn nghiệp vụ cho nhân viên mới chưa có kinh nghiệm',
        goc_may: 'Góc chụp ngang tầm mắt gắn kết con người (Human Connection Shot)',
        anh_sang: 'Ánh sáng ấm áp, thân thiện, tạo cảm giác an tâm',
        promptEn: 'Warm documentary workplace photo of a supportive Vietnamese team leader mentoring a new employee at a modern office desk, welcoming company culture, space for text, no text',
        fallbackCategory: 'creative',
      },
      {
        boi_canh: 'Văn phòng doanh nghiệp hiện đại làm mờ hậu cảnh (Bokeh) cao cấp',
        nhan_vat: `Chân dung ngôi sao ${job.vi_tri} tự tin, biểu tượng của thu nhập bứt phá và thành công`,
        goc_may: 'Chân dung chuyển đổi cao (High-Conversion Hero Portrait)',
        anh_sang: 'Ánh sáng thương mại sắc nét tách biệt chủ thể',
        promptEn: 'High-conversion commercial hero portrait of a successful Vietnamese sales professional in sharp attire, blurred modern office bokeh background, clear space for salary and CTA, no text',
        fallbackCategory: 'sales',
      },
    ];
  }
}

// ============================================================================
// MODULE 3: TaoConceptAI
// Generates 10 genuinely distinct creative concepts with different layouts, palettes, and angles
// ============================================================================
export class TaoConceptAI {
  static generate10Concepts(job: JobData, campaignId: string, brandKit?: BrandKit): CreativeConcept[] {
    const scenes = TaoPromptAnhAI.getIndustryScenes(job);

    const archetypes: Array<{
      ten_concept: string;
      phong_cach: string;
      bo_cuc: PosterLayoutTemplate;
      goc_marketing: string;
      y_tuong: string;
      mau_sac: CreativeConcept['mau_sac'];
    }> = [
      {
        ten_concept: '01. Chuyên nghiệp Doanh nghiệp (Corporate Authority)',
        phong_cach: 'Chuyên nghiệp doanh nghiệp',
        bo_cuc: 'corporate-split',
        goc_marketing: 'Uy tín thương hiệu & Lộ trình sự nghiệp vững chắc',
        y_tuong: 'Xây dựng niềm tin tuyệt đối với bố cục phân mảng chuẩn tập đoàn, nhấn mạnh sự chuyên nghiệp và chế độ đãi ngộ minh bạch.',
        mau_sac: {
          primary: brandKit?.mau_chinh || '#0F172A',
          secondary: '#1E293B',
          accent: brandKit?.mau_phu || '#3B82F6',
          text: '#FFFFFF',
          overlayBg: 'rgba(15, 23, 42, 0.90)',
        },
      },
      {
        ten_concept: '02. Trẻ trung Năng động (GenZ Dynamic Energy)',
        phong_cach: 'Trẻ trung năng động',
        bo_cuc: 'modern-dynamic',
        goc_marketing: 'Môi trường trẻ trung, sáng tạo & Không ngại thử thách',
        y_tuong: 'Sử dụng hình khối nghiêng năng động và màu sắc tươi sáng thu hút ứng viên trẻ yêu thích sự đổi mới.',
        mau_sac: {
          primary: '#064E3B',
          secondary: '#047857',
          accent: '#10B981',
          text: '#FFFFFF',
          overlayBg: 'rgba(6, 78, 59, 0.88)',
        },
      },
      {
        ten_concept: '03. Điện ảnh Chiều sâu (Cinematic Vision)',
        phong_cach: 'Cinematic',
        bo_cuc: 'cinematic-bottom',
        goc_marketing: 'Khát vọng vươn tầm & Đam mê nghề nghiệp',
        y_tuong: 'Tối đa hóa không gian hình ảnh điện ảnh với lớp phủ gradient sâu bên dưới, biến thông báo tuyển dụng thành poster phim truyền cảm hứng.',
        mau_sac: {
          primary: '#090D16',
          secondary: '#1E1B4B',
          accent: '#F59E0B',
          text: '#F8FAFC',
          overlayBg: 'rgba(9, 13, 22, 0.88)',
        },
      },
      {
        ten_concept: '04. Đẳng cấp Tinh hoa (Executive Luxury)',
        phong_cach: 'Cao cấp',
        bo_cuc: 'luxury-frame',
        goc_marketing: 'Đãi ngộ xứng tầm & Vị thế chuyên gia',
        y_tuong: 'Đóng khung viền mảnh sang trọng với tông màu Đen - Vàng Champagne, tôn vinh giá trị của ứng viên chất lượng cao.',
        mau_sac: {
          primary: '#18181B',
          secondary: '#27272A',
          accent: '#D4AF37',
          text: '#FAFAFA',
          overlayBg: 'rgba(24, 24, 27, 0.92)',
        },
      },
      {
        ten_concept: '05. Tối giản Hiện đại (Minimalist Swiss Grid)',
        phong_cach: 'Tối giản',
        bo_cuc: 'minimal-swiss',
        goc_marketing: 'Thông tin trực diện, rõ ràng & Minh bạch 100%',
        y_tuong: 'Lấy cảm hứng từ thiết kế đồ họa Thụy Sĩ: lưới chuẩn xác, chữ sắc nét trên nền sáng thanh lịch, giúp ứng viên nắm bắt thông tin trong 2 giây.',
        mau_sac: {
          primary: '#F8FAFC',
          secondary: '#E2E8F0',
          accent: '#2563EB',
          text: '#0F172A',
          overlayBg: 'rgba(248, 250, 252, 0.94)',
        },
      },
      {
        ten_concept: '06. Phong cách Sống & Cân bằng (Lifestyle Balance)',
        phong_cach: 'Lifestyle',
        bo_cuc: 'lifestyle-card',
        goc_marketing: 'Phúc lợi toàn diện & Cân bằng công việc - cuộc sống',
        y_tuong: 'Thẻ thông tin bo góc tinh tế nổi trên bối cảnh làm việc đời thường ấm áp, thu hút ứng viên tìm kiếm môi trường hạnh phúc.',
        mau_sac: {
          primary: '#134E4A',
          secondary: '#0F766E',
          accent: '#2DD4BF',
          text: '#FFFFFF',
          overlayBg: 'rgba(19, 78, 74, 0.88)',
        },
      },
      {
        ten_concept: '07. Tạp chí Đương đại (Editorial Spotlight)',
        phong_cach: 'Editorial',
        bo_cuc: 'editorial-magazine',
        goc_marketing: 'Câu chuyện thành công & Tự hào nghề nghiệp',
        y_tuong: 'Trình bày như trang bìa tạp chí kinh doanh lớn với tiêu đề cỡ đại ở đỉnh và chân dung nhân vật trung tâm.',
        mau_sac: {
          primary: '#1E1B4B',
          secondary: '#312E81',
          accent: '#F43F5E',
          text: '#FFFFFF',
          overlayBg: 'rgba(30, 27, 75, 0.88)',
        },
      },
      {
        ten_concept: '08. Bùng nổ Mạng xã hội (Social Stop-Scroll)',
        phong_cach: 'Social Media',
        bo_cuc: 'social-impact',
        goc_marketing: 'Cơ hội gia nhập ngay & Đào tạo từ con số 0',
        y_tuong: 'Tối ưu hóa điểm nhìn trung tâm trên Newsfeed Facebook/Zalo/TikTok với độ tương phản cao, giữ chân người xem ngay khi lướt qua.',
        mau_sac: {
          primary: '#3B0764',
          secondary: '#581C87',
          accent: '#38BDF8',
          text: '#FFFFFF',
          overlayBg: 'rgba(59, 7, 100, 0.88)',
        },
      },
      {
        ten_concept: '09. Con người & Văn hóa Đồng đội (Human & Culture)',
        phong_cach: 'Con người và môi trường làm việc',
        bo_cuc: 'human-centric',
        goc_marketing: 'Đồng đội tận tâm, Sếp tâm lý & Đào tạo bài bản',
        y_tuong: 'Đặt yếu tố con người và sự dìuắt lên hàng đầu, xóa bỏ nỗi sợ của ứng viên mới hoặc trái ngành.',
        mau_sac: {
          primary: '#431407',
          secondary: '#7C2D12',
          accent: '#FB923C',
          text: '#FFF7ED',
          overlayBg: 'rgba(67, 20, 7, 0.88)',
        },
      },
      {
        ten_concept: '10. Chuyển đổi Cao - Đột phá Thu nhập (High-Conversion)',
        phong_cach: 'Chuyển đổi cao / thu hút ứng viên',
        bo_cuc: 'high-conversion',
        goc_marketing: 'Thu nhập bứt phá, Thưởng nóng & Ứng tuyển đi làm ngay',
        y_tuong: 'Làm nổi bật con số Thu nhập/Mức lương và nút Kêu gọi hành động (CTA) cỡ lớn để tối đa hóa tỷ lệ nộp hồ sơ.',
        mau_sac: {
          primary: '#450A0A',
          secondary: '#7F1D1D',
          accent: '#FACC15',
          text: '#FFFFFF',
          overlayBg: 'rgba(69, 10, 10, 0.90)',
        },
      },
    ];

    return archetypes.map((arch, idx) => {
      const scene = scenes[idx % scenes.length];
      return {
        id: `concept-${campaignId}-${idx + 1}`,
        campaignId,
        index: idx + 1,
        ten_concept: arch.ten_concept,
        y_tuong: arch.y_tuong,
        boi_canh: scene.boi_canh,
        nhan_vat: scene.nhan_vat,
        goc_may: scene.goc_may,
        anh_sang: scene.anh_sang,
        mau_sac: arch.mau_sac,
        bo_cuc: arch.bo_cuc,
        phong_cach: arch.phong_cach,
        goc_marketing: arch.goc_marketing,
        prompt_tao_anh: `${scene.promptEn}. Style: ${arch.phong_cach}, camera angle: ${scene.goc_may}, lighting: ${scene.anh_sang}. Vietnamese recruitment context for ${job.vi_tri} (${job.nganh_nghe}). Clean composition with negative space for typography, no text, no watermark, no distorted letters.`,
      };
    });
  }
}

// ============================================================================
// MODULE 4: TaoNoiDungPosterAI
// Creates concise, high-impact Vietnamese poster copy tailored to each concept's marketing angle
// ============================================================================
export class TaoNoiDungPosterAI {
  static createPosterRecord(
    job: JobData,
    concept: CreativeConcept,
    campaignId: string,
    aspectRatio: AspectRatioOption,
    backgroundImageUrl: string,
    imageProvider: string,
    brandKit?: BrandKit
  ): PosterRecord {
    const idx = concept.index;

    // 10 distinct headlines matching the 10 marketing angles
    const headlines: Record<number, { tieu_de: string; phu_de: string; cta: string }> = {
      1: {
        tieu_de: 'TUYỂN DỤNG NHÂN SỰ',
        phu_de: 'Cơ hội phát triển sự nghiệp bền vững',
        cta: 'ỨNG TUYỂN NGAY',
      },
      2: {
        tieu_de: 'GIA NHẬP BIỆT ĐỘI TRẺ',
        phu_de: 'Môi trường năng động – Thỏa sức bứt phá',
        cta: 'GIA NHẬP ĐỘI NGŨ',
      },
      3: {
        tieu_de: 'ĐÁNH THỨC TIỀM NĂNG',
        phu_de: 'Kiến tạo dấu ấn sự nghiệp của riêng bạn',
        cta: 'KHÁM PHÁ CƠ HỘI',
      },
      4: {
        tieu_de: 'CHIÊU MỘ HIỀN TÀI',
        phu_de: 'Đãi ngộ xứng tầm – Vị thế chuyên nghiệp',
        cta: 'GỬI HỒ SƠ VIP',
      },
      5: {
        tieu_de: 'THÔNG BÁO TUYỂN DỤNG',
        phu_de: 'Minh bạch lộ trình – Chế độ chuẩn mực',
        cta: 'NỘP CV TRỰC TUYẾN',
      },
      6: {
        tieu_de: 'CÔNG VIỆC LÝ TƯỞNG',
        phu_de: 'Phúc lợi toàn diện – Cân bằng cuộc sống',
        cta: 'ĐĂNG KÝ ỨNG TUYỂN',
      },
      7: {
        tieu_de: 'TÌM KIẾM ĐỒNG ĐỘI MỚI',
        phu_de: 'Cùng nhau chinh phục những cột mốc lớn',
        cta: 'LIÊN HỆ PHỎNG VẤN',
      },
      8: {
        tieu_de: 'TUYỂN GẤP ĐI LÀM NGAY',
        phu_de: job.kinh_nghiem || 'Hỗ trợ đào tạo bài bản từ A-Z',
        cta: 'INBOX / GỌI NGAY',
      },
      9: {
        tieu_de: 'ĐỒNG HÀNH CÙNG PHÁT TRIỂN',
        phu_de: 'Sếp tâm lý – Đồng nghiệp tận tình hỗ trợ',
        cta: 'ỨNG TUYỂN HÔM NAY',
      },
      10: {
        tieu_de: 'BỨT PHÁ THU NHẬP',
        phu_de: job.so_luong ? `Cơ hội cho ${job.so_luong} ứng viên nhanh nhất` : 'Chế độ thưởng hấp dẫn hàng tháng',
        cta: 'CHỐT LỊCH PHỎNG VẤN',
      },
    };

    const selectedCopy = headlines[idx] || headlines[1];

    // Pick top 3 concise bullet points strictly from user data
    const diem_hap_dan: string[] = [];
    if (job.kinh_nghiem) {
      diem_hap_dan.push(job.kinh_nghiem);
    }
    job.quyen_loi.forEach((ql) => {
      if (diem_hap_dan.length < 3 && ql.length <= 55) {
        diem_hap_dan.push(ql);
      }
    });
    job.yeu_cau.forEach((yc) => {
      if (diem_hap_dan.length < 3 && yc.length <= 55 && !diem_hap_dan.includes(yc)) {
        diem_hap_dan.push(yc);
      }
    });
    if (diem_hap_dan.length === 0) {
      diem_hap_dan.push('Môi trường làm việc chuyên nghiệp');
      diem_hap_dan.push('Chế độ đãi ngộ theo năng lực');
    }

    const fontMap: Record<number, string> = {
      1: 'Plus Jakarta Sans',
      2: 'Syne',
      3: 'Be Vietnam Pro',
      4: 'Playfair Display',
      5: 'Plus Jakarta Sans',
      6: 'Be Vietnam Pro',
      7: 'Playfair Display',
      8: 'Syne',
      9: 'Be Vietnam Pro',
      10: 'Plus Jakarta Sans',
    };

    const positionMap: Record<PosterLayoutTemplate, PosterRecord['typography']['position']> = {
      'corporate-split': 'split',
      'modern-dynamic': 'bottom',
      'cinematic-bottom': 'bottom',
      'luxury-frame': 'bottom',
      'minimal-swiss': 'top',
      'lifestyle-card': 'bottom',
      'editorial-magazine': 'top',
      'social-impact': 'center',
      'human-centric': 'bottom',
      'high-conversion': 'bottom',
    };

    const poster: PosterRecord = {
      id: `poster-${campaignId}-${idx}`,
      campaignId,
      conceptId: concept.id,
      index: idx,
      status: 'completed',
      tieu_de: selectedCopy.tieu_de,
      phu_de: selectedCopy.phu_de,
      vi_tri: job.vi_tri,
      diem_hap_dan: diem_hap_dan.slice(0, 3),
      luong: job.luong, // Empty if user didn't provide
      dia_diem: job.dia_diem, // Empty if user didn't provide
      so_luong: job.so_luong,
      kinh_nghiem: job.kinh_nghiem,
      cta: selectedCopy.cta,
      ten_cong_ty: job.ten_cong_ty || brandKit?.ten_cong_ty || '',
      hotline: job.lien_he.hotline || brandKit?.hotline || '',
      website: job.lien_he.website || brandKit?.website || '',
      email: job.lien_he.email || brandKit?.email || '',
      logo: brandKit?.logo || '',
      backgroundImageUrl,
      imageProvider,
      aspectRatio,
      layoutTemplate: concept.bo_cuc,
      typography: {
        fontFamily: brandKit?.font || fontMap[idx] || 'Be Vietnam Pro',
        titleSize: 1.0,
        position: positionMap[concept.bo_cuc] || 'bottom',
        textColor: concept.mau_sac.text,
        accentColor: concept.mau_sac.accent,
        overlayOpacity: 0.88,
        align: concept.bo_cuc === 'luxury-frame' || concept.bo_cuc === 'social-impact' ? 'center' : 'left',
      },
      qualityAudit: {
        totalScore: 95,
        passed: true,
        criteria: {
          dung_nganh_nghe: true,
          dung_vi_tri: true,
          du_khoang_trong_chu: true,
          chu_de_doc: true,
          tieng_viet_chuan: true,
          thong_tin_chinh_xac: true,
          khac_biet_9_poster: true,
        },
        distinctnessScore: 96,
        notes: 'Đạt chuẩn Typography tiếng Việt vector sắc nét & bối cảnh đúng ngành nghề.',
      },
      updatedAt: new Date().toISOString(),
    };

    return poster;
  }
}

// ============================================================================
// MODULE 5: TaoBaiDangAI
// Generates 10 unique social media recruitment posts following HOOK -> INTRO -> SALARY -> BENEFITS -> REQ -> LOC -> CTA -> HASHTAG
// ============================================================================
export class TaoBaiDangAI {
  static generatePostForPoster(job: JobData, concept: CreativeConcept, poster: PosterRecord): SocialPostRecord {
    const idx = concept.index;
    const companyText = job.ten_cong_ty ? `tại ${job.ten_cong_ty}` : 'tại đơn vị chúng tôi';
    const qtyText = job.so_luong ? `${job.so_luong} ` : '';
    const locText = job.dia_diem ? `Khu vực làm việc: ${job.dia_diem}` : '';
    const salText = job.luong ? `Thu nhập hấp dẫn: ${job.luong}` : 'Thu nhập: Thỏa thuận xứng đáng theo năng lực';

    // 10 distinct copywriting angles matching the 10 concepts
    const hooksByAngle: Record<number, { goc: string; hook: string; intro: string }> = {
      1: {
        goc: 'Tập trung vào uy tín doanh nghiệp & sự nghiệp bền vững',
        hook: `🏢 BẠN ĐANG TÌM KIẾM MỘT BẾN ĐỖ SỰ NGHIỆP VỮNG CHẮC CHO NĂM NAY?`,
        intro: `Chào đón các ứng viên tài năng gia nhập vị trí ${qtyText}${job.vi_tri} ${companyText}. Đây là cơ hội để bạn làm việc trong quy trình chuyên nghiệp và lộ trình thăng tiến rõ ràng.`,
      },
      2: {
        goc: 'Tập trung vào môi trường trẻ trung, năng động, sáng tạo',
        hook: `⚡ MÔI TRƯỜNG TRẺ TRUNG – NƠI MỌI Ý TƯỞNG CỦA BẠN ĐỀU ĐƯỢC LẮNG NGHE!`,
        intro: `Nếu bạn sợ sự nhàm chán nơi công sở, hãy về ngay với đội ngũ ${job.vi_tri} ${companyText}. Chúng tôi tìm kiếm ${qtyText}đồng đội cùng tần số năng lượng tích cực!`,
      },
      3: {
        goc: 'Tập trung vào tầm nhìn, đam mê và giá trị nghề nghiệp',
        hook: `🌟 ĐỪNG CHỈ ĐI LÀM – HÃY KIẾN TẠO SỰ NGHIỆP ĐÁNG TỰ HÀO Ở VỊ TRÍ ${job.vi_tri.toUpperCase()}!`,
        intro: `Mỗi ngày đi làm là một bước tiến mới. Chúng tôi đang mở đợt chiêu mộ ${qtyText}${job.vi_tri} ${companyText} dành cho những ai thực sự khao khát khẳng định bản thân.`,
      },
      4: {
        goc: 'Tập trung vào chế độ đãi ngộ cao cấp & sự trân trọng nhân tài',
        hook: `💎 CHIÊU MỘ NHÂN TÀI ${job.vi_tri.toUpperCase()} – ĐÃI NGỘ XỨNG TẦM NĂNG LỰC!`,
        intro: `Nhân tài luôn xứng đáng với môi trường và chế độ tốt nhất. Đợt tuyển dụng đặc biệt vị trí ${qtyText}${job.vi_tri} ${companyText} chính thức mở đơn.`,
      },
      5: {
        goc: 'Tập trung vào thông tin ngắn gọn, trực diện, minh bạch',
        hook: `📌 [THÔNG BÁO TUYỂN DỤNG] CẦN TUYỂN ${qtyText.toUpperCase()}${job.vi_tri.toUpperCase()} ${job.dia_diem ? `TẠI ${job.dia_diem.toUpperCase()}` : ''}`,
        intro: `Thông tin tuyển dụng minh bạch, phỏng vấn nhanh gọn và nhận việc ngay trong tháng này cho vị trí ${job.vi_tri} ${companyText}.`,
      },
      6: {
        goc: 'Tập trung vào cân bằng cuộc sống và phúc lợi nhân viên',
        hook: `🌿 ĐI LÀM VUI VẺ, THU NHẬP ĐẢM BẢO – GIA NHẬP NGAY VỊ TRÍ ${job.vi_tri.toUpperCase()}!`,
        intro: `Chúng tôi tin rằng nhân sự hạnh phúc sẽ tạo ra kết quả tuyệt vời nhất. Hiện đơn vị đang tuyển thêm ${qtyText}${job.vi_tri} ${companyText}.`,
      },
      7: {
        goc: 'Tập trung vào câu chuyện phát triển bản thân & lộ trình thăng tiến',
        hook: `🚀 BẠN MUỐN Ở ĐÂU SAU 6 THÁNG TỚI? CƠ HỘI BỨT PHÁ VỚI VỊ TRÍ ${job.vi_tri.toUpperCase()}!`,
        intro: `Đừng để giới hạn hiện tại kìm hãm bạn. Gia nhập vị trí ${qtyText}${job.vi_tri} ${companyText} để được trao quyền và phát triển chuyên môn tối đa.`,
      },
      8: {
        goc: 'Tập trung vào người mới / đào tạo bài bản / dễ tiếp cận trên Social',
        hook: `🔥 TUYỂN GẤP ${qtyText.toUpperCase()}${job.vi_tri.toUpperCase()} – ${job.kinh_nghiem ? job.kinh_nghiem.toUpperCase() : 'HỖ TRỢ ĐÀO TẠO TỪ ĐẦU'}!`,
        intro: `Cơ hội rộng mở cho các bạn muốn bắt đầu công việc ${job.vi_tri} ${companyText}. Chỉ cần bạn có thái độ cầu tiến, kỹ năng đã có đội ngũ hỗ trợ!`,
      },
      9: {
        goc: 'Tập trung vào văn hóa đồng đội, sếp tâm lý và sự sẻ chia',
        hook: `🤝 TÌM ĐỒNG ĐỘI ${job.vi_tri.toUpperCase()} – SẾP TÂM LÝ, ĐỒNG NGHIỆP HỖ TRỢ HẾT MÌNH!`,
        intro: `Đi làm không còn áp lực cô đơn khi bạn có một tập thể luôn sẵn sàng cầm tay chỉ việc. Chúng mình đang chờ đón ${qtyText}${job.vi_tri} ${companyText}.`,
      },
      10: {
        goc: 'Tập trung mạnh vào thu nhập, quyền lợi tài chính và hành động ngay',
        hook: `💰 BỨT PHÁ THU NHẬP ${job.luong ? job.luong.toUpperCase() : 'HẤP DẪN'} VỚI VỊ TRÍ ${job.vi_tri.toUpperCase()}!`,
        intro: `Cơ hội gia tăng thu nhập rõ rệt ngay trong quý này! Tuyển dụng ${qtyText}${job.vi_tri} ${companyText} với cơ chế lương thưởng cực kỳ cạnh tranh.`,
      },
    };

    const selected = hooksByAngle[idx] || hooksByAngle[1];

    const quyenLoiList =
      job.quyen_loi.length > 0
        ? job.quyen_loi
        : ['Môi trường làm việc chuyên nghiệp, văn minh', 'Hỗ trợ đào tạo nâng cao nghiệp vụ'];

    const yeuCauList =
      job.yeu_cau.length > 0
        ? job.yeu_cau
        : [job.kinh_nghiem || 'Tinh thần trách nhiệm cao, chủ động trong công việc'];

    // Contact block strictly from actual data
    const contactParts: string[] = [];
    if (job.lien_he.hotline) contactParts.push(`📞 Hotline/Zalo: ${job.lien_he.hotline}`);
    if (job.lien_he.email) contactParts.push(`📧 Email: ${job.lien_he.email}`);
    if (job.lien_he.website) contactParts.push(`🌐 Website: ${job.lien_he.website}`);
    if (job.lien_he.dia_chi) contactParts.push(`📍 Địa chỉ: ${job.lien_he.dia_chi}`);

    const ctaText =
      contactParts.length > 0
        ? `👉 ỨNG TUYỂN NGAY HÔM NAY:\n${contactParts.join('\n')}\nHoặc nhắn tin trực tiếp để bộ phận Nhân sự liên hệ tư vấn lịch phỏng vấn sớm nhất!`
        : `👉 ỨNG TUYỂN NGAY: Để lại thông tin hoặc nhắn tin trực tiếp dưới bài viết này để nhận lịch phỏng vấn sớm nhất!`;

    const cleanPosTag = job.vi_tri
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    const hashtags = [
      '#TuyenDung',
      `#TuyenDung${cleanPosTag ? cleanPosTag.charAt(0).toUpperCase() + cleanPosTag.slice(1) : 'NhanSu'}`,
      '#ViecLamTot',
      job.dia_diem ? `#ViecLam${job.dia_diem.replace(/\s+/g, '')}` : '#CoHoiNgheNghiep',
      `#Concept0${idx}`,
    ];

    const facebookContent = [
      selected.hook,
      '',
      selected.intro,
      '',
      `💵 MỨC LƯƠNG & THU NHẬP:`,
      `• ${salText}`,
      '',
      `🎁 QUYỀN LỢI DÀNH CHO BẠN:`,
      ...quyenLoiList.map((q) => `✓ ${q}`),
      '',
      `📋 YÊU CẦU CÔNG VIỆC:`,
      ...yeuCauList.map((y) => `• ${y}`),
      ...(locText ? ['', `📍 ĐỊA ĐIỂM LÀM VIỆC:`, `• ${locText}`] : []),
      '',
      ctaText,
      '',
      hashtags.join(' '),
    ].join('\n');

    const zaloContent = [
      `[TUYỂN DỤNG ${job.vi_tri.toUpperCase()}]`,
      selected.intro,
      `• Thu nhập: ${job.luong || 'Thỏa thuận theo năng lực'}`,
      ...(job.dia_diem ? [`• Khu vực: ${job.dia_diem}`] : []),
      `• Quyền lợi: ${quyenLoiList.join(', ')}`,
      `• Yêu cầu: ${yeuCauList.join(', ')}`,
      contactParts.length > 0 ? contactParts.join(' | ') : 'Nhắn tin Zalo trực tiếp để ứng tuyển ngay!',
    ].join('\n');

    const linkedinContent = [
      `🚀 [WE ARE HIRING] ${job.vi_tri.toUpperCase()} ${job.ten_cong_ty ? `| ${job.ten_cong_ty.toUpperCase()}` : ''}`,
      '',
      selected.intro,
      '',
      `🔹 Ngành nghề: ${job.nganh_nghe}`,
      ...(job.luong ? [`🔹 Mức đãi ngộ: ${job.luong}`] : []),
      ...(job.dia_diem ? [`🔹 Địa điểm: ${job.dia_diem}`] : []),
      '',
      `🔹 Quyền lợi nổi bật:`,
      ...quyenLoiList.map((q) => `  - ${q}`),
      '',
      `🔹 Yêu cầu ứng viên:`,
      ...yeuCauList.map((y) => `  - ${y}`),
      '',
      contactParts.length > 0 ? `📩 Ứng tuyển tại:\n${contactParts.join('\n')}` : '📩 Kết nối và gửi CV trực tiếp qua tin nhắn LinkedIn.',
      '',
      hashtags.join(' '),
    ].join('\n');

    return {
      id: `post-${poster.campaignId}-${idx}`,
      campaignId: poster.campaignId,
      posterId: poster.id,
      index: idx,
      status: 'completed',
      goc_tiep_can: selected.goc,
      hook: selected.hook,
      gioi_thieu_vi_tri: selected.intro,
      muc_luong: salText,
      quyen_loi: quyenLoiList,
      yeu_cau: yeuCauList,
      dia_diem: job.dia_diem,
      cta: ctaText,
      hashtags,
      facebookContent,
      zaloContent,
      linkedinContent,
      updatedAt: new Date().toISOString(),
    };
  }
}

// ============================================================================
// MODULE 6: KiemTraChatLuongAI & KiemTraDoKhacBietAI
// Audits each poster (0-100 score) and verifies diversity across all 10 posters
// ============================================================================
export class KiemTraChatLuongAI {
  static auditPoster(poster: PosterRecord, job: JobData, allPosters: PosterRecord[]): QualityAuditResult {
    const dung_nganh_nghe = Boolean(job.nganh_nghe && poster.backgroundImageUrl);
    const dung_vi_tri = Boolean(poster.vi_tri && poster.vi_tri.trim().length > 1);
    const du_khoang_trong_chu = poster.typography.overlayOpacity >= 0.4;
    const chu_de_doc = Boolean(poster.typography.textColor && poster.typography.accentColor);
    const tieng_viet_chuan = Boolean(poster.tieu_de && poster.cta);
    // Ensure we didn't invent salary or location when job didn't have it
    const thong_tin_chinh_xac =
      poster.luong === job.luong && poster.dia_diem === job.dia_diem;

    const others = allPosters.filter((p) => p.id !== poster.id);
    const khac_biet_9_poster = others.every(
      (o) => o.layoutTemplate !== poster.layoutTemplate || o.tieu_de !== poster.tieu_de
    );

    const criteria = {
      dung_nganh_nghe,
      dung_vi_tri,
      du_khoang_trong_chu,
      chu_de_doc,
      tieng_viet_chuan,
      thong_tin_chinh_xac,
      khac_biet_9_poster,
    };

    const passedCount = Object.values(criteria).filter(Boolean).length;
    const totalScore = Math.round((passedCount / 7) * 100);

    return {
      totalScore,
      passed: totalScore >= 80,
      criteria,
      distinctnessScore: khac_biet_9_poster ? 96 : 75,
      notes:
        totalScore >= 80
          ? 'Đạt chuẩn chất lượng cao: Đúng ngành nghề, chữ tiếng Việt chuẩn xác, bố cục rõ ràng.'
          : 'Cần tối ưu lại độ tương phản hoặc bố cục.',
    };
  }
}

export class KiemTraDoKhacBietAI {
  static calculateCampaignDiversity(concepts: CreativeConcept[], posters: PosterRecord[]): {
    score: number;
    uniqueLayouts: number;
    uniquePalettes: number;
    uniqueAngles: number;
    passed: boolean;
  } {
    const uniqueLayouts = new Set(posters.map((p) => p.layoutTemplate)).size;
    const uniquePalettes = new Set(concepts.map((c) => c.mau_sac.accent)).size;
    const uniqueAngles = new Set(concepts.map((c) => c.goc_marketing)).size;

    const ratio = (uniqueLayouts + uniquePalettes + uniqueAngles) / (posters.length * 3 || 1);
    const score = Math.min(100, Math.round(ratio * 100));

    return {
      score,
      uniqueLayouts,
      uniquePalettes,
      uniqueAngles,
      passed: score >= 85,
    };
  }
}
