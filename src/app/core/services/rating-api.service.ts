import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Rating, RatingSummary } from '@models/index';

@Injectable({ providedIn: 'root' })
export class RatingApiService extends ApiBaseService {
  private readonly BASE = '/ratings';

  getRatingsByComicId(comicId: string): Observable<Rating[]> {
    return this.get<Rating[]>(`${this.BASE}/comic/${comicId}`);
  }

  getSummaryRating(comicId: string): Observable<RatingSummary> {
    return this.get<RatingSummary>(`${this.BASE}/summary/${comicId}`);
  }

  submitRating(data: Rating): Observable<Rating> {
    return this.post<Rating>(this.BASE, data);
  }

  rateComic(comicUrl: string, rating: number): Observable<void> {
    return this.post<void>(`/comics/${comicUrl}/rate`, { rating });
  }

  getComicRating(comicUrl: string): Observable<RatingSummary> {
    return this.post<RatingSummary>(`/comics/${comicUrl}/rating`);
  }

  deleteComicRating(comicUrl: string): Observable<void> {
    return this.delete<void>(`/comics/${comicUrl}/rating`);
  }
}
