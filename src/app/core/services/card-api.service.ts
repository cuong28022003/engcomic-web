import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import {
  Card, CardReviewRequest, PageResponse, PageParams,
  BatchImportRequest, BatchImportResult,
  DashboardResponse, CardDetailResponse,
  PracticeResultRequest
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

  // ─── Vocab Vault methods ─────────────────────────────────────────────

  /** POST /api/card/batch-import — import JSON từ AI */
  batchImport(req: BatchImportRequest): Observable<BatchImportResult> {
    return this.post<BatchImportResult>(`${this.BASE}/batch-import`, req);
  }

  /** GET /api/card/dashboard — stats + danh sách cards có filter */
  getDashboard(params?: PageParams): Observable<DashboardResponse> {
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
}
