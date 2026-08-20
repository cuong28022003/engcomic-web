import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss']
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
