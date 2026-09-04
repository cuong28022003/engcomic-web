import { Component, OnInit, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReaderApiService } from '../services/reader-api.service';
import { AnswerKeyService } from '../services/answer-key.service';
import { TestSummary, ToeicDashboardData, ToeicAttempt } from '../models';
import { FormsModule } from '@angular/forms';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { EmptyStateComponent, ModalComponent, FormInputComponent, PageHeaderComponent, DataFilterBarComponent } from '@shared/components';
import { AttemptHistoryModalComponent } from '../reading-session/attempt-history-modal/attempt-history-modal.component';
import { PartStrategyPopoverComponent } from '../reading-session/part-strategy-popover/part-strategy-popover.component';
import { ToastService } from '@core/services/toast.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-reader-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    TimeAgoPipe, 
    EmptyStateComponent, 
    AttemptHistoryModalComponent,
    ModalComponent,
    FormInputComponent,
    PageHeaderComponent,
    PartStrategyPopoverComponent
  ],
  templateUrl: './reader-dashboard.component.html',
  styleUrls: ['./reader-dashboard.component.scss']
})
export class ReaderDashboardComponent implements OnInit {
  private readerApi = inject(ReaderApiService);
  private answerKeyService = inject(AnswerKeyService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  dashboardData = signal<ToeicDashboardData | null>(null);
  activeAttempt = signal<ToeicAttempt | null>(null);
  tests = signal<TestSummary[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  showHistoryModal = signal<boolean>(false);
  historyAttempts = signal<ToeicAttempt[]>([]);
  selectedTestTitle = signal<string>('');

  // Comprehensive Edit Test State
  isEditModalOpen = signal<boolean>(false);
  editingTest = signal<TestSummary | null>(null);
  editActiveTab = signal<'info' | 'answers' | 'json'>('info');
  editTestName = signal<string>('');
  editPdfUrl = signal<string>('');
  editNewPdfFile = signal<File | null>(null);
  editQuestions = signal<Array<{ number: number; part: number; correctAnswer: string }>>([]);
  editJsonInput = signal<string>('');
  isLoadingDetail = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Delete Test State
  isDeleteModalOpen = signal<boolean>(false);
  deletingTest = signal<TestSummary | null>(null);
  isDeleting = signal<boolean>(false);

  searchQuery = signal<string>('');
  filterStatus = signal<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

  filteredTests = computed(() => {
    let list = this.tests();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(t => t.testName?.toLowerCase().includes(query));
    }
    const filter = this.filterStatus();
    if (filter === 'all') return list;
    return list.filter(t => t.status === filter);
  });

  ngOnInit() {
    this.loadData();
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

  openEditModal(test: TestSummary, event?: Event) {
    if (event) event.stopPropagation();
    this.editingTest.set(test);
    this.editTestName.set(test.testName);
    this.editPdfUrl.set(test.pdfUrl || '');
    this.editNewPdfFile.set(null);
    this.editActiveTab.set('info');
    this.editJsonInput.set('');
    this.isEditModalOpen.set(true);
    this.isLoadingDetail.set(true);
    this.cdr.markForCheck();

    this.readerApi.getTestDetail(test.id).subscribe({
      next: (detail) => {
        this.isLoadingDetail.set(false);
        const mapped = (detail.questions || []).map(q => ({
          number: q.number,
          part: q.part,
          correctAnswer: q.correctAnswer || ''
        }));
        this.editQuestions.set(mapped);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingDetail.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingTest.set(null);
    this.editNewPdfFile.set(null);
    this.editQuestions.set([]);
    this.editJsonInput.set('');
    this.cdr.markForCheck();
  }

  setEditTab(tab: 'info' | 'answers' | 'json') {
    this.editActiveTab.set(tab);
    this.cdr.markForCheck();
  }

  onEditFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        this.toast.error('Vui lòng chỉ chọn tệp định dạng PDF');
        return;
      }
      this.editNewPdfFile.set(file);
      this.cdr.markForCheck();
    }
  }

  removeNewPdfFile() {
    this.editNewPdfFile.set(null);
    this.cdr.markForCheck();
  }

  getResolvedPdfUrl(url: string | null | undefined): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }

  updateQuestionAnswer(qNumber: number, ans: string) {
    const current = [...this.editQuestions()];
    const idx = current.findIndex(q => q.number === qNumber);
    if (idx !== -1) {
      current[idx] = { ...current[idx], correctAnswer: ans };
      this.editQuestions.set(current);
      this.cdr.markForCheck();
    }
  }

  applyEditJson() {
    const raw = this.editJsonInput();
    if (!raw.trim()) {
      this.toast.error('Vui lòng nhập chuỗi JSON đáp án');
      return;
    }
    const res = this.answerKeyService.parseJson(raw);
    if (!res.valid) {
      this.toast.error(res.errors.join('; '));
      return;
    }
    this.editQuestions.set(res.questions);
    if (res.testName && res.testName.trim()) {
      this.editTestName.set(res.testName.trim());
    }
    this.toast.success(`Đã cập nhật ${res.questions.length} câu hỏi từ JSON thành công!`);
    this.editActiveTab.set('answers');
    this.cdr.markForCheck();
  }

  saveEditTest() {
    const test = this.editingTest();
    const newName = this.editTestName().trim();
    if (!test || !newName) {
      this.toast.error('Tên đề thi không được để trống');
      return;
    }

    this.isSaving.set(true);

    const questions = this.editQuestions();
    const payload: { testName: string; pdfUrl?: string; questions?: Array<{ number: number; part: number; correctAnswer: string }> } = {
      testName: newName,
      questions: questions.length > 0 ? questions : undefined
    };

    const newFile = this.editNewPdfFile();

    const request$ = newFile
      ? this.readerApi.updateTestMultipart(test.id, payload, newFile)
      : this.readerApi.updateTestJson(test.id, payload);

    request$.subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.isEditModalOpen.set(false);
        this.editingTest.set(null);
        this.editNewPdfFile.set(null);
        this.toast.success(`Đã cập nhật đề thi "${updated.testName}" thành công!`);
        this.loadData();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err.message || 'Lỗi khi cập nhật đề thi');
        this.cdr.markForCheck();
      }
    });
  }

  openDeleteModal(test: TestSummary, event?: Event) {
    if (event) event.stopPropagation();
    this.deletingTest.set(test);
    this.isDeleteModalOpen.set(true);
    this.cdr.markForCheck();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.deletingTest.set(null);
    this.cdr.markForCheck();
  }

  confirmDelete() {
    const test = this.deletingTest();
    if (!test) return;
    this.isDeleting.set(true);
    this.readerApi.deleteTest(test.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.isDeleteModalOpen.set(false);
        this.deletingTest.set(null);
        this.toast.success(`Đã xóa đề thi "${test.testName}"`);
        this.loadData();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.toast.error(err.message || 'Lỗi khi xóa đề thi');
        this.cdr.markForCheck();
      }
    });
  }
}