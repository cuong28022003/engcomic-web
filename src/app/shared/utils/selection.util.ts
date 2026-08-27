import { signal, computed, Signal, WritableSignal } from '@angular/core';

export interface SelectionManager<T> {
  /** Signal chứa Set các ID đã chọn */
  readonly selectedIds: WritableSignal<Set<string>>;
  /** Số lượng item đang được chọn */
  readonly selectedCount: Signal<number>;
  /** Danh sách các đối tượng T đang được chọn */
  readonly selectedItems: Signal<T[]>;
  /** Đã chọn tất cả item trong danh sách nguồn chưa */
  readonly isAllSelected: Signal<boolean>;
  /** Có ít nhất 1 item được chọn hay không */
  readonly hasSelection: Signal<boolean>;
  /** Chỉ chọn đúng 1 item (thích hợp cho tính năng sửa đơn lẻ) */
  readonly isSingleSelected: Signal<boolean>;
  /** Đối tượng duy nhất được chọn khi isSingleSelected === true */
  readonly singleSelectedItem: Signal<T | undefined>;

  /** Kiểm tra xem item có đang được chọn hay không */
  isSelected: (id?: string) => boolean;
  /** Bật/tắt trạng thái chọn của item (có hỗ trợ stopPropagation) */
  toggle: (id?: string, event?: MouseEvent) => void;
  /** Chọn 1 item cụ thể */
  select: (id?: string) => void;
  /** Bỏ chọn 1 item cụ thể */
  deselect: (id?: string) => void;
  /** Chọn tất cả item trong danh sách nguồn */
  selectAll: () => void;
  /** Bỏ chọn toàn bộ */
  clear: () => void;
  /** Đặt danh sách ID đã chọn */
  setSelected: (ids: string[]) => void;
}

/**
 * Tạo một Composable Selection Manager chuẩn Angular 21 Signal.
 * @param itemsSignal Signal danh sách các item (ví dụ: filteredCards, filteredPoints...)
 * @param idSelector Hàm trích xuất ID từ item (mặc định lấy item.id)
 */
export function createSelectionManager<T>(
  itemsSignal: Signal<T[]>,
  idSelector: (item: T) => string | undefined = (item: any) => item?.id
): SelectionManager<T> {
  const selectedIds = signal<Set<string>>(new Set<string>());

  const selectedCount = computed(() => selectedIds().size);
  const hasSelection = computed(() => selectedIds().size > 0);
  const isSingleSelected = computed(() => selectedIds().size === 1);

  const isAllSelected = computed(() => {
    const items = itemsSignal();
    if (!items || items.length === 0) return false;
    const ids = selectedIds();
    return items.every(item => {
      const id = idSelector(item);
      return id && ids.has(id);
    });
  });

  const selectedItems = computed(() => {
    const ids = selectedIds();
    if (ids.size === 0) return [];
    return (itemsSignal() || []).filter(item => {
      const id = idSelector(item);
      return id && ids.has(id);
    });
  });

  const singleSelectedItem = computed(() => {
    const items = selectedItems();
    return items.length === 1 ? items[0] : undefined;
  });

  const isSelected = (id?: string): boolean => {
    return !!id && selectedIds().has(id);
  };

  const toggle = (id?: string, event?: MouseEvent): void => {
    if (event) event.stopPropagation();
    if (!id) return;
    selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const select = (id?: string): void => {
    if (!id) return;
    selectedIds.update(set => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
  };

  const deselect = (id?: string): void => {
    if (!id) return;
    selectedIds.update(set => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  };

  const selectAll = (): void => {
    const allIds = (itemsSignal() || [])
      .map(idSelector)
      .filter((id): id is string => !!id);
    selectedIds.set(new Set(allIds));
  };

  const clear = (): void => {
    selectedIds.set(new Set<string>());
  };

  const setSelected = (ids: string[]): void => {
    selectedIds.set(new Set<string>(ids));
  };

  return {
    selectedIds,
    selectedCount,
    selectedItems,
    isAllSelected,
    hasSelection,
    isSingleSelected,
    singleSelectedItem,
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    clear,
    setSelected
  };
}
