import { Component, input, output, signal, computed, effect, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PronunciationService } from '@core/services/pronunciation.service';
import { Level1Recognition, ExerciseOption } from '@models/index';

@Component({
  selector: 'app-level1-recognition-exercise',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './level1-recognition-exercise.component.html',
  styleUrls: ['./level1-recognition-exercise.component.scss'],
})
export class Level1RecognitionExerciseComponent {
  private pronunciationService = inject(PronunciationService);

  word = input.required<string>();
  ipa = input<string | undefined>('');
  audio = input<string | undefined>('');
  exercise = input<Level1Recognition | undefined>(undefined);
  fallbackMeaning = input<string | undefined>('');

  answerSubmitted = output<{ isCorrect: boolean; quality: number }>();

  selectedOptionIndex = signal<number | null>(null);
  isAnswered = signal<boolean>(false);
  isCorrect = signal<boolean>(false);

  options = computed<ExerciseOption[]>(() => {
    const ex = this.exercise();
    if (ex && ex.options && ex.options.length > 0) {
      return ex.options;
    }
    const correctText = this.fallbackMeaning() || 'Nghĩa chính xác';
    return [
      { text: correctText, isCorrect: true },
      { text: 'Trì hoãn, kéo dài thời gian', isCorrect: false },
      { text: 'Tạo điều kiện thuận lợi', isCorrect: false },
      { text: 'Phản đối kịch liệt', isCorrect: false }
    ];
  });

  correctOption = computed<ExerciseOption | undefined>(() => {
    return this.options().find(o => this.isOptionCorrect(o));
  });

  constructor() {
    effect(() => {
      // Whenever the word changes, reset state
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

  playAudio(): void {
    const textVal = this.word();
    if (textVal) {
      this.pronunciationService.speak(textVal, 'us');
    }
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
