import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Deck, PageResponse, PageParams } from '@models/index';

@Injectable({ providedIn: 'root' })
export class DeckApiService extends ApiBaseService {
  private readonly BASE = '/deck';

  getDecksByUserId(
    userId: string,
    params?: PageParams
  ): Observable<PageResponse<Deck>> {
    return this.get<PageResponse<Deck>>(`${this.BASE}/user/${userId}`, params);
  }

  getDeckById(id: string): Observable<Deck> {
    return this.get<Deck>(`${this.BASE}/${id}`);
  }

  createDeck(data: Partial<Deck>): Observable<Deck> {
    return this.post<Deck>(this.BASE, data);
  }

  updateDeck(id: string, data: Partial<Deck>): Observable<Deck> {
    return this.put<Deck>(`${this.BASE}/${id}`, data);
  }

  deleteDeck(id: string): Observable<void> {
    return this.delete<void>(`${this.BASE}/${id}`);
  }
}
