import { Component, OnInit, ChangeDetectorRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoadingComponent, ErrorStateComponent, BreadcrumbComponent, BreadcrumbItem } from '@shared/components';
import { PdfViewerComponent } from '../reading-session/pdf-viewer/pdf-viewer.component';
import { AiReviewImportModalComponent } from '../reading-session/ai-review-import-modal/ai-review-import-modal.component';
import { ReaderApiService } from '../services/reader-api.service';
import { PendingItemApiService } from '../../../core/services/pending-item-api.service';
import { ImportReviewItemsPayload, TestDetail, ToeicAttempt, ToeicAttemptAnswer, ToeicReviewItem } from '../models';
import { PartStrategyPopoverComponent } from '../reading-session/part-strategy-popover/part-strategy-popover.component';
import { ToastService } from '@core/services/toast.service';
import { resolveBackendPath } from '../utils/backend-url.util';

@Component({
  selector: 'app-attempt-review',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingComponent,
    ErrorStateComponent,
    PdfViewerComponent,
    AiReviewImportModalComponent,
    BreadcrumbComponent,
    PartStrategyPopoverComponent
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

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Luyện Đề TOEIC', url: '/reader', icon: 'fa-solid fa-book-open-reader' },
    { label: this.attempt()?.testName || 'Xem Lại Bài Thi' }
  ]);

  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  activeMobileTab = signal<'pdf' | 'answers'>('answers');
  filterMode = signal<'all' | 'wrong' | 'flagged' | 'correct' | 'reviewed'>('all');
  selectedQuestionNumber = signal<number | null>(null);
  addedWords = signal<Set<string>>(new Set());

  showImportModal = signal<boolean>(false);
  isImportingReviews = signal<boolean>(false);

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

  readonly currentActivePart = computed<number>(() => {
    const ans = this.currentAnswer();
    if (ans && ans.part) return ans.part;
    const qNum = this.selectedQuestionNumber();
    if (qNum !== null) {
      if (qNum <= 130) return 5;
      if (qNum <= 146) return 6;
      return 7;
    }
    return 5;
  });

  readonly selectedReviewItem = computed<ToeicReviewItem | null>(() => {
    const qNum = this.selectedQuestionNumber();
    if (qNum === null) return null;
    return this.reviewItemsMap().get(qNum) || null;
  });

  readonly audioUrl = computed<string>(() => resolveBackendPath(this.test()?.audioUrl));

  readonly currentQuestionDetail = computed<{ number: number; part?: number; audioStartMs?: number; transcript?: string } | undefined>(() => {
    const qNum = this.selectedQuestionNumber();
    if (qNum === null) return undefined;
    return this.test()?.questions.find(q => q.number === qNum);
  });

  readonly currentTranscript = computed<string>(() => {
    const q = this.currentQuestionDetail();
    if (q?.transcript?.trim()) return q.transcript.trim();
    return this.selectedReviewItem()?.transcript?.trim() || '';
  });

  readonly currentTranscriptHasSpeaker = computed<boolean>(() => {
    return this.currentTranscriptLines().some(l => l.speaker != null);
  });

  readonly currentQuestionPart = computed<number | null>(() => {
    const detail = this.currentQuestionDetail();
    if (detail?.part != null && detail.part > 0) return detail.part;
    const answer = this.currentAnswer();
    return answer?.part ?? null;
  });

  readonly currentTranscriptLines = computed<Array<{ speaker: string | null; text: string }>>(() => {
    const raw = this.currentTranscript();
    if (!raw) return [];
    const speakerRx = /^\s*(Woman(?:\s+[AB])?|Man(?:\s+[AB])?|Speaker\s*\d*|Male\d*|Female\d*|Interviewer\d*|Host|M|W)\s*[:：]\s*(.*)$/i;
    return raw
      .split(/\r?\n/)
      .map(line => {
        const m = line.match(speakerRx);
        if (m && m[1]) {
          return { speaker: m[1], text: (m[2] || '').trim() };
        }
        return { speaker: null, text: line.trim() };
      })
      .filter(l => l.speaker || l.text.length > 0);
  });

  readonly currentAudioStartMs = computed<number | null>(() => {
    const q = this.currentQuestionDetail();
    return q && q.audioStartMs != null ? q.audioStartMs : null;
  });

  private audioEl?: HTMLAudioElement;

  onAudioReady(el: HTMLAudioElement): void {
    this.audioEl = el;
  }

  playCurrentQuestionAudio(): void {
    if (!this.audioEl) return;
    const ms = this.currentAudioStartMs();
    if (ms != null) {
      this.audioEl.currentTime = ms / 1000;
    }
    void this.audioEl.play();
  }

  readonly currentFilterLabel = computed<string>(() => {
    switch (this.filterMode()) {
      case 'wrong':
        return 'Câu làm sai';
      case 'flagged':
        return 'Câu phân vân';
      case 'correct':
        return 'Câu làm đúng';
      case 'reviewed':
        return 'Câu đã có AI';
      case 'all':
      default:
        return 'Tất cả câu hỏi';
    }
  });

  readonly questionsNeedingReview = computed(() => {
    return this.filteredQuestions().map(a => ({
      questionNumber: a.questionNumber,
      part: a.part,
      userAnswer: a.userAnswer,
      correctAnswer: a.correctAnswer || '',
      isCorrect: this.isAnswerCorrect(a),
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
    this.isImportingReviews.set(false);
    this.showImportModal.set(true);
    this.cdr.markForCheck();
  }

  closeAiImportModal() {
    this.isImportingReviews.set(false);
    this.showImportModal.set(false);
    this.cdr.markForCheck();
  }

  handleImportReviews(payload: ImportReviewItemsPayload) {
    this.isImportingReviews.set(true);
    this.readerApi.importAttemptReviews(this.attemptId(), payload).subscribe({
      next: (savedList) => {
        this.isImportingReviews.set(false);
        this.reviewItems.set(savedList || []);
        this.showImportModal.set(false);
        this.toast.success(`Đã import thành công phân tích cho ${savedList.length} câu!`);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isImportingReviews.set(false);
        this.toast.error(err.message || 'Import thất bại. Vui lòng kiểm tra lại định dạng JSON!');
        this.cdr.markForCheck();
      }
    });
  }
}
