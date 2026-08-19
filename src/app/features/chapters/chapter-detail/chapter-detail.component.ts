import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChapterApiService } from '@core/services/chapter-api.service';
import { TranslatorApiService, TranslateResponse } from '@core/services/translator-api.service';
import { DeckApiService } from '@core/services/deck-api.service';
import { CardApiService } from '@core/services/card-api.service';
import { ReadingApiService } from '@core/services/reading-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Chapter, Deck } from '@models/index';

@Component({
  selector: 'app-chapter-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="reader-page">
      <!-- Sticky Reader Navigation Bar -->
      <nav class="reader-topbar glass-panel">
        <div class="topbar-left">
          <a [routerLink]="['/comics', comicId]" class="btn-icon back-btn" title="Quay lại truyện">
            <i class="fa-solid fa-arrow-left"></i>
          </a>
          <div class="comic-chapter-title">
            <h2 class="comic-name">Chương {{ chapter?.chapterNumber }}</h2>
            @if (chapter?.title) {
              <span class="chap-sub">{{ chapter?.title }}</span>
            }
          </div>
        </div>

        <div class="topbar-center">
          <button
            class="btn-icon nav-arrow"
            [disabled]="!hasPrevChapter"
            (click)="navigateChapter('prev')"
            title="Chương trước"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>

          <select [ngModel]="chapterId" (ngModelChange)="onSelectChapter($event)" class="chapter-select">
            @for (chap of allChapters; track chap.id) {
              <option [value]="chap.id">
                Chương {{ chap.chapterNumber }} {{ chap.title ? '- ' + chap.title : '' }}
              </option>
            }
          </select>

          <button
            class="btn-icon nav-arrow"
            [disabled]="!hasNextChapter"
            (click)="navigateChapter('next')"
            title="Chương tiếp theo"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div class="topbar-right">
          <!-- Quick Dictionary Lookup Trigger -->
          <button
            class="btn-primary btn-sm dict-btn"
            (click)="isDictModalOpen = !isDictModalOpen"
            title="Tra từ điển & Tạo thẻ Flashcard"
          >
            <i class="fa-solid fa-language"></i> Tra từ vựng
          </button>
        </div>
      </nav>

      <!-- Main Comic Canvas / Pages -->
      <div class="pages-container">
        @if (loading) {
          <div class="loading-pages">
            <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
            <p>Đang tải trang truyện...</p>
          </div>
        } @else if (chapter?.images && chapter!.images!.length > 0) {
          <div class="images-scroll-view">
            @for (imgUrl of chapter!.images; track imgUrl; let idx = $index) {
              <div class="page-frame">
                <img
                  [src]="imgUrl"
                  [alt]="'Trang ' + (idx + 1)"
                  class="comic-page-img"
                  loading="lazy"
                  (error)="onImgError($event)"
                />
              </div>
            }
          </div>
        } @else {
          <!-- Demo fallback images if no images in mock data -->
          <div class="images-scroll-view">
            <div class="page-frame demo-frame">
              <img
                src="https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=900&q=80"
                alt="Page 1"
                class="comic-page-img"
              />
            </div>
            <div class="page-frame demo-frame">
              <img
                src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&q=80"
                alt="Page 2"
                class="comic-page-img"
              />
            </div>
          </div>
        }

        <!-- Bottom Chapter Nav Controls -->
        <div class="bottom-nav-controls">
          <button
            class="btn-secondary"
            [disabled]="!hasPrevChapter"
            (click)="navigateChapter('prev')"
          >
            <i class="fa-solid fa-arrow-left"></i> Chương trước
          </button>
          <a [routerLink]="['/comics', comicId]" class="btn-secondary">
            <i class="fa-solid fa-list"></i> Mục lục
          </a>
          <button
            class="btn-primary"
            [disabled]="!hasNextChapter"
            (click)="navigateChapter('next')"
          >
            Chương kế tiếp <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Quick Vocabulary Lookup & Card Maker Popup Modal -->
      @if (isDictModalOpen) {
        <div class="dict-modal-backdrop" (click)="isDictModalOpen = false">
          <div class="dict-modal glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3><i class="fa-solid fa-spell-check highlight"></i> Tra Từ & Lưu Thẻ SRS</h3>
              <button class="close-btn" (click)="isDictModalOpen = false">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="dict-content">
              <!-- Search word input -->
              <div class="search-word-row">
                <input
                  type="text"
                  placeholder="Nhập từ hoặc câu tiếng Anh cần tra..."
                  [(ngModel)]="lookupWord"
                  (keyup.enter)="translateWord()"
                />
                <button class="btn-primary btn-sm" (click)="translateWord()" [disabled]="translating">
                  @if (translating) {
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                  } @else {
                    <i class="fa-solid fa-magnifying-glass"></i> Tra
                  }
                </button>
              </div>

              <!-- Translation Result -->
              @if (translationResult) {
                <div class="result-card">
                  <div class="word-header">
                    <h4 class="word-text">{{ translationResult.word }}</h4>
                    <button class="btn-icon speak-btn" (click)="speak(translationResult.word)" title="Nghe phát âm">
                      <i class="fa-solid fa-volume-high"></i>
                    </button>
                  </div>

                  @if (translationResult.ipa) {
                    <p class="ipa-text">Phiên âm: <code>{{ translationResult.ipa }}</code></p>
                  }

                  <div class="meaning-box">
                    <span class="label">Nghĩa tiếng Việt:</span>
                    <p class="meaning-text">{{ translationResult.meaning }}</p>
                  </div>

                  <hr class="divider" />

                  <!-- Add to Deck Section -->
                  <div class="add-to-deck-section">
                    <h5><i class="fa-solid fa-plus-circle"></i> Thêm vào Bộ thẻ (Deck)</h5>

                    <div class="deck-select-row">
                      <select [(ngModel)]="selectedDeckId" class="deck-select">
                        <option value="">-- Chọn bộ thẻ --</option>
                        @for (deck of decks; track deck.id) {
                          <option [value]="deck.id">{{ deck.name }}</option>
                        }
                      </select>
                      <button class="btn-primary btn-sm" (click)="saveCardToDeck()" [disabled]="savingCard">
                        @if (savingCard) {
                          <i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...
                        } @else {
                          <i class="fa-solid fa-floppy-disk"></i> Lưu thẻ
                        }
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reader-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      position: relative;
    }

    /* Top Sticky Controls */
    .reader-topbar {
      position: sticky;
      top: var(--header-height);
      width: 100%;
      max-width: 960px;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: var(--radius-md);
      z-index: 100;
      margin-bottom: 24px;
      gap: 16px;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .comic-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
    }

    .chap-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .topbar-center {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chapter-select {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: #fff;
      padding: 8px 12px;
      font-size: 0.88rem;
      outline: none;
      max-width: 220px;
    }

    .nav-arrow {
      width: 34px;
      height: 34px;
    }

    .dict-btn {
      padding: 8px 16px;
    }

    /* Pages Container */
    .pages-container {
      width: 100%;
      max-width: 820px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .images-scroll-view {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .page-frame {
      width: 100%;
      background: #000;
      border-radius: var(--radius-sm);
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .comic-page-img {
      width: 100%;
      height: auto;
      display: block;
      user-select: none;
    }

    .loading-pages {
      padding: 80px;
      text-align: center;
      color: var(--text-muted);
      .spinner { font-size: 2rem; color: var(--primary-color); margin-bottom: 12px; }
    }

    /* Bottom Controls */
    .bottom-nav-controls {
      display: flex;
      gap: 16px;
      margin: 40px 0 60px;
      width: 100%;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Dictionary Modal */
    .dict-modal-backdrop {
      position: fixed;
      inset: 0;
      background: var(--bg-overlay);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
    }

    .dict-modal {
      width: 100%;
      max-width: 520px;
      padding: 24px;
      border-radius: var(--radius-lg);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .modal-header h3 { font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .highlight { color: var(--primary-color); }
    .close-btn { background: transparent; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; }

    .search-word-row {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .search-word-row input {
      flex: 1;
      padding: 10px 14px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: #fff;
      outline: none;
    }

    .result-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .word-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .word-text { font-size: 1.3rem; font-weight: 800; color: #fff; text-transform: capitalize; }
    .speak-btn { width: 34px; height: 34px; color: var(--primary-color); }
    .ipa-text code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #38bdf8; }

    .meaning-box .label { font-size: 0.78rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; }
    .meaning-text { font-size: 1rem; color: var(--text-main); font-weight: 600; margin-top: 2px; }

    .divider { border: none; border-top: 1px solid var(--border-color); margin: 6px 0; }

    .add-to-deck-section h5 { font-size: 0.88rem; font-weight: 700; color: #a5b4fc; margin-bottom: 8px; }

    .deck-select-row {
      display: flex;
      gap: 10px;
    }

    .deck-select {
      flex: 1;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: #fff;
      padding: 8px 12px;
      outline: none;
    }

    @media (max-width: 768px) {
      .reader-topbar { flex-direction: column; gap: 10px; }
      .topbar-center { width: 100%; justify-content: space-between; }
    }
  `]
})
export class ChapterDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chapterApi = inject(ChapterApiService);
  private translatorApi = inject(TranslatorApiService);
  private deckApi = inject(DeckApiService);
  private cardApi = inject(CardApiService);
  private readingApi = inject(ReadingApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  comicId = '';
  chapterId = '';
  chapter: Chapter | null = null;
  allChapters: Chapter[] = [];
  decks: Deck[] = [];

  loading = true;
  isDictModalOpen = false;
  lookupWord = '';
  translating = false;
  translationResult: TranslateResponse | null = null;
  selectedDeckId = '';
  savingCard = false;

  get currentChapterIndex(): number {
    return this.allChapters.findIndex((c) => c.id === this.chapterId);
  }

  get hasPrevChapter(): boolean {
    return this.currentChapterIndex > 0;
  }

  get hasNextChapter(): boolean {
    return this.currentChapterIndex < this.allChapters.length - 1 && this.currentChapterIndex !== -1;
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.comicId = params['comicId'];
      this.chapterId = params['chapterId'];
      if (this.comicId && this.chapterId) {
        this.loadChapter();
        this.loadAllChapters();
        this.loadDecks();
        this.updateReadingHistory();
      }
    });
  }

  loadChapter(): void {
    this.loading = true;
    this.chapterApi.getChapterById(this.chapterId).subscribe({
      next: (chap) => {
        this.chapter = chap;
        this.loading = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.toast.error('Không tìm thấy chương truyện này');
        this.loading = false;
      },
    });
  }

  loadAllChapters(): void {
    this.chapterApi.getChaptersByComicId(this.comicId, { page: 0, size: 200 }).subscribe({
      next: (res) => {
        this.allChapters = res.content || [];
      },
    });
  }

  loadDecks(): void {
    const user = this.auth.currentUser;
    if (!user) return;
    this.deckApi.getDecksByUserId(user.userId).subscribe({
      next: (res) => {
        this.decks = res.content || [];
        if (this.decks.length > 0) {
          this.selectedDeckId = this.decks[0].id;
        }
      },
    });
  }

  updateReadingHistory(): void {
    const user = this.auth.currentUser;
    if (!user || !this.chapter) return;
    this.readingApi
      .setReading({
        userId: user.userId,
        comicId: this.comicId,
        chapterId: this.chapterId,
        chapterNumber: this.chapter.chapterNumber,
      })
      .subscribe({ error: () => {} });
  }

  onSelectChapter(newChapterId: string): void {
    if (newChapterId && newChapterId !== this.chapterId) {
      this.router.navigate(['/comics', this.comicId, 'chapters', newChapterId]);
    }
  }

  navigateChapter(direction: 'prev' | 'next'): void {
    const idx = this.currentChapterIndex;
    if (direction === 'prev' && this.hasPrevChapter) {
      const prevId = this.allChapters[idx - 1].id;
      this.router.navigate(['/comics', this.comicId, 'chapters', prevId]);
    } else if (direction === 'next' && this.hasNextChapter) {
      const nextId = this.allChapters[idx + 1].id;
      this.router.navigate(['/comics', this.comicId, 'chapters', nextId]);
    }
  }

  translateWord(): void {
    if (!this.lookupWord.trim()) return;
    this.translating = true;
    this.translatorApi.translateText({ text: this.lookupWord.trim() }).subscribe({
      next: (res) => {
        this.translationResult = res;
        this.translating = false;
      },
      error: () => {
        this.translationResult = {
          word: this.lookupWord.trim(),
          ipa: '/.../',
          meaning: 'Đang tra cứu từ điển...',
        };
        this.translating = false;
      },
    });
  }

  speak(text: string): void {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  saveCardToDeck(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để lưu thẻ từ vựng');
      return;
    }
    if (!this.selectedDeckId) {
      this.toast.warning('Vui lòng chọn bộ thẻ (Deck)');
      return;
    }
    if (!this.translationResult) return;

    this.savingCard = true;
    this.cardApi
      .createCard({
        deckId: this.selectedDeckId,
        front: this.translationResult.word,
        back: this.translationResult.meaning || '',
        ipa: this.translationResult.ipa || '',
      })
      .subscribe({
        next: () => {
          this.savingCard = false;
          this.toast.success(`Đã lưu "${this.translationResult?.word}" vào bộ thẻ!`);
          this.isDictModalOpen = false;
        },
        error: () => {
          this.savingCard = false;
          this.toast.error('Lỗi khi tạo thẻ từ vựng');
        },
      });
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=900&q=80';
  }
}
