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

@Component({
  selector: 'app-vocab-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    VocabImportModalComponent,
    ExerciseImportModalComponent,
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
  totalPages = signal(0);
  currentPage = signal(0);

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
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      size: 20,
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
          this.cards.set(cardPage?.content ?? (Array.isArray(cardPage) ? cardPage : []));
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

  filterByTopic(topic?: string) {
    if (!topic) return;
    this.filterTopic = topic;
    this.loadDashboard(0);
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterTopic = '';
    this.filterDeckId = '';
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.loadDashboard(0);
  }

  // ─── Selection Logic ──────────────────────────────────────────

  toggleSelectCard(cardId: string, event: Event): void {
    event.stopPropagation();
    this.selectedCardIds.update(set => {
      const next = new Set(set);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    const list = this.cards();
    if (this.isAllSelected()) {
      this.selectedCardIds.set(new Set());
    } else {
      this.selectedCardIds.set(new Set(list.map(c => c.id)));
    }
  }

  clearSelection(): void {
    this.selectedCardIds.set(new Set());
  }

  isCardSelected(cardId: string): boolean {
    return this.selectedCardIds().has(cardId);
  }

  // ─── Bulk Deck Assignment ─────────────────────────────────────

  executeBulkAssignDeck(): void {
    const ids = Array.from(this.selectedCardIds());
    if (ids.length === 0 || this.isAssigningBulk()) return;

    this.isAssigningBulk.set(true);
    this.cardApi.batchAssignDeck(ids, this.targetDeckIdForBulk).subscribe({
      next: (res) => {
        this.isAssigningBulk.set(false);
        this.toast.success(res.message || `Đã cập nhật ${ids.length} thẻ từ!`);
        this.clearSelection();
        this.targetDeckIdForBulk = '';
        this.loadDashboard(this.currentPage());
        this.fetchUserDecks();
      },
      error: () => {
        this.isAssigningBulk.set(false);
        this.toast.error('Lỗi khi gán bộ thẻ hàng loạt');
      }
    });
  }

  // ─── Single Card Deck Assignment ──────────────────────────────

  openAssignDeckModal(card: Card, event: Event): void {
    event.stopPropagation();
    this.cardToAssignDeck.set(card);
    this.singleTargetDeckId = card.deckId || '';
  }

  closeAssignDeckModal(): void {
    this.cardToAssignDeck.set(null);
  }

  executeSingleAssignDeck(): void {
    const card = this.cardToAssignDeck();
    if (!card || this.isAssigningSingle()) return;

    this.isAssigningSingle.set(true);
    const targetDeckId = this.singleTargetDeckId || undefined;

    this.cardApi.updateCard(card.id, {
      deckId: targetDeckId,
    }).subscribe({
      next: (updated) => {
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

  // ─── Helpers ──────────────────────────────────────────────────

  getDeckName(deckId?: string): string | null {
    if (!deckId) return null;
    return this.deckNameMap().get(deckId) || 'Bộ thẻ';
  }

  getStageLabel(stage?: number): string {
    const labels = ['Mới', 'Nhận biết', 'Gợi nhớ', 'Phát âm', 'Điền từ', 'Thành thạo'];
    return labels[stage ?? 0] ?? 'Mới';
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

  getStageDots(stage = 0): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < stage);
  }

  isOverdue(nextReview?: string): boolean {
    if (!nextReview) return false;
    return new Date(nextReview) < new Date();
  }

  formatNextReview(nextReview?: string): string {
    if (!nextReview) return '—';
    const d = new Date(nextReview);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    if (diffDays < 0) return 'Quá hạn';
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Ngày mai';
    return `${diffDays} ngày nữa`;
  }

  prevPage() {
    if (this.currentPage() > 0) this.loadDashboard(this.currentPage() - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) this.loadDashboard(this.currentPage() + 1);
  }
}
