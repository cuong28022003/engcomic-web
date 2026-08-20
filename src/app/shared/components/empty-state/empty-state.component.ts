import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-empty-state glass-panel">
      <div class="icon-wrap" *ngIf="icon">
        <i [class]="icon"></i>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-description" *ngIf="description">{{ description }}</p>
      <div class="empty-action" *ngIf="actionText">
        <button class="btn-primary" (click)="actionClick.emit()">
          <i [class]="actionIcon" *ngIf="actionIcon"></i>
          {{ actionText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .app-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 24px;
      margin: 16px 0;
      border-radius: var(--radius-xl);
    }

    .icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255, 51, 119, 0.1);
      border: 1px solid rgba(255, 51, 119, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;

      i {
        font-size: 1.8rem;
        color: var(--primary-color);
      }
    }

    .empty-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
    }

    .empty-description {
      font-size: 0.9rem;
      color: var(--text-muted);
      max-width: 380px;
      margin-bottom: 18px;
      line-height: 1.5;
    }

    .empty-action {
      margin-top: 4px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'fa-regular fa-folder-open';
  @Input() title = 'Không có dữ liệu';
  @Input() description = '';
  @Input() actionText = '';
  @Input() actionIcon = '';

  @Output() actionClick = new EventEmitter<void>();
}
