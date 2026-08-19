import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { SavedComic } from '@models/index';

@Injectable({ providedIn: 'root' })
export class SavedApiService extends ApiBaseService {
  private readonly BASE = '/saved';

  saveComic(data: { comicId: string; userId: string }): Observable<SavedComic> {
    return this.post<SavedComic>(this.BASE, data);
  }

  deleteSaved(savedId: string): Observable<void> {
    return this.delete<void>(`${this.BASE}/${savedId}`);
  }

  checkSavedComic(params: {
    comicId: string;
    userId: string;
  }): Observable<{ saved: boolean; savedId?: string }> {
    return this.get<{ saved: boolean; savedId?: string }>(
      `${this.BASE}/check`,
      params
    );
  }

  getSavedComicsByUser(userId: string): Observable<SavedComic[]> {
    return this.get<SavedComic[]>(`${this.BASE}/user/${userId}`);
  }
}
