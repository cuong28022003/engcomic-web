export type ErrorType = 'vocab' | 'grammar' | 'inference' | 'detail_missed' | 'trap_answer' | 'time_pressure';

export interface KeyVocabItem {
  word: string;
  meaningVi: string;
}

export interface ToeicReviewItem {
  id: string;
  testId: string;
  attemptId: string;
  questionNumber: number;
  part: number;
  errorType: ErrorType | string;
  errorSubtype?: string;
  relatedGrammarTopic?: string;
  passageExcerpt?: string;
  questionText?: string;
  options?: Record<string, string>;
  explanation: string;
  tip?: string;
  keyVocab?: KeyVocabItem[];
  createdAt?: string;
}

export interface ImportReviewItemsPayload {
  items: Array<{
    question_number: number;
    part?: number;
    error_type?: string;
    error_subtype?: string;
    related_grammar_topic?: string;
    passage_excerpt?: string;
    question_text?: string;
    options?: Record<string, string>;
    explanation: string;
    tip?: string;
    key_vocab?: Array<{ word: string; meaning_vi: string }>;
  }>;
}
