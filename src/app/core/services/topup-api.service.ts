import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { TopupRequest, PageResponse, PageParams } from '@models/index';

@Injectable({ providedIn: 'root' })
export class TopupApiService extends ApiBaseService {
  private readonly BASE = '/topup';

  getTopupHistory(params?: PageParams): Observable<PageResponse<TopupRequest>> {
    return this.get<PageResponse<TopupRequest>>(`${this.BASE}/history`, params);
  }

  createTopupRequest(
    data: Pick<TopupRequest, 'amount'>
  ): Observable<TopupRequest> {
    return this.post<TopupRequest>(this.BASE, data);
  }

  cancelTopupRequest(requestId: string): Observable<void> {
    return this.post<void>(`${this.BASE}/${requestId}/cancel`);
  }

  getTopupRequests(params?: PageParams): Observable<PageResponse<TopupRequest>> {
    return this.get<PageResponse<TopupRequest>>(this.BASE, params);
  }

  confirmTopupRequest(requestId: string): Observable<void> {
    return this.post<void>(`${this.BASE}/${requestId}/confirm`);
  }
}
