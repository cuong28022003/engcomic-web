import { Injectable, computed, signal } from '@angular/core';
import { PacingStatus, PartTiming, TimeTargetConfig } from '../models';

const READING_PARTS = [5, 6, 7];
const LISTENING_PARTS = [1, 2, 3, 4];

const READING_RANGES: Record<number, [number, number]> = { 5: [101, 130], 6: [131, 146], 7: [147, 200] };
const LISTENING_RANGES: Record<number, [number, number]> = { 1: [1, 6], 2: [7, 31], 3: [32, 70], 4: [71, 100] };

const READING_DEFAULT_MINUTES: Record<number, number> = { 5: 20, 6: 10, 7: 45 };
const LISTENING_DEFAULT_MINUTES: Record<number, number> = { 1: 5, 2: 8, 3: 16, 4: 16 };

@Injectable({
  providedIn: 'root'
})
export class TestTimerService {
  readonly totalElapsed = signal<number>(0);
  readonly currentPart = signal<number>(5);
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

    const isListening = config.section === 'listening';
    const defaultParts = isListening ? LISTENING_PARTS : READING_PARTS;
    const selected = (config.selectedParts && config.selectedParts.length > 0) ? config.selectedParts : defaultParts;
    const firstPart = selected[0] ?? (isListening ? 1 : 5);
    this.currentPart.set(firstPart);
    this.currentTrackedQuestion = this.getPartRange(firstPart).start;

    this.questionStartTime = null;
    this.questionTimings = {};
    this.isExpired.set(false);
    this.onExpireCallback = onExpire;

    const parts: PartTiming[] = defaultParts
      .filter(p => selected.includes(p))
      .map(p => {
        let target = 0;
        const defaultMin = isListening ? LISTENING_DEFAULT_MINUTES[p] : READING_DEFAULT_MINUTES[p];
        if (config.mode === 'full_test') {
          target = defaultMin * 60;
        } else if (config.mode === 'per_part') {
          target = (config[`part${p}_minutes` as 'part1_minutes'] || defaultMin) * 60;
        }
        const range = this.getPartRange(p);
        return {
          part: p as PartTiming['part'],
          target_seconds: target,
          elapsed_seconds: 0,
          start_question: range.start,
          end_question: range.end
        };
      });

    this.partTimings.set(Object.fromEntries(parts.map(pt => [pt.part, pt])));
  }

  start(): void {
    if (this.isRunning()) return;

    this.isRunning.set(true);
    this.questionStartTime = this.questionStartTime ?? Date.now();

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
    this.commitCurrent();
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
    this.commitCurrent();
  }

  /** Cộng thời gian từ checkpoint hiện tại vào `questionNum` rồi ghi checkpoint mới. */
  private checkpointOn(questionNum: number): void {
    if (this.questionStartTime !== null) {
      const spent = Math.round((Date.now() - this.questionStartTime) / 1000);
      this.questionTimings[questionNum] = (this.questionTimings[questionNum] || 0) + spent;
    }
    this.questionStartTime = Date.now();
  }

  /** Cộng thời gian từ checkpoint hiện tại vào câu đang theo dõi rồi dừng theo dõi. */
  private commitCurrent(): void {
    if (this.questionStartTime !== null) {
      const spent = Math.round((Date.now() - this.questionStartTime) / 1000);
      this.questionTimings[this.currentTrackedQuestion] = (this.questionTimings[this.currentTrackedQuestion] || 0) + spent;
      this.questionStartTime = null;
    }
  }

  onQuestionFocus(questionNum: number): void {
    if (questionNum === this.currentTrackedQuestion) return;

    this.commitCurrent();
    this.currentTrackedQuestion = questionNum;
    if (this.isRunning()) {
      this.questionStartTime = Date.now();
    }

    // Tự động chuyển currentPart nếu câu này thuộc Part khác
    const newPart = this.getPartByQuestion(questionNum);
    if (newPart !== this.currentPart()) {
      this.currentPart.set(newPart);
    }
  }

  onAnswerCommitted(questionNum: number): void {
    this.checkpointOn(questionNum);
    this.currentTrackedQuestion = questionNum;

    // Tự động chuyển currentPart nếu câu này thuộc Part khác
    const newPart = this.getPartByQuestion(questionNum);
    if (newPart !== this.currentPart()) {
      this.currentPart.set(newPart);
    }
  }

  /** Khôi phục thời gian từng câu đã lưu khi tiếp tục (resume) lượt làm bài dang dở. */
  restoreQuestionTimings(timings: Record<number, number>): void {
    this.questionTimings = { ...timings };
  }

  resetElapsed(): void {
    const cfg = this.config();
    if (cfg) {
      this.init(cfg, this.onExpireCallback);
    }
    this.start();
  }

  private getPartRange(num: number): { start: number; end: number } {
    const range = num <= 4 ? LISTENING_RANGES[num] : READING_RANGES[num];
    return { start: range[0], end: range[1] };
  }

  private getPartByQuestion(num: number): number {
    if (num <= 100) {
      if (num <= 6) return 1;
      if (num <= 31) return 2;
      if (num <= 70) return 3;
      return 4;
    }
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

  getPartElapsed(part: number): number {
    return this.partTimings()[part]?.elapsed_seconds || 0;
  }

  getPartTarget(part: number): number {
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
    const selected = cfg?.selectedParts || LISTENING_PARTS.concat(READING_PARTS);
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