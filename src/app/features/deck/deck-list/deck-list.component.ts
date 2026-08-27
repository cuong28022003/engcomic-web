import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DeckApiService } from '@core/services/deck-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { Deck } from '@models/index';
import { VocabImportModalComponent } from '@shared/components/vocab-import-modal/vocab-import-modal.component';
import { FormInputComponent } from '@shared/components/form-input/form-input.component';
import { BulkActionsBarComponent, BulkCustomAction } from '@shared/components/bulk-actions-bar/bulk-actions-bar.component';
import { SelectionCheckboxComponent } from '@shared/components/selection-checkbox/selection-checkbox.component';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import { DataFilterBarComponent, SortOption } from '@shared/components/data-filter-bar/data-filter-bar.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

export interface DeckTheme {
  gradient: string;
  border: string;
  icon: string;
  glow: string;
}

@Component({
  selector: 'app-deck-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    VocabImportModalComponent,
    BulkActionsBarComponent,
    SelectionCheckboxComponent,
    PaginatorComponent,
    DataFilterBarComponent,
    PageHeaderComponent,
  ],
  templateUrl: './deck-list.component.html',
  styleUrls: ['./deck-list.component.scss'],
})
export class DeckListComponent implements OnInit {
  private deckApi = inject(DeckApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);

