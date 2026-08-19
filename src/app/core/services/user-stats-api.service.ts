import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { UserStats, LeaderboardEntry, Rank } from '@models/index';

@Injectable({ providedIn: 'root' })
export class UserStatsApiService extends ApiBaseService {
  private readonly BASE = '/user-stats';

  getUserStats(userId: string): Observable<UserStats> {
    return this.get<UserStats>(`${this.BASE}/${userId}`);
  }

  addXp(payload: { userId: string; xp: number }): Observable<UserStats> {
    return this.post<UserStats>(`${this.BASE}/add-xp`, payload);
  }

  addDiamond(payload: {
    userId: string;
    amount: number;
  }): Observable<UserStats> {
    return this.post<UserStats>(`${this.BASE}/add-diamond`, payload);
  }

  upgradePremium(payload: {
    userId: string;
    days?: number;
  }): Observable<UserStats> {
    return this.post<UserStats>(`${this.BASE}/upgrade-premium`, payload);
  }

  getLeaderboard(params?: {
    page?: number;
    size?: number;
  }): Observable<LeaderboardEntry[]> {
    return this.get<LeaderboardEntry[]>(`${this.BASE}/top-users`, params);
  }
}
