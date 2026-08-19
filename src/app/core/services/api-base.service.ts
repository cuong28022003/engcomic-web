import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiBaseService {
  readonly baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  protected get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${path}`, {
        params: this.buildParams(params),
      })
      .pipe(catchError(this.handleError));
  }

  protected post<T>(path: string, body?: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${path}`, body)
      .pipe(catchError(this.handleError));
  }

  protected postForm<T>(path: string, formData: FormData): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${path}`, formData)
      .pipe(catchError(this.handleError));
  }

  protected put<T>(path: string, body?: unknown): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${path}`, body)
      .pipe(catchError(this.handleError));
  }

  protected putForm<T>(path: string, formData: FormData): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${path}`, formData)
      .pipe(catchError(this.handleError));
  }

  protected patch<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Observable<T> {
    return this.http
      .patch<T>(`${this.baseUrl}${path}`, body, {
        params: this.buildParams(params),
      })
      .pipe(catchError(this.handleError));
  }

  protected delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${path}`)
      .pipe(catchError(this.handleError));
  }

  protected deleteWithBody<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${path}`, { body })
      .pipe(catchError(this.handleError));
  }

  private buildParams(
    params?: Record<string, string | number | boolean | undefined>
  ): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }

  private handleError(error: unknown) {
    const err = error as {
      error?: { message?: string; details?: { message?: string } };
      status?: number;
      message?: string;
    };
    const message =
      err?.error?.details?.message ||
      err?.error?.message ||
      err?.message ||
      'Có lỗi xảy ra';
    console.error('API Error:', error);
    return throwError(() => ({ message, raw: error }));
  }
}
