import { Component, computed, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss']
})
export class PaginatorComponent {
  /** Trang hiện tại (1-indexed) */
  readonly currentPage = model<number>(1);

  /** Tổng số bản ghi / items */
  readonly totalItems = input<number>(0);

  /** Số bản ghi trên mỗi trang */
  readonly pageSize = model<number>(10);

  /** Danh sách tùy chọn số bản ghi mỗi trang */
  readonly pageSizeOptions = input<number[]>([5, 10, 20, 50]);

  /** Hiển thị dropdown đổi pageSize */
  readonly showPageSize = input<boolean>(true);

  /** Hiển thị ô nhảy tới trang */
  readonly showJumpToPage = input<boolean>(true);

  /** Hiển thị thông tin tổng số bản ghi */
  readonly showTotalInfo = input<boolean>(true);

  /** Số nút phân trang hiển thị tối đa */
  readonly range = input<number>(3);

  /** Sự kiện khi trang thay đổi */
  readonly pageChange = output<number>();

  /** Sự kiện khi pageSize thay đổi */
  readonly pageSizeChange = output<number>();

  /** Tính tổng số trang */
  readonly totalPages = computed<number>(() => {
    const total = this.totalItems();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
  });

  /** Vị trí bắt đầu của bản ghi hiện tại */
  readonly startItem = computed<number>(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  /** Vị trí kết thúc của bản ghi hiện tại */
  readonly endItem = computed<number>(() => {
    return Math.min(this.totalItems(), this.currentPage() * this.pageSize());
  });

  /** Danh sách các số trang hiển thị dạng trượt thông minh */
  readonly visiblePages = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const r = this.range();

    if (total <= r + 2) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(1, current - Math.floor(r / 2));
    let end = start + r - 1;

    if (end > total) {
      end = total;
      start = Math.max(1, end - r + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page < 1 || page > total || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.pageChange.emit(page);
  }

  onPageSizeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = Number(target.value);
    this.pageSize.set(newSize);
    this.currentPage.set(1);
    this.pageSizeChange.emit(newSize);
    this.pageChange.emit(1);
  }

  onJumpToPage(event: Event): void {
    const target = event.target as HTMLInputElement;
    let val = Number(target.value);
    const total = this.totalPages();

    if (isNaN(val) || val < 1) val = 1;
    if (val > total) val = total;

    target.value = String(val);
    this.goToPage(val);
  }
}