import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CardApiService } from '@services/card-api.service';
import { DeckApiService } from '@services/deck-api.service';
import { AuthService } from '@services/auth.service';
import { ToastService } from '@services/toast.service';
import { PendingCountService } from '@services/pending-count.service';
import { Card, Deck, DashboardStats, PracticePromptResponse } from '@models/index';
import { VocabImportModalComponent } from '@shared/components/vocab-import-modal/vocab-import-modal.component';
import { ExerciseImportModalComponent } from '@shared/components/exercise-import-modal/exercise-import-modal.component';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

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
    StatusBadgeComponent,
  ],
  templateUrl: './vocab-dashboard.component.html',
  styleUrls: ['./vocab-dashboard.component.scss'],
})
export class VocabDashboardComponent implements OnInit, OnDestroy {
  stats = signal<DashboardStats>({
    total: 0, dueToday: 0, newCount: 0,
    learningCount: 0, matureCount: 0, leechCount: 0
  });
  cards = signal<Card[]>([]);
  decks = signal<Deck[]>([]);
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

  // Selection state for Bulk Actions
  selectedCardIds = signal<Set<string>>(new Set());

  // Bulk Assign Deck State
  targetDeckIdForBulk = '';
  isAssigningBulk = signal<boolean>(false);

  // Single Assign Deck Modal State
  cardToAssignDeck = signal<Card | null>(null);
  singleTargetDeckId = '';
  isAssigningSingle = signal<boolean>(false);

  // Filters
  searchQuery = '';
  filterStatus = '';
  filterTopic = '';
  filterDeckId = '';

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

  constructor(
    private cardApi: CardApiService,
    private deckApi: DeckApiService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    public pendingCountService: PendingCountService
  ) {}

  get pendingCount() {
    return this.pendingCountService.pendingCount;
  }

  ngOnInit() {
    this.pendingCountService.refresh();
    this.fetchUserDecks();

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
      if (params['deckId'] !== undefined) {
        this.filterDeckId = params['deckId'];
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

  loadDashboard(page = 0) {
    this.loading.set(true);
    const size = this.pageSize();
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      size,
      ...(this.searchQuery && { search: this.searchQuery }),
      ...(this.filterStatus && { status: this.filterStatus }),
      ...(this.filterTopic && { topic: this.filterTopic }),
      ...(this.filterDeckId && { deckId: this.filterDeckId }),
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
          const list = cardPage?.content ?? (Array.isArray(cardPage) ? cardPage : []);
          this.cards.set(list);
          this.totalElements.set(cardPage?.totalElements ?? this.stats().total ?? list.length);
          this.totalPages.set(cardPage?.totalPages ?? 1);
          this.currentPage.set(page);
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

  onTopicInput() {
    this.searchSubject.next();
  }

  onFilterChange() {
    this.loadDashboard(0);
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterTopic = '';
    this.filterDeckId = '';
    this.loadDashboard(0);
  }

  onDeckChange() {
    this.loadDashboard(0);
  }

  setFilterStatus(status: string) {
    this.filterStatus = status;
    this.loadDashboard(0);
  }

  filterByTopic(topic: string): void {
    this.filterTopic = topic;
    this.loadDashboard(0);
  }

  clearTopicFilter(): void {
    this.filterTopic = '';
    this.loadDashboard(0);
  }

  // ─── Bulk Actions ─────────────────────────────────────────────

  toggleSelectAll(event?: Event): void {
    if (this.isAllSelected()) {
      this.selectedCardIds.set(new Set());
    } else {
      const allIds = new Set(this.cards().map(c => c.id));
      this.selectedCardIds.set(allIds);
    }
  }

  toggleSelectCard(cardId: string, event: Event): void {
    event.stopPropagation();
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
    this.isVocabModalOpen.set(true);
  }

  openExerciseModal(): void {
    const dId = this.filterDeckId === 'unassigned' ? undefined : (this.filterDeckId || undefined);
    this.cardApi.getPracticePrompt(dId).subscribe({
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
    this.pendingCountService.refresh();
  }

  onExerciseImportSuccess(): void {
    this.loadDashboard(this.currentPage());
  }

  // ─── Navigation ───────────────────────────────────────────────

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
      queryParams: this.filterDeckId && this.filterDeckId !== 'unassigned' ? { deckId: this.filterDeckId } : undefined
    });
  }

  goToImport() {
    this.router.navigate(['/vocab/import'], {
      queryParams: this.filterDeckId ? { deckId: this.filterDeckId } : undefined
    });
  }

  goToCollector() {
    this.router.navigate(['/vocab/collector']);
  }

  goToLeech() {
    this.router.navigate(['/vocab/leech']);
  }

  playAudio(audioUrl?: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (!audioUrl) return;
    try {
      const a = new Audio(audioUrl);
      a.play().catch(() => {});
    } catch {}
  }

  toggleFavorite(card: Card, event: Event): void {
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
