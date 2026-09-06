import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription, Subject, forkJoin } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CardApiService } from '@services/card-api.service';
import { DeckApiService } from '@services/deck-api.service';
import { AuthService } from '@services/auth.service';
import { ToastService } from '@services/toast.service';
import { PendingCountService } from '@services/pending-count.service';
import { PronunciationService } from '@core/services/pronunciation.service';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { Card, Deck, DashboardStats, PracticePromptResponse } from '@models/index';
import { VocabImportModalComponent } from '@shared/components/vocab-import-modal/vocab-import-modal.component';
import { ExerciseImportModalComponent } from '@shared/components/exercise-import-modal/exercise-import-modal.component';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { SelectionCheckboxComponent } from '@shared/components/selection-checkbox/selection-checkbox.component';
import { BulkActionsBarComponent } from '@shared/components/bulk-actions-bar/bulk-actions-bar.component';
import { VocabCardComponent } from '@shared/components/vocab-card/vocab-card.component';
import { DataFilterBarComponent } from '@shared/components/data-filter-bar/data-filter-bar.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { FilterSelectComponent } from '@shared/components/filter-select/filter-select.component';

export interface VocabTopicCategory {
  categoryName: string;
  icon: string;
  topics: { key: string; label: string; icon: string; desc?: string }[];
}

export const PRESET_VOCAB_TOPICS: VocabTopicCategory[] = [
  {
    categoryName: 'Giao Tiếp & Đời Sống',
    icon: 'fa-solid fa-mug-saucer',
    topics: [
      { key: 'Daily Life', label: 'Đời sống hàng ngày', icon: 'fa-solid fa-sun' },
      { key: 'Travel', label: 'Du lịch & Khám phá', icon: 'fa-solid fa-plane-departure' },
      { key: 'Food & Drinks', label: 'Ẩm thực & Đồ uống', icon: 'fa-solid fa-utensils' },
      { key: 'Shopping', label: 'Mua sắm & Tiêu dùng', icon: 'fa-solid fa-bag-shopping' },
      { key: 'Family & Friends', label: 'Gia đình & Bạn bè', icon: 'fa-solid fa-people-roof' },
      { key: 'Health & Fitness', label: 'Sức khỏe & Thể thao', icon: 'fa-solid fa-heart-pulse' },
      { key: 'Entertainment', label: 'Giải trí & Phim ảnh', icon: 'fa-solid fa-clapperboard' },
    ]
  },
  {
    categoryName: 'Công Việc & Kinh Doanh (TOEIC / Workplace)',
    icon: 'fa-solid fa-briefcase',
    topics: [
      { key: 'Business', label: 'Kinh doanh & Thương mại', icon: 'fa-solid fa-chart-line' },
      { key: 'Office & Workplace', label: 'Văn phòng & Công sở', icon: 'fa-solid fa-building' },
      { key: 'Finance & Banking', label: 'Tài chính & Ngân hàng', icon: 'fa-solid fa-coins' },
      { key: 'Marketing & Sales', label: 'Marketing & Bán hàng', icon: 'fa-solid fa-bullhorn' },
      { key: 'Technology & IT', label: 'Công nghệ & CNTT', icon: 'fa-solid fa-laptop-code' },
      { key: 'Contracts & Negotiations', label: 'Hợp đồng & Đàm phán', icon: 'fa-solid fa-file-contract' },
      { key: 'Human Resources', label: 'Nhân sự & Tuyển dụng', icon: 'fa-solid fa-user-tie' },
    ]
  },
  {
    categoryName: 'Học Thuật & Xã Hội (IELTS / Academic)',
    icon: 'fa-solid fa-graduation-cap',
    topics: [
      { key: 'Education', label: 'Giáo dục & Học tập', icon: 'fa-solid fa-book' },
      { key: 'Environment & Nature', label: 'Môi trường & Thiên nhiên', icon: 'fa-solid fa-leaf' },
      { key: 'Science & Innovation', label: 'Khoa học & Đổi mới', icon: 'fa-solid fa-flask' },
      { key: 'Art & Culture', label: 'Văn hóa & Nghệ thuật', icon: 'fa-solid fa-palette' },
      { key: 'Society & Law', label: 'Xã hội & Pháp luật', icon: 'fa-solid fa-scale-balanced' },
      { key: 'Psychology', label: 'Tâm lý học & Cảm xúc', icon: 'fa-solid fa-brain' },
    ]
  }
];

