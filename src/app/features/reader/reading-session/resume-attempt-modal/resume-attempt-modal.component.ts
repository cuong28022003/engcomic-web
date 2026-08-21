import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ToeicAttempt } from '../../models';

@Component({
  selector: 'app-resume-attempt-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './resume-attempt-modal.component.html',
  styleUrls: ['./resume-attempt-modal.component.scss']
})
export class ResumeAttemptModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly attempt = input<ToeicAttempt | null>(null);

  readonly resume = output<ToeicAttempt>();
  readonly abandon = output<ToeicAttempt>();
  readonly dismiss = output<void>();

  readonly answeredCount = computed(() => {
    const att = this.attempt();
    if (!att || !att.answers) return 0;
    return att.answers.filter(a => a.userAnswer && a.userAnswer.trim().length > 0).length;
  });

  readonly totalCount = computed(() => {
    const att = this.attempt();
    return att?.totalQuestions || 100;
  });

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatParts(parts?: number[]): string {
    if (!parts || parts.length === 0 || parts.length === 3) return 'Toàn bộ đề (Part 5, 6, 7)';
    return `Part ${parts.join(', ')}`;
  }

  onResume() {
    const att = this.attempt();
    if (att) this.resume.emit(att);
  }

  onAbandon() {
    const att = this.attempt();
    if (att) this.abandon.emit(att);
  }

  onDismiss() {
    this.dismiss.emit();
  }
}
