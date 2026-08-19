import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { CurrentUser, Comic, PageResponse, PageParams } from '@models/index';
import { Comment } from '@models/index';

@Injectable({ providedIn: 'root' })
export class AdminApiService extends ApiBaseService {
  // ===== Comments =====

  createComment(params: { url: string; content: string }): Observable<Comment> {
    return this.post<Comment>('/comment', params);
  }

  getCommentsByUrl(url: string): Observable<Comment[]> {
    return this.get<Comment[]>(`/comment/${url}`);
  }

  deleteComment(commentId: string): Observable<void> {
    return this.delete<void>(`/comment/${commentId}`);
  }

  // ===== Admin Users =====

  getAllUsers(params?: PageParams): Observable<PageResponse<CurrentUser>> {
    return this.get<PageResponse<CurrentUser>>('/admin/users', params);
  }

  activeUserByAdmin(data: { userId: string }): Observable<void> {
    return this.put<void>('/admin/user/active', data);
  }

  inactiveUserByAdmin(data: { userId: string }): Observable<void> {
    return this.put<void>('/admin/user/inactive', data);
  }

  updateRole(data: { userId: string; role: string }): Observable<void> {
    return this.put<void>('/admin/role/updatetouser', data);
  }

  deleteAccount(userId: string): Observable<void> {
    return this.deleteWithBody<void>('/admin/deleteuser', { username: userId });
  }

  // ===== Admin Comics =====

  getAllComicsAdmin(params?: PageParams): Observable<PageResponse<Comic>> {
    return this.get<PageResponse<Comic>>('/admin/comics', params);
  }

  updateComicStatus(comicId: string, status: string): Observable<void> {
    return this.put<void>(`/comic/${comicId}/status`, { status });
  }
}
