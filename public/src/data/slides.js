// Slide content for the how-to-play panel and the stage briefings.
// Each slide: { art: key in SLIDE_ART, title, text }. Keep it to the few things that matter.
import { RULES } from './rules.js';

export const HOW_TO_PLAY = [
  {
    art: 'answerAmmo',
    title: 'TRẢ LỜI ĐỂ CÓ ĐẠN',
    text: `MỖI CÂU TRẢ LỜI ĐÚNG ĐƯỢC NẠP 1 VIÊN ĐẠN.`,
  },
  {
    art: 'shootDuck',
    title: 'BẤM ĐỂ BẮN',
    text: 'DÙNG ĐẠN BẮN VỊT. MỖI PHÁT TRÚNG ĐỀU ĐƯỢC ĐIỂM.',
  },
  {
    art: 'combo',
    title: 'GIỮ CHUỖI TRÚNG',
    text: 'TRÚNG 3 PHÁT LIÊN TIẾP = x1.5 ĐIỂM. 5 PHÁT = x2.',
  },
];

export const STAGE_SLIDES = {
  1: [
    {
      art: 'smallDucks',
      title: 'BẮN HẾT ĐÀN VỊT',
      text: 'VỊT ĐỨNG NGAY TRƯỚC MẶT THÔI. NHẮM CHO CHUẨN, ĐỪNG BẮN CHIM TRỜI.',
    },
  ],

  2: [
    {
      art: 'copAmmo',
      title: 'TRẢ LỜI SAI? TẶNG ĐẠN CHO CẢNH SÁT',
      text: 'MỖI CÂU SAI LÀ CẢNH SÁT ĐƯỢC THÊM 1 VIÊN. CẨN THẬN KẺO ĂN KẸO ĐỒNG.',
    },
  ],

  3: [
    {
      art: 'guardAmmo',
      title: `MỖI LƯỢT ${RULES.QUESTIONS_PER_WAVE[3]} CÂU HỎI`,
      text: 'TRẢ LỜI SAI THÌ VỆ SĨ ĐƯỢC THÊM ĐẠN. ĐÚNG RỒI, BẠN ĐANG TỰ VŨ TRANG CHO KẺ ĐỊCH.',
    },
    {
      art: 'guards',
      title: 'PHÁ KHIÊN ĐI',
      text: `HẠ CẢ ${RULES.BODYGUARDS_PER_CYCLE} VỆ SĨ THÌ MỚI LÔI ĐƯỢC VỊT TỔNG THỐNG RA. DỄ MÀ, ĐÚNG KHÔNG?`,
    },
    {
      art: 'shieldBack',
      title: 'KHIÊN LẠI HỒI RỒI',
      text: `SAU ${RULES.PRESIDENT_SHIELD_COOLDOWN} GIÂY, TỔNG THỐNG LẠI CHẠY TRỐN. BẮN NHANH LÊN, HAY ĐỂ HẮN TRỐN LUÔN?`,
    },
  ],
};

export const TUTORIAL_DONE = [
  {
    art: 'goodShot',
    title: 'Ồ, BẮN TRÚNG KÌA!',
    text: 'KHÔNG TỆ. GIỜ THÌ VÀO TRẬN VÀ ĐỪNG LÀM TÔI THẤT VỌNG.',
  },
];