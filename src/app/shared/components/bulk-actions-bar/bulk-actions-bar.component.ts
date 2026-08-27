import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BulkCustomAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'secondary';
  disabled?: boolean;
}

@Component({
  selector: 'app-bulk-actions-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-actions-bar.component.html',
  styleUrls: ['./bulk-actions-bar.component.scss']
})
export class BulkActionsBarComponent {
  /** Số lượng item đang được chọn */
  readonly selectedCount = input<number>(0);

  /** Tổng số item trong danh sách (dùng cho nút Chọn tất cả) */
  readonly totalCount = input<number>(0);

  /** Tên hiển thị của item (ví dụ: 'điểm ngữ pháp', 'từ vựng', 'bộ thẻ'...) */
  readonly itemLabel = input<string>('mục');

  /** Hiển thị nút Chỉnh sửa khi chỉ chọn đúng 1 item */
  readonly showEdit = input<boolean>(true);

  /** Hiển thị nút Xóa */
  readonly showDelete = input<boolean>(true);

  /** Hiển thị nút Chọn tất cả / Bỏ chọn tất cả */
  readonly showSelectAll = input<boolean>(true);

  /** Trạng thái hiện tại đã chọn tất cả chưa */
  readonly isAllSelected = input<boolean>(false);

  /** Danh sách các action tùy biến bổ sung */
  readonly customActions = input<BulkCustomAction[]>([]);

  // ── Outputs ────────────────────────────────────────────────────────
  readonly selectAll = output<void>();
  readonly clearSelection = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();
  readonly customActionClick = output<string>();

  readonly hasSelection = computed(() => this.selectedCount() > 0);
  readonly canEdit = computed(() => this.showEdit() && this.selectedCount() === 1);

  onSelectAll(): void {
    this.selectAll.emit();
  }

  onClearSelection(): void {
    this.clearSelection.emit();
  }

  onEdit(): void {
    if (this.canEdit()) {
      this.edit.emit();
    }
  }

  onDelete(): void {
    if (this.selectedCount() > 0) {
      this.delete.emit();
    }
  }

  onCustomAction(actionId: string): void {
    this.customActionClick.emit(actionId);
  }
}
