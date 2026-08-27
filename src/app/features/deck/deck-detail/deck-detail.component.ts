import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DeckApiService } from '@core/services/deck-api.service';
import { CardApiService } from '@core/services/card-api.service';
import { PronunciationService } from '@core/services/pronunciation.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { Deck, Card, PracticePromptResponse } from '@models/index';
import { VocabImportModalComponent } from '@shared/components/vocab-import-modal/vocab-import-modal.component';
import { ExerciseImportModalComponent } from '@shared/components/exercise-import-modal/exercise-import-modal.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { SelectionCheckboxComponent } from '@shared/components/selection-checkbox/selection-checkbox.component';
import { BulkActionsBarComponent } from '@shared/components/bulk-actions-bar/bulk-actions-bar.component';
import { VocabCardComponent } from '@shared/components/vocab-card/vocab-card.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';
import { FormInputComponent } from '@shared/components/form-input/form-input.component';
import { DataFilterBarComponent } from '@shared/components/data-filter-bar/data-filter-bar.component';

@Component({
  selector: 'app-deck-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    VocabImportModalComponent,
    ExerciseImportModalComponent,
    BulkActionsBarComponent,
    VocabCardComponent,
    BreadcrumbComponent,
    FormInputComponent,
    DataFilterBarComponent,
  ],
  templateUrl: './deck-detail.component.html',
  styleUrls: ['./deck-detail.component.scss'],
})
export class DeckDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deckApi = inject(DeckApiService);
  private cardApi = inject(CardApiService);
  private toast = inject(ToastService);
  private pronunciationService = inject(PronunciationService);
  private confirmDialog = inject(ConfirmDialogService);

  deckId = signal<string>('');
  deck = signal<Deck | null>(null);
  allDecks = signal<Deck[]>([]);
  cards = signal<Card[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');
  filterTab = signal<'all' | 'ready' | 'pending' | 'l1' | 'l2' | 'l3' | 'l4'>('all');
  viewMode = signal<'grid' | 'list'>((localStorage.getItem('deck_detail_view_mode') as 'grid' | 'list') || 'grid');
  notFound = signal<boolean>(false);

  // Selection state for Bulk Actions
  selectedCardIds = signal<Set<string>>(new Set());

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Bộ Thẻ', url: '/deck', icon: 'fa-solid fa-layer-group' },
    { label: this.deck()?.name || 'Chi Tiết Bộ Thẻ' }
  ]);

  // Shared Modals
  isVocabModalOpen = signal<boolean>(false);
  isExerciseModalOpen = signal<boolean>(false);
  promptData = signal<PracticePromptResponse | null>(null);

  // Edit Deck Modal
  isEditDeckModalOpen = signal<boolean>(false);
  editDeckName = '';
  editDeckDesc = '';
  isSavingDeck = signal<boolean>(false);

  // Edit / Create Card Modal
  isEditCardModalOpen = signal<boolean>(false);
  editingCard = signal<Card | null>(null);

  // Pending vs Ready statistics
  pendingCards = computed<Card[]>(() => {
    return this.cards().filter(c => !c.exercisePackage);
  });

  readyCards = computed<Card[]>(() => {
    return this.cards().filter(c => !!c.exercisePackage);
  });

  // Level breakdown statistics
  levelStats = computed(() => {
    const list = this.cards();
    let l1 = 0, l2 = 0, l3 = 0, l4 = 0;
    for (const c of list) {
      const lvl = c.masteryLevel || 1;
      if (lvl === 1) l1++;
      else if (lvl === 2) l2++;
      else if (lvl === 3) l3++;
      else if (lvl >= 4) l4++;
    }
    return { l1, l2, l3, l4, total: list.length };
  });

  // Filtered cards by search query & filter tab
  filteredCards = computed<Card[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const tab = this.filterTab();
    let list = this.cards();

    if (tab === 'ready') {
      list = list.filter(c => !!c.exercisePackage);
    } else if (tab === 'pending') {
      list = list.filter(c => !c.exercisePackage);
    } else if (tab === 'l1') {
      list = list.filter(c => (c.masteryLevel || 1) === 1);
    } else if (tab === 'l2') {
      list = list.filter(c => (c.masteryLevel || 1) === 2);
    } else if (tab === 'l3') {
      list = list.filter(c => (c.masteryLevel || 1) === 3);
    } else if (tab === 'l4') {
      list = list.filter(c => (c.masteryLevel || 1) >= 4);
    }

    if (!q) return list;
    return list.filter(c =>
      (c.word && c.word.toLowerCase().includes(q)) ||
      (c.meaning && c.meaning.toLowerCase().includes(q)) ||
      (c.ipa && c.ipa.toLowerCase().includes(q))
    );
  });

  selectedCount = computed(() => this.selectedCardIds().size);

  isAllSelected = computed(() => {
    const list = this.filteredCards();
    if (list.length === 0) return false;
    const set = this.selectedCardIds();
    return list.every(c => set.has(c.id));
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['deckId'] || params['id'];
      if (id) {
        this.deckId.set(id);
        this.loadDeckData();
      } else {
        this.loading.set(false);
        this.notFound.set(true);
      }
    });
  }

  loadDeckData(): void {
    const id = this.deckId();
    if (!id) return;

    this.loading.set(true);
    this.notFound.set(false);

    this.deckApi.getDeckById(id).subscribe({
      next: (d) => {
        if (!d) {
          this.notFound.set(true);
          this.loading.set(false);
          return;
        }
        this.deck.set(d);
        this.editDeckName = d.name;
        this.editDeckDesc = d.description || '';
        this.loadCards();
      },
      error: () => {
        this.notFound.set(true);
        this.toast.error('Không tìm thấy thông tin bộ thẻ');
        this.loading.set(false);
      }
    });
  }

  loadCards(): void {
    const id = this.deckId();
    this.cardApi.getCardsByDeckId(id, { page: 0, size: 200 }).subscribe({
      next: (res) => {
        this.cards.set(res?.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.cards.set([]);
        this.loading.set(false);
      }
    });
  }

  setFilterTab(tab: 'all' | 'ready' | 'pending' | 'l1' | 'l2' | 'l3' | 'l4'): void {
    this.filterTab.set(tab);
    this.clearSelection();
  }

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
    try {
      localStorage.setItem('deck_detail_view_mode', mode);
    } catch {
      // ignore
    }
  }

  // ─── Selection & Bulk Actions ───────────────────────────────────

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedCardIds.set(new Set());
    } else {
      const allIds = new Set(this.filteredCards().map(c => c.id));
      this.selectedCardIds.set(allIds);
    }
  }

  toggleSelectCard(cardId: string): void {
    const current = new Set(this.selectedCardIds());
    if (current.has(cardId)) {
      current.delete(cardId);
    } else {
      current.add(cardId);
    }
    this.selectedCardIds.set(current);
  }

  isCardSelected(cardId: string): boolean {
    return this.selectedCardIds().has(cardId);
  }

  clearSelection(): void {
    this.selectedCardIds.set(new Set());
  }

  editSelectedCard(): void {
    const ids = Array.from(this.selectedCardIds());
    if (ids.length !== 1) return;
    const card = this.cards().find(c => c.id === ids[0]);
    if (card) {
      this.openEditCardModal(card);
    }
  }

  deleteSelectedCards(): void {
    const ids = Array.from(this.selectedCardIds());
    if (ids.length === 0) return;

    const count = ids.length;
    const msg = count === 1
      ? `Bạn có chắc chắn muốn xóa từ vựng đã chọn khỏi bộ thẻ? Hành động này không thể hoàn tác.`
      : `Bạn có chắc chắn muốn xóa toàn bộ ${count} từ vựng đã chọn khỏi bộ thẻ? Hành động này không thể hoàn tác.`;

    this.confirmDialog.confirm({
      title: `Xóa ${count} Từ Vựng`,
      message: msg,
      confirmText: 'Xóa ngay',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    }).subscribe((confirmed) => {
      if (confirmed) {
        const deleteObservables = ids.map(id => this.cardApi.deleteCard(id));
        forkJoin(deleteObservables).subscribe({
          next: () => {
            this.toast.success(`Đã xóa thành công ${count} từ vựng!`);
            this.clearSelection();
            this.loadCards();
          },
          error: () => {
            this.toast.error('Có lỗi xảy ra trong quá trình xóa dữ liệu.');
            this.loadCards();
          }
        });
      }
    });
  }

  // ─── Modals ───────────────────────────────────────────────────

  openVocabModal(): void {
    this.editingCard.set(null);
    this.isVocabModalOpen.set(true);
  }

  closeVocabModal(): void {
    this.isVocabModalOpen.set(false);
    this.editingCard.set(null);
  }

  openExerciseModal(): void {
    const id = this.deckId();
    this.cardApi.getPracticePrompt(id).subscribe({
      next: (data) => {
        this.promptData.set(data);
        this.isExerciseModalOpen.set(true);
      },
      error: () => {
        this.toast.error('Không thể trích xuất AI Prompt cho bộ thẻ này');
      }
    });
  }

  onVocabAdded(): void {
    this.loadCards();
    this.clearSelection();
  }

  onExerciseImportSuccess(): void {
    this.loadCards();
  }

  startPractice(): void {
    const id = this.deckId();
    this.router.navigate(['/vocab/practice'], { queryParams: { deckId: id } });
  }

  // ─── Edit Deck ────────────────────────────────────────────────

  openEditDeckModal(): void {
    const d = this.deck();
    if (!d) return;
    this.editDeckName = d.name;
    this.editDeckDesc = d.description || '';
    this.isEditDeckModalOpen.set(true);
  }

  saveDeck(): void {
    const id = this.deckId();
    if (!id || !this.editDeckName.trim()) return;

    this.isSavingDeck.set(true);
    this.deckApi
      .updateDeck(id, {
        name: this.editDeckName.trim(),
        description: this.editDeckDesc.trim(),
      })
      .subscribe({
        next: (updated) => {
          this.isSavingDeck.set(false);
          this.deck.set(updated);
          this.isEditDeckModalOpen.set(false);
          this.toast.success('Đã cập nhật bộ thẻ thành công!');
        },
        error: () => {
          this.isSavingDeck.set(false);
          this.toast.error('Lỗi khi cập nhật thông tin bộ thẻ');
        },
      });
  }

  openEditCardModal(card: Card, event?: Event): void {
    if (event) event.stopPropagation();
    this.editingCard.set(card);
    this.isVocabModalOpen.set(true);
  }

  openCreateCardModal(): void {
    this.openVocabModal();
  }

  onCardSaved(savedCard: Card): void {
    this.loadCards();
    this.clearSelection();
  }

  goToWordDetail(card: Card): void {
    this.router.navigate(['/vocab/word', card.id]);
  }

  playAudio(card: Card, event?: Event): void {
    if (event) event.stopPropagation();
    const word = card.word || card.front;
    if (word) {
      this.pronunciationService.speak(word, 'us');
    }
  }

  toggleFavorite(card: Card, event: MouseEvent): void {
    event.stopPropagation();
    const newFav = !(card.favorite || card.isFavorite);
    this.cardApi.updateCard(card.id, { favorite: newFav } as Partial<Card>).subscribe({
      next: (updated: Card) => {
        this.cards.update(list => list.map(c => c.id === card.id ? { ...c, favorite: updated.favorite ?? newFav, isFavorite: updated.isFavorite ?? newFav } : c));
      },
      error: () => {
        this.toast.error('Không thể cập nhật yêu thích');
      }
    });
  }
}
