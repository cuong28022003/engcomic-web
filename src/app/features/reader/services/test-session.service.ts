import { Injectable, computed, inject, signal } from '@angular/core';
import { ReaderApiService } from './reader-api.service';
import { TestTimerService } from './test-timer.service';
import { SaveProgressPayload, TimeTargetConfig, ToeicAttempt } from '../models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TestSessionService {
  private api = inject(ReaderApiService);
  private timerService = inject(TestTimerService);

  readonly currentAttempt = signal<ToeicAttempt | null>(null);
  readonly isAttemptActive = computed(() => !!this.currentAttempt() && this.currentAttempt()?.status === 'in_progress');

  private autoSaveInterval: any = null;
  private answerBuffer = new Map<number, { questionNumber: number; part: number; answer?: string; flagged?: boolean; timeSpentSeconds?: number }>();

  async startNewAttempt(testId: string, config: TimeTargetConfig): Promise<ToeicAttempt> {
    const payload = {
      timeMode: config.mode,
      selectedParts: config.selectedParts || (config.section === 'listening' ? [1, 2, 3, 4] : [5, 6, 7]),
      part1TargetSeconds: (config.part1_minutes || 5) * 60,
      part2TargetSeconds: (config.part2_minutes || 8) * 60,
      part3TargetSeconds: (config.part3_minutes || 16) * 60,
      part4TargetSeconds: (config.part4_minutes || 16) * 60,
      part5TargetSeconds: (config.part5_minutes || 20) * 60,
      part6TargetSeconds: (config.part6_minutes || 10) * 60,
      part7TargetSeconds: (config.part7_minutes || 45) * 60
    };

    const attempt = await this.api.startAttempt(testId, payload).toPromise();
    if (!attempt) throw new Error('Không thể tạo lượt làm bài');

    this.currentAttempt.set(attempt);
    this.answerBuffer.clear();
    this.startAutoSave();
    return attempt;
  }

  setCurrentAttempt(attempt: ToeicAttempt) {
    this.currentAttempt.set(attempt);
    this.answerBuffer.clear();
    if (attempt.answers) {
      attempt.answers.forEach(a => {
        this.answerBuffer.set(a.questionNumber, {
          questionNumber: a.questionNumber,
          part: a.part,
          answer: a.userAnswer,
          flagged: a.flagged,
          timeSpentSeconds: a.timeSpentSeconds
        });
      });
    }
    if (attempt.status === 'in_progress') {
      this.startAutoSave();
    }
  }

  onAnswerSelected(questionNumber: number, part: number, answer?: string, timeSpentSeconds: number = 0, flagged: boolean = false) {
    this.answerBuffer.set(questionNumber, {
      questionNumber,
      part,
      answer,
      flagged,
      timeSpentSeconds
    });

    // Cập nhật ngay trong background
    this.triggerSaveProgress();
  }

  startAutoSave(intervalMs: number = 10000) {
    this.stopAutoSave();
    this.autoSaveInterval = setInterval(() => {
      this.triggerSaveProgress();
    }, intervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  async triggerSaveProgress(): Promise<void> {
    const attempt = this.currentAttempt();
    if (!attempt || attempt.status !== 'in_progress') return;

    const payload: SaveProgressPayload = {
      totalElapsedSeconds: this.timerService.totalElapsed(),
      part1ElapsedSeconds: this.timerService.getPartElapsed(1),
      part2ElapsedSeconds: this.timerService.getPartElapsed(2),
      part3ElapsedSeconds: this.timerService.getPartElapsed(3),
      part4ElapsedSeconds: this.timerService.getPartElapsed(4),
      part5ElapsedSeconds: this.timerService.getPartElapsed(5),
      part6ElapsedSeconds: this.timerService.getPartElapsed(6),
      part7ElapsedSeconds: this.timerService.getPartElapsed(7),
      answers: Array.from(this.answerBuffer.values())
    };

    try {
      const updated = await this.api.saveAttemptProgress(attempt.id, payload).toPromise();
      if (updated) {
        this.currentAttempt.set(updated);
      }
    } catch (e) {
      console.warn('Auto-save attempt progress failed:', e);
    }
  }

  onLeavePageBeacon() {
    const attempt = this.currentAttempt();
    if (!attempt || attempt.status !== 'in_progress') return;

    this.stopAutoSave();

    const payload: SaveProgressPayload = {
      totalElapsedSeconds: this.timerService.totalElapsed(),
      part1ElapsedSeconds: this.timerService.getPartElapsed(1),
      part2ElapsedSeconds: this.timerService.getPartElapsed(2),
      part3ElapsedSeconds: this.timerService.getPartElapsed(3),
      part4ElapsedSeconds: this.timerService.getPartElapsed(4),
      part5ElapsedSeconds: this.timerService.getPartElapsed(5),
      part6ElapsedSeconds: this.timerService.getPartElapsed(6),
      part7ElapsedSeconds: this.timerService.getPartElapsed(7),
      answers: Array.from(this.answerBuffer.values())
    };

    try {
      const url = `${environment.apiUrl}/toeic/attempts/${attempt.id}/save-progress`;
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, blob);
      }
    } catch (e) {
      console.warn('Beacon save progress failed:', e);
    }
  }

  async abandonCurrentAttempt(): Promise<void> {
    const attempt = this.currentAttempt();
    if (!attempt) return;
    this.stopAutoSave();
    await this.api.abandonAttempt(attempt.id).toPromise();
    this.currentAttempt.set(null);
    this.answerBuffer.clear();
  }

  clear() {
    this.stopAutoSave();
    this.currentAttempt.set(null);
    this.answerBuffer.clear();
  }
}
