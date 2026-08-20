import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CardApiService } from '@services/card-api.service';
import { PendingCountService } from '@services/pending-count.service';
import { Card, DashboardStats } from '@models/index';

@Component({
  selector: 'app-vocab-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vocab-dashboard.component.html',
  styleUrls: ['./vocab-dashboard.component.scss'],
})
export class VocabDashboardComponent implements OnInit, OnDestroy {
  stats = signal<DashboardStats>({
    total: 0, dueToday: 0, newCount: 0,
    learningCount: 0, matureCount: 0, leechCount: 0
  });
  cards = signal<Card[]>([]);
  loading = signal(true);
  totalPages = signal(0);
  currentPage = signal(0);

  // Filters
  searchQuery = '';
  filterStatus = '';
  filterTopic = '';

  private querySub?: Subscription;
  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  constructor(
    private cardApi: CardApiService,
    private router: Router,
    private route: ActivatedRoute,
    public pendingCountService: PendingCountService
  ) {}

  get pendingCount() {
    return this.pendingCountService.pendingCount;
  }

  ngOnInit() {
    this.pendingCountService.refresh();

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
      this.loadDashboard(0);
    });
  }

  ngOnDestroy() {
    this.querySub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  loadDashboard(page = 0) {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      size: 20,
      ...(this.searchQuery && { search: this.searchQuery }),
      ...(this.filterStatus && { status: this.filterStatus }),
      ...(this.filterTopic && { topic: this.filterTopic }),
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
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.loadDashboard(0);
  }

  goToDetail(card: Card) {
    this.router.navigate(['/vocab/word', card.id]);
  }

  startPractice() {
    this.router.navigate(['/vocab/practice']);
  }

  goToImport() {
    this.router.navigate(['/vocab/import']);
  }

  goToCollector() {
    this.router.navigate(['/vocab/collector']);
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
