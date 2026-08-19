import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Rank } from '@models/index';

@Injectable({ providedIn: 'root' })
export class RankApiService extends ApiBaseService {
  private readonly BASE = '/rank';

  getAllRanks(): Observable<Rank[]> {
    return this.get<Rank[]>(this.BASE);
  }

  getRankById(id: string): Observable<Rank> {
    return this.get<Rank>(`${this.BASE}/${id}`);
  }

  getRankByXp(xp: number): Observable<Rank> {
    return this.get<Rank>(`${this.BASE}/${xp}`);
  }

  createRank(formData: FormData): Observable<Rank> {
    return this.postForm<Rank>(this.BASE, formData);
  }

  updateRank(id: string, formData: FormData): Observable<Rank> {
    return this.putForm<Rank>(`${this.BASE}/${id}`, formData);
  }

  deleteRank(id: string): Observable<void> {
    return this.delete<void>(`${this.BASE}/${id}`);
  }
}
