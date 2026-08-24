import { Component, input, output, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Level2Context, ExerciseOption } from '@models/index';

@Component({
  selector: 'app-level2-context-exercise',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './level2-context-exercise.component.html',
  styleUrls: ['./level2-context-exercise.component.scss'],
})
export class Level2ContextExerciseComponent {
  word = input.required<string>();
  exercise = input<Level2Context | undefined>(undefined);
  fallbackSentence = input<string | undefined>('');

  answerSubmitted = output<{ isCorrect: boolean; quality: number }>();

  selectedOptionIndex = signal<number | null>(null);
  isAnswered = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  sentence = computed<string>(() => {
    const ex = this.exercise();
    if (ex && ex.sentence) return ex.sentence;
    const fb = this.fallbackSentence();
    if (fb) {
      return fb.replace(new RegExp(this.word(), 'gi'), '_____');
    }
    return `We must take immediate action to _____ the risks.`;
  });

  options = computed<ExerciseOption[]>(() => {
    const ex = this.exercise();
    if (ex && ex.options && ex.options.length > 0) {
      return ex.options;
    }
    return [
      { text: this.word(), isCorrect: true },
      { text: 'allocate', isCorrect: false },
      { text: 'hesitate', isCorrect: false },
      { text: 'frustrate', isCorrect: false }
    ];
  });

  correctOption = computed<ExerciseOption | undefined>(() => {
    return this.options().find(o => this.isOptionCorrect(o));
  });

  constructor() {
    effect(() => {
      this.word();
      this.resetState();
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      if (this.isAnswered()) {
        event.preventDefault();
        this.proceedNext();
      }
    }
  }

  isOptionCorrect(option?: ExerciseOption): boolean {
    if (!option) return false;
    const opt = option as any;
    return opt.isCorrect === true ||
           opt.correct === true ||
           opt.is_correct === true ||
           opt.isTrue === true ||
           opt.is_correct === 'true' ||
           opt.isCorrect === 'true';
  }

  private resetState(): void {
    this.selectedOptionIndex.set(null);
    this.isAnswered.set(false);
    this.isCorrect.set(false);
  }

  selectOption(index: number, option: ExerciseOption): void {
    if (this.isAnswered()) return;
    this.selectedOptionIndex.set(index);
    this.isAnswered.set(true);

    const correct = this.isOptionCorrect(option);
    this.isCorrect.set(correct);
  }

  proceedNext(): void {
    if (!this.isAnswered()) return;
    const quality = this.isCorrect() ? 5 : 1;
    this.answerSubmitted.emit({ isCorrect: this.isCorrect(), quality });
  }
}
