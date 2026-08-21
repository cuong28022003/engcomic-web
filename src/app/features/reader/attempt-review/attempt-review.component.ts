import { Component, OnInit, ChangeDetectorRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoadingComponent, ErrorStateComponent } from '@shared/components';
import { PdfViewerComponent } from '../reading-session/pdf-viewer/pdf-viewer.component';
import { AiReviewImportModalComponent } from '../reading-session/ai-review-import-modal/ai-review-import-modal.component';
import { ReaderApiService } from '../services/reader-api.service';
import { PendingItemApiService } from '../../../core/services/pending-item-api.service';
import { ImportReviewItemsPayload, TestDetail, ToeicAttempt, ToeicAttemptAnswer, ToeicReviewItem } from '../models';

import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-attempt-review',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingComponent,
    ErrorStateComponent,
    PdfViewerComponent,
    AiReviewImportModalComponent
  ],
  templateUrl: './attempt-review.component.html',
  styleUrls: ['./attempt-review.component.scss']
})
export class AttemptReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private readerApi = inject(ReaderApiService);
  private pendingApi = inject(PendingItemApiService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  testId = signal<string>('');
  attemptId = signal<string>('');

  test = signal<TestDetail | null>(null);
  attempt = signal<ToeicAttempt | null>(null);
  reviewItems = signal<ToeicReviewItem[]>([]);

  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  activeMobileTab = signal<'pdf' | 'answers'>('answers');
  filterMode = signal<'all' | 'wrong' | 'flagged' | 'correct' | 'reviewed'>('wrong');
  selectedQuestionNumber = signal<number | null>(null);
  addedWords = signal<Set<string>>(new Set());

  showImportModal = signal<boolean>(false);

  readonly reviewItemsMap = computed(() => {
    const map = new Map<number, ToeicReviewItem>();
    this.reviewItems().forEach(r => map.set(r.questionNumber, r));
    return map;
  });

  readonly allQuestions = computed(() => {
    const att = this.attempt();
    if (!att || !att.answers) return [];
    return att.answers;
  });

  readonly allQuestionsCount = computed(() => this.allQuestions().length);

  isAnswerCorrect(a?: ToeicAttemptAnswer): boolean {
    if (!a) return false;
    if (typeof a.isCorrect === 'boolean') return a.isCorrect;
    if (typeof (a as any).correct === 'boolean') return (a as any).correct;
    if (a.userAnswer && a.correctAnswer) {
      return a.userAnswer.trim().toUpperCase() === a.correctAnswer.trim().toUpperCase();
    }
    return false;
  }

  readonly countWrong = computed(() => {
    return this.allQuestions().filter(q => !this.isAnswerCorrect(q)).length;
  });

  readonly countFlagged = computed(() => {
    return this.allQuestions().filter(q => q.flagged).length;
  });

  readonly countCorrect = computed(() => {
    return this.allQuestions().filter(q => this.isAnswerCorrect(q) && !q.flagged).length;
  });

  readonly countReviewed = computed(() => {
    return this.reviewItems().length;
  });

  readonly filteredQuestions = computed(() => {
    const mode = this.filterMode();
    const list = this.allQuestions();

    switch (mode) {
      case 'wrong':
        return list.filter(q => !this.isAnswerCorrect(q));
      case 'flagged':
        return list.filter(q => q.flagged);
      case 'correct':
        return list.filter(q => this.isAnswerCorrect(q) && !q.flagged);
      case 'reviewed':
        return list.filter(q => this.hasReviewItem(q.questionNumber));
      case 'all':
      default:
        return list;
    }
  });

  setFilterMode(mode: 'all' | 'wrong' | 'flagged' | 'correct' | 'reviewed') {
    this.filterMode.set(mode);
    const filtered = this.filteredQuestions();
    if (filtered.length > 0) {
      this.selectQuestion(filtered[0].questionNumber);
    } else {
      this.selectedQuestionNumber.set(null);
    }
    this.cdr.markForCheck();
  }

  readonly currentFilteredIndex = computed(() => {
    const qNum = this.selectedQuestionNumber();
    if (qNum === null) return -1;
    return this.filteredQuestions().findIndex(q => q.questionNumber === qNum);
  });

  readonly hasPrevQuestion = computed(() => {
    return this.currentFilteredIndex() > 0;
  });

  readonly hasNextQuestion = computed(() => {
    const idx = this.currentFilteredIndex();
    return idx >= 0 && idx < this.filteredQuestions().length - 1;
  });

  readonly currentAnswer = computed<ToeicAttemptAnswer | undefined>(() => {
    const qNum = this.selectedQuestionNumber();
    if (qNum === null) return undefined;
    return this.allQuestions().find(a => a.questionNumber === qNum);
  });

  readonly selectedReviewItem = computed<ToeicReviewItem | null>(() => {
    const qNum = this.selectedQuestionNumber();
    if (qNum === null) return null;
    return this.reviewItemsMap().get(qNum) || null;
  });

  readonly questionsNeedingReview = computed(() => {
    return this.allQuestions()
      .filter(a => !a.isCorrect || a.flagged)
      .map(a => ({
        questionNumber: a.questionNumber,
        part: a.part,
        userAnswer: a.userAnswer,
        correctAnswer: a.correctAnswer || '',
        isCorrect: !!a.isCorrect,
        flagged: !!a.flagged
      }));
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const tId = params.get('testId');
      const aId = params.get('attemptId');
      if (tId && aId) {
        this.testId.set(tId);
        this.attemptId.set(aId);
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.cdr.markForCheck();

    this.readerApi.getTestDetail(this.testId()).subscribe({
      next: (t) => {
        this.test.set(t);
        this.readerApi.getAttemptDetail(this.attemptId()).subscribe({
          next: (att) => {
            this.attempt.set(att);
            this.loadReviews();
          },
          error: (err) => {
            this.loading.set(false);
            this.errorMessage.set(err.message || 'Không thể tải thông tin lượt làm bài');
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Không thể tải thông tin đề thi');
        this.cdr.markForCheck();
      }
    });
  }

  private loadReviews() {
    this.readerApi.getAttemptReviews(this.attemptId()).subscribe({
      next: (reviews) => {
        this.reviewItems.set(reviews || []);
        this.loading.set(false);
        this.autoSelectInitialQuestion();
        this.cdr.markForCheck();
      },
      error: () => {
        this.reviewItems.set([]);
        this.loading.set(false);
        this.autoSelectInitialQuestion();
        this.cdr.markForCheck();
      }
    });
  }

  private autoSelectInitialQuestion() {
    // If wrong questions exist, default to wrong and pick first wrong question
    if (this.countWrong() > 0) {
      this.filterMode.set('wrong');
    } else if (this.countFlagged() > 0) {
      this.filterMode.set('flagged');
    } else {
      this.filterMode.set('all');
    }

    const list = this.filteredQuestions();
    if (list.length > 0) {
      this.selectedQuestionNumber.set(list[0].questionNumber);
    }
  }

  selectQuestion(qNum: number) {
    this.selectedQuestionNumber.set(qNum);
    this.cdr.markForCheck();
  }

  prevQuestion() {
    const idx = this.currentFilteredIndex();
    if (idx > 0) {
      const prevQ = this.filteredQuestions()[idx - 1];
      this.selectedQuestionNumber.set(prevQ.questionNumber);
      this.cdr.markForCheck();
    }
  }

  nextQuestion() {
    const idx = this.currentFilteredIndex();
    if (idx >= 0 && idx < this.filteredQuestions().length - 1) {
      const nextQ = this.filteredQuestions()[idx + 1];
      this.selectedQuestionNumber.set(nextQ.questionNumber);
      this.cdr.markForCheck();
    }
  }

  hasReviewItem(qNum: number): boolean {
    return this.reviewItemsMap().has(qNum);
  }

  formatErrorType(type?: string): string {
    if (!type) return 'Từ vựng';
    switch (type.toLowerCase()) {
      case 'vocab': return '🏷 Từ vựng';
      case 'grammar': return '📘 Ngữ pháp';
      case 'inference': return '🧠 Suy luận';
      case 'detail_missed': return '🔍 Bỏ sót chi tiết';
      case 'trap_answer': return '⚠️ Bẫy đề thi';
      case 'time_pressure': return '⏱ Áp lực thời gian';
      default: return type;
    }
  }

  addWordToCollector(word: string) {
    if (this.addedWords().has(word)) return;

    this.pendingApi.create({
      content: word,
      sourceType: 'toeic_review'
    }).subscribe({
      next: () => {
        const nextSet = new Set(this.addedWords());
        nextSet.add(word);
        this.addedWords.set(nextSet);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.warn('Failed to add word to collector:', err);
      }
    });
  }

  openAiImportModal() {
    this.showImportModal.set(true);
    this.cdr.markForCheck();
  }

  closeAiImportModal() {
    this.showImportModal.set(false);
    this.cdr.markForCheck();
  }

  handleImportReviews(payload: ImportReviewItemsPayload) {
    this.readerApi.importAttemptReviews(this.attemptId(), payload).subscribe({
      next: (savedList) => {
        this.reviewItems.set(savedList || []);
        this.showImportModal.set(false);
        this.toast.success(`Đã import thành công phân tích cho ${savedList.length} câu!`);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.toast.error(err.message || 'Import thất bại. Vui lòng kiểm tra lại định dạng JSON!');
        this.cdr.markForCheck();
      }
    });
  }
}
