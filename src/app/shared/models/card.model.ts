import { CardExercisePackage } from './practice.model';

export interface WordRelation {
  text: string;             // từ liên quan
  type: 'family' | 'collocation' | 'synonym';
  pos?: string;             // noun | verb | adjective | adverb (chỉ cho family)
  relatedCardId?: string;   // null nếu chưa auto-link
  // Backward compatibility
  relatedText?: string;
  relationType?: 'family' | 'collocation' | 'synonym';
  word?: string;
}

export interface ExampleSentence {
  id?: string;
  text: string;             // câu ví dụ tiếng Anh
  translation?: string;     // nghĩa tiếng Việt
  formality?: 'formal' | 'informal' | 'written';
  source?: string;
}

export interface Card {
  id: string;
  deckId?: string;
  userId?: string;
  // Nội dung từ vựng chính
  word: string;             // từ / cụm từ tiếng Anh
  meaning: string;          // nghĩa tiếng Việt
  ipa?: string;
  audio?: string;
  partOfSpeech?: string;
  definitionEn?: string;
  usageNote?: string;
  topic?: string;
  examples?: ExampleSentence[];
  relations?: WordRelation[];
  // SRS & Mastery fields
  stage?: number;           // 0–5
  masteryLevel?: number;    // 1–4
  confidenceScore?: number; // 1–5
  memoryTip?: string;
  exercisePackage?: CardExercisePackage;
  status?: 'new' | 'learning' | 'review' | 'mature' | 'leech';
  easeFactor?: number;
  interval?: number;
  repetition?: number;
  wrongCount?: number;
  nextReview?: string;
  lastReviewed?: string;
  reviewCount?: number;
  seenExampleIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields (backward compat)
  front?: string;
  back?: string;
  example?: string;
  difficulty?: number;
}

export interface CardReviewRequest {
  cardId: string;
  quality: number; // 0-5 for spaced repetition
}
