import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '../../../core/services/api-base.service';
import {
  TestSummary,
  TestDetail,
  CreateTestPayload,
  SubmitSessionPayload,
  SubmitSessionResponse,
  MistakeItem,
  CreateMistakeBatchPayload,
  UpdateMistakePayload,
  ToeicDashboardData
} from '../models';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReaderApiService extends ApiBaseService {
  private readonly TEST_BASE = '/toeic/tests';
  private readonly MISTAKE_BASE = '/toeic/mistakes';

  getDashboard(): Observable<ToeicDashboardData> {
    return this.get<ToeicDashboardData>(`${this.TEST_BASE}/dashboard`);
  }

  getTests(page: number = 0, size: number = 20): Observable<PageResponse<TestSummary>> {
    return this.get<PageResponse<TestSummary>>(this.TEST_BASE, { page, size });
  }

  getTestDetail(id: string): Observable<TestDetail> {
    return this.get<TestDetail>(`${this.TEST_BASE}/${id}`);
  }

  createTestJson(payload: CreateTestPayload): Observable<TestSummary> {
    return this.post<TestSummary>(this.TEST_BASE, payload);
  }

  createTestMultipart(payload: CreateTestPayload, pdfFile?: File): Observable<TestSummary> {
    if (!pdfFile) {
      return this.createTestJson(payload);
    }
    const formData = new FormData();
    formData.append('requestData', JSON.stringify(payload));
    formData.append('pdfFile', pdfFile);
    return this.postForm<TestSummary>(this.TEST_BASE, formData);
  }

  submitSession(testId: string, payload: SubmitSessionPayload): Observable<SubmitSessionResponse> {
    return this.post<SubmitSessionResponse>(`${this.TEST_BASE}/${testId}/submit`, payload);
  }

  getMistakes(status?: string, page: number = 0, size: number = 1000): Observable<PageResponse<MistakeItem>> {
    return this.get<PageResponse<MistakeItem>>(this.MISTAKE_BASE, { status, page, size });
  }

  createMistakesBatch(payload: CreateMistakeBatchPayload): Observable<MistakeItem[]> {
    return this.post<MistakeItem[]>(`${this.MISTAKE_BASE}/batch`, payload);
  }

  updateMistake(id: string, payload: UpdateMistakePayload): Observable<MistakeItem> {
    return this.patch<MistakeItem>(`${this.MISTAKE_BASE}/${id}`, payload);
  }

  startAttempt(testId: string, payload?: { timeMode?: string; selectedParts?: number[]; part5TargetSeconds?: number; part6TargetSeconds?: number; part7TargetSeconds?: number }): Observable<import('../models').ToeicAttempt> {
    return this.post<import('../models').ToeicAttempt>(`${this.TEST_BASE}/${testId}/attempts`, payload || {});
  }

  getAttemptsForTest(testId: string): Observable<import('../models').ToeicAttempt[]> {
    return this.get<import('../models').ToeicAttempt[]>(`${this.TEST_BASE}/${testId}/attempts`);
  }

  getActiveAttempt(testId?: string): Observable<import('../models').ToeicAttempt | null> {
    return this.get<import('../models').ToeicAttempt | null>('/toeic/attempts/active', testId ? { testId } : undefined);
  }

  getAttemptDetail(attemptId: string): Observable<import('../models').ToeicAttempt> {
    return this.get<import('../models').ToeicAttempt>(`/toeic/attempts/${attemptId}`);
  }

  saveAttemptProgress(attemptId: string, payload: import('../models').SaveProgressPayload): Observable<import('../models').ToeicAttempt> {
    return this.patch<import('../models').ToeicAttempt>(`/toeic/attempts/${attemptId}/progress`, payload);
  }

  abandonAttempt(attemptId: string): Observable<import('../models').ToeicAttempt> {
    return this.post<import('../models').ToeicAttempt>(`/toeic/attempts/${attemptId}/abandon`, {});
  }

  submitAttempt(attemptId: string, payload: SubmitSessionPayload): Observable<SubmitSessionResponse> {
    return this.post<SubmitSessionResponse>(`/toeic/attempts/${attemptId}/submit`, payload);
  }

  importAttemptReviews(attemptId: string, payload: import('../models').ImportReviewItemsPayload): Observable<import('../models').ToeicReviewItem[]> {
    return this.post<import('../models').ToeicReviewItem[]>(`/toeic/attempts/${attemptId}/reviews/import`, payload);
  }

  importMistakeReviews(payload: import('../models').ImportReviewItemsPayload): Observable<import('../models').MistakeItem[]> {
    return this.post<import('../models').MistakeItem[]>(`${this.MISTAKE_BASE}/import-reviews`, payload);
  }

  getAttemptReviews(attemptId: string): Observable<import('../models').ToeicReviewItem[]> {
    return this.get<import('../models').ToeicReviewItem[]>(`/toeic/attempts/${attemptId}/reviews`);
  }

  deleteMistake(id: string): Observable<void> {
    return this.delete<void>(`${this.MISTAKE_BASE}/${id}`);
  }
}