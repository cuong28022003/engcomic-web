import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import {
  GrammarPoint,
  MostMissedGrammar,
  BatchImportGrammarResult
} from '../../features/grammar/models/grammar.model';

@Injectable({ providedIn: 'root' })
export class GrammarApiService extends ApiBaseService {
  private readonly BASE = '/grammar';

  /** Lấy danh sách điểm ngữ pháp (có thể lọc theo category hoặc keyword) */
  getGrammarPoints(params?: { category?: string; keyword?: string }): Observable<GrammarPoint[]> {
    return this.get<GrammarPoint[]>(this.BASE, params);
  }

  /** Lấy chi tiết điểm ngữ pháp theo ID */
  getGrammarPointById(id: string): Observable<GrammarPoint> {
    return this.get<GrammarPoint>(`${this.BASE}/${id}`);
  }

  /** Lấy chi tiết điểm ngữ pháp theo Topic name */
  getGrammarPointByTopic(topic: string): Observable<GrammarPoint> {
    return this.get<GrammarPoint>(`${this.BASE}/by-topic`, { topic });
  }

  /** Lấy top điểm ngữ pháp user hay làm sai nhất */
  getMostMissedGrammar(limit = 5): Observable<MostMissedGrammar[]> {
    return this.get<MostMissedGrammar[]>(`${this.BASE}/most-missed`, { limit });
  }

  /** Batch import danh sách điểm ngữ pháp từ JSON AI */
  batchImport(items: Partial<GrammarPoint>[]): Observable<BatchImportGrammarResult> {
    return this.post<BatchImportGrammarResult>(`${this.BASE}/batch-import`, { items });
  }

  /** Tạo mới một điểm ngữ pháp */
  createGrammarPoint(payload: Partial<GrammarPoint>): Observable<GrammarPoint> {
    return this.post<GrammarPoint>(this.BASE, payload);
  }

  /** Cập nhật một điểm ngữ pháp */
  updateGrammarPoint(id: string, payload: Partial<GrammarPoint>): Observable<GrammarPoint> {
    return this.put<GrammarPoint>(`${this.BASE}/${id}`, payload);
  }

  /** Xóa một điểm ngữ pháp */
  deleteGrammarPoint(id: string): Observable<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(`${this.BASE}/${id}`);
  }
}
