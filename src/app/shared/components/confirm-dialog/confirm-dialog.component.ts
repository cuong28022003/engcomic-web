import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-dialog-backdrop" *ngIf="dialogService.isOpen()" (click)="onCancel()">
      <div class="confirm-dialog-card glass-panel" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <div class="dialog-icon-wrap" [class]="dialogService.options().type">
            <i [class]="dialogService.options().icon"></i>
          </div>
          <h3 class="dialog-title">{{ dialogService.options().title }}</h3>
        </div>

        <div class="dialog-body">
          <p class="dialog-message">{{ dialogService.options().message }}</p>
        </div>

        <div class="dialog-actions">
          <button class="btn-secondary" (click)="onCancel()">
            {{ dialogService.options().cancelText }}
          </button>
          <button
            class="btn-primary"
            [class.btn-danger]="dialogService.options().type === 'danger'"
            (click)="onConfirm()"
          >
            {{ dialogService.options().confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      padding: 20px;
      animation: fadeIn 0.15s ease-out;
    }

    .confirm-dialog-card {
      width: 100%;
      max-width: 440px;
      padding: 28px;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 14px;
    }

    .dialog-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;

      &.danger {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #ef4444;
      }

      &.warning {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid rgba(245, 158, 11, 0.35);
        color: #f59e0b;
      }

      &.info {
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.35);
        color: #a5b4fc;
      }
    }

    .dialog-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
    }

    .dialog-body {
      margin-bottom: 24px;
    }

    .dialog-message {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .dialog-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;

      button {
        min-width: 100px;
      }

      .btn-danger {
        background: #ef4444 !important;
        border-color: #ef4444 !important;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4) !important;

        &:hover {
          background: #dc2626 !important;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(public dialogService: ConfirmDialogService) {}

  onConfirm(): void {
    this.dialogService.handleConfirm();
  }

  onCancel(): void {
    this.dialogService.handleCancel();
  }
}
