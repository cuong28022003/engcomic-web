import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  isOpen = signal<boolean>(false);
  options = signal<ConfirmDialogOptions>({ message: '' });

  private resultSubject = new Subject<boolean>();

  confirm(options: ConfirmDialogOptions): Observable<boolean> {
    this.options.set({
      title: options.title || 'Xác nhận',
      message: options.message,
      confirmText: options.confirmText || 'Đồng ý',
      cancelText: options.cancelText || 'Hủy bỏ',
      type: options.type || 'info',
      icon: options.icon || (options.type === 'danger' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-question'),
    });
    this.isOpen.set(true);

    this.resultSubject = new Subject<boolean>();
    return this.resultSubject.asObservable();
  }

  handleConfirm(): void {
    this.isOpen.set(false);
    this.resultSubject.next(true);
    this.resultSubject.complete();
  }

  handleCancel(): void {
    this.isOpen.set(false);
    this.resultSubject.next(false);
    this.resultSubject.complete();
  }
}
