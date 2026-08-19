import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Reading, PageResponse, PageParams } from '@models/index';

@Injectable({ providedIn: 'root' })
export class ReadingApiService extends ApiBaseService {
  private readonly BASE = '/reading';

  setReading(data: Omit<Reading, 'id' | 'readAt'>): Observable<Reading> {
    return this.post<Reading>(this.BASE, data);
  }

  getReadingByUserAndComic(params: {
    userId: string;
    comicId: string;
  }): Observable<Reading> {
    return this.get<Reading>(this.BASE, params);
  }

  getReadingsByUser(
    userId: string,
    params?: PageParams
  ): Observable<PageResponse<Reading>> {
    return this.get<PageResponse<Reading>>(
      `${this.BASE}/user/${userId}`,
      params
    );
  }
}
