import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeckApiService } from '@core/services/deck-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Deck } from '@models/index';
import { VocabImportModalComponent } from '@shared/components/vocab-import-modal/vocab-import-modal.component';
import { FormInputComponent } from '@shared/components/form-input/form-input.component';
@Component({
  selector: 'app-deck-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    VocabImportModalComponent,
    FormInputComponent,
  ],
  templateUrl: './deck-list.component.html',
  styleUrls: ['./deck-list.component.scss'],
})
export class DeckListComponent implements OnInit {
  decks = signal<Deck[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');
  isCreateModalOpen = signal<boolean>(false);
  creating = signal<boolean>(false);

  newDeckName = '';
  newDeckDesc = '';

  // Delete modal confirmation
  deckToDelete = signal<Deck | null>(null);
  isDeleting = signal<boolean>(false);

  // Shared Vocab Modal
  isVocabModalOpen = signal<boolean>(false);
  selectedTargetDeck = signal<Deck | null>(null);

  filteredDecks = computed<Deck[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.decks();
    if (!q) return list;
    return list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  totalCardsAcrossDecks = computed<number>(() => {
    return this.decks().reduce((acc, d) => acc + (d.totalCards || d.stats?.totalCards || 0), 0);
  });

  constructor(
    private deckApi: DeckApiService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

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
    this.deckApi.getDecksByUserId(user.userId).subscribe({
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

  openCreateModal(): void {
    this.newDeckName = '';
    this.newDeckDesc = '';
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (this.creating()) return;
    this.isCreateModalOpen.set(false);
  }

  createDeck(): void {
    const user = this.auth.currentUser;
    if (!user || !this.newDeckName.trim()) return;

    this.creating.set(true);
    this.deckApi
      .createDeck({
        name: this.newDeckName.trim(),
        description: this.newDeckDesc.trim(),
        userId: user.userId,
      })
      .subscribe({
        next: (newDeck) => {
          this.creating.set(false);
          this.decks.update(list => [newDeck, ...list]);
          this.isCreateModalOpen.set(false);
          this.toast.success(`Đã tạo bộ thẻ "${newDeck.name}" thành công!`);
        },
        error: (err) => {
          this.creating.set(false);
          this.toast.error(err.error?.detail || err.error?.message || 'Lỗi khi tạo bộ thẻ mới');
        },
      });
  }

  openVocabModal(deck?: Deck): void {
    this.selectedTargetDeck.set(deck || null);
    this.isVocabModalOpen.set(true);
  }

  onVocabAdded(): void {
    this.fetchDecks();
  }

  confirmDeleteDeck(deck: Deck, event?: Event): void {
    if (event) event.stopPropagation();
    this.deckToDelete.set(deck);
  }

  cancelDelete(): void {
    this.deckToDelete.set(null);
  }

  executeDelete(): void {
    const deck = this.deckToDelete();
    if (!deck) return;

    this.isDeleting.set(true);
    this.deckApi.deleteDeck(deck.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.decks.update(list => list.filter(d => d.id !== deck.id));
        this.deckToDelete.set(null);
        this.toast.success(`Đã xóa bộ thẻ "${deck.name}"`);
      },
      error: () => {
        this.isDeleting.set(false);
        this.toast.error('Không thể xóa bộ thẻ');
      },
    });
  }

  startPractice(deck: Deck, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/vocab/practice'], { queryParams: { deckId: deck.id } });
  }

  goToDeck(deckId: string): void {
    this.router.navigate(['/deck', deckId]);
  }
}
