import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-question-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-row.component.html',
  styleUrls: ['./question-row.component.scss']
})
export class QuestionRowComponent {
  @Input() questionNumber = 101;
  @Input() part = 5;
  @Input() optionCount = 4;
  @Input() selectedAnswer?: string;
  @Input() flagged = false;
  @Input() isSubmitted = false;
  @Input() isCorrect?: boolean;
  @Input() correctAnswer?: string;

  @Output() answerSelected = new EventEmitter<string>();
  @Output() flagToggled = new EventEmitter<void>();

  readonly letters = ['A', 'B', 'C', 'D'];

  get options(): string[] {
    const count = Math.max(1, Math.min(4, this.optionCount || 4));
    return this.letters.slice(0, count);
  }

  selectOption(opt: string) {
    if (this.isSubmitted) return;
    this.answerSelected.emit(opt);
  }

  toggleFlag(event: Event) {
    event.stopPropagation();
    this.flagToggled.emit();
  }
}