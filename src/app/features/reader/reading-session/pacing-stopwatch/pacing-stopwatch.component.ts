import { Component, OnInit, OnDestroy, signal, computed, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';

export interface StopwatchPreset {
  label: string;
  seconds: number;
  partTip?: string;
}

@Component({
  selector: 'app-pacing-stopwatch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pacing-stopwatch.component.html',
  styleUrls: ['./pacing-stopwatch.component.scss']
})
export class PacingStopwatchComponent implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private toast = inject(ToastService);

  // Core Timer State (Signal-based)
  readonly totalDurationSeconds = signal<number>(180); // Mặc định 3 phút (chuẩn đoạn đơn Part 7)
  readonly remainingSeconds = signal<number>(180);
  readonly isRunning = signal<boolean>(false);
  readonly isFinished = signal<boolean>(false);
  readonly isExpanded = signal<boolean>(false);

  private intervalId: any = null;
  private audioCtx: AudioContext | null = null;

  // Presets thời gian thông dụng trong TOEIC
  readonly presets: StopwatchPreset[] = [
    { label: '30s', seconds: 30, partTip: 'Part 5 (30s/câu)' },
    { label: '1m', seconds: 60, partTip: 'Part 6 (1m/câu)' },
    { label: '2m', seconds: 120, partTip: 'Part 6 / Đoạn ngắn' },
    { label: '3m', seconds: 180, partTip: 'Đoạn đơn Part 7 (2-3 câu)' },
    { label: '5m', seconds: 300, partTip: 'Đoạn đôi Part 7 (5 câu)' },
    { label: '8m', seconds: 480, partTip: 'Đoạn ba Part 7 (5 câu khó)' },
    { label: '10m', seconds: 600, partTip: 'Chặng 10 phút' },
    { label: '15m', seconds: 900, partTip: 'Chặng 15 phút' }
  ];

  // Computeds
  readonly formattedMinutes = computed<string>(() => {
    const sec = this.remainingSeconds();
    const m = Math.floor(sec / 60);
    return m.toString().padStart(2, '0');
  });

  readonly formattedSeconds = computed<string>(() => {
    const sec = this.remainingSeconds();
    const s = sec % 60;
    return s.toString().padStart(2, '0');
  });

  readonly formattedTime = computed<string>(() => {
    return `${this.formattedMinutes()}:${this.formattedSeconds()}`;
  });

  readonly progressPercent = computed<number>(() => {
    const total = this.totalDurationSeconds();
    if (total <= 0) return 0;
    const remaining = this.remainingSeconds();
    return Math.max(0, Math.min(100, Math.round((remaining / total) * 100)));
  });

  readonly urgencyLevel = computed<'normal' | 'warning' | 'danger' | 'finished'>(() => {
    if (this.isFinished() || this.remainingSeconds() === 0) return 'finished';
    const sec = this.remainingSeconds();
    const total = this.totalDurationSeconds();
    const percent = total > 0 ? (sec / total) * 100 : 100;

    if (sec <= 10 || percent <= 15) return 'danger';
    if (sec <= 30 || percent <= 35) return 'warning';
    return 'normal';
  });

  ngOnInit(): void {
    // Sẵn sàng timer
  }

  ngOnDestroy(): void {
    this.stopTimerInterval();
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isExpanded()) return;
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isExpanded.set(false);
    }
  }

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  openPanel(): void {
    this.isExpanded.set(true);
  }

  closePanel(): void {
    this.isExpanded.set(false);
  }

  selectPreset(preset: StopwatchPreset): void {
    this.stopTimerInterval();
    this.totalDurationSeconds.set(preset.seconds);
    this.remainingSeconds.set(preset.seconds);
    this.isRunning.set(false);
    this.isFinished.set(false);
  }

  adjustDuration(deltaSeconds: number): void {
    if (this.isRunning()) return;
    const current = this.remainingSeconds();
    const next = Math.max(10, Math.min(3600, current + deltaSeconds));
    this.totalDurationSeconds.set(next);
    this.remainingSeconds.set(next);
    this.isFinished.set(false);
  }

  start(): void {
    if (this.isRunning()) return;
    if (this.remainingSeconds() <= 0) {
      this.remainingSeconds.set(this.totalDurationSeconds());
    }

    this.isRunning.set(true);
    this.isFinished.set(false);

    let lastTick = Date.now();
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.round((now - lastTick) / 1000);
      if (elapsed >= 1) {
        lastTick = now;
        const current = this.remainingSeconds();
        if (current <= 1) {
          this.remainingSeconds.set(0);
          this.onTimerFinished();
        } else {
          this.remainingSeconds.update(v => v - 1);
        }
      }
    }, 250);
  }

  pause(): void {
    if (!this.isRunning()) return;
    this.stopTimerInterval();
    this.isRunning.set(false);
  }

  reset(): void {
    this.stopTimerInterval();
    this.isRunning.set(false);
    this.remainingSeconds.set(this.totalDurationSeconds());
    this.isFinished.set(false);
  }

  private stopTimerInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private onTimerFinished(): void {
    this.stopTimerInterval();
    this.isRunning.set(false);
    this.isFinished.set(true);
    this.playAudioAlert();
    this.toast.warning('⏱️ Hết thời gian mục tiêu! Hãy chuyển sang câu tiếp theo.');
  }

  private playAudioAlert(): void {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Beep 1 (880 Hz - note A5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Beep 2 (1046 Hz - note C6, cách 180ms)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.18);
      gain2.gain.setValueAtTime(0.15, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.38);
    } catch (e) {
      // Browser audio policy might block auto-play without prior interaction, fail silently
    }
  }
}
