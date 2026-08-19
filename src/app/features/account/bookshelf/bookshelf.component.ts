import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SavedApiService } from '@core/services/saved-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { ComicCardComponent } from '@shared/components/comic-card/comic-card.component';
import { SavedComic } from '@models/index';

@Component({
  selector: 'app-bookshelf',
  standalone: true,
  imports: [CommonModule, RouterModule, ComicCardComponent],
  template: `
    <div class="bookshelf-panel glass-panel">
      <div class="panel-header">
        <h2><i class="fa-solid fa-bookmark highlight"></i> Tủ Truyện Của Tôi</h2>
        <p class="subtitle">Những bộ truyện tranh bạn đã đánh dấu để theo dõi và đọc lại</p>
      </div>

      @if (loading) {
        <div class="loading-state">
          <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
          <p>Đang tải tủ truyện...</p>
        </div>
      } @else if (savedList.length === 0) {
        <div class="empty-bookshelf">
          <i class="fa-regular fa-bookmark empty-icon"></i>
          <h3>Tủ truyện của bạn đang trống!</h3>
          <p>Hãy khám phá thư viện truyện tranh và nhấn "Đánh dấu" để lưu các bộ truyện yêu thích vào đây.</p>
          <a routerLink="/comics" class="btn-primary">Khám phá truyện</a>
        </div>
      } @else {
        <div class="comic-grid">
          @for (item of savedList; track item.id) {
            @if (item.comic) {
              <app-comic-card [comic]="item.comic"></app-comic-card>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .bookshelf-panel {
      padding: 32px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .panel-header h2 { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 4px; }
    .highlight { color: var(--primary-color); }
    .subtitle { color: var(--text-muted); font-size: 0.9rem; }

    .loading-state { text-align: center; padding: 40px; color: var(--text-muted); }
    .spinner { font-size: 1.8rem; color: var(--primary-color); margin-bottom: 8px; }

    .empty-bookshelf {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .empty-icon { font-size: 3rem; color: var(--text-dim); }
    .empty-bookshelf h3 { font-size: 1.25rem; color: #fff; }
    .empty-bookshelf p { color: var(--text-muted); max-width: 420px; font-size: 0.92rem; }
  `]
})
export class BookshelfComponent implements OnInit {
  private savedApi = inject(SavedApiService);
  private auth = inject(AuthService);

  savedList: SavedComic[] = [];
  loading = true;

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user) {
      this.savedApi.getSavedComicsByUser(user.userId).subscribe({
        next: (list) => {
          this.savedList = list || [];
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }
}
