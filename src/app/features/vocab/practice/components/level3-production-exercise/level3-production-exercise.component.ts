import { Component, input, output, signal, OnInit, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Level3Production } from '@models/index';

interface WordTile {
  id: number;
  text: string;
  isUsed: boolean;
}

@Component({
  selector: 'app-level3-production-exercise',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './level3-production-exercise.component.html',
  styleUrls: ['./level3-production-exercise.component.scss'],
})
export class Level3ProductionExerciseComponent implements OnInit {
  word = input.required<string>();
  exercise = input<Level3Production>();

  answerSubmitted = output<{ isCorrect: boolean; quality: number }>();

  availableTiles = signal<WordTile[]>([]);
  selectedTiles = signal<WordTile[]>([]);
  isChecking = signal<boolean>(false);
  isAnswerCorrect = signal<boolean | null>(null);

  constructor() {
    effect(() => {
      this.word();
      this.initTiles();
    });
  }

  ngOnInit(): void {
    this.initTiles();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      if (this.isChecking()) {
        event.preventDefault();
        this.proceedNext();
      }
    }
  }

  initTiles(): void {
    const ex = this.exercise();
    let words: string[] = [];

    if (ex && ex.shuffledWords && ex.shuffledWords.length > 0) {
      words = [...ex.shuffledWords];
    } else {
      words = ['We', 'need', 'to', this.word(), 'the', 'overall', 'impact.'];
    }

    this.availableTiles.set(words.map((w, idx) => ({ id: idx, text: w, isUsed: false })));
    this.selectedTiles.set([]);
    this.isChecking.set(false);
    this.isAnswerCorrect.set(null);
  }

  selectTile(tile: WordTile): void {
    if (tile.isUsed || this.isChecking()) return;
    tile.isUsed = true;
    this.selectedTiles.update(list => [...list, tile]);
  }

  deselectTile(tile: WordTile): void {
    if (this.isChecking()) return;
    tile.isUsed = false;
    this.selectedTiles.update(list => list.filter(t => t.id !== tile.id));
  }

  resetSentence(): void {
    if (this.isChecking()) return;
    this.availableTiles.update(list => list.map(t => ({ ...t, isUsed: false })));
    this.selectedTiles.set([]);
  }

  checkAnswer(): void {
    if (this.selectedTiles().length === 0 || this.isChecking()) return;
    this.isChecking.set(true);

    const userSentence = this.selectedTiles().map(t => t.text).join(' ').trim().replace(/\s+([.,!?;:])/g, '$1');
    const correctSentence = (this.exercise()?.correctSentence || '').trim().replace(/\s+([.,!?;:])/g, '$1');

    // Compare sentences (case-insensitive and punctuation-tolerant)
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isCorrect = normalize(userSentence) === normalize(correctSentence) || userSentence.toLowerCase().includes(this.word().toLowerCase());

    this.isAnswerCorrect.set(isCorrect);
  }

  proceedNext(): void {
    if (!this.isChecking()) return;
    const isCorrect = this.isAnswerCorrect() ?? false;
    const quality = isCorrect ? 5 : 1;
    this.answerSubmitted.emit({ isCorrect, quality });
  }
}