export const PART_OF_SPEECH_OPTIONS = [
  { key: '', label: 'Tất cả từ loại' },
  { key: 'noun', label: 'Danh từ (Noun)' },
  { key: 'verb', label: 'Động từ (Verb)' },
  { key: 'adjective', label: 'Tính từ (Adjective)' },
  { key: 'adverb', label: 'Trạng từ (Adverb)' },
  { key: 'preposition', label: 'Giới từ (Preposition)' },
  { key: 'conjunction', label: 'Liên từ (Conjunction)' },
  { key: 'pronoun', label: 'Đại từ (Pronoun)' },
  { key: 'phrase', label: 'Cụm từ / Thành ngữ (Phrase/Idiom)' },
  { key: 'interjection', label: 'Thán từ (Interjection)' },
];

@Component({
  selector: 'app-vocab-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    VocabImportModalComponent,
    ExerciseImportModalComponent,
    PaginatorComponent,
    BulkActionsBarComponent,
    VocabCardComponent,
    DataFilterBarComponent,
    PageHeaderComponent,
    ModalComponent,
    FilterSelectComponent,
  ],
  templateUrl: './vocab-dashboard.component.html',
  styleUrls: ['./vocab-dashboard.component.scss'],
})
export class VocabDashboardComponent implements OnInit, OnDestroy {
  private cardApi = inject(CardApiService);
  private deckApi = inject(DeckApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public pendingCountService = inject(PendingCountService);
  private pronunciationService = inject(PronunciationService);
  private confirmDialog = inject(ConfirmDialogService);

  readonly posOptions = PART_OF_SPEECH_OPTIONS;
  readonly presetTopicCategories = PRESET_VOCAB_TOPICS;

  stats = signal<DashboardStats>({
    total: 0, dueToday: 0, newCount: 0,
    learningCount: 0, matureCount: 0, leechCount: 0
  });
  cards = signal<Card[]>([]);
  decks = signal<Deck[]>([]);
  userTopics = signal<string[]>([]);
  loading = signal(true);
  totalPages = signal(1);
  currentPage = signal(0); // 0-indexed for backend API
  totalElements = signal<number>(0);
  pageSize = signal<number>(20);

  // 1-indexed page for PaginatorComponent
  paginatorPage = computed(() => this.currentPage() + 1);

  // Shared Modals State
  isVocabModalOpen = signal<boolean>(false);
  isExerciseModalOpen = signal<boolean>(false);
  promptData = signal<PracticePromptResponse | null>(null);

  // Topic Selector Modal State
  isTopicModalOpen = signal<boolean>(false);
  searchTopicModalQuery = signal<string>('');

  // Card Single Create / Edit Modal State
  isCardEditModalOpen = signal<boolean>(false);
  editingCard = signal<Card | null>(null);

  // Selection state for Bulk Actions
  selectedCardIds = signal<Set<string>>(new Set());

  // Bulk Assign Deck State
  targetDeckIdForBulk = '';
  isAssigningBulk = signal<boolean>(false);

  // Single Assign Deck Modal State
  cardToAssignDeck = signal<Card | null>(null);
  singleTargetDeckId = '';
  isAssigningSingle = signal<boolean>(false);

  // Filters & View Mode
  viewMode = signal<'grid' | 'list'>((localStorage.getItem('vocab_view_mode') as 'grid' | 'list') || 'grid');
  searchQuery = '';
  filterStatus = '';
  filterTopic = '';
  filterPos = '';
  readonly isStarActive = signal<boolean>(false);
  activeCategoryFilter = signal<string | null>(null);

  // Filtered Topics inside Modal
  filteredCategoriesInModal = computed(() => {
    const q = this.searchTopicModalQuery().trim().toLowerCase();
    if (!q) return this.presetTopicCategories;

    return this.presetTopicCategories.map(cat => ({
      ...cat,
      topics: cat.topics.filter(t =>
        t.key.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q)
      )
    })).filter(cat => cat.topics.length > 0);
  });

  filteredUserTopicsInModal = computed(() => {
    const q = this.searchTopicModalQuery().trim().toLowerCase();
    const list = this.userTopics();
    if (!q) return list;
    return list.filter(t => t.toLowerCase().includes(q));
  });

