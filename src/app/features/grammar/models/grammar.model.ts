export interface GrammarExample {
  text: string;
  note?: string;
}

export interface GrammarPoint {
  id: string;
  topic: string;
  category: string;
  shortRule?: string;
  structure?: string;
  signalWords?: string[];
  commonMistake?: string;
  examples?: GrammarExample[];
  searchKeywords?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MostMissedGrammar {
  topic: string;
  category: string;
  count: number;
  grammarPoint?: GrammarPoint;
}

export interface BatchImportGrammarResult {
  insertedCount: number;
  updatedCount: number;
  total: number;
  data: GrammarPoint[];
}

export interface GrammarCategoryOption {
  key: string;
  label: string;
  icon: string;
  color: string;
}

export const GRAMMAR_CATEGORIES: GrammarCategoryOption[] = [
  { key: 'all', label: 'Tất Cả Chủ Đề', icon: 'fa-solid fa-layer-group', color: '#6366f1' },
  { key: 'tenses', label: 'Thì (Tenses)', icon: 'fa-solid fa-clock-rotate-left', color: '#38bdf8' },
  { key: 'conditionals', label: 'Câu Điều Kiện', icon: 'fa-solid fa-code-branch', color: '#a855f7' },
  { key: 'passive_voice', label: 'Câu Bị Động', icon: 'fa-solid fa-arrows-rotate', color: '#ec4899' },
  { key: 'relative_clauses', label: 'Mệnh Đề Quan Hệ', icon: 'fa-solid fa-link', color: '#10b981' },
  { key: 'prepositions', label: 'Giới Từ & Cụm', icon: 'fa-solid fa-location-crosshairs', color: '#f59e0b' },
  { key: 'conjunctions', label: 'Liên Từ & Mệnh Đề', icon: 'fa-solid fa-signs-post', color: '#14b8a6' },
  { key: 'modal_verbs', label: 'Động Từ Khuyết Thiếu', icon: 'fa-solid fa-wand-magic-sparkles', color: '#8b5cf6' },
  { key: 'word_forms', label: 'Từ Loại (Word Forms)', icon: 'fa-solid fa-font', color: '#06b6d4' },
  { key: 'gerunds_infinitives', label: 'V-ing & To V', icon: 'fa-solid fa-list-check', color: '#84cc16' },
  { key: 'comparatives', label: 'So Sánh', icon: 'fa-solid fa-scale-balanced', color: '#f97316' },
  { key: 'subject_verb_agreement', label: 'Hòa Hợp S - V', icon: 'fa-solid fa-handshake', color: '#ef4444' }
];
