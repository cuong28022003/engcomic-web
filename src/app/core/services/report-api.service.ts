import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Report, PageResponse, PageParams } from '@models/index';

@Injectable({ providedIn: 'root' })
export class ReportApiService extends ApiBaseService {
  private readonly BASE = '/report';

  createReport(data: Pick<Report, 'comicId' | 'reason'>): Observable<Report> {
    return this.post<Report>(this.BASE, data);
  }

  getAllReports(params?: PageParams): Observable<PageResponse<Report>> {
    return this.get<PageResponse<Report>>(`${this.BASE}/all`, params);
  }

  getReportsByComic(comicId: string): Observable<Report[]> {
    return this.get<Report[]>(`${this.BASE}/comic/${comicId}`);
  }

  getReportsByStatus(status: string): Observable<Report[]> {
    return this.get<Report[]>(`${this.BASE}/status`, { status });
  }

  getReportSummary(comicId: string): Observable<unknown> {
    return this.get<unknown>(`${this.BASE}/summary/${comicId}`);
  }

  updateReportStatus(reportId: string, status: string): Observable<void> {
    return this.put<void>(`${this.BASE}/${reportId}/status?status=${status}`, null);
  }
}
