import { Component, OnInit, OnDestroy, HostListener, ViewChild, ChangeDetectorRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoadingComponent, ErrorStateComponent, ModalComponent, BreadcrumbComponent, BreadcrumbItem } from '@shared/components';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { AnswerSheetComponent } from './answer-sheet/answer-sheet.component';
import { PreTestConfigModalComponent } from './pre-test-config-modal/pre-test-config-modal.component';
import { ResumeAttemptModalComponent } from './resume-attempt-modal/resume-attempt-modal.component';
import { AttemptHistoryModalComponent } from './attempt-history-modal/attempt-history-modal.component';
import { ReaderApiService } from '../services/reader-api.service';
import { MistakeQueueService } from '../services/mistake-queue.service';
import { TestTimerService } from '../services/test-timer.service';
import { TestSessionService } from '../services/test-session.service';
import { GradedQuestion, SubmitSessionPayload, SubmitSessionResponse, TestDetail, TimeTargetConfig, ToeicAttempt } from '../models';

import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-reading-session',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    PdfViewerComponent, 
    AnswerSheetComponent, 
    PreTestConfigModalComponent,
    ResumeAttemptModalComponent,
    AttemptHistoryModalComponent,
    LoadingComponent, 
    ErrorStateComponent,
    ModalComponent,
    BreadcrumbComponent
  ],
  templateUrl: './reading-session.component.html',
  styleUrls: ['./reading-session.component.scss']
})
export class ReadingSessionComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private readerApi = inject(ReaderApiService);
  private mistakeQueueService = inject(MistakeQueueService);
  private toast = inject(ToastService);
  readonly timerService = inject(TestTimerService);
  readonly sessionService = inject(TestSessionService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(AnswerSheetComponent) answerSheet?: AnswerSheetComponent;

  testId = signal<string>('');
  test = signal<TestDetail | null>(null);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Luyện Đề TOEIC', url: '/reader', icon: 'fa-solid fa-book-open-reader' },
    { label: this.test()?.testName || 'Phòng Thi TOEIC' }
  ]);

  showConfigModal = signal<boolean>(false);
  showResumeModal = signal<boolean>(false);
  showTimeUpModal = signal<boolean>(false);
  activeAttempt = signal<ToeicAttempt | null>(null);

  showHistoryModal = signal<boolean>(false);
  historyAttempts = signal<ToeicAttempt[]>([]);

  selectedParts = signal<number[]>([5, 6, 7]);
  isSubmitted = signal<boolean>(false);
  submissionResult = signal<SubmitSessionResponse | null>(null);
  gradedResults = signal<GradedQuestion[]>([]);

  readonly filteredQuestions = computed<Array<{ number: number; part: number }>>(() => {
    const t = this.test();
    if (!t || !t.questions) return [];
    const parts = this.selectedParts();
    return t.questions.filter(q => parts.includes(q.part));
  });

  // Mobile layout tab
  activeMobileTab = signal<'pdf' | 'answers'>('answers');

  @HostListener('window:beforeunload')
  onBeforeUnload() {
    this.sessionService.onLeavePageBeacon();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('testId');
      if (id) {
        this.testId.set(id);
        this.loadTestDetailAndCheckAttempt();
      }
    });
  }

  ngOnDestroy() {
    this.sessionService.onLeavePageBeacon();
  }

  loadTestDetailAndCheckAttempt() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.cdr.markForCheck();

    this.readerApi.getTestDetail(this.testId()).subscribe({
      next: (detail) => {
        this.test.set(detail);
        this.loading.set(false);
        this.checkActiveAttempt();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Không thể tải thông tin bài thi');
        this.cdr.markForCheck();
      }
    });
  }

  private checkActiveAttempt() {
    this.readerApi.getActiveAttempt(this.testId()).subscribe({
      next: (att) => {
        if (att) {
          this.activeAttempt.set(att);
          this.showResumeModal.set(true);
          this.showConfigModal.set(false);
        } else {
          this.showConfigModal.set(true);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.showConfigModal.set(true);
        this.cdr.markForCheck();
      }
    });
  }

  onResumeAttempt(att: ToeicAttempt) {
    this.sessionService.setCurrentAttempt(att);
    if (att.selectedParts && att.selectedParts.length > 0) {
      this.selectedParts.set(att.selectedParts);
    }

    const config: TimeTargetConfig = {
      mode: att.timeMode || 'full_test',
      selectedParts: att.selectedParts,
      part5_minutes: (att.part5TargetSeconds || 1200) / 60,
      part6_minutes: (att.part6TargetSeconds || 600) / 60,
      part7_minutes: (att.part7TargetSeconds || 2700) / 60
    };

    this.timerService.init(config, () => {
      this.showTimeUpModal.set(true);
      this.toast.warning('Đã hết giờ làm bài mục tiêu!');
      this.cdr.markForCheck();
    });

    // Restore timer elapsed
    this.timerService.totalElapsed.set(att.totalElapsedSeconds || 0);
    this.timerService.start();

    // Restore answers into answer sheet
    setTimeout(() => {
      if (this.answerSheet && att.answers) {
        this.answerSheet.loadAnswers(att.answers);
      }
    }, 100);

    this.showResumeModal.set(false);
    this.cdr.markForCheck();
  }

  async onAbandonAttempt(att: ToeicAttempt) {
    await this.sessionService.abandonCurrentAttempt();
    this.showResumeModal.set(false);
    this.showConfigModal.set(true);
    this.cdr.markForCheck();
  }

  setMobileTab(tab: 'pdf' | 'answers'): void {
    this.activeMobileTab.set(tab);
    this.cdr.markForCheck();
  }

  async onStartTest(config: TimeTargetConfig): Promise<void> {
    if (config.selectedParts && config.selectedParts.length > 0) {
      this.selectedParts.set(config.selectedParts);
    }

    try {
      await this.sessionService.startNewAttempt(this.testId(), config);
    } catch (e) {
      console.warn('Could not start new attempt on backend:', e);
    }

    this.timerService.init(config, () => {
      this.showTimeUpModal.set(true);
      this.toast.warning('Đã hết giờ làm bài mục tiêu!');
      this.cdr.markForCheck();
    });
    this.timerService.start();
    this.showConfigModal.set(false);
    this.cdr.markForCheck();
  }

  closeTimeUpModal(): void {
    this.showTimeUpModal.set(false);
    this.cdr.markForCheck();
  }

  submitFromTimeUpModal(): void {
    this.showTimeUpModal.set(false);
    if (this.answerSheet) {
      this.answerSheet.submitDirectly();
    }
  }

  onCancelConfig(): void {
    this.showConfigModal.set(false);
    this.router.navigate(['/reader']);
  }

  openHistory(): void {
    this.readerApi.getAttemptsForTest(this.testId()).subscribe({
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

  closeHistory(): void {
    this.showHistoryModal.set(false);
    this.cdr.markForCheck();
  }

  onSubmitAnswers(payload: SubmitSessionPayload): void {
    this.submitting.set(true);
    this.cdr.markForCheck();

    const currentAttemptId = this.sessionService.currentAttempt()?.id;
    const request$ = currentAttemptId 
      ? this.readerApi.submitAttempt(currentAttemptId, payload)
      : this.readerApi.submitSession(this.testId(), payload);

    request$.subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.isSubmitted.set(true);
        this.submissionResult.set(res);
        this.gradedResults.set(res.results);
        this.sessionService.clear();

        // Auto update local mistake queue
        if (res.newMistakes && res.newMistakes.length > 0) {
          this.mistakeQueueService.addMistakes(res.newMistakes);
        }

        this.toast.success(`Nộp bài thành công! Điểm của bạn: ${res.rawScore}/${res.totalQuestions}`);

        // Navigate to result summary page
        this.router.navigate(['/reader', this.testId(), 'result'], {
          state: { result: res }
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(err.message || 'Gặp lỗi khi nộp bài. Vui lòng thử lại!');
        this.cdr.markForCheck();
      }
    });
  }
}