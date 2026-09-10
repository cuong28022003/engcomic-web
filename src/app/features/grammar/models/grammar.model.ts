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
  typicalWords?: string[];
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

  // ── Trụ cột I: Nền tảng (Foundation) ─────────────────────────────
  { key: 'parts_of_speech', label: '1. Từ loại (Parts of Speech)', icon: 'fa-solid fa-font', color: '#06b6d4' },
  { key: 'tenses', label: '2. 12 Thì cơ bản (Tenses)', icon: 'fa-solid fa-clock-rotate-left', color: '#38bdf8' },
  { key: 'sentence_structure', label: '3. Cấu trúc câu (Sentence Structure)', icon: 'fa-solid fa-diagram-project', color: '#60a5fa' },
  { key: 'subject_verb_agreement', label: '4. Hòa hợp Chủ ngữ - Động từ', icon: 'fa-solid fa-handshake', color: '#ef4444' },

  // ── Trụ cột II: Dạng thức động từ & Cú pháp cốt lõi ───────────────
  { key: 'passive_voice', label: '5. Câu bị động (Passive Voice)', icon: 'fa-solid fa-arrows-rotate', color: '#ec4899' },
  { key: 'conditionals', label: '6. Câu điều kiện (Conditionals)', icon: 'fa-solid fa-code-branch', color: '#a855f7' },
  { key: 'reported_speech', label: '7. Câu tường thuật (Reported Speech)', icon: 'fa-solid fa-comments', color: '#f43f5e' },
  { key: 'modal_verbs', label: '8. Động từ khuyết thiếu (Modal Verbs)', icon: 'fa-solid fa-wand-magic-sparkles', color: '#8b5cf6' },
  { key: 'gerunds_infinitives', label: '9. Danh động từ & To-V', icon: 'fa-solid fa-list-check', color: '#84cc16' },
  { key: 'comparisons', label: '10. Câu so sánh (Comparisons)', icon: 'fa-solid fa-scale-balanced', color: '#f97316' },

  // ── Trụ cột III: Ngữ pháp chức năng (Functional Grammar) ───────────
  { key: 'prepositions', label: '11. Giới từ (Prepositions)', icon: 'fa-solid fa-route', color: '#06b6d4' },
  { key: 'conjunctions', label: '12. Liên từ & Trạng từ liên kết', icon: 'fa-solid fa-signs-post', color: '#14b8a6' },
  { key: 'articles_quantifiers', label: '13. Mạo từ & Lượng từ', icon: 'fa-solid fa-boxes-stacked', color: '#eab308' },
  { key: 'phrasal_verbs', label: '14. Cụm động từ & Cụm từ cố định', icon: 'fa-solid fa-shapes', color: '#f59e0b' },

  // ── Trụ cột IV: Cấu trúc nâng cao (Advanced Mastery) ──────────────
  { key: 'relative_clauses', label: '15. Mệnh đề quan hệ (Relative Clauses)', icon: 'fa-solid fa-link', color: '#10b981' },
  { key: 'inversion', label: '16. Câu đảo ngữ (Inversion)', icon: 'fa-solid fa-repeat', color: '#d946ef' },
  { key: 'cleft_sentences', label: '17. Câu nhấn mạnh (Cleft Sentences)', icon: 'fa-solid fa-bolt', color: '#fbbf24' },
  { key: 'parallel_structure', label: '18. Cấu trúc song song (Parallelism)', icon: 'fa-solid fa-bars-staggered', color: '#2dd4bf' },
  { key: 'subjunctive_wish', label: '19. Câu ước & Thể giả định', icon: 'fa-solid fa-wand-sparkles', color: '#c084fc' }
];

export function resolveGrammarCategory(catKey?: string): GrammarCategoryOption {
  if (!catKey || catKey === 'all') {
    return { key: 'all', label: 'Tất cả chủ đề', icon: 'fa-solid fa-layer-group', color: '#6366f1' };
  }
  const normalized = catKey.toLowerCase().trim();
  const directMatch = GRAMMAR_CATEGORIES.find(c => c.key.toLowerCase() === normalized);
  if (directMatch) return directMatch;

  // Alias mapping for backward compatibility
  if (normalized === 'preposition' || normalized === 'prep') {
    return GRAMMAR_CATEGORIES.find(c => c.key === 'prepositions')!;
  }
  if (normalized === 'conjunction' || normalized === 'conj' || normalized === 'transition_word' || normalized === 'transitions') {
    return GRAMMAR_CATEGORIES.find(c => c.key === 'conjunctions')!;
  }
  if (normalized === 'collocation_idiom' || normalized === 'collocation' || normalized === 'collocations' || normalized === 'phrasal_verb') {
    return GRAMMAR_CATEGORIES.find(c => c.key === 'phrasal_verbs')!;
  }
  if (normalized === 'functional_grammar' || normalized === 'functional') {
    return GRAMMAR_CATEGORIES.find(c => c.key === 'prepositions')!;
  }

  return {
    key: catKey,
    label: catKey,
    icon: 'fa-solid fa-book-bookmark',
    color: '#6366f1'
  };
}
