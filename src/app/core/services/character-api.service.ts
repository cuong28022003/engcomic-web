import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { GachaCharacter, UserCharacter } from '@models/index';

@Injectable({ providedIn: 'root' })
export class CharacterApiService extends ApiBaseService {
  private readonly BASE = '/characters';

  getAllCharactersByUserId(userId: string): Observable<UserCharacter[]> {
    return this.get<UserCharacter[]>(`${this.BASE}/users/${userId}/all`);
  }

  getCharactersByUserId(
    userId: string,
    params?: { page?: number; size?: number }
  ): Observable<UserCharacter[]> {
    return this.get<UserCharacter[]>(`${this.BASE}/users/${userId}`, params);
  }

  getCharactersByVersion(versionId: string): Observable<GachaCharacter[]> {
    return this.get<GachaCharacter[]>(`${this.BASE}/version/${versionId}`);
  }

  getCharacterById(characterId: string): Observable<GachaCharacter> {
    return this.get<GachaCharacter>(`${this.BASE}/${characterId}`);
  }

  getRandomEnemies(count = 1): Observable<GachaCharacter[]> {
    return this.get<GachaCharacter[]>(`${this.BASE}/random-enemies`, {
      count,
    });
  }
}
