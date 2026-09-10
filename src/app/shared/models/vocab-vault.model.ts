import { Card } from './card.model';
import { PageResponse } from './common/page.model';

export interface DashboardStats {
  total: number;
  dueToday: number;
  newCount: number;
  learningCount: number;
  matureCount: number;
  leechCount: number;
}

export interface DashboardResponse {
  totalCards: number;
  dueToday: number;
  newCount: number;
  learningCount: number;
  matureCount: number;
  leechCount: number;
  cards: PageResponse<Card>;
  stats?: DashboardStats;
}

export interface BatchImportRequest {
  jsonContent: string;
  deckId?: string;
  promptWords?: string[];
}

export interface BatchImportError {
  word: string;
  missingFields?: string[];
  reason?: string;
}

export interface BatchImportResult {
  imported: Card[];
  skipped: string[];
  errors: BatchImportError[];
  importedCount?: number;
  skippedCount?: number;
  errorCount?: number;
}

export interface PendingItem {
  id: string;
  userId: string;
  content: string;
  sourceType?: 'family' | 'collocation' | 'synonym' | 'manual' | 'toeic_review';
  sourceCardId?: string;
  status: 'pending' | 'imported';
  createdAt?: string;
}

export interface CreatePendingItemRequest {
  content: string;
  sourceType?: string;
  sourceCardId?: string;
}

export interface PracticeResultRequest {
  quality: number; // 0–5 (SM-2 scale)
}

export interface CardDetailResponse {
  card: Card;
  reverseRelations?: Card[];
}
