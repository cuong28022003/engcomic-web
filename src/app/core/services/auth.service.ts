import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { environment } from '@env/environment';
import { StorageService } from './storage.service';
import {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from '@models/index';
import { FULL_ROUTE } from '@shared/constants/route';

const STORAGE_KEY = 'eng_comic_user';

interface JwtPayload {
  exp: number;
  sub: string;
  roles?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

  /** Observable of the current logged-in user */
  readonly currentUser$ = this._currentUser$.asObservable();

  /** Firebase storage instance */
  readonly firebaseStorage;

  private readonly BASE = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService
  ) {
    // Restore from localStorage on app init
    const saved = this.storage.getItem<CurrentUser>(STORAGE_KEY);
    if (saved) {
      this._currentUser$.next(saved);
    }

    // Initialize Firebase
    const app = initializeApp(environment.firebaseConfig);
    this.firebaseStorage = getStorage(app);
  }

  // ===================== Getters =====================

  get currentUser(): CurrentUser | null {
    return this._currentUser$.getValue();
  }

  get accessToken(): string | null {
    return this.currentUser?.accessToken ?? null;
  }

  isLoggedIn(): boolean {
    const user = this.currentUser;
    if (!user?.accessToken) return false;
    try {
      const decoded = jwtDecode<JwtPayload>(user.accessToken);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles?.includes(role) ?? false;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // ===================== Auth Actions =====================

  login(credentials: LoginRequest): Observable<CurrentUser> {
    return this.http
      .post<any>(`${this.BASE}/login`, credentials)
      .pipe(
        map((res) => {
          const raw = res?.data || res;
          const user: CurrentUser = {
            userId: raw.id || raw.userId,
            username: raw.username,
            email: raw.email,
            roles: raw.roles || [],
            accessToken: raw.accessToken,
            refreshToken: raw.refreshToken,
            avatarUrl: raw.avatarUrl || raw.imageUrl,
          };
          return user;
        }),
        tap((user) => this._persistUser(user)),
        catchError((err) =>
          throwError(
            () =>
              err?.error?.details?.[0] ||
              err?.error?.message ||
              'Đăng nhập thất bại'
          )
        )
      );
  }

  register(data: RegisterRequest): Observable<unknown> {
    return this.http
      .post(`${this.BASE}/register`, data)
      .pipe(
        catchError((err) =>
          throwError(
            () =>
              err?.error?.details?.[0] ||
              err?.error?.message ||
              'Đăng ký thất bại'
          )
        )
      );
  }

  logout(): void {
    this._currentUser$.next(null);
    this.storage.removeItem(STORAGE_KEY);
    this.router.navigate([FULL_ROUTE.login]);
  }

  refreshToken(): Observable<string> {
    const user = this.currentUser;
    if (!user) return throwError(() => 'No user');

    return this.http
      .post<{ accessToken: string }>(`${this.BASE}/refreshtoken`, {
        refreshToken: user.refreshToken,
      })
      .pipe(
        map((res) => res.accessToken),
        tap((newToken) => {
          const updated: CurrentUser = { ...user, accessToken: newToken };
          this._persistUser(updated);
        }),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  verifyToken(): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.BASE}/verifytoken`)
      .pipe(catchError(() => throwError(() => false)));
  }

  forgetPassword(email: string): Observable<unknown> {
    return this.http.post(`${this.BASE}/forgetpassword`, { email });
  }

  reActive(email: string): Observable<unknown> {
    return this.http.post(`${this.BASE}/reactive`, { email });
  }

  activeAccount(token: string): Observable<unknown> {
    return this.http.get(`${this.BASE}/active`, { params: { token } });
  }

  checkUsername(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.BASE}/checkusername`, {
      params: { username },
    });
  }

  checkEmail(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.BASE}/checkemail`, {
      params: { email },
    });
  }

  /** Update user partial data (e.g. after profile edit or token refresh) */
  updateUser(partial: Partial<CurrentUser>): void {
    const user = this.currentUser;
    if (!user) return;
    const updated: CurrentUser = { ...user, ...partial };
    this._persistUser(updated);
  }

  // ===================== Token check (for interceptor use) =====================

  isTokenExpired(): boolean {
    const token = this.accessToken;
    if (!token) return true;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  // ===================== Private =====================

  private _persistUser(user: AuthResponse | CurrentUser): void {
    const currentUser: CurrentUser = {
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      userId: user.userId,
      username: user.username,
      email: user.email,
      roles: user.roles,
      avatarUrl: (user as CurrentUser).avatarUrl,
    };
    this._currentUser$.next(currentUser);
    this.storage.setItem(STORAGE_KEY, currentUser);
  }
}
