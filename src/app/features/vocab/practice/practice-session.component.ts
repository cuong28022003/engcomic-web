import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardApiService } from '@services/card-api.service';
import { Card } from '@models/index';

type PracticeState = 'loading' | 'exercise' | 'feedback' | 'finished';

@Component({
  selector: 'app-practice-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practice-session.component.html',
  styleUrls: ['./practice-session.component.scss'],
})
export class PracticeSessionComponent implements OnInit {
  state = signal<PracticeState>('loading');
  cards = signal<Card[]>([]);
  currentIndex = signal(0);
  lastAnswerCorrect = signal<boolean | null>(null);
  correctCount = signal(0);
  inputAnswer = '';
  showingCard = signal(false);   // Stage 0: first view flip
  mcChoices = signal<string[]>([]);
  selectedChoice = signal('');
  fillBlankSentence = signal('');
  fillBlankAnswer = signal('');
  submitLoading = signal(false);

  get currentCard(): Card | null {
    return this.cards()[this.currentIndex()] ?? null;
  }

  get progress(): number {
    const total = this.cards().length;
    return total > 0 ? Math.round((this.currentIndex() / total) * 100) : 0;
  }

  get stageName(): string {
    const s = this.currentCard?.stage ?? 0;
    const names = ['Lần đầu', 'Nhận biết', 'Gợi nhớ', 'Phát âm', 'Điền từ', 'Thành thạo'];
    return names[s] ?? 'Lần đầu';
  }

  constructor(private cardApi: CardApiService, private router: Router) {}

  ngOnInit() {
    this.loadDue();
  }

  loadDue() {
    this.state.set('loading');
    this.cardApi.getDueCards(15).subscribe({
      next: (cards) => {
        if (cards.length === 0) {
          this.state.set('finished');
          return;
        }
        this.cards.set(cards);
        this.currentIndex.set(0);
        this.prepareExercise();
      },
      error: () => this.state.set('finished')
    });
  }

  prepareExercise() {
    const card = this.currentCard;
    if (!card) { this.state.set('finished'); return; }

    this.inputAnswer = '';
    this.selectedChoice.set('');
    this.lastAnswerCorrect.set(null);
    this.showingCard.set(false);

    const stage = card.stage ?? 0;

    if (stage === 1) {
      // Build multiple choice options
      const allCards = this.cards();
      const currentMeaning = card.meaning || card.back || '';
      const wrong = allCards
        .filter(c => c.id !== card.id && (c.meaning || c.back))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(c => c.meaning || c.back || '');
      const choices: string[] = [currentMeaning, ...wrong].sort(() => Math.random() - 0.5);
      this.mcChoices.set(choices);
    }

    if (stage === 4) {
      // Pick a random example for fill-in-blank
      const examples = card.examples ?? [];
      const word = card.word || card.front || '';
      if (examples.length > 0 && word) {
        const ex = examples[Math.floor(Math.random() * examples.length)];
        const blank = '_'.repeat(word.length);
        const sentence = (ex.text || '').replace(new RegExp(word, 'gi'), blank);
        this.fillBlankSentence.set(sentence);
        this.fillBlankAnswer.set(word);
      } else {
        // Fallback: treat as recall
        this.fillBlankSentence.set('');
        this.fillBlankAnswer.set(word);
      }
    }

    this.state.set('exercise');
  }

  // Stage 0 — flip card, auto-advance
  flipCard() {
    this.showingCard.set(true);
  }

  markSeen() {
    this.submitResult(5); // auto 5/5 for new card
  }

  // Stage 1 — multiple choice
  selectChoice(choice: string) {
    if (this.selectedChoice()) return;
    this.selectedChoice.set(choice);
    const correct = choice === (this.currentCard?.meaning || this.currentCard?.back);
    this.lastAnswerCorrect.set(correct);
    this.state.set('feedback');
    this.submitResult(correct ? 5 : 1);
  }

  // Stage 2 — recall (type the word)
  submitRecall() {
    const answer = this.inputAnswer.trim().toLowerCase();
    const targetWord = (this.currentCard?.word || this.currentCard?.front || '').toLowerCase();
    const correct = targetWord === answer;
    this.lastAnswerCorrect.set(correct);
    this.state.set('feedback');
    this.submitResult(correct ? 5 : 1);
  }

  // Stage 3 — pronunciation (self-assessed)
  markPronunciation(knew: boolean) {
    this.submitResult(knew ? 5 : 1);
  }

  // Stage 4 — fill in blank
  submitFillBlank() {
    const answer = this.inputAnswer.trim().toLowerCase();
    const correct = this.fillBlankAnswer().toLowerCase() === answer;
    this.lastAnswerCorrect.set(correct);
    this.state.set('feedback');
    this.submitResult(correct ? 5 : 1);
  }

  submitResult(quality: number) {
    const card = this.currentCard;
    if (!card) return;
    this.submitLoading.set(true);

    this.cardApi.submitPracticeResult(card.id, { quality }).subscribe({
      next: () => {
        if (quality >= 3) this.correctCount.update(n => n + 1);
        this.submitLoading.set(false);
        if (this.state() !== 'feedback') {
          this.advance();
        }
      },
      error: () => {
        this.submitLoading.set(false);
        this.advance();
      }
    });
  }

  advance() {
    const next = this.currentIndex() + 1;
    if (next >= this.cards().length) {
      this.state.set('finished');
    } else {
      this.currentIndex.set(next);
      this.prepareExercise();
    }
  }

  goToDashboard() {
    this.router.navigate(['/vocab']);
  }
}
