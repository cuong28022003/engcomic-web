import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { CurrentUser, UserStats } from '@models/index';

@Injectable({ providedIn: 'root' })
export class UserApiService extends ApiBaseService {
  private readonly BASE = '/user';

  getUserById(userId: string): Observable<CurrentUser> {
    return this.get<CurrentUser>(`${this.BASE}/${userId}`);
  }

  updateUserInfo(userId: string, formData: FormData): Observable<CurrentUser> {
    return this.putForm<CurrentUser>(`${this.BASE}/${userId}`, formData);
  }

  getUserInfo(): Observable<CurrentUser> {
    return this.get<CurrentUser>(`${this.BASE}/info`);
  }

  changePassword(data: {
    oldPassword: string;
    newPassword: string;
  }): Observable<void> {
    return this.put<void>(`${this.BASE}/info/password`, data);
  }
}
