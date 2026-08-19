import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Chapter, ChapterPage } from '@models/index';

@Injectable({ providedIn: 'root' })
export class ChapterApiService extends ApiBaseService {
  private readonly BASE = '/chapter';

  getChaptersByComicId(
    comicId: string,
    params?: { page?: number; size?: number }
  ): Observable<ChapterPage> {
    return this.get<ChapterPage>(`${this.BASE}/comic/${comicId}`, params);
  }

  getChapterByComicIdAndNumber(params: {
    comicId: string;
    chapterNumber: number;
  }): Observable<Chapter> {
    return this.get<Chapter>(this.BASE, params);
  }

  getChapterById(chapterId: string): Observable<Chapter> {
    return this.get<Chapter>(`${this.BASE}/${chapterId}`);
  }

  createChapter(formData: FormData): Observable<Chapter> {
    return this.postForm<Chapter>(this.BASE, formData);
  }

  updateChapter(chapterId: string, formData: FormData): Observable<Chapter> {
    return this.putForm<Chapter>(`${this.BASE}/${chapterId}`, formData);
  }

  deleteChapter(chapterId: string): Observable<void> {
    return this.delete<void>(`${this.BASE}/${chapterId}`);
  }
}
