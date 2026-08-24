import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Params } from '@angular/router';

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
  /** Danh sách các mục trong breadcrumb */
  items = input<BreadcrumbItem[]>([]);

  /** Đường dẫn quay lại nhanh (hiển thị nút back arrow) */
  backUrl = input<string | undefined>(undefined);

  /** Label tùy chọn cạnh nút back arrow */
  backLabel = input<string | undefined>(undefined);

  /** Tùy chọn hiển thị icon Home ở đầu */
  showHome = input<boolean>(false);

  /** Tùy chọn separator: 'slash' | 'chevron' | 'arrow' */
  separator = input<'slash' | 'chevron' | 'arrow'>('chevron');
}
