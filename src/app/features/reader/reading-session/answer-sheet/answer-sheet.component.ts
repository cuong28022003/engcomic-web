import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionRowComponent } from '../question-row/question-row.component';
import { PacingStatusBarComponent } from '../pacing-status-bar/pacing-status-bar.component';
import { GradedQuestion, SubmitSessionPayload, UserAnswerItem } from '../../models';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';
import { TestTimerService } from '../../services/test-timer.service';
import { TestSessionService } from '../../services/test-session.service';

@Component({
  selector: 'app-answer-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, QuestionRowComponent, PacingStatusBarComponent],
  templateUrl: './answer-sheet.component.html',
  styleUrls: ['./answer-sheet.component.scss']
})
export class AnswerSheetComponent implements OnInit, OnDestroy {
  readonly timerService = inject(TestTimerService);
  private testSessionService = inject(TestSessionService);
  private confirmDialog = inject(ConfirmDialogService);

  @Input() testId = '';
  @Input() testName = '';
  @Input() questions: Array<{ number: number; part: number }> = [];
  @Input() isSubmitted = false;
  @Input() gradedResults: GradedQuestion[] = [];

  @Output() submitAnswers = new EventEmitter<SubmitSessionPayload>();

  // Map from questionNumber to { answer, flagged }
  userAnswersMap = new Map<number, { answer?: string; flagged?: boolean }>();

  // Timer
  secondsElapsed = 0;
  private timerInterval?: any;

  // Filter
  filterTab: 'all' | 'unanswered' | 'flagged' | 'p5' | 'p6' | 'p7' = 'all';

  ngOnInit() {
    if (!this.isSubmitted) {
      this.startTimer();
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private get storageKey(): string {
    return `toeic_session_${this.testId}`;
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.secondsElapsed++;
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTimer(sec: number): string {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  resetAnswers() {
    this.userAnswersMap.clear();
    this.secondsElapsed = 0;
    if (this.testId) {
      localStorage.removeItem(this.storageKey);
    }
  }

  private saveToLocalStorage() {
    if (this.isSubmitted || !this.testId) return;
    const obj: Record<number, { answer?: string; flagged?: boolean }> = {};
    this.userAnswersMap.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(this.storageKey, JSON.stringify({
      answers: obj,
      seconds: this.secondsElapsed
    }));
  }

  private restoreFromLocalStorage() {
    if (!this.testId) return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.answers) {
          this.userAnswersMap.clear();
          Object.keys(parsed.answers).forEach(k => {
            this.userAnswersMap.set(Number(k), parsed.answers[k]);
          });
        }
        if (parsed.seconds && !this.isSubmitted) {
          this.secondsElapsed = Number(parsed.seconds);
        }
      }
    } catch (e) {
      console.warn('Failed to restore session from LocalStorage', e);
    }
  }

  get rawAnsweredMap(): Record<number, string> {
    const res: Record<number, string> = {};
    this.userAnswersMap.forEach((v, k) => {
      if (v.answer) res[k] = v.answer;
    });
    return res;
  }

  loadAnswers(answers: Array<{ questionNumber: number; userAnswer?: string; flagged?: boolean }>) {
    this.userAnswersMap.clear();
    answers.forEach(a => {
      this.userAnswersMap.set(a.questionNumber, { answer: a.userAnswer, flagged: a.flagged });
    });
    this.saveToLocalStorage();
  }

  onAnswerSelected(questionNumber: number, answer: string) {
    this.timerService.onQuestionFocus(questionNumber);
    const qObj = this.questions.find(q => q.number === questionNumber);
    const part = qObj ? qObj.part : 5;
    const existing = this.userAnswersMap.get(questionNumber) || {};
    this.userAnswersMap.set(questionNumber, { ...existing, answer });
    this.saveToLocalStorage();

    this.testSessionService.onAnswerSelected(
      questionNumber,
      part,
      answer,
      this.timerService.getQuestionTiming(questionNumber),
      existing.flagged || false
    );
  }

  onFlagToggled(questionNumber: number) {
    const existing = this.userAnswersMap.get(questionNumber) || {};
    const flagged = !existing.flagged;
    this.userAnswersMap.set(questionNumber, { ...existing, flagged });
    this.saveToLocalStorage();

    const qObj = this.questions.find(q => q.number === questionNumber);
    const part = qObj ? qObj.part : 5;
    this.testSessionService.onAnswerSelected(
      questionNumber,
      part,
      existing.answer,
      this.timerService.getQuestionTiming(questionNumber),
      flagged
    );
  }

  get answeredCount(): number {
    let count = 0;
    this.userAnswersMap.forEach((v) => {
      if (v.answer) count++;
    });
    return count;
  }

  get flaggedCount(): number {
    let count = 0;
    this.userAnswersMap.forEach((v) => {
      if (v.flagged) count++;
    });
    return count;
  }

  get filteredQuestions(): Array<{ number: number; part: number }> {
    return this.questions.filter(q => {
      const state = this.userAnswersMap.get(q.number);
      if (this.filterTab === 'unanswered') return !state?.answer;
      if (this.filterTab === 'flagged') return !!state?.flagged;
      if (this.filterTab === 'p5') return q.part === 5;
      if (this.filterTab === 'p6') return q.part === 6;
      if (this.filterTab === 'p7') return q.part === 7;
      return true;
    });
  }

  getGradedInfo(questionNumber: number): GradedQuestion | undefined {
    return this.gradedResults.find(r => r.questionNumber === questionNumber);
  }

  scrollToQuestion(qNum: number) {
    this.timerService.onQuestionFocus(qNum);
    const el = document.getElementById(`q-${qNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  onSubmitClick() {
    const total = this.questions.length;
    const answered = this.answeredCount;
    const unanswered = total - answered;

    let message = 'Bạn có chắc chắn muốn nộp bài để xem điểm và phân tích câu sai?';
    if (unanswered > 0) {
      message = `Bạn vẫn còn ${unanswered} câu chưa làm. Các câu chưa làm sẽ tính là SAI. Bạn có chắc chắn muốn nộp bài?`;
    }

    this.confirmDialog.confirm({
      title: 'Xác nhận nộp bài thi',
      message: message,
      confirmText: 'Nộp bài ngay',
      cancelText: 'Làm tiếp',
      type: unanswered > 0 ? 'warning' : 'info'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.submitDirectly();
      }
    });
  }

  submitDirectly() {
    this.timerService.stop();
    this.stopTimer();
    // Clear localStorage cache for this test
    localStorage.removeItem(this.storageKey);

    const answers: UserAnswerItem[] = this.questions.map(q => {
      const u = this.userAnswersMap.get(q.number);
      return {
        questionNumber: q.number,
        answer: u?.answer,
        flagged: u?.flagged,
        timeSpentSeconds: this.timerService.getQuestionTiming(q.number)
      };
    });

    this.submitAnswers.emit({
      duration: this.timerService.totalElapsed(),
      timeMode: this.timerService.config()?.mode,
      selectedParts: this.timerService.config()?.selectedParts,
      part5TargetSeconds: this.timerService.getPartTarget(5),
      part6TargetSeconds: this.timerService.getPartTarget(6),
      part7TargetSeconds: this.timerService.getPartTarget(7),
      part5ElapsedSeconds: this.timerService.getPartElapsed(5),
      part6ElapsedSeconds: this.timerService.getPartElapsed(6),
      part7ElapsedSeconds: this.timerService.getPartElapsed(7),
      answers
    });
  }
}