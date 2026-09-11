import { Component, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PronunciationService } from '@core/services/pronunciation.service';
import { PendingItemApiService } from '@core/services/pending-item-api.service';
import { PendingCountService } from '@core/services/pending-count.service';
import { getPosShortLabel, getPosCssClass } from '@shared/constants/part-of-speech.constant';

/**
 * WordMiniChipComponent — Chip từ vựng mini dùng chung.
 *
 * Hiển thị: [từ] [loại từ?] [🔊] [+]
 * - Bấm text/loa: phát âm US
 * - Bấm +: thêm vào Word Collector (pending items)
 * - Trạng thái "đã thêm" phản ánh ngay lập tức qua PendingCountService
 *
 * @example
 * <app-word-mini-chip word="since" />
 * <app-word-mini-chip word="look forward to" pos="phrasal_verb" />
 */
@Component({
  selector: 'app-word-mini-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './word-mini-chip.component.html',
  styleUrls: ['./word-mini-chip.component.scss']
})
export class WordMiniChipComponent {
  private pronunciation = inject(PronunciationService);
  private pendingApi = inject(PendingItemApiService);
  readonly pendingCount = inject(PendingCountService);

  /** Từ / cụm từ hiển thị và phát âm */
  readonly word = input.required<string>();

  /** Loại từ (VD: 'noun', 'verb', 'preposition') — hiển thị badge nhỏ */
  readonly pos = input<string | undefined>(undefined);

  /** Có hiển thị nút + thêm vào collector không (mặc định: true) */
  readonly showCollect = input<boolean>(true);

  /** Có hiển thị nút loa không (mặc định: true) */
  readonly showAudio = input<boolean>(true);

  readonly isAdding = signal(false);

  get posLabel(): string {
    return getPosShortLabel(this.pos());
  }

  get posClass(): string {
    return getPosCssClass(this.pos());
  }

  get isPending(): boolean {
    return this.pendingCount.isWordPending(this.word());
  }

  playAudio(event: MouseEvent): void {
    event.stopPropagation();
    const w = this.word()?.trim();
    if (w) this.pronunciation.speak(w, 'us');
  }

  addToCollector(event: MouseEvent): void {
    event.stopPropagation();
    const clean = this.word()?.trim();
    if (!clean || this.isPending || this.isAdding()) return;

    this.isAdding.set(true);
    this.pendingApi.addManual(clean).subscribe({
      next: () => {
        this.pendingCount.addPendingWord(clean);
        this.isAdding.set(false);
      },
      error: () => this.isAdding.set(false)
    });
  }
}
