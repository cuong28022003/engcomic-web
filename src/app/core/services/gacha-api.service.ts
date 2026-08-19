import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { GachaCharacter, UserCharacter } from '@models/index';

@Injectable({ providedIn: 'root' })
export class GachaApiService extends ApiBaseService {
  private readonly BASE = '/gacha';

  rollGacha(count: number): Observable<UserCharacter[]> {
    return this.post<UserCharacter[]>(`${this.BASE}/roll`, null);
  }
}
