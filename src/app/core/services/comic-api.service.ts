import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Comic, ComicPage, ComicParams } from '@models/index';

@Injectable({ providedIn: 'root' })
export class ComicApiService extends ApiBaseService {
  private readonly BASE = '/comics';

  getComicById(comicId: string): Observable<Comic> {
    return this.get<Comic>(`${this.BASE}/${comicId}`);
  }

  getComics(params?: ComicParams): Observable<ComicPage> {
    return this.get<ComicPage>(this.BASE, params as Record<string, string | number | boolean | undefined>);
  }

  searchComics(params: ComicParams): Observable<ComicPage> {
    return this.get<ComicPage>(`${this.BASE}/search`, params as Record<string, string | number | boolean | undefined>);
  }

  getComicsByUploaderId(userId: string): Observable<Comic[]> {
    return this.get<Comic[]>(`${this.BASE}/uploader/${userId}`);
  }

  getComicsAdmin(params?: ComicParams): Observable<ComicPage> {
    return this.get<ComicPage>(`${this.BASE}/admin`, params as Record<string, string | number | boolean | undefined>);
  }

  createComic(formData: FormData): Observable<Comic> {
    return this.postForm<Comic>(this.BASE, formData);
  }

  updateComic(comicId: string, formData: FormData): Observable<Comic> {
    return this.putForm<Comic>(`${this.BASE}/${comicId}`, formData);
  }

  deleteComic(comicId: string): Observable<void> {
    return this.delete<void>(`${this.BASE}/${comicId}`);
  }

  incrementViews(comicId: string): Observable<void> {
    return this.patch<void>(`${this.BASE}/${comicId}/view`);
  }

  updateComicStatus(comicId: string, status: string): Observable<void> {
    return this.put<void>(`/comic/${comicId}/status`, { status });
  }
}
