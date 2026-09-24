import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AudioSegmentSet {
  startQ: number;
  endQ: number;
  startMs: number;
  endMs: number;
  label: string;
}

@Component({
  selector: 'app-listening-audio-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './listening-audio-bar.component.html',
  styleUrls: ['./listening-audio-bar.component.scss']
})
export class ListeningAudioBarComponent {
  readonly audioUrl = input<string | null | undefined>(undefined);
  readonly questions = input<Array<{ number: number; part: number; audioStartMs?: number }>>([]);
  readonly currentQuestionNumber = input<number | null>(null);

  readonly activeQuestionChanged = output<number | null>();

  private audioEl?: HTMLAudioElement;

  readonly isPlaying = signal<boolean>(false);
  readonly currentTime = signal<number>(0);
  readonly duration = signal<number>(0);
  readonly playbackRate = signal<number>(1);

  readonly hasAudio = computed(() => !!this.audioUrl());

  readonly hasLoadError = signal<boolean>(false);

  /** Nhóm các câu liên tiếp có cùng audioStartMs thành một "set" (Part 3/4). */
  readonly segments = computed<AudioSegmentSet[]>(() => {
    const qs = this.questions()
      .filter(q => q.audioStartMs != null)
      .sort((a, b) => a.number - b.number);

    const result: AudioSegmentSet[] = [];
    let current: AudioSegmentSet | null = null;

    for (const q of qs) {
      const ms = q.audioStartMs ?? 0;
      if (current && current.startMs === ms) {
        current.endQ = q.number;
      } else {
        if (current) current.endMs = ms;
        current = { startQ: q.number, endQ: q.number, startMs: ms, endMs: 0, label: `Câu ${q.number}` };
        result.push(current);
      }
    }
    if (current) {
      const d = this.duration() * 1000;
      current.endMs = d > current.startMs ? d : current.startMs + 1000;
    }
    result.forEach(r => {
      if (r.startQ !== r.endQ) r.label = `Câu ${r.startQ} – ${r.endQ}`;
      r.endMs = r.endMs || Number.MAX_SAFE_INTEGER;
    });
    return result;
  });

  /** Set chứa thời điểm phát hiện tại. */
  readonly activeSet = computed<AudioSegmentSet | null>(() => {
    const ms = this.currentTime() * 1000;
    const segs = this.segments();
    if (segs.length === 0) return null;
    let current = segs[0];
    for (const s of segs) {
      if (ms >= s.startMs) current = s;
      else break;
    }
    return current;
  });

  readonly activeQuestion = computed<number | null>(() => {
    const set = this.activeSet();
    return set ? set.startQ : null;
  });

  readonly activeSegmentIndex = computed<number>(() => {
    const set = this.activeSet();
    return set ? this.segments().indexOf(set) : -1;
  });

  constructor() {
    effect(() => {
      const q = this.currentQuestionNumber();
      if (q != null) {
        this.seekTo(q);
      }
    });
    effect(() => {
      this.activeQuestionChanged.emit(this.activeQuestion());
    });
  }

  onElementReady(el: HTMLAudioElement): void {
    if (this.audioEl === el) return;
    this.audioEl = el;
    el.addEventListener('timeupdate', () => this.currentTime.set(el.currentTime));
    el.addEventListener('durationchange', () => this.duration.set(el.duration || 0));
    el.addEventListener('play', () => {
      this.isPlaying.set(true);
      this.hasLoadError.set(false);
    });
    el.addEventListener('pause', () => this.isPlaying.set(false));
    el.addEventListener('ended', () => this.isPlaying.set(false));
    el.addEventListener('error', () => this.onLoadError());
  }

  onLoadError(): void {
    this.isPlaying.set(false);
    this.hasLoadError.set(true);
  }

  togglePlay(): void {
    if (!this.audioEl) {
      this.hasLoadError.set(true);
      return;
    }
    if (this.audioEl.paused) {
      if (this.audioEl.readyState === 0) {
        this.audioEl.load();
      }
      void this.audioEl.play().catch(() => this.onLoadError());
    } else {
      this.audioEl.pause();
    }
  }

  seekTo(questionNumber: number): void {
    const q = this.questions().find(x => x.number === questionNumber);
    const ms = q?.audioStartMs;
    if (ms == null || !this.audioEl) return;
    this.audioEl.currentTime = ms / 1000;
    this.currentTime.set(ms / 1000);
  }

  seekToSet(set: AudioSegmentSet): void {
    if (!this.audioEl) return;
    this.audioEl.currentTime = set.startMs / 1000;
    this.currentTime.set(set.startMs / 1000);
  }

  rewind(seconds = 10): void {
    if (!this.audioEl) return;
    this.audioEl.currentTime = Math.max(0, this.audioEl.currentTime - seconds);
    this.currentTime.set(this.audioEl.currentTime);
  }

  forward(seconds = 10): void {
    if (!this.audioEl) return;
    const dur = this.duration() || 0;
    const target = this.audioEl.currentTime + seconds;
    this.audioEl.currentTime = dur > 0 ? Math.min(dur, target) : target;
    this.currentTime.set(this.audioEl.currentTime);
  }

  onSliderChange(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (this.audioEl) {
      this.audioEl.currentTime = v;
    }
    this.currentTime.set(v);
  }

  changeRate(event: Event): void {
    const r = Number((event.target as HTMLSelectElement).value);
    this.playbackRate.set(r);
    if (this.audioEl) {
      this.audioEl.playbackRate = r;
    }
  }

  formatTime(sec: number): string {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}