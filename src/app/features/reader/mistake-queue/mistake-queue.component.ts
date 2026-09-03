import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ImportReviewItemsPayload, MistakeItem } from '../models';
import { MistakeQueueService } from '../services/mistake-queue.service';
import { ReaderApiService } from '../services/reader-api.service';
import { MistakeItemComponent } from './mistake-item/mistake-item.component';
import { AiReviewImportModalComponent } from '../reading-session/ai-review-import-modal/ai-review-import-modal.component';
import { EmptyStateComponent, PaginatorComponent, BreadcrumbComponent, BreadcrumbItem, DataFilterBarComponent, SortOption } from '@shared/components';

import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-mistake-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MistakeItemComponent,
    AiReviewImportModalComponent,
    EmptyStateComponent,
    PaginatorComponent,
    BreadcrumbComponent,
    DataFilterBarComponent
  ],
  templateUrl: './mistake-queue.component.html',
  styleUrls: ['./mistake-queue.component.scss']
})
export class MistakeQueueComponent implements OnInit, OnDestroy {
  private readerApi = inject(ReaderApiService);
  private toast = inject(ToastService);
  public mistakeQueueService = inject(MistakeQueueService);

  readonly breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Luyện Đề TOEIC', url: '/reader', icon: 'fa-solid fa-book-open-reader' },
    { label: 'Hàng Đợi Lỗi Sai' }
  ];

  readonly mistakes = signal<MistakeItem[]>([]);
  private sub?: Subscription;

  readonly activeTab = signal<'all' | 'pending' | 'explained' | 'resolved'>('all');
  readonly searchQuery = signal<string>('');
  readonly selectedTest = signal<string>('all');
  readonly sortBy = signal<string>('test-qnum');
  readonly showImportModal = signal<boolean>(false);

  readonly sortOptions: SortOption[] = [
    { value: 'test-qnum', label: 'Theo đề & số câu', icon: 'fa-solid fa-list-ol' },
    { value: 'qnum', label: 'Theo số câu', icon: 'fa-solid fa-hashtag' },
    { value: 'created-desc', label: 'Mới nhất', icon: 'fa-solid fa-clock' },
    { value: 'created-asc', label: 'Cũ nhất', icon: 'fa-solid fa-clock-rotate-left' }
  ];

  // Pagination state
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  readonly questionsNeedingReview = computed(() => {
    const list = this.mistakes();
    const pendingOnly = list.filter(m => m.status === 'pending');
    const targetList = pendingOnly.length > 0 ? pendingOnly : list;

    return targetList.map(m => ({
      questionNumber: m.questionNumber,
      part: m.part,
      userAnswer: m.userAnswer,
      correctAnswer: m.correctAnswer,
      isCorrect: false,
      flagged: m.reason === 'flagged',
      testName: m.testName
    }));
  });

  /** Danh sách đề thi có câu đang cần review, dùng cho lọc per-test trong modal */
  readonly reviewTestOptions = computed<string[]>(() => {
    const names = new Set<string>();
    for (const q of this.questionsNeedingReview()) {
      if (q.testName) names.add(q.testName);
    }
    const selected = this.selectedTest();
    if (selected !== 'all') {
      names.add(selected);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  });

  ngOnInit(): void {
    this.sub = this.mistakeQueueService.mistakes$.subscribe(list => {
      this.mistakes.set(list);
    });
    this.mistakeQueueService.fetchFromBackend();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  readonly pendingCount = computed<number>(() => {
    return this.mistakes().filter(m => m.status === 'pending').length;
  });

  readonly explainedCount = computed<number>(() => {
    return this.mistakes().filter(m => m.status === 'explained').length;
  });

  readonly resolvedCount = computed<number>(() => {
    return this.mistakes().filter(m => m.status === 'resolved').length;
  });

  /** Danh sách đề thi có lỗi, dùng cho ô lọc theo đề */
  readonly availableTests = computed<string[]>(() => {
    const names = new Set<string>();
    for (const m of this.mistakes()) {
      if (m.testName) names.add(m.testName);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredMistakes = computed<MistakeItem[]>(() => {
    const tab = this.activeTab();
    const q = this.searchQuery().trim().toLowerCase();
    const test = this.selectedTest();

    const filtered = this.mistakes().filter(m => {
      if (tab !== 'all' && m.status !== tab) {
        return false;
      }
      if (test !== 'all' && m.testName !== test) {
        return false;
      }
      if (q) {
        const testMatch = m.testName?.toLowerCase().includes(q);
        const numMatch = m.questionNumber.toString().includes(q);
        return testMatch || numMatch;
      }
      return true;
    });

    const sort = this.sortBy();
    return filtered.sort((a, b) => {
      if (sort === 'qnum') {
        return (a.questionNumber || 0) - (b.questionNumber || 0);
      }
      if (sort === 'created-desc') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      if (sort === 'created-asc') {
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      const testA = a.testName || '';
      const testB = b.testName || '';
      const cmp = testA.localeCompare(testB);
      if (cmp !== 0) return cmp;
      return (a.questionNumber || 0) - (b.questionNumber || 0);
    });
  });

  /** Danh sách lỗi hiển thị sau khi phân trang */
  readonly paginatedMistakes = computed<MistakeItem[]>(() => {
    const list = this.filteredMistakes();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  /** Số lỗi sau khi lọc (phục vụ count summary của data-filter-bar) */
  readonly filteredCount = computed<number>(() => this.filteredMistakes().length);

  setTab(tab: 'all' | 'pending' | 'explained' | 'resolved'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onSortChange(val: string): void {
    this.sortBy.set(val);
    this.currentPage.set(1);
  }

  onTestFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedTest.set(val);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedTest.set('all');
    this.currentPage.set(1);
  }

  onSaveExplanation(event: { id: string; explanation: string }): void {
    this.mistakeQueueService.updateMistake(event.id, event.explanation);
  }

  onMarkResolved(id: string): void {
    this.mistakeQueueService.markAsResolved(id);
  }

  onDeleteMistake(id: string): void {
    this.mistakeQueueService.deleteMistake(id);
  }

  openImportModal(): void {
    this.showImportModal.set(true);
  }

  closeImportModal(): void {
    this.showImportModal.set(false);
  }

  handleImportMistakeReviews(payload: ImportReviewItemsPayload): void {
    this.readerApi.importMistakeReviews(payload).subscribe({
      next: (updatedList) => {
        this.showImportModal.set(false);
        this.mistakeQueueService.fetchFromBackend();
        this.toast.success(`Đã import thành công phân tích cho ${updatedList.length} câu sai! Lời giải đã được đồng bộ vào trang Review.`);
      },
      error: (err: any) => {
        this.toast.error(err.message || 'Import thất bại. Vui lòng kiểm tra lại định dạng JSON!');
      }
    });
  }
}