import { Component, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectionCheckboxComponent } from '@shared/components/selection-checkbox/selection-checkbox.component';

export interface SortOption {
  value: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-data-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectionCheckboxComponent],
  templateUrl: './data-filter-bar.component.html',
  styleUrls: ['./data-filter-bar.component.scss']
})
export class DataFilterBarComponent {
  // ── Selection Model & Controls ───────────────────────────────────
  readonly showSelectAll = input<boolean>(false);
  readonly isAllSelected = input<boolean>(false);
  readonly selectedCount = input<number>(0);
  readonly selectAllLabel = input<string>('Chọn tất cả');
  readonly showSelectCountBadge = input<boolean>(true);

  // ── Search Model & Options ───────────────────────────────────────
  readonly searchQuery = model<string>('');
  readonly searchPlaceholder = input<string>('Tìm kiếm...');
  readonly showSearch = input<boolean>(true);
  readonly searchIcon = input<string>('fa-solid fa-magnifying-glass');

  // ── Star / Saved Favorite Filter ─────────────────────────────────
  readonly showStarFilter = input<boolean>(false);
  readonly isStarActive = model<boolean>(false);
  readonly starFilterLabel = input<string>('Đã lưu');
  readonly starFilterCount = input<number | undefined>(undefined);

  // ── Sort Model & Options ─────────────────────────────────────────
  readonly sortBy = model<string>('');
  readonly sortOptions = input<SortOption[]>([]);
  readonly showSort = input<boolean>(true);
  readonly sortPlaceholder = input<string>('Sắp xếp');

  // ── View Mode Model & Options ────────────────────────────────────
  readonly viewMode = model<'grid' | 'list'>('grid');
  readonly showViewMode = input<boolean>(false);

  // ── Stats / Count Summary ────────────────────────────────────────
  readonly totalCount = input<number | undefined>(undefined);
  readonly filteredCount = input<number | undefined>(undefined);
  readonly itemLabel = input<string>('mục');
  readonly showCountSummary = input<boolean>(true);

  // ── Filter Status / Clear ────────────────────────────────────────
  readonly isFilterActive = input<boolean>(false);
  readonly showClearButton = input<boolean>(true);

  // ── Outputs ──────────────────────────────────────────────────────
  readonly searchChange = output<string>();
  readonly starChange = output<boolean>();
  readonly sortChange = output<string>();
  readonly viewModeChange = output<'grid' | 'list'>();
  readonly selectAll = output<void>();
  readonly selectAllChange = output<boolean>();
  readonly clear = output<void>();

  // ── Computed Helpers ─────────────────────────────────────────────
  readonly hasActiveFilters = computed<boolean>(() => {
    return !!this.searchQuery().trim() || this.isFilterActive() || this.isStarActive();
  });

  readonly countSummaryText = computed<string>(() => {
    const total = this.totalCount();
    const filtered = this.filteredCount();
    const label = this.itemLabel();

    if (filtered !== undefined && total !== undefined) {
      if (filtered === total) {
        return `Hiển thị <strong>${total}</strong> ${label}`;
      }
      return `Hiển thị <strong>${filtered}</strong> / ${total} ${label}`;
    }

    if (filtered !== undefined) {
      return `Hiển thị <strong>${filtered}</strong> ${label}`;
    }

    if (total !== undefined) {
      return `Tổng cộng <strong>${total}</strong> ${label}`;
    }

    return '';
  });

  toggleSelectAll(): void {
    const next = !this.isAllSelected();
    this.selectAllChange.emit(next);
    this.selectAll.emit();
  }

  toggleStarFilter(): void {
    const next = !this.isStarActive();
    this.isStarActive.set(next);
    this.starChange.emit(next);
  }

  onSearchInput(val: string): void {
    this.searchQuery.set(val);
    this.searchChange.emit(val);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchChange.emit('');
  }

  onSortChange(val: string): void {
    this.sortBy.set(val);
    this.sortChange.emit(val);
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
    this.viewModeChange.emit(mode);
  }

  onClearAll(): void {
    this.searchQuery.set('');
    this.searchChange.emit('');
    if (this.isStarActive()) {
      this.isStarActive.set(false);
      this.starChange.emit(false);
    }
    this.clear.emit();
  }
}
