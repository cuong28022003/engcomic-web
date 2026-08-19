import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// URLs that do NOT need auth token
const PUBLIC_URLS = [
  '/auth/login',
  '/auth/register',
  '/auth/refreshtoken',
  '/auth/active',
  '/auth/forgetpassword',
  '/auth/reactive',
  '/auth/checkusername',
  '/auth/checkemail',
  '/comics',
  '/comment',
  '/rating',
  '/rank',
  '/user-stats/top-users',
];

function isPublicUrl(url: string): boolean {
  return PUBLIC_URLS.some(
    (pub) =>
      url.includes(pub) &&
      !url.includes('/admin') &&
      !url.includes('/create') &&
      !url.includes('/update') &&
      !url.includes('/delete')
  );
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Skip auth header for public endpoints
  if (isPublicUrl(req.url)) {
    return next(req);
  }

  const token = authService.accessToken;

  // If no token at all, just pass through
  if (!token) {
    return next(req);
  }

  // If token is expired → refresh first
  if (authService.isTokenExpired()) {
    return authService.refreshToken().pipe(
      switchMap((newToken) => {
        const cloned = addToken(req, newToken);
        return next(cloned);
      }),
      catchError((err) => {
        authService.logout();
        return throwError(() => err);
      })
    );
  }

  // Token still valid — attach and go
  return next(addToken(req, token)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // Token rejected by server — try refresh once
        return authService.refreshToken().pipe(
          switchMap((newToken) => next(addToken(req, newToken))),
          catchError((refreshErr) => {
            authService.logout();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};

function addToken(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}
