import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-paginator" *ngIf="totalPages > 1">
      <!-- First page -->
      <button
        class="page-btn nav-btn"
        (click)="goToPage(0)"
        [disabled]="currentPage === 0"
        title="Trang đầu"
      >
        <i class="fa-solid fa-angles-left"></i>
      </button>

      <!-- Previous page -->
      <button
        class="page-btn nav-btn"
        (click)="goToPage(currentPage - 1)"
        [disabled]="currentPage === 0"
        title="Trang trước"
      >
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <!-- Page Numbers -->
      <div class="page-numbers">
        <ng-container *ngFor="let page of visiblePages">
          <button
            *ngIf="page !== -1; else dotsTpl"
            class="page-btn num-btn"
            [class.active]="page === currentPage"
            (click)="goToPage(page)"
          >
            {{ page + 1 }}
          </button>
          <ng-template #dotsTpl>
            <span class="dots">...</span>
          </ng-template>
        </ng-container>
      </div>

      <!-- Next page -->
      <button
        class="page-btn nav-btn"
        (click)="goToPage(currentPage + 1)"
        [disabled]="currentPage >= totalPages - 1"
        title="Trang tiếp"
      >
        <i class="fa-solid fa-chevron-right"></i>
      </button>

      <!-- Last page -->
      <button
        class="page-btn nav-btn"
        (click)="goToPage(totalPages - 1)"
        [disabled]="currentPage >= totalPages - 1"
        title="Trang cuối"
      >
        <i class="fa-solid fa-angles-right"></i>
      </button>
    </div>
  `,
  styles: [`
    .app-paginator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 24px;
      user-select: none;
    }

    .page-numbers {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .page-btn {
      min-width: 36px;
      height: 36px;
      padding: 0 10px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        border-color: var(--primary-color);
        color: #fff;
        background: var(--bg-card-hover);
        transform: translateY(-1px);
      }

      &.active {
        background: var(--primary-gradient);
        border-color: var(--primary-color);
        color: #fff;
        box-shadow: 0 2px 10px rgba(255, 51, 119, 0.4);
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    }

    .dots {
      color: var(--text-dim);
      font-weight: bold;
      padding: 0 4px;
    }
  `]
})
export class PaginatorComponent {
  @Input() currentPage = 0;
  @Input() totalPages = 0;
  @Input() maxVisible = 5;

  @Output() pageChange = new EventEmitter<number>();

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const pages: number[] = [];
    pages.push(0);

    let start = Math.max(1, current - 1);
    let end = Math.min(total - 2, current + 1);

    if (current <= 2) {
      end = 3;
    }
    if (current >= total - 3) {
      start = total - 4;
    }

    if (start > 1) pages.push(-1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < total - 2) pages.push(-1);

    pages.push(total - 1);
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
