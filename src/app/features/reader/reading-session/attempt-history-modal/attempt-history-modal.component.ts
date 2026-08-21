import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ToeicAttempt } from '../../models';

@Component({
  selector: 'app-attempt-history-modal',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent, EmptyStateComponent],
  templateUrl: './attempt-history-modal.component.html',
  styleUrls: ['./attempt-history-modal.component.scss']
})
export class AttemptHistoryModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly attempts = input<ToeicAttempt[]>([]);
  readonly testTitle = input<string>('');

  readonly close = output<void>();
  readonly closed = output<void>();

  readonly completedAttempts = computed(() => {
    return this.attempts().filter(a => a.status === 'completed');
  });

  readonly completedAttemptsCount = computed(() => {
    return this.completedAttempts().length;
  });

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatParts(parts?: number[]): string {
    if (!parts || parts.length === 0 || parts.length === 3) return 'Part 5, 6, 7';
    return `Part ${parts.join(', ')}`;
  }

  onClose() {
    this.close.emit();
    this.closed.emit();
  }
}
