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
import { EmptyStateComponent, PaginatorComponent, BreadcrumbComponent, BreadcrumbItem } from '@shared/components';

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
    BreadcrumbComponent
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
  readonly showImportModal = signal<boolean>(false);

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
      flagged: m.reason === 'flagged'
    }));
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

  readonly filteredMistakes = computed<MistakeItem[]>(() => {
    const tab = this.activeTab();
    const q = this.searchQuery().trim().toLowerCase();

    const filtered = this.mistakes().filter(m => {
      if (tab !== 'all' && m.status !== tab) {
        return false;
      }
      if (q) {
        const testMatch = m.testName?.toLowerCase().includes(q);
        const numMatch = m.questionNumber.toString().includes(q);
        return testMatch || numMatch;
      }
      return true;
    });

    return filtered.sort((a, b) => {
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

  setTab(tab: 'all' | 'pending' | 'explained' | 'resolved'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
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