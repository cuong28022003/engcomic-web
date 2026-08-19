import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toast$ = new BehaviorSubject<ToastMessage | null>(null);
  readonly toast$ = this._toast$.asObservable();

  success(message: string, duration = 3000): void {
    this._show({ type: 'success', message, duration });
  }

  error(message: string, duration = 4000): void {
    this._show({ type: 'error', message, duration });
  }

  info(message: string, duration = 3000): void {
    this._show({ type: 'info', message, duration });
  }

  warning(message: string, duration = 3000): void {
    this._show({ type: 'warning', message, duration });
  }

  private _show(toast: ToastMessage): void {
    this._toast$.next(toast);
    setTimeout(() => this._toast$.next(null), toast.duration ?? 3000);
  }
}
