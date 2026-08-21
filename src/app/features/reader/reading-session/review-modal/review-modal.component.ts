import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ToeicReviewItem } from '../../models';
import { PendingItemApiService } from '../../../../core/services/pending-item-api.service';

@Component({
  selector: 'app-review-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './review-modal.component.html',
  styleUrls: ['./review-modal.component.scss']
})
export class ReviewModalComponent {
  private pendingApi = inject(PendingItemApiService);

  readonly isOpen = input<boolean>(false);
  readonly item = input<ToeicReviewItem | null>(null);
  readonly userAnswer = input<string>('');
  readonly correctAnswer = input<string>('');
  readonly currentIndex = input<number>(0);
  readonly totalItems = input<number>(0);
  readonly hasPrev = input<boolean>(false);
  readonly hasNext = input<boolean>(false);

  readonly close = output<void>();
  readonly prev = output<void>();
  readonly next = output<void>();

  readonly addedWords = signal<Set<string>>(new Set());

  readonly modalTitle = computed(() => {
    const it = this.item();
    if (!it) return 'Chi Tiết Phân Tích Câu Hỏi';
    return `📝 Phân Tích Câu ${it.questionNumber} (Part ${it.part})`;
  });

  hasOptions(options?: Record<string, string>): boolean {
    if (!options) return false;
    return Object.keys(options).length > 0;
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
      },
      error: (err) => {
        console.warn('Failed to add word to collector:', err);
      }
    });
  }

  onPrev() {
    this.prev.emit();
  }

  onNext() {
    this.next.emit();
  }

  onClose() {
    this.close.emit();
  }
}
