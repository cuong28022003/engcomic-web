import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestTimerService } from '../../services/test-timer.service';
import { ConfirmDialogService } from '@shared/components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-pacing-status-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pacing-status-bar.component.html',
  styleUrls: ['./pacing-status-bar.component.scss']
})
export class PacingStatusBarComponent {
  readonly timerService = inject(TestTimerService);
  private confirmDialog = inject(ConfirmDialogService);

  /** Mảng số câu đã chọn đáp án để tính % tiến độ Part */
  readonly answeredQuestions = input<Record<number, string>>({});

  readonly currentPartElapsed = computed<number>(() => {
    return this.timerService.getPartElapsed(this.timerService.currentPart());
  });

  readonly partStartQuestion = computed<number>(() => {
    const timing = this.partTiming();
    return timing?.start_question ?? 1;
  });

  readonly partEndQuestion = computed<number>(() => {
    const timing = this.partTiming();
    return timing?.end_question ?? 200;
  });

  private readonly partTiming = computed(() => {
    return this.timerService.partTimings()[this.timerService.currentPart()];
  });

  readonly partTotalQuestions = computed<number>(() => {
    return this.partEndQuestion() - this.partStartQuestion() + 1;
  });

  readonly partQuestionsDone = computed<number>(() => {
    const start = this.partStartQuestion();
    const end = this.partEndQuestion();
    const answers = this.answeredQuestions();
    let count = 0;
    for (let q = start; q <= end; q++) {
      if (answers[q] && answers[q].trim().length > 0) {
        count++;
      }
    }
    return count;
  });

  readonly partQuestionsPercent = computed<number>(() => {
    const total = this.partTotalQuestions();
    if (total === 0) return 0;
    return Math.min(100, Math.round((this.partQuestionsDone() / total) * 100));
  });

  readonly totalQuestionsCount = computed<number>(() => {
    const answers = this.answeredQuestions();
    const keys = Object.keys(answers);
    return keys.length > 0 ? Math.max(100, keys.length) : 100;
  });

  readonly totalQuestionsDone = computed<number>(() => {
    const answers = this.answeredQuestions();
    let count = 0;
    for (const k of Object.keys(answers)) {
      if (answers[+k] && answers[+k].trim().length > 0) {
        count++;
      }
    }
    return count;
  });

  readonly totalQuestionsPercent = computed<number>(() => {
    const total = this.totalQuestionsCount();
    if (total === 0) return 0;
    return Math.min(100, Math.round((this.totalQuestionsDone() / total) * 100));
  });

  resetMainTimer(): void {
    this.confirmDialog.confirm({
      title: 'Đặt lại đồng hồ bài thi',
      message: 'Bạn có chắc muốn đặt lại thời gian làm bài về 0? Đồng hồ sẽ đếm lại từ đầu toàn bộ Parts.',
      confirmText: 'Đặt lại & đếm lại',
      cancelText: 'Hủy bỏ',
      type: 'warning'
    }).subscribe((confirmed) => {
        if (confirmed) {
          this.timerService.resetElapsed();
        }
      });
  }
}