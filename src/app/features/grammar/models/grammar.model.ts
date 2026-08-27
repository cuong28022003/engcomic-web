export interface GrammarExample {
  text: string;
  translation?: string;
  highlight?: string;
  note?: string;
}

export interface GrammarUsage {
  title: string;
  structure?: string;
  explanation?: string;
  signalWords?: string[];
  examples?: GrammarExample[];
  note?: string;
}

export interface GrammarComparison {
  compareWith: string;
  coreDifference: string;
  currentExample?: string;
  targetExample?: string;
}

export interface GrammarPoint {
  id: string;
  topic: string;
  category: string;
  level?: 'basic' | 'intermediate' | 'advanced' | string;
  summary?: string;
  shortRule?: string;
  structure?: string;
  signalWords?: string[];
  commonMistake?: string;
  examples?: GrammarExample[];
  usages?: GrammarUsage[];
  commonMistakes?: string[];
  examTips?: string[];
  comparisons?: GrammarComparison[];
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
  { key: 'all', label: 'Tất cả chủ đề', icon: 'fa-solid fa-layer-group', color: '#6366f1' },
  { key: 'parts_of_speech', label: '1. Từ loại', icon: 'fa-solid fa-font', color: '#06b6d4' },
  { key: 'tenses', label: '2. 12 Thì cơ bản', icon: 'fa-solid fa-clock-rotate-left', color: '#38bdf8' },
  { key: 'sentence_structure', label: '3. Cấu trúc câu', icon: 'fa-solid fa-diagram-project', color: '#60a5fa' },
  { key: 'passive_voice', label: '4. Câu bị động', icon: 'fa-solid fa-arrows-rotate', color: '#ec4899' },
  { key: 'conditionals', label: '5. Câu điều kiện', icon: 'fa-solid fa-code-branch', color: '#a855f7' },
  { key: 'reported_speech', label: '6. Câu tường thuật', icon: 'fa-solid fa-comments', color: '#f43f5e' },
  { key: 'relative_clauses', label: '7. Mệnh đề quan hệ', icon: 'fa-solid fa-link', color: '#10b981' },
  { key: 'gerunds_infinitives', label: '8. Danh động từ & Động từ nguyên mẫu', icon: 'fa-solid fa-list-check', color: '#84cc16' },
  { key: 'modal_verbs', label: '9. Động từ khuyết thiếu', icon: 'fa-solid fa-wand-magic-sparkles', color: '#8b5cf6' },
  { key: 'comparisons', label: '10. Câu so sánh', icon: 'fa-solid fa-scale-balanced', color: '#f97316' },
  { key: 'articles_quantifiers', label: '11. Mạo từ & Lượng từ', icon: 'fa-solid fa-boxes-stacked', color: '#eab308' },
  { key: 'phrasal_verbs', label: '12. Cụm động từ & Giới từ', icon: 'fa-solid fa-route', color: '#f59e0b' },
  { key: 'subject_verb_agreement', label: '13. Hòa hợp chủ ngữ - động từ', icon: 'fa-solid fa-handshake', color: '#ef4444' },
  { key: 'inversion', label: '14. Câu đảo ngữ', icon: 'fa-solid fa-repeat', color: '#d946ef' },
  { key: 'cleft_sentences', label: '15. Câu nhấn mạnh', icon: 'fa-solid fa-bolt', color: '#fbbf24' },
  { key: 'conjunctions', label: '16. Liên từ & Từ nối', icon: 'fa-solid fa-signs-post', color: '#14b8a6' },
  { key: 'parallel_structure', label: '17. Cấu trúc song song', icon: 'fa-solid fa-bars-staggered', color: '#2dd4bf' },
  { key: 'subjunctive_wish', label: '18. Câu ước & Thể giả định', icon: 'fa-solid fa-wand-sparkles', color: '#c084fc' }
];
