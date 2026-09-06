import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardApiService } from '@core/services/card-api.service';
import { DeckApiService } from '@core/services/deck-api.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Card, Deck } from '@models/index';

@Component({
  selector: 'app-study',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="study-session-page">
      <!-- Top header with Progress -->
      <div class="study-topbar glass-panel">
        <a [routerLink]="deckId ? ['/deck', deckId] : '/deck'" class="btn-icon" title="Thoát phiên học">
          <i class="fa-solid fa-arrow-left"></i>
        </a>
        <div class="progress-wrap">
          <div class="deck-title-row">
            <span class="deck-title">{{ deck?.name || 'Ôn Tập Flashcard' }}</span>
            @if (levelParam > 0) {
              <span class="filter-pill lvl">Level {{ levelParam }}</span>
            }
            @if (posParam !== 'all') {
              <span class="filter-pill pos">{{ posParam }}</span>
            }
            @if (starParam) {
              <span class="filter-pill star"><i class="fa-solid fa-star"></i> Yêu thích</span>
            }
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" [style.width.%]="progressPercent"></div>
          </div>
          <span class="progress-text">{{ currentIndex + 1 }} / {{ cards.length }}</span>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state">
          <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
          <p>Đang chuẩn bị bộ thẻ học...</p>
        </div>
      } @else if (cards.length === 0) {
        <div class="empty-state glass-panel">
          <i class="fa-solid fa-sparkles empty-icon"></i>
          <h3>Bộ thẻ này chưa có từ vựng nào!</h3>
          <p>Hãy đọc truyện tranh và tra từ để thêm từ mới vào bộ thẻ này nhé.</p>
          <a routerLink="/comics" class="btn-primary">Đọc truyện ngay</a>
        </div>
      } @else if (isFinished) {
        <!-- Completed Summary View -->
        <div class="finished-summary glass-panel">
          <div class="trophy-icon-wrap">
            <i class="fa-solid fa-medal trophy-icon"></i>
          </div>
          <h2>Chúc mừng bạn đã hoàn thành!</h2>
          <p class="summary-sub">Bạn đã ôn tập xong toàn bộ <strong>{{ cards.length }}</strong> thẻ từ vựng trong phiên này.</p>

          <div class="rewards-row">
            <div class="reward-box">
              <i class="fa-solid fa-bolt bolt"></i>
              <span class="reward-val">+{{ cards.length * 10 }} XP</span>
              <span class="reward-lbl">Kinh nghiệm học</span>
            </div>
            <div class="reward-box">
              <i class="fa-solid fa-gem gem"></i>
              <span class="reward-val">+2 Kim cương</span>
              <span class="reward-lbl">Thưởng hoàn thành</span>
            </div>
          </div>

          <div class="summary-actions">
            <button class="btn-primary" (click)="restartStudy()"><i class="fa-solid fa-rotate-right"></i> Ôn tập lại</button>
            <a routerLink="/deck" class="btn-secondary">Về danh sách bộ thẻ</a>
          </div>
        </div>
      } @else {
        <!-- Interactive 3D Flip Flashcard -->
        <div class="flashcard-container">
          <div
            class="flashcard"
            [class.flipped]="isFlipped"
            (click)="toggleFlip()"
          >
            <!-- Card Front (English word + IPA + Audio) -->
            <div class="card-face card-front glass-panel">
              <span class="face-badge">Tiếng Anh</span>
              <h2 class="card-word">{{ currentCard?.word || currentCard?.front }}</h2>
              @if (currentCard?.ipa) {
                <p class="card-ipa"><code>{{ currentCard?.ipa }}</code></p>
              }
              <button class="btn-icon audio-btn" (click)="speak($event, currentCard?.word || currentCard?.front || '')" title="Nghe phát âm">
                <i class="fa-solid fa-volume-high"></i>
              </button>
              <span class="flip-hint"><i class="fa-solid fa-hand-pointer"></i> Nhấp thẻ hoặc nhấn Space để lật</span>
            </div>

            <!-- Card Back (Vietnamese Meaning + Example) -->
            <div class="card-face card-back glass-panel">
              <span class="face-badge back-badge">Nghĩa Tiếng Việt</span>
              <h3 class="card-meaning">{{ currentCard?.meaning || currentCard?.back }}</h3>
              @if (currentCard?.example) {
                <div class="example-box">
                  <p class="example-text">"{{ currentCard?.example }}"</p>
                </div>
              }
              <span class="flip-hint"><i class="fa-solid fa-hand-pointer"></i> Nhấp để xem mặt trước</span>
            </div>
          </div>
        </div>

        <!-- SRS Rating Controls Bar -->
        <div class="srs-controls-bar">
          @if (!isFlipped) {
            <button class="btn-primary show-ans-btn" (click)="toggleFlip()">
              <i class="fa-solid fa-eye"></i> Hiện đáp án (Space)
            </button>
          } @else {
            <div class="review-buttons">
              <button class="srs-btn btn-again" (click)="rateCard(1)" title="Nhấn phím A">
                <span class="btn-title">Again (A)</span>
                <span class="interval">1 phút</span>
              </button>
              <button class="srs-btn btn-hard" (click)="rateCard(2)" title="Nhấn phím H">
                <span class="btn-title">Hard (H)</span>
                <span class="interval">1 ngày</span>
              </button>
              <button class="srs-btn btn-good" (click)="rateCard(3)" title="Nhấn phím G">
                <span class="btn-title">Good (G)</span>
                <span class="interval">3 ngày</span>
              </button>
              <button class="srs-btn btn-easy" (click)="rateCard(4)" title="Nhấn phím E">
                <span class="btn-title">Easy (E)</span>
                <span class="interval">7 ngày</span>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .study-session-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: calc(100vh - var(--header-height) - 100px);
      gap: 32px;
      max-width: 680px;
      margin: 0 auto;
      width: 100%;
    }

    /* Top Progress Bar */
    .study-topbar {
      width: 100%;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-radius: var(--radius-md);
    }

    .progress-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .deck-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .filter-pill {
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 600;

      &.lvl {
        background: rgba(99, 102, 241, 0.2);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }

      &.pos {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      &.star {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
    }

    .deck-title { font-weight: 700; font-size: 0.95rem; white-space: nowrap; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }

    .progress-bar-bg {
      flex: 1;
      height: 8px;
      background: var(--bg-card);
      border-radius: var(--radius-full);
      overflow: hidden;
      border: 1px solid var(--border-color);
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--primary-gradient);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-muted);
      white-space: nowrap;
    }

    /* 3D Flashcard */
    .flashcard-container {
      width: 100%;
      height: 380px;
      perspective: 1000px;
    }

    .flashcard {
      position: relative;
      width: 100%;
      height: 100%;
      cursor: pointer;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .flashcard.flipped {
      transform: rotateY(180deg);
    }

    .card-face {
      position: absolute;
      inset: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      border-radius: var(--radius-lg);
      padding: 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 16px;
    }

    .card-front {
      background: radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, rgba(22, 25, 38, 0.95) 80%);
      border-color: rgba(99, 102, 241, 0.3);
    }

    .card-back {
      transform: rotateY(180deg);
      background: radial-gradient(circle at 50% 30%, rgba(255, 51, 119, 0.15) 0%, rgba(22, 25, 38, 0.95) 80%);
      border-color: rgba(255, 51, 119, 0.3);
    }

    .face-badge {
      position: absolute;
      top: 18px;
      left: 18px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
    }

    .back-badge {
      background: rgba(255, 51, 119, 0.2);
      color: var(--primary-color);
    }

    .card-word {
      font-size: 2.4rem;
      font-weight: 800;
      color: #fff;
      text-transform: capitalize;
    }

    .card-ipa code {
      font-size: 1.1rem;
      color: #38bdf8;
      background: rgba(0, 0, 0, 0.3);
      padding: 4px 12px;
      border-radius: var(--radius-sm);
    }

    .audio-btn {
      width: 44px;
      height: 44px;
      font-size: 1.2rem;
      color: var(--primary-color);
    }

    .card-meaning {
      font-size: 1.8rem;
      font-weight: 700;
      color: #fff;
    }

    .example-box {
      background: rgba(0, 0, 0, 0.3);
      padding: 12px 18px;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-style: italic;
      max-width: 480px;
    }

    .flip-hint {
      position: absolute;
      bottom: 18px;
      font-size: 0.78rem;
      color: var(--text-dim);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* SRS Rating Controls */
    .srs-controls-bar {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .show-ans-btn {
      padding: 14px 40px;
      font-size: 1.05rem;
    }

    .review-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      width: 100%;
    }

    .srs-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      cursor: pointer;
      background: var(--bg-card);
      color: #fff;
      transition: all 0.2s;
    }

    .srs-btn .btn-title { font-weight: 700; font-size: 0.95rem; }
    .srs-btn .interval { font-size: 0.75rem; opacity: 0.75; margin-top: 2px; }

    .btn-again:hover { background: #ef4444; border-color: #ef4444; }
    .btn-hard:hover { background: #f97316; border-color: #f97316; }
    .btn-good:hover { background: #10b981; border-color: #10b981; }
    .btn-easy:hover { background: #3b82f6; border-color: #3b82f6; }

    /* Finished Summary */
    .finished-summary {
      width: 100%;
      padding: 48px 36px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 20px;
    }

    .trophy-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(255, 184, 0, 0.2) 0%, rgba(255, 115, 0, 0.2) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .trophy-icon { font-size: 2.2rem; color: #ffb800; }
    .summary-sub { color: var(--text-muted); font-size: 0.95rem; }

    .rewards-row {
      display: flex;
      gap: 20px;
      margin: 10px 0;
    }

    .reward-box {
      padding: 16px 24px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .bolt { color: #f59e0b; font-size: 1.4rem; }
    .gem { color: #38bdf8; font-size: 1.4rem; }
    .reward-val { font-size: 1.2rem; font-weight: 800; color: #fff; }
    .reward-lbl { font-size: 0.75rem; color: var(--text-dim); }

    .summary-actions { display: flex; gap: 14px; }
  `]
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
  deck: Deck | null = null;
  cards: Card[] = [];
  currentIndex = 0;
  isFlipped = false;
  loading = true;
  isFinished = false;

  // Smart Practice Filters
  levelParam = 0;
  posParam = 'all';
  starParam = false;
  shuffleParam = true;
  limitParam = 20;

  get currentCard(): Card | null {
    return this.cards[this.currentIndex] || null;
  }

  get progressPercent(): number {
    if (!this.cards.length) return 0;
    return Math.round(((this.currentIndex) / this.cards.length) * 100);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.isFinished || this.loading) return;

    if (event.code === 'Space') {
      event.preventDefault();
      this.toggleFlip();
    } else if (this.isFlipped) {
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
      this.levelParam = queryParams['level'] ? parseInt(queryParams['level'], 10) : 0;
      this.posParam = queryParams['pos'] || 'all';
      this.starParam = queryParams['starOnly'] === 'true' || queryParams['starOnly'] === true;
      this.shuffleParam = queryParams['shuffle'] !== 'false' && queryParams['shuffle'] !== false;
      this.limitParam = queryParams['limit'] ? parseInt(queryParams['limit'], 10) : 20;
      if (this.deckId) {
        this.loadCards();
      }
    });
  }

  ngOnDestroy(): void {}

  loadDeck(): void {
    this.deckApi.getDeckById(this.deckId).subscribe({
      next: (deck) => (this.deck = deck),
      error: () => {},
    });
  }

  loadCards(): void {
    this.loading = true;
    this.cardApi.getCardsByDeckId(this.deckId, { page: 0, size: 500 }).subscribe({
      next: (res) => {
        let list = res.content || [];

        if (this.starParam) {
          list = list.filter((c) => c.isFavorite || c.favorite);
        }

        if (this.levelParam > 0) {
          list = list.filter((c) => {
            const cardLvl = c.masteryLevel || 1;
            return this.levelParam === 4 ? cardLvl >= 4 : cardLvl === this.levelParam;
          });
        }

        if (this.posParam !== 'all') {
          list = list.filter((c) => {
            const cardPos = (c.partOfSpeech || '').trim().toLowerCase();
            if (this.posParam === 'unknown') return !cardPos;
            return cardPos === this.posParam.toLowerCase();
          });
        }

        if (this.shuffleParam) {
          for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
          }
        }

        if (this.limitParam > 0 && list.length > this.limitParam) {
          list = list.slice(0, this.limitParam);
        }

        this.cards = list;
        this.currentIndex = 0;
        this.isFlipped = false;
        this.isFinished = false;
        this.loading = false;
        if (this.cards.length > 0) {
          this.speakWord(this.cards[0].word || this.cards[0].front || '');
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  toggleFlip(): void {
    this.isFlipped = !this.isFlipped;
  }

  rateCard(quality: number): void {
    const card = this.currentCard;
    if (!card) return;

    this.cardApi.reviewCard({ cardId: card.id, quality }).subscribe({ error: () => {} });

    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.isFlipped = false;
      this.speakWord(this.currentCard?.word || this.currentCard?.front || '');
    } else {
      this.isFinished = true;
      this.awardStudyRewards();
    }
  }

  awardStudyRewards(): void {
    const user = this.auth.currentUser;
    if (!user) return;

    const earnedXp = this.cards.length * 10;
    this.userStatsApi.addXp({ userId: user.userId, xp: earnedXp }).subscribe({ error: () => {} });
  }

  restartStudy(): void {
    this.currentIndex = 0;
    this.isFlipped = false;
    this.isFinished = false;
    this.speakWord(this.cards[0]?.word || this.cards[0]?.front || '');
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
