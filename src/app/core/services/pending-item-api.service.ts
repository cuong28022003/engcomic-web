import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import {
  PendingItem, CreatePendingItemRequest, PageResponse, PageParams
} from '@models/index';

@Injectable({ providedIn: 'root' })
export class PendingItemApiService extends ApiBaseService {
  private readonly BASE = '/pending-item';

  /** POST /api/pending-item — tạo pending item từ relation hoặc manual */
  create(req: CreatePendingItemRequest): Observable<PendingItem> {
    return this.post<PendingItem>(this.BASE, req);
  }

  /** POST /api/pending-item/add-manual — thêm thủ công từ Word Collector */
  addManual(content: string): Observable<PendingItem> {
    return this.post<PendingItem>(`${this.BASE}/add-manual`, { content });
  }

  /** GET /api/pending-item?status=pending&page=0&size=50 */
  getAll(params?: PageParams): Observable<PageResponse<PendingItem>> {
    return this.get<PageResponse<PendingItem>>(this.BASE, params);
  }

  /** DELETE /api/pending-item/:id */
  remove(id: string): Observable<void> {
    return this.delete<void>(`${this.BASE}/${id}`);
  }

  /** GET /api/pending-item/generate-prompt — sinh AI prompt từ pending items */
  generatePrompt(): Observable<{ prompt: string }> {
    return this.get<{ prompt: string }>(`${this.BASE}/generate-prompt`);
  }
}
