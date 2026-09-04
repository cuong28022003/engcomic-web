import { Component, input, output, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, Router, Params } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
  queryParams?: Params;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  private location = inject(Location);
  private router = inject(Router);

  /** Danh sách các mục trong breadcrumb */
  readonly items = input<BreadcrumbItem[]>([]);

  /** Đường dẫn quay lại nhanh (hiển thị nút back arrow) */
  readonly backUrl = input<string | undefined>(undefined);

  /** Label tùy chọn cạnh nút back arrow */
  readonly backLabel = input<string | undefined>(undefined);

  /** Sử dụng lịch sử trình duyệt để quay lại trang trước đó */
  readonly useHistoryBack = input<boolean>(false);

  /** Tùy chọn hiển thị icon Home ở đầu */
  readonly showHome = input<boolean>(false);

  /** Tùy chọn separator: 'slash' | 'chevron' | 'arrow' */
  readonly separator = input<'slash' | 'chevron' | 'arrow'>('chevron');

  /** Custom click handler cho nút Back */
  readonly backClick = output<void>();

  onBack(): void {
    this.backClick.emit();
    if (this.useHistoryBack()) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        this.location.back();
      } else if (this.backUrl()) {
        this.router.navigateByUrl(this.backUrl()!);
      } else {
        this.router.navigate(['/']);
      }
    } else if (this.backUrl()) {
      this.router.navigateByUrl(this.backUrl()!);
    }
  }
}
