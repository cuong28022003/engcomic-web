import { Injectable, computed, signal } from '@angular/core';
import { PacingStatus, PartTiming, TimeTargetConfig } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TestTimerService {
  readonly totalElapsed = signal<number>(0);
  readonly currentPart = signal<5 | 6 | 7>(5);
  readonly partTimings = signal<Record<number, PartTiming>>({});
  readonly isRunning = signal<boolean>(false);
  readonly isExpired = signal<boolean>(false);
  readonly config = signal<TimeTargetConfig | null>(null);

  private questionStartTime: number | null = null;
  private questionTimings: Record<number, number> = {};
  private currentTrackedQuestion = 101;
  private intervalId: any = null;
  private onExpireCallback?: () => void;

  init(config: TimeTargetConfig, onExpire?: () => void): void {
    this.stop();
    this.config.set(config);
    this.totalElapsed.set(0);

    const selected = (config.selectedParts && config.selectedParts.length > 0) ? config.selectedParts : [5, 6, 7];
    const firstPart = (selected[0] as 5 | 6 | 7) || 5;
    this.currentPart.set(firstPart);
    this.currentTrackedQuestion = firstPart === 5 ? 101 : (firstPart === 6 ? 131 : 147);

    this.questionStartTime = null;
    this.questionTimings = {};
    this.isExpired.set(false);
    this.onExpireCallback = onExpire;

    let p5Sec = (config.part5_minutes ?? 20) * 60;
    let p6Sec = (config.part6_minutes ?? 10) * 60;
    let p7Sec = (config.part7_minutes ?? 45) * 60;

    if (config.mode === 'full_test') {
      p5Sec = 20 * 60;
      p6Sec = 10 * 60;
      p7Sec = 45 * 60;
    } else if (config.mode === 'untimed') {
      p5Sec = 0;
      p6Sec = 0;
      p7Sec = 0;
    }

    const parts: PartTiming[] = [
      { part: 5, target_seconds: p5Sec, elapsed_seconds: 0, start_question: 101, end_question: 130 },
      { part: 6, target_seconds: p6Sec, elapsed_seconds: 0, start_question: 131, end_question: 146 },
      { part: 7, target_seconds: p7Sec, elapsed_seconds: 0, start_question: 147, end_question: 200 }
    ];

    this.partTimings.set(Object.fromEntries(parts.map(p => [p.part, p])));
  }

  start(): void {
    if (this.isRunning()) return;

    this.isRunning.set(true);
    this.questionStartTime = Date.now();

    this.intervalId = setInterval(() => {
      this.totalElapsed.update(v => v + 1);

      const curPart = this.currentPart();
      this.partTimings.update(timings => {
        const part = timings[curPart];
        if (part) {
          part.elapsed_seconds++;
        }
        return { ...timings };
      });

      // Check expire for timed modes
      const cfg = this.config();
      if (cfg && cfg.mode !== 'untimed') {
        const totalTarget = this.totalTargetSeconds();
        if (totalTarget > 0 && this.totalElapsed() >= totalTarget && !this.isExpired()) {
          this.isExpired.set(true);
          if (this.onExpireCallback) {
            this.onExpireCallback();
          }
        }
      }
    }, 1000);
  }

  pause(): void {
    if (!this.isRunning()) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning.set(false);

    if (this.questionStartTime !== null) {
      const spent = Math.round((Date.now() - this.questionStartTime) / 1000);
      this.questionTimings[this.currentTrackedQuestion] = (this.questionTimings[this.currentTrackedQuestion] || 0) + spent;
      this.questionStartTime = null;
    }
  }

  resume(): void {
    if (this.isRunning()) return;
    this.start();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning.set(false);

    if (this.questionStartTime !== null) {
      const spent = Math.round((Date.now() - this.questionStartTime) / 1000);
      this.questionTimings[this.currentTrackedQuestion] = (this.questionTimings[this.currentTrackedQuestion] || 0) + spent;
      this.questionStartTime = null;
    }
  }

  /**
   * Gọi khi người dùng click/focus vào câu hỏi (chọn đáp án hoặc click bảng đáp án)
   */
  onQuestionFocus(questionNum: number): void {
    const now = Date.now();
    if (this.questionStartTime !== null) {
      const prevQuestion = this.currentTrackedQuestion;
      const spent = Math.round((now - this.questionStartTime) / 1000);
      this.questionTimings[prevQuestion] = (this.questionTimings[prevQuestion] || 0) + spent;
    }

    this.questionStartTime = now;
    this.currentTrackedQuestion = questionNum;

    // Tự động chuyển currentPart nếu câu này thuộc Part khác
    const newPart = this.getPartByQuestion(questionNum);
    if (newPart !== this.currentPart()) {
      this.currentPart.set(newPart);
    }
  }

  private getPartByQuestion(num: number): 5 | 6 | 7 {
    if (num <= 130) return 5;
    if (num <= 146) return 6;
    return 7;
  }

  getQuestionTiming(questionNum: number): number {
    let extra = 0;
    if (this.isRunning() && this.questionStartTime !== null && this.currentTrackedQuestion === questionNum) {
      extra = Math.round((Date.now() - this.questionStartTime) / 1000);
    }
    return (this.questionTimings[questionNum] || 0) + extra;
  }

  getAllQuestionTimings(): Record<number, number> {
    const result = { ...this.questionTimings };
    if (this.questionStartTime !== null) {
      const extra = Math.round((Date.now() - this.questionStartTime) / 1000);
      result[this.currentTrackedQuestion] = (result[this.currentTrackedQuestion] || 0) + extra;
    }
    return result;
  }

  getPartElapsed(part: 5 | 6 | 7): number {
    return this.partTimings()[part]?.elapsed_seconds || 0;
  }

  getPartTarget(part: 5 | 6 | 7): number {
    return this.partTimings()[part]?.target_seconds || 0;
  }

  // === COMPUTEDS FOR UI & PACING ===

  readonly currentPartRemaining = computed<number>(() => {
    const timing = this.partTimings()[this.currentPart()];
    if (!timing || timing.target_seconds === 0) return 0;
    return Math.max(0, timing.target_seconds - timing.elapsed_seconds);
  });

  readonly totalTargetSeconds = computed<number>(() => {
    const cfg = this.config();
    const selected = cfg?.selectedParts || [5, 6, 7];
    const timings = Object.values(this.partTimings()).filter(t => selected.includes(t.part));
    return timings.reduce((sum, t) => sum + t.target_seconds, 0);
  });

  readonly totalRemaining = computed<number>(() => {
    const totalTarget = this.totalTargetSeconds();
    if (totalTarget === 0) return 0;
    return Math.max(0, totalTarget - this.totalElapsed());
  });

  readonly currentPartTimeProgress = computed<number>(() => {
    const timing = this.partTimings()[this.currentPart()];
    if (!timing || timing.target_seconds === 0) return 0;
    return Math.min(100, Math.round((timing.elapsed_seconds / timing.target_seconds) * 100));
  });

  readonly pacingStatus = computed<PacingStatus>(() => {
    const part = this.currentPart();
    const timing = this.partTimings()[part];
    if (!timing || timing.target_seconds === 0) return 'on_track';

    const timeRatio = timing.elapsed_seconds / timing.target_seconds;
    const totalQuestionsInPart = timing.end_question - timing.start_question + 1;
    const questionsDone = Math.max(0, this.currentTrackedQuestion - timing.start_question + 1);
    const questionRatio = questionsDone / totalQuestionsInPart;

    if (timeRatio > questionRatio + 0.15) return 'behind'; // Trễ nhịp
    if (timeRatio < questionRatio - 0.15) return 'ahead';  // Nhanh hơn dự kiến
    return 'on_track';
  });

  formatSeconds(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}