import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeckApiService } from '@core/services/deck-api.service';
import { CardApiService } from '@core/services/card-api.service';
import { PronunciationService } from '@core/services/pronunciation.service';
import { ToastService } from '@core/services/toast.service';
import { Deck, Card, PracticePromptResponse } from '@models/index';
import { VocabImportModalComponent } from '@shared/components/vocab-import-modal/vocab-import-modal.component';
import { ExerciseImportModalComponent } from '@shared/components/exercise-import-modal/exercise-import-modal.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { FormInputComponent } from '@shared/components/form-input/form-input.component';
import { FormSelectComponent, FormSelectOption } from '@shared/components/form-select/form-select.component';
import { BreadcrumbComponent, BreadcrumbItem } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-deck-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    VocabImportModalComponent,
    ExerciseImportModalComponent,
    StatusBadgeComponent,
    FormInputComponent,
    FormSelectComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './deck-detail.component.html',
  styleUrls: ['./deck-detail.component.scss'],
})
export class DeckDetailComponent implements OnInit {
  deckId = signal<string>('');
  deck = signal<Deck | null>(null);
  cards = signal<Card[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');
  filterTab = signal<'all' | 'ready' | 'pending' | 'l1' | 'l2' | 'l3' | 'l4'>('all');
  notFound = signal<boolean>(false);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Bộ Thẻ', url: '/deck', icon: 'fa-solid fa-layer-group' },
    { label: this.deck()?.name || 'Chi Tiết Bộ Thẻ' }
  ]);

  readonly posOptions: FormSelectOption[] = [
    { label: 'Danh từ (noun)', value: 'noun' },
    { label: 'Động từ (verb)', value: 'verb' },
    { label: 'Tính từ (adjective)', value: 'adjective' },
    { label: 'Trạng từ (adverb)', value: 'adverb' },
    { label: 'Cụm từ (phrase)', value: 'phrase' },
  ];

  // Shared Modals
  isVocabModalOpen = signal<boolean>(false);
  isExerciseModalOpen = signal<boolean>(false);
  promptData = signal<PracticePromptResponse | null>(null);

  // Edit Deck Modal
  isEditDeckModalOpen = signal<boolean>(false);
  editDeckName = '';
  editDeckDesc = '';
  isSavingDeck = signal<boolean>(false);

  // Edit Card Modal
  isEditCardModalOpen = signal<boolean>(false);
  editingCard = signal<Card | null>(null);
  editCardWord = '';
  editCardMeaning = '';
  editCardIpa = '';
  editCardPos = 'noun';
  isSavingCard = signal<boolean>(false);

  // Delete Card Modal
  cardToDelete = signal<Card | null>(null);
  isDeletingCard = signal<boolean>(false);

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deckApi: DeckApiService,
    private cardApi: CardApiService,
    private toast: ToastService,
    private pronunciationService: PronunciationService
  ) {}

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
  }

  openVocabModal(): void {
    this.isVocabModalOpen.set(true);
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
  }

  onExerciseImportSuccess(): void {
    this.loadCards();
  }

  startPractice(): void {
    const id = this.deckId();
    this.router.navigate(['/vocab/practice'], { queryParams: { deckId: id } });
  }

  // Edit Deck
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

  // Edit Card
  openEditCardModal(card: Card, event: Event): void {
    event.stopPropagation();
    this.editingCard.set(card);
    this.editCardWord = card.word;
    this.editCardMeaning = card.meaning;
    this.editCardIpa = card.ipa || '';
    this.editCardPos = card.partOfSpeech || 'noun';
    this.isEditCardModalOpen.set(true);
  }

  saveEditCard(): void {
    const card = this.editingCard();
    if (!card || !this.editCardWord.trim() || !this.editCardMeaning.trim()) return;

    this.isSavingCard.set(true);
    this.cardApi
      .updateCard(card.id, {
        word: this.editCardWord.trim(),
        meaning: this.editCardMeaning.trim(),
        ipa: this.editCardIpa.trim() || undefined,
        partOfSpeech: this.editCardPos,
      })
      .subscribe({
        next: (updated) => {
          this.isSavingCard.set(false);
          this.cards.update(list => list.map(c => (c.id === updated.id ? updated : c)));
          this.isEditCardModalOpen.set(false);
          this.toast.success(`Đã cập nhật thẻ "${updated.word}"!`);
        },
        error: () => {
          this.isSavingCard.set(false);
          this.toast.error('Không thể cập nhật thẻ từ vựng');
        },
      });
  }

  // Delete Card
  confirmDeleteCard(card: Card, event: Event): void {
    event.stopPropagation();
    this.cardToDelete.set(card);
  }

  cancelDeleteCard(): void {
    this.cardToDelete.set(null);
  }

  executeDeleteCard(): void {
    const card = this.cardToDelete();
    if (!card) return;

    this.isDeletingCard.set(true);
    this.cardApi.deleteCard(card.id).subscribe({
      next: () => {
        this.isDeletingCard.set(false);
        this.cards.update(list => list.filter(c => c.id !== card.id));
        this.cardToDelete.set(null);
        this.toast.success(`Đã xóa thẻ "${card.word}"`);
      },
      error: () => {
        this.isDeletingCard.set(false);
        this.toast.error('Không thể xóa thẻ từ');
      },
    });
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
}