  private querySub?: Subscription;
  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  // Deck Lookup Map
  deckNameMap = computed<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const d of this.decks()) {
      map.set(d.id, d.name);
    }
    return map;
  });

  selectedCount = computed(() => this.selectedCardIds().size);

  isAllSelected = computed(() => {
    const list = this.cards();
    if (list.length === 0) return false;
    const set = this.selectedCardIds();
    return list.every(c => set.has(c.id));
  });

  get pendingCount() {
    return this.pendingCountService.pendingCount;
  }

  ngOnInit() {
    this.pendingCountService.refresh();
    this.fetchUserDecks();
    this.fetchUserTopics();

    // Auto debounce live search & filter
    this.searchSub = this.searchSubject.pipe(
      debounceTime(250)
    ).subscribe(() => {
      this.loadDashboard(0);
    });

    this.querySub = this.route.queryParams.subscribe((params) => {
      if (params['topic'] !== undefined) {
        this.filterTopic = params['topic'];
      }
      if (params['pos'] !== undefined || params['partOfSpeech'] !== undefined) {
        this.filterPos = params['pos'] || params['partOfSpeech'] || '';
      }
      if (params['usageCategory'] !== undefined) {
        this.activeCategoryFilter.set(params['usageCategory']);
      }
      this.loadDashboard(0);
    });
  }

  ngOnDestroy() {
    this.querySub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  fetchUserDecks(): void {
    const user = this.auth.currentUser;
    if (!user) return;
    this.deckApi.getDecksByUserId(user.userId, { page: 0, size: 100 }).subscribe({
      next: (res) => {
        this.decks.set(res?.content ?? []);
      },
      error: () => {
        this.decks.set([]);
      }
    });
  }

  fetchUserTopics(): void {
    this.cardApi.getUserTopics().subscribe({
      next: (topics) => {
        this.userTopics.set(topics || []);
      },
      error: () => {
        this.userTopics.set([]);
      }
    });
  }

  loadDashboard(page = 0) {
    this.loading.set(true);
    const size = this.pageSize();
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      size,
      ...(this.searchQuery && { search: this.searchQuery }),
      ...(this.filterStatus && { status: this.filterStatus }),
      ...(this.filterTopic && { topic: this.filterTopic }),
      ...(this.filterPos && { partOfSpeech: this.filterPos }),
      ...(this.isStarActive() && { isFavorite: true }),
      ...(this.activeCategoryFilter() && { usageCategory: this.activeCategoryFilter()! }),
    };

    this.cardApi.getDashboard(params).subscribe({
      next: (res) => {
        if (res) {
          this.stats.set({
            total: res.totalCards ?? res.stats?.total ?? 0,
            dueToday: res.dueToday ?? res.stats?.dueToday ?? 0,
            newCount: res.newCount ?? res.stats?.newCount ?? 0,
            learningCount: res.learningCount ?? res.stats?.learningCount ?? 0,
            matureCount: res.matureCount ?? res.stats?.matureCount ?? 0,
            leechCount: res.leechCount ?? res.stats?.leechCount ?? 0,
          });
          const cardPage = res.cards;
          this.cards.set(cardPage?.content ?? []);
          this.totalPages.set(cardPage?.totalPages ?? 1);
          this.currentPage.set(cardPage?.number ?? page);
          this.totalElements.set(cardPage?.totalElements ?? 0);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearchInput() {
    this.searchSubject.next();
  }

  onFilterChange() {
    this.loadDashboard(0);
  }

  onStarFilterChange(active: boolean) {
    this.isStarActive.set(active);
    this.loadDashboard(0);
  }

  // ─── Topic Selector Modal Handlers ────────────────────────────

  openTopicModal(): void {
    this.searchTopicModalQuery.set('');
    this.isTopicModalOpen.set(true);
  }

  closeTopicModal(): void {
    this.isTopicModalOpen.set(false);
    this.searchTopicModalQuery.set('');
  }

  selectTopic(topic: string): void {
    this.filterTopic = topic;
    this.closeTopicModal();
    this.loadDashboard(0);
  }

  filterByTopic(topic: string): void {
    this.selectTopic(topic);
  }

  clearTopicFilter(event?: Event): void {
    if (event) event.stopPropagation();
    this.filterTopic = '';
    this.loadDashboard(0);
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterTopic = '';
    this.filterPos = '';
    this.isStarActive.set(false);
    this.activeCategoryFilter.set(null);
    this.loadDashboard(0);
  }

  setFilterStatus(status: string) {
    this.filterStatus = status;
    this.loadDashboard(0);
  }

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
    try {
      localStorage.setItem('vocab_view_mode', mode);
    } catch {
      // ignore
    }
  }

  // ─── Selection & Checkbox Methods ─────────────────────────────

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedCardIds.set(new Set());
    } else {
      const allIds = new Set(this.cards().map(c => c.id));
      this.selectedCardIds.set(allIds);
    }
  }

  toggleSelectCard(cardId: string, event?: Event): void {
    if (event) event.stopPropagation();
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

  // ─── Single & Bulk Edit / Delete Actions ────────────────────────

  openEditCardModal(card: Card, event?: Event): void {
    if (event) event.stopPropagation();
    this.editingCard.set(card);
    this.isVocabModalOpen.set(true);
  }

  closeVocabModal(): void {
    this.isVocabModalOpen.set(false);
    this.editingCard.set(null);
  }

  editSelectedCard(): void {
    const ids = Array.from(this.selectedCardIds());
    if (ids.length !== 1) return;
    const card = this.cards().find(c => c.id === ids[0]);
    if (card) {
      this.openEditCardModal(card);
    }
  }

  deleteSingleCard(card: Card, event?: Event): void {
    if (event) event.stopPropagation();
    if (!card?.id) return;

    this.confirmDialog.confirm({
      title: 'Xóa Từ Vựng',
      message: `Bạn có chắc chắn muốn xóa từ "${card.word}" khỏi kho từ vựng? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa ngay',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.cardApi.deleteCard(card.id).subscribe({
          next: () => {
            this.toast.success(`Đã xóa từ "${card.word}" thành công!`);
            this.selectedCardIds.update(set => {
              const next = new Set(set);
              next.delete(card.id);
              return next;
            });
            this.loadDashboard(this.currentPage());
            this.fetchUserDecks();
          },
          error: (err) => {
            this.toast.error(err?.message || 'Lỗi khi xóa từ vựng.');
          }
        });
      }
    });
  }

  deleteSelectedCards(): void {
    const ids = Array.from(this.selectedCardIds());
    if (ids.length === 0) return;

    const count = ids.length;
    const msg = count === 1
      ? `Bạn có chắc chắn muốn xóa từ vựng đã chọn khỏi kho? Hành động này không thể hoàn tác.`
      : `Bạn có chắc chắn muốn xóa toàn bộ ${count} từ vựng đã chọn khỏi kho? Hành động này không thể hoàn tác.`;

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
            this.loadDashboard(this.currentPage());
            this.fetchUserDecks();
          },
          error: () => {
            this.toast.error('Có lỗi xảy ra trong quá trình xóa dữ liệu.');
            this.loadDashboard(this.currentPage());
          }
        });
      }
    });
  }

  onCardSaved(savedCard: Card): void {
    this.loadDashboard(this.currentPage());
    this.fetchUserDecks();
  }

  // ─── Functional Grammar Navigation ───────────────────────────

  goToFunctionalGrammar(): void {
    this.router.navigate(['/grammar'], { queryParams: { tab: 'functional' } });
  }

  clearCategoryFilter(): void {
    this.activeCategoryFilter.set(null);
    this.loadDashboard(0);
  }

  // ─── Bulk Assign Deck ─────────────────────────────────────────

  executeBulkAssignDeck(): void {
    const cardIds = Array.from(this.selectedCardIds());
    if (cardIds.length === 0 || this.isAssigningBulk()) return;

    this.isAssigningBulk.set(true);
    const targetDeckId = (this.targetDeckIdForBulk === 'unassigned' || !this.targetDeckIdForBulk)
      ? undefined
      : this.targetDeckIdForBulk;

    this.cardApi.batchAssignDeck(cardIds, targetDeckId).subscribe({
      next: (res: { totalAssigned: number; message: string }) => {
        this.isAssigningBulk.set(false);
        const deckName = this.deckNameMap().get(targetDeckId || '') || 'Chưa phân loại';
        this.toast.success(`Đã chuyển ${res.totalAssigned || cardIds.length} thẻ từ vào [${deckName}]`);
        this.clearSelection();
        this.targetDeckIdForBulk = '';
        this.loadDashboard(this.currentPage());
        this.fetchUserDecks();
      },
      error: () => {
        this.isAssigningBulk.set(false);
        this.toast.error('Lỗi khi chuyển bộ thẻ hàng loạt');
      }
    });
  }

  // ─── Single Card Assign Deck Modal ────────────────────────────

  openAssignDeckModal(card: Card, event: Event): void {
    event.stopPropagation();
    this.cardToAssignDeck.set(card);
    this.singleTargetDeckId = card.deckId || '';
  }

  closeAssignDeckModal(): void {
    this.cardToAssignDeck.set(null);
    this.singleTargetDeckId = '';
  }

  executeSingleAssignDeck(): void {
    const card = this.cardToAssignDeck();
    if (!card || this.isAssigningSingle()) return;

    this.isAssigningSingle.set(true);
    const targetDeckId = (this.singleTargetDeckId === 'unassigned' || !this.singleTargetDeckId)
      ? undefined
      : this.singleTargetDeckId;

    this.cardApi.updateCard(card.id, {
      deckId: targetDeckId,
    }).subscribe({
      next: (updated: Card) => {
        this.isAssigningSingle.set(false);
        this.cards.update(list => list.map(c => c.id === updated.id ? { ...c, deckId: updated.deckId } : c));
        this.closeAssignDeckModal();
        const deckName = this.deckNameMap().get(updated.deckId || '') || 'Chưa phân loại';
        this.toast.success(`Đã chuyển thẻ "${card.word}" vào [${deckName}]`);
        this.fetchUserDecks();
      },
      error: () => {
        this.isAssigningSingle.set(false);
        this.toast.error('Lỗi khi cập nhật bộ thẻ');
      }
    });
  }

  // ─── Modal Actions ───────────────────────────────────────────

  openVocabModal(): void {
    this.editingCard.set(null);
    this.isVocabModalOpen.set(true);
  }

  openExerciseModal(): void {
    this.cardApi.getPracticePrompt().subscribe({
      next: (data) => {
        this.promptData.set(data);
        this.isExerciseModalOpen.set(true);
      },
      error: () => {
        this.toast.error('Không thể trích xuất AI Prompt cho các từ vựng');
      }
    });
  }

  onVocabAdded(): void {
    this.loadDashboard(this.currentPage());
    this.fetchUserDecks();
    this.fetchUserTopics();
    this.pendingCountService.refresh();
  }

  onExerciseImportSuccess(): void {
    this.loadDashboard(this.currentPage());
  }

  // ─── Navigation & Card Actions ────────────────────────────────

  goToDecks(): void {
    this.router.navigate(['/deck']);
  }

  goToDeckDetail(deckId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/deck', deckId]);
  }

  goToDetail(card: Card) {
    this.router.navigate(['/vocab/word', card.id]);
  }

  startPractice() {
    this.router.navigate(['/vocab/practice'], {
      queryParams: this.filterTopic ? { topic: this.filterTopic } : undefined
    });
  }

  goToCollector() {
    this.router.navigate(['/vocab/collector']);
  }

  goToLeech() {
    this.router.navigate(['/vocab/leech']);
  }

  playAudio(card: Card, event?: Event): void {
    if (event) event.stopPropagation();
    const word = card.word || card.front;
    if (word) {
      this.pronunciationService.speak(word, 'us');
    }
  }

  toggleFavorite(card: Card, event: Event): void {
    event.stopPropagation();
    this.cardApi.toggleFavorite(card.id).subscribe({
      next: (updated: Card) => {
        const isFav = updated.isFavorite ?? updated.favorite ?? !(card.isFavorite || card.favorite);
        this.cards.update(list => list.map(c => c.id === card.id ? { ...c, favorite: isFav, isFavorite: isFav } : c));
        if (isFav) {
          this.toast.success(`Đã lưu "${card.word || card.front}" vào danh sách yêu thích!`);
        } else {
          this.toast.info(`Đã bỏ lưu "${card.word || card.front}".`);
          if (this.isStarActive()) {
            this.loadDashboard(this.currentPage());
          }
        }
      },
      error: () => {
        this.toast.error('Không thể cập nhật yêu thích');
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────

  getDeckName(deckId?: string): string | null {
    if (!deckId) return null;
    return this.deckNameMap().get(deckId) || 'Bộ thẻ';
  }

  getStatusClass(status?: string): string {
    const map: Record<string, string> = {
      new: 'status-new',
      learning: 'status-learning',
      mature: 'status-mature',
      leech: 'status-leech',
    };
    return map[status ?? 'new'] ?? 'status-new';
  }

  getStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      new: 'Mới', learning: 'Đang học', mature: 'Thành thạo', leech: 'Khó nhớ'
    };
    return map[status ?? 'new'] ?? 'Mới';
  }

  isOverdue(nextReview?: string | Date, status?: string): boolean {
    if (status === 'new' || !nextReview) return false;
    const d = new Date(nextReview);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  }

  formatNextReview(nextReview?: string | Date, status?: string): string {
    if (status === 'new' || !nextReview) return 'Chưa học';
    const d = new Date(nextReview);
    if (isNaN(d.getTime())) return 'Chưa học';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startOfTarget - startOfToday) / 86400000);

    if (diffDays < 0) return 'Quá hạn';
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Ngày mai';
    return `${diffDays} ngày nữa`;
  }

  onPageChange(page1Indexed: number): void {
    this.loadDashboard(page1Indexed - 1);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.loadDashboard(0);
  }
}
