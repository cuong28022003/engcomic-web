import { FormSelectOption } from '../components/form-select/form-select.component';

export interface PartOfSpeechConfig {
  key: string;
  vietnamese: string;
  english: string;
  shortCode: string;
  cssClass: string;
  order: number;
}

/**
 * Single Source of Truth (SSOT) cho toàn bộ từ loại (Part of Speech) trong ứng dụng.
 * Khi cần thêm/sửa/xóa từ loại, CHỈ CẦN chỉnh sửa danh sách này.
 */
export const PARTS_OF_SPEECH_LIST: PartOfSpeechConfig[] = [
  { key: 'noun', vietnamese: 'Danh từ', english: 'Noun', shortCode: 'n', cssClass: 'pos-noun', order: 1 },
  { key: 'verb', vietnamese: 'Động từ', english: 'Verb', shortCode: 'v', cssClass: 'pos-verb', order: 2 },
  { key: 'adjective', vietnamese: 'Tính từ', english: 'Adjective', shortCode: 'adj', cssClass: 'pos-adj', order: 3 },
  { key: 'adverb', vietnamese: 'Trạng từ', english: 'Adverb', shortCode: 'adv', cssClass: 'pos-adv', order: 4 },
  { key: 'pronoun', vietnamese: 'Đại từ', english: 'Pronoun', shortCode: 'pron', cssClass: 'pos-pronoun', order: 5 },
  { key: 'determiner', vietnamese: 'Từ hạn định', english: 'Determiner', shortCode: 'det', cssClass: 'pos-determiner', order: 6 },
  { key: 'preposition', vietnamese: 'Giới từ', english: 'Preposition', shortCode: 'prep', cssClass: 'pos-prep', order: 7 },
  { key: 'conjunction', vietnamese: 'Liên từ', english: 'Conjunction', shortCode: 'conj', cssClass: 'pos-conj', order: 8 },
  { key: 'transition_word', vietnamese: 'Trạng từ liên kết', english: 'Transition Word', shortCode: 'trans', cssClass: 'pos-transition', order: 9 },
  { key: 'phrasal_verb', vietnamese: 'Cụm động từ', english: 'Phrasal Verb', shortCode: 'phr v', cssClass: 'pos-phrasal', order: 10 },
  { key: 'collocation', vietnamese: 'Cụm từ cố định', english: 'Collocation', shortCode: 'colloc', cssClass: 'pos-colloc', order: 11 },
  { key: 'idiom', vietnamese: 'Thành ngữ', english: 'Idiom', shortCode: 'idiom', cssClass: 'pos-idiom', order: 12 },
  { key: 'phrase', vietnamese: 'Cụm từ', english: 'Phrase', shortCode: 'phrase', cssClass: 'pos-phrase', order: 13 },
  { key: 'interjection', vietnamese: 'Thán từ', english: 'Interjection', shortCode: 'interj', cssClass: 'pos-interj', order: 14 }
];

/** Bảng tra cứu nhanh O(1) theo key */
export const POS_MAP: Record<string, PartOfSpeechConfig> = PARTS_OF_SPEECH_LIST.reduce((acc, item) => {
  acc[item.key.toLowerCase()] = item;
  return acc;
}, {} as Record<string, PartOfSpeechConfig>);

/** Chuỗi các keys phục vụ chèn vào System Prompt AI (VD: "noun|verb|adjective|...") */
export const POS_PROMPT_SCHEMA_KEYS: string = PARTS_OF_SPEECH_LIST.map(p => p.key).join('|');

/** Options cho FormSelect trong Modal thêm/sửa thẻ từ vựng */
export const POS_FORM_SELECT_OPTIONS: FormSelectOption[] = PARTS_OF_SPEECH_LIST.map(p => ({
  label: `${p.vietnamese} (${p.key})`,
  value: p.key
}));

/** Options cho bộ lọc từ loại trong Dashboard từ vựng */
export const POS_DASHBOARD_FILTER_OPTIONS: Array<{ key: string; label: string }> = [
  { key: '', label: 'Tất cả từ loại' },
  ...PARTS_OF_SPEECH_LIST.map(p => ({
    key: p.key,
    label: `${p.vietnamese} (${p.english})`
  }))
];

/** Lấy cấu hình chi tiết của từ loại */
export function getPosConfig(pos?: string): PartOfSpeechConfig | undefined {
  if (!pos) return undefined;
  const normalized = pos.trim().toLowerCase();
  return POS_MAP[normalized];
}

/** Lấy nhãn viết tắt ngắn gọn (ví dụ: 'n', 'v', 'det', 'pron') */
export function getPosShortLabel(pos?: string): string {
  const config = getPosConfig(pos);
  if (config) return config.shortCode;
  return pos ? pos.trim() : '';
}

/** Lấy nhãn đầy đủ kèm viết tắt (ví dụ: 'Từ hạn định (det)', 'Danh từ (n)') */
export function getPosFullLabel(pos?: string): string {
  const config = getPosConfig(pos);
  if (config) return `${config.vietnamese} (${config.shortCode})`;
  return pos && pos.trim() ? pos.trim() : 'Từ vựng';
}

/** Lấy nhãn hiển thị cho bộ lọc chi tiết bộ thẻ (ví dụ: 'Từ hạn định (Determiner)') */
export function getPosDisplayName(pos?: string): string {
  const config = getPosConfig(pos);
  if (config) return `${config.vietnamese} (${config.english})`;
  if (!pos || pos === 'unknown') return 'Chưa phân loại';
  return pos.charAt(0).toUpperCase() + pos.slice(1);
}

/** Lấy CSS class tương ứng cho badge từ loại */
export function getPosCssClass(pos?: string): string {
  const config = getPosConfig(pos);
  if (config) return config.cssClass;
  const p = (pos || '').toLowerCase();
  if (p.includes('noun') || p === 'n') return 'pos-noun';
  if (p.includes('verb') || p === 'v') return 'pos-verb';
  if (p.includes('adj') || p === 'a') return 'pos-adj';
  if (p.includes('adv')) return 'pos-adv';
  return 'pos-other';
}

/** Thứ tự sắp xếp từ loại chuẩn */
export const POS_SORT_ORDER: string[] = [
  ...PARTS_OF_SPEECH_LIST.map(p => p.key),
  'unknown'
];
