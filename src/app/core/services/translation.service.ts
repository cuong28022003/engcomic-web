import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export type LanguageCode = 'vi' | 'en';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);

  readonly availableLanguages: LanguageOption[] = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  // Current active language signal
  private readonly _currentLang = signal<LanguageCode>(this.getInitialLanguage());
  readonly currentLang = this._currentLang.asReadonly();

  // Dictionary dictionary signal: Record<string, string>
  private readonly _translations = signal<Record<string, any>>({});
  readonly translations = this._translations.asReadonly();

  // Loading state
  private readonly _isLoading = signal<boolean>(false);
  readonly isLoading = this._isLoading.asReadonly();

  readonly currentLanguageOption = computed(() =>
    this.availableLanguages.find(l => l.code === this._currentLang()) || this.availableLanguages[0]
  );

  constructor() {
    this.loadTranslations(this._currentLang()).subscribe();
  }

  private getInitialLanguage(): LanguageCode {
    const saved = localStorage.getItem('app_language') as LanguageCode;
    if (saved && (saved === 'vi' || saved === 'en')) {
      return saved;
    }
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('vi') ? 'vi' : 'en';
  }

  setLanguage(lang: LanguageCode): Observable<Record<string, any>> {
    if (this._currentLang() === lang && Object.keys(this._translations()).length > 0) {
      return of(this._translations());
    }
    this._currentLang.set(lang);
    localStorage.setItem('app_language', lang);
    return this.loadTranslations(lang);
  }

  loadTranslations(lang: LanguageCode): Observable<Record<string, any>> {
    this._isLoading.set(true);
    const path = `assets/i18n/${lang}.json`;

    return this.http.get<Record<string, any>>(path).pipe(
      tap((data) => {
        this._translations.set(data || {});
        this._isLoading.set(false);
      }),
      catchError((err) => {
        console.warn(`[TranslationService] Failed to load ${path}:`, err);
        this._isLoading.set(false);
        return of({});
      })
    );
  }

  /**
   * Translate key with optional parameter interpolation
   * e.g., t('vocab.selectedCount', { count: '5' })
   */
  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let result: any = this._translations();

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Fallback to key if not found
      }
    }

    if (typeof result === 'string' && params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramVal]) => str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal)),
        result
      );
    }

    return typeof result === 'string' ? result : key;
  }
}
