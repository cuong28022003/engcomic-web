import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Level4Realworld } from '@models/index';

@Component({
  selector: 'app-level4-realworld-exercise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './level4-realworld-exercise.component.html',
  styleUrls: ['./level4-realworld-exercise.component.scss'],
})
export class Level4RealworldExerciseComponent {
  word = input.required<string>();
  meaning = input<string | undefined>('');
  exercise = input<Level4Realworld | undefined>(undefined);

  answerSubmitted = output<{ isCorrect: boolean; quality: number; confidenceScore: number }>();

  userResponse = '';
  selectedConfidence = signal<number>(0);
  isSubmitted = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.word();
      this.resetState();
    });
  }

  private resetState(): void {
    this.userResponse = '';
    this.selectedConfidence.set(0);
    this.isSubmitted.set(false);
  }

  setConfidence(stars: number): void {
    if (this.isSubmitted()) return;
    this.selectedConfidence.set(stars);
  }

  submitRating(): void {
    const stars = this.selectedConfidence();
    if (stars === 0 || this.isSubmitted()) return;

    this.isSubmitted.set(true);
    const isCorrect = stars >= 3;
    const quality = stars; // 1 to 5

    setTimeout(() => {
      this.answerSubmitted.emit({
        isCorrect,
        quality,
        confidenceScore: stars
      });
    }, 800);
  }
}
