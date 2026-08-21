import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestTimerService } from '../../services/test-timer.service';

@Component({
  selector: 'app-pacing-status-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pacing-status-bar.component.html',
  styleUrls: ['./pacing-status-bar.component.scss']
})
export class PacingStatusBarComponent {
  readonly timerService = inject(TestTimerService);

  /** Mảng số câu đã chọn đáp án để tính % tiến độ Part */
  readonly answeredQuestions = input<Record<number, string>>({});

  readonly currentPartElapsed = computed<number>(() => {
    return this.timerService.getPartElapsed(this.timerService.currentPart());
  });

  readonly partStartQuestion = computed<number>(() => {
    const part = this.timerService.currentPart();
    if (part === 5) return 101;
    if (part === 6) return 131;
    return 147;
  });

  readonly partEndQuestion = computed<number>(() => {
    const part = this.timerService.currentPart();
    if (part === 5) return 130;
    if (part === 6) return 146;
    return 200;
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
}