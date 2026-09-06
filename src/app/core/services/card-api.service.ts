import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import {
  Card, CardReviewRequest, PageResponse, PageParams,
  BatchImportRequest, BatchImportResult,
  DashboardResponse, CardDetailResponse,
  PracticeResultRequest,
  PracticePromptResponse, ImportPracticeJsonResponse,
  PracticeQueueItem, SubmitLevelAnswerRequest,
  SubmitLevelAnswerResponse
} from '@models/index';

@Injectable({ providedIn: 'root' })
export class CardApiService extends ApiBaseService {
  private readonly BASE = '/card';

  // ─── Existing methods ───────────────────────────────────────────────

  getCardsByDeckId(deckId: string, params?: PageParams): Observable<PageResponse<Card>> {
    return this.get<PageResponse<Card>>(`${this.BASE}/deck/${deckId}`, params);
  }

  getCardById(id: string): Observable<Card> {
    return this.get<Card>(`${this.BASE}/${id}`);
  }

  createCard(data: Partial<Card>): Observable<Card> {
    return this.post<Card>(this.BASE, data);
  }

  updateCard(id: string, data: Partial<Card>): Observable<Card> {
    return this.put<Card>(`${this.BASE}/${id}`, data);
  }

  deleteCard(id: string): Observable<void> {
    return this.delete<void>(`${this.BASE}/${id}`);
  }

  reviewCard(data: CardReviewRequest): Observable<void> {
    return this.post<void>(`${this.BASE}/review`, data);
  }

  toggleFavorite(id: string): Observable<Card> {
    return this.put<Card>(`${this.BASE}/${id}/toggle-favorite`, {});
  }

  // ─── Vocab Vault methods ─────────────────────────────────────────────

  /** POST /api/card/batch-import — import JSON từ AI */
  batchImport(req: BatchImportRequest): Observable<BatchImportResult> {
    return this.post<BatchImportResult>(`${this.BASE}/batch-import`, req);
  }

  /** POST /api/card/batch-assign-deck — gán hàng loạt cards vào deck */
  batchAssignDeck(cardIds: string[], deckId?: string): Observable<{ totalAssigned: number; message: string }> {
    return this.post<{ totalAssigned: number; message: string }>(`${this.BASE}/batch-assign-deck`, {
      cardIds,
      deckId: deckId || null,
    });
  }

  /** GET /api/card/topics — danh sách chủ đề distinct của người dùng */
  getUserTopics(): Observable<string[]> {
    return this.get<string[]>(`${this.BASE}/topics`);
  }

  /** GET /api/card/dashboard — stats + danh sách cards có filter */
  getDashboard(params?: Record<string, string | number | boolean | undefined>): Observable<DashboardResponse> {
    return this.get<DashboardResponse>(`${this.BASE}/dashboard`, params);
  }

  /** GET /api/card/:id — chi tiết card kèm reverse relations */
  getCardDetail(id: string): Observable<CardDetailResponse> {
    return this.get<CardDetailResponse>(`${this.BASE}/${id}`);
  }

  /** GET /api/card/practice/due?limit=15 — cards đến hạn luyện tập */
  getDueCards(limit = 15): Observable<Card[]> {
    return this.get<Card[]>(`${this.BASE}/practice/due`, { limit });
  }

  /** POST /api/card/:id/practice-result — nộp kết quả SM-2 */
  submitPracticeResult(cardId: string, req: PracticeResultRequest): Observable<Card> {
    return this.post<Card>(`${this.BASE}/${cardId}/practice-result`, req);
  }

  // ─── Feature 002: Word Journey Practice APIs ──────────────────────────

  /** GET /api/card/practice-prompt or /api/card/deck/:deckId/practice-prompt */
  getPracticePrompt(deckId?: string): Observable<PracticePromptResponse> {
    const url = deckId ? `${this.BASE}/deck/${deckId}/practice-prompt` : `${this.BASE}/practice-prompt`;
    return this.get<PracticePromptResponse>(url);
  }

  /** POST /api/card/import-practice-json or /api/card/deck/:deckId/import-practice-json */
  importPracticeJson(jsonContent: string, deckId?: string): Observable<ImportPracticeJsonResponse> {
    const url = deckId ? `${this.BASE}/deck/${deckId}/import-practice-json` : `${this.BASE}/import-practice-json`;
    return this.post<ImportPracticeJsonResponse>(url, { jsonContent });
  }

  /** GET /api/card/practice/queue — lấy queue bài tập theo Level */
  getPracticeQueue(
    deckId?: string,
    options?: { limit?: number; level?: number; pos?: string; starOnly?: boolean; shuffle?: boolean } | number
  ): Observable<{ items: PracticeQueueItem[]; totalDue: number }> {
    const params: any = {};
    if (typeof options === 'number') {
      params.limit = options;
    } else if (options) {
      if (options.limit) params.limit = options.limit;
      if (options.level && options.level > 0) params.level = options.level;
      if (options.pos && options.pos !== 'all') params.pos = options.pos;
      if (options.starOnly) params.starOnly = true;
      if (options.shuffle) params.shuffle = true;
    } else {
      params.limit = 20;
    }
    if (deckId) params.deckId = deckId;
    return this.get<{ items: PracticeQueueItem[]; totalDue: number }>(`${this.BASE}/practice/queue`, params);
  }

  /** POST /api/card/:id/submit-level — nộp câu trả lời cho level hiện tại */
  submitLevelAnswer(cardId: string, payload: SubmitLevelAnswerRequest): Observable<SubmitLevelAnswerResponse> {
    return this.post<SubmitLevelAnswerResponse>(`${this.BASE}/${cardId}/submit-level`, payload);
  }

  /** GET /api/card/leech — danh sách từ bị kẹt */
  getLeechCards(): Observable<Card[]> {
    return this.get<Card[]>(`${this.BASE}/leech`);
  }

  /** POST /api/card/:id/clear-leech — gỡ trạng thái Leech */
  clearLeechStatus(cardId: string, memoryTip?: string): Observable<{ card: Card; message: string }> {
    return this.post<{ card: Card; message: string }>(`${this.BASE}/${cardId}/clear-leech`, { memoryTip });
  }
}
