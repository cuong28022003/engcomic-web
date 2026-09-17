import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '@models/index';
import { PronunciationService } from '@core/services/pronunciation.service';
import { SelectionCheckboxComponent } from '@shared/components/selection-checkbox/selection-checkbox.component';

@Component({
  selector: 'app-vocab-card',
  standalone: true,
  imports: [CommonModule, SelectionCheckboxComponent],
  templateUrl: './vocab-card.component.html',
  styleUrls: ['./vocab-card.component.scss']
})
export class VocabCardComponent {
  private pronunciationService = inject(PronunciationService);

  readonly card = input.required<Card>();
  readonly layout = input<'grid' | 'list'>('list');
  readonly selected = input<boolean>(false);
  readonly showCheckbox = input<boolean>(true);
  readonly showDeckBadge = input<boolean>(true);
  readonly deckName = input<string | null>(null);
  readonly deckNames = input<string[]>([]);

  // Outputs
  readonly selectChange = output<boolean>();
  readonly cardClick = output<Card>();
  readonly favoriteClick = output<{ card: Card; event: MouseEvent }>();
  readonly deckClick = output<{ deckId: string; event: MouseEvent }>();
  readonly topicClick = output<{ topic: string; event: MouseEvent }>();
  readonly assignDeckClick = output<{ card: Card; event: MouseEvent }>();

  onCardClick(): void {
    this.cardClick.emit(this.card());
  }

  onToggleSelect(val: boolean): void {
    this.selectChange.emit(val);
  }

  playAudio(event: MouseEvent): void {
    event.stopPropagation();
    const word = this.card().word || this.card().front;
    if (word) {
      this.pronunciationService.speak(word, 'us');
    }
  }

  onFavoriteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.favoriteClick.emit({ card: this.card(), event });
  }

  onDeckClick(event: MouseEvent): void {
    event.stopPropagation();
    const dId = this.card().deckId;
    if (dId) {
      this.deckClick.emit({ deckId: dId, event });
    }
  }

  onTopicClick(event: MouseEvent): void {
    event.stopPropagation();
    const t = this.card().topic;
    if (t) {
      this.topicClick.emit({ topic: t, event });
    }
  }

  onAssignDeckClick(event: MouseEvent): void {
    event.stopPropagation();
    this.assignDeckClick.emit({ card: this.card(), event });
  }

  getStatusClass(status?: string): string {
    const map: Record<string, string> = {
      new: 'status-new',
      learning: 'status-learning',
      mature: 'status-mature',
      leech: 'status-leech',
    };
    return map[status ?? 'new'] ?? 'status-new';
  }

  getStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      new: 'Mới',
      learning: 'Đang học',
      mature: 'Thành thạo',
      leech: 'Khó nhớ'
    };
    return map[status ?? 'new'] ?? 'Mới';
  }

  isOverdue(nextReview?: string | Date, status?: string): boolean {
    if (status === 'new' || !nextReview) return false;
    const d = new Date(nextReview);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  }

  formatNextReview(nextReview?: string | Date, status?: string): string {
    if (status === 'new' || !nextReview) return 'Chưa học';
    const d = new Date(nextReview);
    if (isNaN(d.getTime())) return 'Chưa học';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startOfTarget - startOfToday) / 86400000);

    if (diffDays < 0) return 'Quá hạn';
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Ngày mai';
    return `${diffDays} ngày nữa`;
  }
}
