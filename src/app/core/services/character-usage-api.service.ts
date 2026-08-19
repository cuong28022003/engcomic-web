import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class CharacterUsageApiService extends ApiBaseService {
  private readonly BASE = '/character-usage';

  checkCanUseSkill(payload: {
    characterId: string;
    skillId: string;
  }): Observable<{ canUse: boolean }> {
    return this.post<{ canUse: boolean }>(`${this.BASE}/can-use`, payload);
  }

  markSkillUsed(payload: {
    characterId: string;
    skillId: string;
  }): Observable<void> {
    return this.post<void>(`${this.BASE}/use`, payload);
  }

  checkAndUseSkill(payload: {
    characterId: string;
    skillId: string;
  }): Observable<{ success: boolean }> {
    return this.post<{ success: boolean }>(`${this.BASE}/use-skill`, payload);
  }
}
