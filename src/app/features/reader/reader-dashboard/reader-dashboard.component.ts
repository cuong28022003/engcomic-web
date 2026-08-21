import { Component, OnInit, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReaderApiService } from '../services/reader-api.service';
import { MistakeQueueService } from '../services/mistake-queue.service';
import { TestSummary, ToeicDashboardData, ToeicAttempt } from '../models';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { AttemptHistoryModalComponent } from '../reading-session/attempt-history-modal/attempt-history-modal.component';

@Component({
  selector: 'app-reader-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe, EmptyStateComponent, AttemptHistoryModalComponent],
  templateUrl: './reader-dashboard.component.html',
  styleUrls: ['./reader-dashboard.component.scss']
})
export class ReaderDashboardComponent implements OnInit {
  private readerApi = inject(ReaderApiService);
  public mistakeQueueService = inject(MistakeQueueService);
  private cdr = inject(ChangeDetectorRef);

  dashboardData = signal<ToeicDashboardData | null>(null);
  activeAttempt = signal<ToeicAttempt | null>(null);
  tests = signal<TestSummary[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  showHistoryModal = signal<boolean>(false);
  historyAttempts = signal<ToeicAttempt[]>([]);
  selectedTestTitle = signal<string>('');

  filterStatus = signal<'all' | 'not_started' | 'completed'>('all');

  filteredTests = computed(() => {
    const list = this.tests();
    const filter = this.filterStatus();
    if (filter === 'all') return list;
    return list.filter(t => t.status === filter);
  });

  ngOnInit() {
    this.loadData();
    this.mistakeQueueService.fetchFromBackend();
  }

  loadData() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.cdr.markForCheck();

    this.readerApi.getActiveAttempt().subscribe({
      next: (att) => {
        this.activeAttempt.set(att);
        this.cdr.markForCheck();
      }
    });

    this.readerApi.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.tests.set(data.recentTests || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Không thể tải dữ liệu');
        this.cdr.markForCheck();
      }
    });
  }

  getAnsweredCount(att: ToeicAttempt): number {
    if (!att.answers) return 0;
    return att.answers.filter(a => a.userAnswer && a.userAnswer.trim().length > 0).length;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  setFilter(status: 'all' | 'not_started' | 'completed') {
    this.filterStatus.set(status);
    this.cdr.markForCheck();
  }

  openTestHistory(test: TestSummary) {
    this.selectedTestTitle.set(test.testName);
    this.readerApi.getAttemptsForTest(test.id).subscribe({
      next: (list) => {
        this.historyAttempts.set(list || []);
        this.showHistoryModal.set(true);
        this.cdr.markForCheck();
      },
      error: () => {
        this.historyAttempts.set([]);
        this.showHistoryModal.set(true);
        this.cdr.markForCheck();
      }
    });
  }

  closeTestHistory() {
    this.showHistoryModal.set(false);
    this.cdr.markForCheck();
  }
}