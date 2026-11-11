import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, switchMap, catchError, from } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { KeycloakService } from '../services/keycloak.service';

import { environment } from '@env/environment';

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
  // Never attach auth header to 3rd party domains (e.g. dictionaryapi.dev, cloudinary)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (!url.startsWith(environment.apiUrl)) {
      return true;
    }
  }

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
  const keycloak = inject(KeycloakService);

  // Skip auth header for public endpoints
  if (isPublicUrl(req.url)) {
    return next(req);
  }

  // ── Keycloak (OIDC) flow: refresh if needed, then attach token ────────────
  if (keycloak.isAuthenticated) {
    return from(keycloak.refresh(30)).pipe(
      switchMap(() => {
        const token = keycloak.token;
        return next(token ? addToken(req, token) : req).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 401) {
              return from(keycloak.refresh(0)).pipe(
                switchMap(() => {
                  const refreshed = keycloak.token;
                  return refreshed
                    ? next(addToken(req, refreshed))
                    : throwError(() => err);
                }),
                catchError((refreshErr) => throwError(() => refreshErr))
              );
            }
            return throwError(() => err);
          })
        );
      }),
      catchError(() => next(req))
    );
  }

  // ── Classic (self-issued JWT) flow ───────────────────────────────────────
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