  readonly DECK_THEMES: DeckTheme[] = [
    { gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.22) 100%)', border: 'rgba(99, 102, 241, 0.4)', icon: 'fa-solid fa-graduation-cap', glow: '#6366f1' },
    { gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.22) 100%)', border: 'rgba(6, 182, 212, 0.4)', icon: 'fa-solid fa-book-open-reader', glow: '#06b6d4' },
    { gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(20, 184, 166, 0.22) 100%)', border: 'rgba(16, 185, 129, 0.4)', icon: 'fa-solid fa-seedling', glow: '#10b981' },
    { gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(239, 68, 68, 0.22) 100%)', border: 'rgba(245, 158, 11, 0.4)', icon: 'fa-solid fa-fire-flame-curved', glow: '#f59e0b' },
    { gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.22) 100%)', border: 'rgba(168, 85, 247, 0.4)', icon: 'fa-solid fa-wand-magic-sparkles', glow: '#a855f7' },
    { gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(251, 146, 60, 0.22) 100%)', border: 'rgba(244, 63, 94, 0.4)', icon: 'fa-solid fa-gem', glow: '#f43f5e' },
    { gradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(139, 92, 246, 0.22) 100%)', border: 'rgba(14, 165, 233, 0.4)', icon: 'fa-solid fa-compass', glow: '#0ea5e9' },
    { gradient: 'linear-gradient(135deg, rgba(132, 204, 22, 0.25) 0%, rgba(16, 185, 129, 0.22) 100%)', border: 'rgba(132, 204, 22, 0.4)', icon: 'fa-solid fa-bolt', glow: '#84cc16' }
  ];

  decks = signal<Deck[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');
  sortBy = signal<'newest' | 'name_asc' | 'name_desc' | 'cards_desc' | 'cards_asc'>('newest');
  viewMode = signal<'grid' | 'list'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('deck_view_mode') as 'grid' | 'list') || 'grid'
  );

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('deck_view_mode', mode);
      }
    } catch {}
  }

  readonly deckSortOptions: SortOption[] = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'name_asc', label: 'Tên (A → Z)' },
    { value: 'name_desc', label: 'Tên (Z → A)' },
    { value: 'cards_desc', label: 'Nhiều từ vựng nhất' },
    { value: 'cards_asc', label: 'Ít từ vựng nhất' },
  ];

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);

  // Selection
  selectedDeckIds = signal<Set<string>>(new Set());

  // Modal Create / Edit
  isCreateModalOpen = signal<boolean>(false);
  editingDeck = signal<Deck | null>(null);
  creating = signal<boolean>(false);
  deckNameInput = '';
  deckDescInput = '';

  // Shared Vocab Modal
  isVocabModalOpen = signal<boolean>(false);
  selectedTargetDeck = signal<Deck | null>(null);

  readonly bulkCustomActions: BulkCustomAction[] = [
    {
      id: 'practice',
      label: 'Luyện tập',
      icon: 'fa-solid fa-bolt',
      variant: 'primary'
    }
  ];

  readonly sortedAndFilteredDecks = computed<Deck[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    let list = this.decks();

    if (q) {
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    }

    const sort = this.sortBy();
    return [...list].sort((a, b) => {
      const aCards = a.totalCards || a.stats?.totalCards || 0;
      const bCards = b.totalCards || b.stats?.totalCards || 0;

      switch (sort) {
        case 'name_asc':
          return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
        case 'name_desc':
          return b.name.localeCompare(a.name, 'vi', { sensitivity: 'base' });
        case 'cards_desc':
          return bCards - aCards;
        case 'cards_asc':
          return aCards - bCards;
        case 'newest':
        default:
          return 0; // Default order from API
      }
    });
  });

  readonly totalFilteredDecks = computed<number>(() => this.sortedAndFilteredDecks().length);

  readonly paginatedDecks = computed<Deck[]>(() => {
    const all = this.sortedAndFilteredDecks();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return all.slice(start, start + size);
  });

  readonly totalCardsAcrossDecks = computed<number>(() => {
    return this.decks().reduce((acc, d) => acc + (d.totalCards || d.stats?.totalCards || 0), 0);
  });

  readonly isAllSelected = computed<boolean>(() => {
    const allOnPage = this.paginatedDecks();
    if (allOnPage.length === 0) return false;
    const selected = this.selectedDeckIds();
    return allOnPage.every(d => selected.has(d.id));
  });

  readonly selectedCount = computed<number>(() => this.selectedDeckIds().size);

  ngOnInit(): void {
    this.fetchDecks();
  }

  fetchDecks(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để xem danh sách bộ thẻ');
      this.router.navigate(['/login']);
      return;
    }

    this.loading.set(true);
    this.deckApi.getDecksByUserId(user.userId, { page: 0, size: 500 }).subscribe({
      next: (res) => {
        this.decks.set(res?.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.decks.set([]);
        this.loading.set(false);
      },
    });
  }

  readonly AVAILABLE_ICONS: string[] = [
    'fa-solid fa-graduation-cap',
    'fa-solid fa-book-open-reader',
    'fa-solid fa-seedling',
    'fa-solid fa-fire-flame-curved',
    'fa-solid fa-wand-magic-sparkles',
    'fa-solid fa-gem',
    'fa-solid fa-compass',
    'fa-solid fa-bolt',
    'fa-solid fa-rocket',
    'fa-solid fa-star',
    'fa-solid fa-trophy',
    'fa-solid fa-palette',
    'fa-solid fa-earth-americas',
    'fa-solid fa-briefcase',
    'fa-solid fa-mug-hot',
    'fa-solid fa-lightbulb'
  ];

  selectedIcon = signal<string>('fa-solid fa-graduation-cap');
  selectedGradient = signal<string>('linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.22) 100%)');

  // Custom Image State for Icon & Background
  selectedIconImage = signal<string | null>(null);
  selectedBackgroundImage = signal<string | null>(null);
  iconUrlInput = '';
  bgUrlInput = '';

  isImageUrl(val?: string | null): boolean {
    if (!val) return false;
    return val.startsWith('http://') ||
           val.startsWith('https://') ||
           val.startsWith('data:image/') ||
           val.startsWith('/') ||
           val.startsWith('./');
  }

  getDeckTheme(deck: Deck, index: number): DeckTheme {
    let hash = 0;
    const str = deck.id || deck.name || index.toString();
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % this.DECK_THEMES.length;
    const defaultTheme = this.DECK_THEMES[idx];

    return {
      gradient: deck.background || defaultTheme.gradient,
      border: defaultTheme.border,
      icon: deck.icon || defaultTheme.icon,
      glow: defaultTheme.glow
    };
  }

  getDeckBackgroundStyle(deck: Deck, index: number): string {
    if (deck.background && this.isImageUrl(deck.background)) {
      return `linear-gradient(rgba(18, 22, 38, 0.8), rgba(12, 16, 28, 0.92)), url('${deck.background}') center/cover no-repeat`;
    }
    const theme = this.getDeckTheme(deck, index);
    return theme.gradient;
  }

  getLivePreviewBackground(): string {
    const bgImg = this.selectedBackgroundImage() || this.bgUrlInput.trim();
    if (bgImg && this.isImageUrl(bgImg)) {
      return `linear-gradient(rgba(18, 22, 38, 0.75), rgba(12, 16, 28, 0.9)), url('${bgImg}') center/cover no-repeat`;
    }
    return this.selectedGradient();
  }

  // ─── Image Upload Handlers ───────────────────────────────────

  onIconFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedIconImage.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onBackgroundFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedBackgroundImage.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  clearCustomIcon(): void {
    this.selectedIconImage.set(null);
    this.iconUrlInput = '';
  }

  clearCustomBackground(): void {
    this.selectedBackgroundImage.set(null);
    this.bgUrlInput = '';
  }

  // ─── Selection Management ────────────────────────────────────

  toggleSelectDeck(deckId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedDeckIds.update(set => {
      const next = new Set(set);
      if (next.has(deckId)) {
        next.delete(deckId);
      } else {
        next.add(deckId);
      }
      return next;
    });
  }

  onSelectAll(): void {
    const currentOnPage = this.paginatedDecks();
    if (this.isAllSelected()) {
      // Unselect all on current page
      this.selectedDeckIds.update(set => {
        const next = new Set(set);
        currentOnPage.forEach(d => next.delete(d.id));
        return next;
      });
    } else {
      // Select all on current page
      this.selectedDeckIds.update(set => {
        const next = new Set(set);
        currentOnPage.forEach(d => next.add(d.id));
        return next;
      });
    }
  }

  clearSelection(): void {
    this.selectedDeckIds.set(new Set());
  }

  // ─── Bulk Actions ────────────────────────────────────────────

  onBulkEdit(): void {
    const ids = Array.from(this.selectedDeckIds());
    if (ids.length !== 1) return;
    const deck = this.decks().find(d => d.id === ids[0]);
    if (deck) {
      this.openEditModal(deck);
    }
  }

  onBulkDelete(): void {
    const ids = Array.from(this.selectedDeckIds());
    if (ids.length === 0) return;

    const count = ids.length;
    const msg = count === 1
      ? 'Bạn có chắc chắn muốn xóa bộ thẻ này? Các thẻ từ trong bộ thẻ sẽ chuyển về kho chung (không bị xóa mất).'
      : `Bạn có chắc chắn muốn xóa ${count} bộ thẻ đã chọn? Các thẻ từ sẽ chuyển về kho chung (không bị xóa mất).`;

    this.confirmDialog.confirm({
      title: `Xóa ${count} Bộ Thẻ`,
      message: msg,
      confirmText: 'Xóa ngay',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    }).subscribe((confirmed) => {
      if (confirmed) {
        const deleteObservables = ids.map(id => this.deckApi.deleteDeck(id));
        forkJoin(deleteObservables).subscribe({
          next: () => {
            this.toast.success(`Đã xóa ${count} bộ thẻ thành công!`);
            this.decks.update(list => list.filter(d => !ids.includes(d.id)));
            this.clearSelection();
          },
          error: () => {
            this.toast.error('Có lỗi xảy ra trong quá trình xóa bộ thẻ.');
            this.fetchDecks();
          }
        });
      }
    });
  }

  onBulkCustomAction(actionId: string): void {
    if (actionId === 'practice') {
      const ids = Array.from(this.selectedDeckIds());
      if (ids.length === 0) return;
      // Navigate to practice with primary selected deck
      this.router.navigate(['/vocab/practice'], { queryParams: { deckId: ids[0] } });
    }
  }

  // ─── Create & Edit Modals ────────────────────────────────────

  openCreateModal(): void {
    this.editingDeck.set(null);
    this.deckNameInput = '';
    this.deckDescInput = '';
    this.iconUrlInput = '';
    this.bgUrlInput = '';
    this.selectedIconImage.set(null);
    this.selectedBackgroundImage.set(null);
    this.selectedIcon.set(this.AVAILABLE_ICONS[0]);
    this.selectedGradient.set(this.DECK_THEMES[0].gradient);
    this.isCreateModalOpen.set(true);
  }

  openEditModal(deck: Deck, event?: Event): void {
    if (event) event.stopPropagation();
    this.editingDeck.set(deck);
    this.deckNameInput = deck.name;
    this.deckDescInput = deck.description || '';
    
    // Check if icon is image
    if (deck.icon && this.isImageUrl(deck.icon)) {
      this.selectedIconImage.set(deck.icon);
      this.iconUrlInput = deck.icon;
    } else {
      this.selectedIconImage.set(null);
      this.iconUrlInput = '';
      this.selectedIcon.set(deck.icon || this.AVAILABLE_ICONS[0]);
    }

    // Check if background is image
    if (deck.background && this.isImageUrl(deck.background)) {
      this.selectedBackgroundImage.set(deck.background);
      this.bgUrlInput = deck.background;
    } else {
      this.selectedBackgroundImage.set(null);
      this.bgUrlInput = '';
      const theme = this.getDeckTheme(deck, 0);
      this.selectedGradient.set(deck.background || theme.gradient);
    }

    this.isCreateModalOpen.set(true);
  }

  closeModal(): void {
    if (this.creating()) return;
    this.isCreateModalOpen.set(false);
    this.editingDeck.set(null);
  }

  saveDeck(): void {
    const user = this.auth.currentUser;
    const name = this.deckNameInput.trim();
    if (!user || !name) {
      this.toast.warning('Vui lòng nhập tên bộ thẻ!');
      return;
    }

    this.creating.set(true);
    const existing = this.editingDeck();

    const finalIcon = this.selectedIconImage() || this.iconUrlInput.trim() || this.selectedIcon();
    const finalBackground = this.selectedBackgroundImage() || this.bgUrlInput.trim() || this.selectedGradient();

    if (existing) {
      // Update
      this.deckApi.updateDeck(existing.id, {
        name,
        description: this.deckDescInput.trim(),
        icon: finalIcon,
        background: finalBackground
      }).subscribe({
        next: (updated) => {
          this.creating.set(false);
          this.decks.update(list => list.map(d => d.id === updated.id ? { ...d, ...updated } : d));
          this.closeModal();
          this.toast.success(`Đã cập nhật bộ thẻ "${updated.name}" thành công!`);
        },
        error: (err) => {
          this.creating.set(false);
          this.toast.error(err.error?.detail || err.error?.message || 'Không thể cập nhật bộ thẻ');
        }
      });
    } else {
      // Create
      this.deckApi.createDeck({
        name,
        description: this.deckDescInput.trim(),
        userId: user.userId,
        icon: finalIcon,
        background: finalBackground
      }).subscribe({
        next: (newDeck) => {
          this.creating.set(false);
          this.decks.update(list => [newDeck, ...list]);
          this.closeModal();
          this.toast.success(`Đã tạo bộ thẻ "${newDeck.name}" thành công!`);
        },
        error: (err) => {
          this.creating.set(false);
          this.toast.error(err.error?.detail || err.error?.message || 'Lỗi khi tạo bộ thẻ mới');
        }
      });
    }
  }

  // ─── Single Delete ───────────────────────────────────────────

  confirmDeleteDeck(deck: Deck, event?: Event): void {
    if (event) event.stopPropagation();
    this.confirmDialog.confirm({
      title: `Xóa Bộ Thẻ "${deck.name}"`,
      message: 'Bạn có chắc chắn muốn xóa bộ thẻ này? Các thẻ từ trong bộ thẻ sẽ chuyển về kho chung (không bị xóa mất).',
      confirmText: 'Xóa ngay',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.deckApi.deleteDeck(deck.id).subscribe({
          next: () => {
            this.decks.update(list => list.filter(d => d.id !== deck.id));
            this.selectedDeckIds.update(set => {
              const next = new Set(set);
              next.delete(deck.id);
              return next;
            });
            this.toast.success(`Đã xóa bộ thẻ "${deck.name}"`);
          },
          error: () => {
            this.toast.error('Không thể xóa bộ thẻ');
          }
        });
      }
    });
  }

  // ─── Navigation & Actions ────────────────────────────────────

  openVocabModal(deck?: Deck, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedTargetDeck.set(deck || null);
    this.isVocabModalOpen.set(true);
  }

  onVocabAdded(): void {
    this.fetchDecks();
  }

  startPractice(deck: Deck, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/vocab/practice'], { queryParams: { deckId: deck.id } });
  }

  goToDeck(deckId: string): void {
    this.router.navigate(['/deck', deckId]);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }
}
