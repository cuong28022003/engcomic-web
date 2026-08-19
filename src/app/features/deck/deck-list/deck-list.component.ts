import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeckApiService } from '@core/services/deck-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Deck } from '@models/index';

@Component({
  selector: 'app-deck-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="deck-list-page">
      <div class="page-header">
        <div>
          <h1><i class="fa-solid fa-layer-group highlight"></i> Quản Lý Bộ Thẻ Flashcard (SRS)</h1>
          <p class="subtitle">Ôn tập từ vựng ngắt quãng thông minh giúp ghi nhớ lâu gấp 5 lần</p>
        </div>

        <button class="btn-primary" (click)="openCreateModal()">
          <i class="fa-solid fa-plus"></i> Tạo bộ thẻ mới
        </button>
      </div>

      @if (loading) {
        <div class="loading-grid">
          <div class="skeleton-deck" *ngFor="let i of [1,2,3,4]"></div>
        </div>
      } @else if (decks.length === 0) {
        <div class="empty-state glass-panel">
          <i class="fa-solid fa-folder-open empty-icon"></i>
          <h3>Bạn chưa có bộ thẻ nào</h3>
          <p>Tạo bộ thẻ đầu tiên hoặc đọc truyện tranh và lưu từ vựng để bắt đầu học nhé!</p>
          <button class="btn-primary" (click)="openCreateModal()">+ Tạo bộ thẻ mới</button>
        </div>
      } @else {
        <div class="decks-grid">
          @for (deck of decks; track deck.id) {
            <div class="deck-card glass-panel">
              <div class="deck-header">
                <div class="deck-icon">
                  <i class="fa-solid fa-book-bookmark"></i>
                </div>
                <div class="deck-title-wrap">
                  <h3 class="deck-name">{{ deck.name }}</h3>
                  <span class="card-count">{{ deck.totalCards || 0 }} thẻ từ vựng</span>
                </div>
              </div>

              @if (deck.description) {
                <p class="deck-desc">{{ deck.description }}</p>
              }

              <div class="deck-actions">
                <a [routerLink]="['/study', deck.id]" class="btn-primary btn-sm study-btn">
                  <i class="fa-solid fa-play"></i> Bắt đầu học
                </a>
                <a [routerLink]="['/deck', deck.id]" class="btn-secondary btn-sm">
                  <i class="fa-solid fa-gear"></i> Chi tiết
                </a>
                <button class="btn-icon delete-btn" (click)="deleteDeck(deck.id)" title="Xóa bộ thẻ">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create Deck Modal -->
      @if (isCreateModalOpen) {
        <div class="modal-backdrop" (click)="isCreateModalOpen = false">
          <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3><i class="fa-solid fa-folder-plus highlight"></i> Tạo bộ thẻ từ vựng mới</h3>
              <button class="close-btn" (click)="isCreateModalOpen = false"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <form (ngSubmit)="createDeck()" class="modal-form">
              <div class="form-group">
                <label>Tên bộ thẻ *</label>
                <input
                  type="text"
                  [(ngModel)]="newDeckName"
                  name="newDeckName"
                  placeholder="Ví dụ: Từ vựng One Piece Ch.1, Slang..."
                  required
                />
              </div>

              <div class="form-group">
                <label>Mô tả ngắn</label>
                <textarea
                  rows="3"
                  [(ngModel)]="newDeckDesc"
                  name="newDeckDesc"
                  placeholder="Mục đích ôn luyện..."
                ></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="isCreateModalOpen = false">Hủy</button>
                <button type="submit" class="btn-primary" [disabled]="!newDeckName.trim() || creating">
                  @if (creating) {
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Đang tạo...
                  } @else {
                    Hoàn tất
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .deck-list-page {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .page-header h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .highlight { color: var(--primary-color); }
    .subtitle { color: var(--text-muted); font-size: 0.92rem; margin-top: 4px; }

    .decks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .deck-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-radius: var(--radius-md);
      transition: all 0.25s;
    }

    .deck-card:hover {
      border-color: var(--border-glow);
      transform: translateY(-4px);
    }

    .deck-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .deck-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: var(--secondary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #fff;
    }

    .deck-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
    }

    .card-count {
      font-size: 0.8rem;
      color: #38bdf8;
      font-weight: 600;
    }

    .deck-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .deck-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: auto;
      padding-top: 8px;
    }

    .study-btn { flex: 1; }
    .delete-btn:hover { color: var(--danger-color); border-color: var(--danger-color); }

    /* Modal */
    .modal-backdrop {
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

    .modal-card {
      width: 100%;
      max-width: 480px;
      padding: 28px;
      border-radius: var(--radius-lg);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .close-btn { background: transparent; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
    .form-group input, .form-group textarea {
      padding: 10px 14px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: #fff;
      outline: none;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }

    /* Skeleton */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .skeleton-deck {
      height: 180px;
      border-radius: var(--radius-md);
      background: linear-gradient(90deg, #161926 25%, #222638 50%, #161926 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .empty-state {
      padding: 60px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }

    .empty-icon { font-size: 3rem; color: var(--text-dim); }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class DeckListComponent implements OnInit {
  private deckApi = inject(DeckApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  decks: Deck[] = [];
  loading = true;
  isCreateModalOpen = false;
  creating = false;

  newDeckName = '';
  newDeckDesc = '';

  ngOnInit(): void {
    this.fetchDecks();
  }

  fetchDecks(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để xem danh sách bộ thẻ');
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.deckApi.getDecksByUserId(user.userId).subscribe({
      next: (res) => {
        this.decks = res.content || [];
        this.loading = false;
      },
      error: () => {
        this.decks = [];
        this.loading = false;
      },
    });
  }

  openCreateModal(): void {
    this.newDeckName = '';
    this.newDeckDesc = '';
    this.isCreateModalOpen = true;
  }

  createDeck(): void {
    const user = this.auth.currentUser;
    if (!user || !this.newDeckName.trim()) return;

    this.creating = true;
    this.deckApi
      .createDeck({
        name: this.newDeckName.trim(),
        description: this.newDeckDesc.trim(),
        userId: user.userId,
      })
      .subscribe({
        next: (newDeck) => {
          this.creating = false;
          this.decks.unshift(newDeck);
          this.isCreateModalOpen = false;
          this.toast.success(`Đã tạo bộ thẻ "${newDeck.name}"!`);
        },
        error: () => {
          this.creating = false;
          this.toast.error('Lỗi khi tạo bộ thẻ mới');
        },
      });
  }

  deleteDeck(deckId: string): void {
    if (!confirm('Bạn có chắc muốn xóa bộ thẻ này cùng tất cả thẻ từ vựng bên trong?')) return;

    this.deckApi.deleteDeck(deckId).subscribe({
      next: () => {
        this.decks = this.decks.filter((d) => d.id !== deckId);
        this.toast.success('Đã xóa bộ thẻ');
      },
      error: () => this.toast.error('Không thể xóa bộ thẻ'),
    });
  }
}
