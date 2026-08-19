import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '@core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toastService.toast$ | async; as toast) {
      <div class="toast-wrapper" [ngClass]="'toast-' + toast.type">
        <div class="toast-icon">
          @switch (toast.type) {
            @case ('success') { <i class="fa-solid fa-circle-check"></i> }
            @case ('error') { <i class="fa-solid fa-circle-exclamation"></i> }
            @case ('warning') { <i class="fa-solid fa-triangle-exclamation"></i> }
            @case ('info') { <i class="fa-solid fa-circle-info"></i> }
          }
        </div>
        <div class="toast-msg">{{ toast.message }}</div>
      </div>
    }
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      color: #fff;
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 9999;
      animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-icon { font-size: 1.15rem; }

    .toast-success {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.15);
      backdrop-filter: blur(12px);
      .toast-icon { color: var(--success-color); }
    }

    .toast-error {
      border-color: rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.15);
      backdrop-filter: blur(12px);
      .toast-icon { color: var(--danger-color); }
    }

    .toast-warning {
      border-color: rgba(245, 158, 11, 0.4);
      background: rgba(245, 158, 11, 0.15);
      backdrop-filter: blur(12px);
      .toast-icon { color: var(--warning-color); }
    }

    .toast-info {
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(99, 102, 241, 0.15);
      backdrop-filter: blur(12px);
      .toast-icon { color: var(--secondary-color); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
