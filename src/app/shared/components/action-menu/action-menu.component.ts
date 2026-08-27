import {
  Component,
  input,
  output,
  computed,
  signal,
  ElementRef,
  HostListener,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ActionVariant =
  | 'default'
  | 'primary'
  | 'edit'
  | 'danger'
  | 'warning'
  | 'success'
  | 'info'
  | 'secondary';

export type ActionDisplayMode = 'buttons' | 'dropdown' | 'compact';
export type ActionButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ActionItem<T = string> {
  id: T;
  label: string;
  icon?: string;
  variant?: ActionVariant;
  disabled?: boolean;
  tooltip?: string;
  showLabel?: boolean;
  dividerAfter?: boolean;
}

@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-menu.component.html',
  styleUrls: ['./action-menu.component.scss']
})
export class ActionMenuComponent {
  private elementRef = inject(ElementRef);

  /** Danh sách các action tùy biến */
  readonly actions = input<ActionItem[]>([]);

  /** Chế độ hiển thị: 'buttons' (hàng nút), 'dropdown' (menu 3 chấm), 'compact' (nút siêu gọn) */
  readonly mode = input<ActionDisplayMode>('buttons');

  /** Kích cỡ nút: 'xs' | 'sm' | 'md' | 'lg' */
  readonly size = input<ActionButtonSize>('sm');

  /** Trạng thái disabled toàn bộ menu */
  readonly disabled = input<boolean>(false);

  /** Hiện nhãn chữ kèm icon khi ở chế độ 'buttons' */
  readonly showLabels = input<boolean>(false);

  /** Hướng dropdown menu bung ra: 'right' | 'left' */
  readonly dropdownAlign = input<'right' | 'left'>('right');

  // ── Quick Action Shortcuts ─────────────────────────────────────────
  /** Bật nhanh nút Sửa (edit) */
  readonly showEdit = input<boolean>(false);
  readonly editLabel = input<string>('Chỉnh sửa');
  readonly editDisabled = input<boolean>(false);

  /** Bật nhanh nút Xóa (delete) */
  readonly showDelete = input<boolean>(false);
  readonly deleteLabel = input<string>('Xóa');
  readonly deleteDisabled = input<boolean>(false);

  /** Bật nhanh nút Xem (view) */
  readonly showView = input<boolean>(false);
  readonly viewLabel = input<string>('Xem chi tiết');
  readonly viewDisabled = input<boolean>(false);

  /** Bật nhanh nút Sao chép (copy) */
  readonly showCopy = input<boolean>(false);
  readonly copyLabel = input<string>('Sao chép');
  readonly copyDisabled = input<boolean>(false);

  // ── Outputs ────────────────────────────────────────────────────────
  /** Bắn ra khi bất kỳ action nào được click: { id, event } */
  readonly actionClick = output<{ id: string; event: MouseEvent }>();

  /** Shortcut output cho nút edit */
  readonly edit = output<MouseEvent>();

  /** Shortcut output cho nút delete */
  readonly delete = output<MouseEvent>();

  /** Shortcut output cho nút view */
  readonly view = output<MouseEvent>();

  /** Shortcut output cho nút copy */
  readonly copy = output<MouseEvent>();

  // ── State ──────────────────────────────────────────────────────────
  readonly isDropdownOpen = signal<boolean>(false);

  /** Tổng hợp toàn bộ danh sách action kết hợp giữa quick shortcuts và custom actions */
  readonly allActions = computed<ActionItem[]>(() => {
    const list: ActionItem[] = [];

    if (this.showView()) {
      list.push({
        id: 'view',
        label: this.viewLabel(),
        icon: 'fa-solid fa-eye',
        variant: 'info',
        disabled: this.viewDisabled(),
        tooltip: this.viewLabel()
      });
    }

    if (this.showEdit()) {
      list.push({
        id: 'edit',
        label: this.editLabel(),
        icon: 'fa-solid fa-pen-to-square',
        variant: 'edit',
        disabled: this.editDisabled(),
        tooltip: this.editLabel()
      });
    }

    if (this.showCopy()) {
      list.push({
        id: 'copy',
        label: this.copyLabel(),
        icon: 'fa-solid fa-copy',
        variant: 'secondary',
        disabled: this.copyDisabled(),
        tooltip: this.copyLabel()
      });
    }

    // Gộp thêm các custom actions do component cha truyền vào
    const customList = this.actions();
    if (customList && customList.length > 0) {
      list.push(...customList);
    }

    if (this.showDelete()) {
      list.push({
        id: 'delete',
        label: this.deleteLabel(),
        icon: 'fa-solid fa-trash',
        variant: 'danger',
        disabled: this.deleteDisabled(),
        tooltip: this.deleteLabel()
      });
    }

    return list;
  });

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.isDropdownOpen.update(v => !v);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  onItemClick(item: ActionItem, event: MouseEvent): void {
    event.stopPropagation();
    if (item.disabled || this.disabled()) return;

    this.closeDropdown();

    // Trigger general output
    this.actionClick.emit({ id: item.id, event });

    // Trigger specific convenience outputs
    if (item.id === 'edit') this.edit.emit(event);
    else if (item.id === 'delete') this.delete.emit(event);
    else if (item.id === 'view') this.view.emit(event);
    else if (item.id === 'copy') this.copy.emit(event);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isDropdownOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isDropdownOpen()) {
      this.closeDropdown();
    }
  }
}
