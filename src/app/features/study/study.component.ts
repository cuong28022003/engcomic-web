import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardApiService } from '@core/services/card-api.service';
import { DeckApiService } from '@core/services/deck-api.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { getPosShortLabel, getPosCssClass } from '@shared/constants/part-of-speech.constant';
import { Card, Deck, WordRelation } from '@models/index';

@Component({
  selector: 'app-study',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.scss']
})
export class StudyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardApi = inject(CardApiService);
  private deckApi = inject(DeckApiService);
  private userStatsApi = inject(UserStatsApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  deckId = '';
  readonly deck = signal<Deck | null>(null);
  readonly cards = signal<Card[]>([]);
  readonly currentIndex = signal(0);
  readonly isFlipped = signal(false);
  readonly loading = signal(true);
  readonly isFinished = signal(false);

  // true = Recall: mặt trước hiện nghĩa Việt, tự nhớ từ tiếng Anh rồi mới lật kiểm tra
  readonly recallMode = signal(false);

  // Smart Practice Filters
  readonly levelParam = signal(0);
  readonly posParam = signal('all');
  readonly starParam = signal(false);
  readonly shuffleParam = signal(true);
  readonly limitParam = signal(20);

  readonly currentCard = computed<Card | null>(() => this.cards()[this.currentIndex()] || null);

  readonly progressPercent = computed<number>(() => {
    if (!this.cards().length) return 0;
    return Math.round(((this.currentIndex()) / this.cards().length) * 100);
  });

  /** Loại từ + class màu (hiển thị chip trên thẻ) */
  readonly posInfo = computed<{ label: string; css: string }>(() => {
    const pos = this.currentCard()?.partOfSpeech || '';
    return { label: getPosShortLabel(pos), css: getPosCssClass(pos) };
  });

  /** Các cụm từ kết hợp (collocations) từ quan hệ của từ */
  readonly collocations = computed<string[]>(() => this.relationWords('collocation'));

  /** Các từ đồng nghĩa từ quan hệ của từ */
  readonly synonyms = computed<string[]>(() => this.relationWords('synonym'));

  /** Ví dụ mẫu (ưu tiên usages[].examples, fallback example/myExample legacy), lấy tối đa 2 */
  readonly detailExamples = computed<{ text: string; translation?: string }[]>(() => {
    const c = this.currentCard();
    if (!c) return [];

    const list: { text: string; translation?: string }[] = [];
    for (const u of c.usages || []) {
      for (const ex of u.examples || []) {
        if (ex?.text && ex.text.trim()) {
          list.push({ text: ex.text.trim(), translation: ex.translation });
        }
      }
    }
    if (list.length === 0) {
      const legacy = (c.example || c.myExample || '').trim();
      if (legacy) list.push({ text: legacy });
    }
    return list.slice(0, 2);
  });

  private relationWords(kind: 'collocation' | 'synonym'): string[] {
    const c = this.currentCard();
    if (!c) return [];
    return (c.relations || [])
      .filter((r) => (r.type || r.relationType) === kind && this.relationText(r))
      .map((r) => this.relationText(r));
  }

  private relationText(r: WordRelation): string {
    return (r.text || r.relatedText || r.word || '').trim();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.isFinished() || this.loading()) return;

    if (event.code === 'Space') {
      event.preventDefault();
      this.toggleFlip();
    } else if (this.isFlipped()) {
      switch (event.key.toLowerCase()) {
        case 'a':
          this.rateCard(1);
          break;
        case 'h':
          this.rateCard(2);
          break;
        case 'g':
          this.rateCard(3);
          break;
        case 'e':
          this.rateCard(4);
          break;
      }
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.deckId = params['deckId'];
      if (this.deckId) {
        this.loadDeck();
      }
    });

    this.route.queryParams.subscribe((queryParams) => {
      this.levelParam.set(queryParams['level'] ? parseInt(queryParams['level'], 10) : 0);
      this.posParam.set(queryParams['pos'] || 'all');
      this.starParam.set(queryParams['starOnly'] === 'true' || queryParams['starOnly'] === true);
      this.shuffleParam.set(queryParams['shuffle'] !== 'false' && queryParams['shuffle'] !== false);
      this.limitParam.set(queryParams['limit'] ? parseInt(queryParams['limit'], 10) : 20);
      if (this.deckId) {
        this.loadCards();
      }
    });
  }

  ngOnDestroy(): void {}

  setRecallMode(value: boolean): void {
    this.recallMode.set(value);
  }

  loadDeck(): void {
    this.deckApi.getDeckById(this.deckId).subscribe({
      next: (deck) => this.deck.set(deck),
      error: () => {},
    });
  }

  loadCards(): void {
    this.loading.set(true);
    this.cardApi.getCardsByDeckId(this.deckId, { page: 0, size: 500 }).subscribe({
      next: (res) => {
        let list = res.content || [];

        if (this.starParam()) {
          list = list.filter((c) => c.isFavorite || c.favorite);
        }

        if (this.levelParam() > 0) {
          list = list.filter((c) => {
            const cardLvl = c.masteryLevel || 1;
            return this.levelParam() === 4 ? cardLvl >= 4 : cardLvl === this.levelParam();
          });
        }

        if (this.posParam() !== 'all') {
          list = list.filter((c) => {
            const cardPos = (c.partOfSpeech || '').trim().toLowerCase();
            if (this.posParam() === 'unknown') return !cardPos;
            return cardPos === this.posParam().toLowerCase();
          });
        }

        if (this.shuffleParam()) {
          for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
          }
        }

        if (this.limitParam() > 0 && list.length > this.limitParam()) {
          list = list.slice(0, this.limitParam());
        }

        this.cards.set(list);
        this.currentIndex.set(0);
        this.isFlipped.set(false);
        this.isFinished.set(false);
        this.loading.set(false);
        if (this.cards().length > 0) {
          this.speakWord(this.cards()[0].word || this.cards()[0].front || '');
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  toggleFlip(): void {
    this.isFlipped.update((v) => !v);
    if (this.isFlipped()) {
      // Đọc từ khi hiện đáp án — hỗ trợ ghi nhớ phát âm liên kết với nghĩa
      this.speakWord(this.currentCard()?.word || this.currentCard()?.front || '');
    }
  }

  rateCard(quality: number): void {
    const card = this.currentCard();
    if (!card) return;

    this.cardApi.reviewCard({ cardId: card.id, quality }).subscribe({ error: () => {} });

    if (this.currentIndex() < this.cards().length - 1) {
      this.currentIndex.update((i) => i + 1);
      this.isFlipped.set(false);
      this.speakWord(this.currentCard()?.word || this.currentCard()?.front || '');
    } else {
      this.isFinished.set(true);
      this.awardStudyRewards();
    }
  }

  awardStudyRewards(): void {
    const user = this.auth.currentUser;
    if (!user) return;

    const earnedXp = this.cards().length * 10;
    this.userStatsApi.addXp({ userId: user.userId, xp: earnedXp }).subscribe({ error: () => {} });
  }

  restartStudy(): void {
    this.currentIndex.set(0);
    this.isFlipped.set(false);
    this.isFinished.set(false);
    this.speakWord(this.cards()[0]?.word || this.cards()[0]?.front || '');
  }

  speak(event: Event, text: string): void {
    event.stopPropagation();
    this.speakWord(text);
  }

  private speakWord(text: string): void {
    if (!window.speechSynthesis || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
}