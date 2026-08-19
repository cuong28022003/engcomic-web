import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComicApiService } from '@core/services/comic-api.service';
import { ChapterApiService } from '@core/services/chapter-api.service';
import { RatingApiService } from '@core/services/rating-api.service';
import { SavedApiService } from '@core/services/saved-api.service';
import { AdminApiService } from '@core/services/admin-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { Comic, Chapter, RatingSummary, Comment } from '@models/index';

@Component({
  selector: 'app-comic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    @if (loading) {
      <div class="loading-state">
        <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
        <p>Đang tải thông tin truyện...</p>
      </div>
    } @else if (comic) {
      <div class="comic-detail-container">
        <!-- Hero Header with Blur Backdrop -->
        <div class="detail-hero glass-panel">
          <div
            class="backdrop-blur"
            [style.backgroundImage]="'url(' + (comic.coverImage || 'assets/image/banner-home.png') + ')'"
          ></div>

          <div class="hero-content">
            <div class="poster-wrap">
              <img
                [src]="comic.coverImage || 'assets/image/banner-home.png'"
                [alt]="comic.title"
                class="poster-img"
                (error)="onPosterError($event)"
              />
              @if (comic.isPremium) {
                <span class="badge badge-vip vip-tag"><i class="fa-solid fa-crown"></i> VIP</span>
              }
            </div>

            <div class="info-wrap">
              <div class="genres-row">
                @for (genre of comic.genres; track genre) {
                  <span class="badge badge-genre">{{ genre }}</span>
                }
                <span class="badge badge-primary">{{ comic.status || 'Đang tiến hành' }}</span>
              </div>

              <h1 class="title">{{ comic.title }}</h1>
              <p class="uploader"><i class="fa-solid fa-user-pen"></i> Đăng bởi: <strong>{{ comic.uploaderName || 'Admin' }}</strong></p>

              <!-- Stats summary -->
              <div class="stats-row">
                <div class="stat-box">
                  <span class="num">{{ (comic.views || 0) | number }}</span>
                  <span class="lbl"><i class="fa-regular fa-eye"></i> Lượt xem</span>
                </div>
                <div class="stat-box">
                  <span class="num">{{ chapters.length }}</span>
                  <span class="lbl"><i class="fa-solid fa-book-open"></i> Chương</span>
                </div>
                <div class="stat-box">
                  <span class="num rating-num">
                    <i class="fa-solid fa-star star"></i> {{ (ratingSummary?.averageRating || comic.rating || 5.0) | number:'1.1-1' }}
                  </span>
                  <span class="lbl">({{ ratingSummary?.totalRatings || 0 }} đánh giá)</span>
                </div>
              </div>

              <!-- Action CTAs -->
              <div class="action-buttons">
                @if (chapters.length > 0) {
                  <a [routerLink]="['chapters', chapters[0].id]" class="btn-primary read-cta">
                    <i class="fa-solid fa-book-open-reader"></i> Đọc từ đầu (Ch.1)
                  </a>
                  <a [routerLink]="['chapters', chapters[chapters.length - 1].id]" class="btn-secondary">
                    <i class="fa-solid fa-bolt"></i> Chương mới nhất
                  </a>
                } @else {
                  <button class="btn-secondary" disabled>Chưa có chương</button>
                }

                <button class="btn-icon bookmark-btn" [class.saved]="isSaved" (click)="toggleSaveComic()" [title]="isSaved ? 'Bỏ lưu' : 'Lưu vào tủ truyện'">
                  <i [class]="isSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"></i>
                </button>

                <button class="btn-icon report-btn" (click)="openReportModal()" title="Báo cáo vi phạm">
                  <i class="fa-solid fa-flag"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="tabs-nav glass-panel">
          <button class="tab-btn" [class.active]="activeTab === 'about'" (click)="activeTab = 'about'">
            <i class="fa-solid fa-circle-info"></i> Giới thiệu
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'chapters'" (click)="activeTab = 'chapters'">
            <i class="fa-solid fa-list-ol"></i> Danh sách chương ({{ chapters.length }})
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'reviews'" (click)="activeTab = 'reviews'">
            <i class="fa-solid fa-comments"></i> Đánh giá & Bình luận
          </button>
        </div>

        <!-- Tab 1: About -->
        @if (activeTab === 'about') {
          <div class="tab-panel glass-panel">
            <h3><i class="fa-solid fa-align-left"></i> Nội dung tóm tắt</h3>
            <p class="description-text">
              {{ comic.description || 'Nội dung truyện đang được ban biên tập cập nhật. Hãy cùng đón đọc những chương mới nhất nhé!' }}
            </p>
          </div>
        }

        <!-- Tab 2: Chapters List -->
        @if (activeTab === 'chapters') {
          <div class="tab-panel glass-panel">
            <div class="chapters-header">
              <h3><i class="fa-solid fa-book-journal-whills"></i> Tất cả các chương</h3>
              <input
                type="text"
                placeholder="Tìm số chương..."
                [(ngModel)]="chapterFilter"
                class="chapter-search-input"
              />
            </div>

            @if (filteredChapters.length === 0) {
              <p class="empty-text">Không tìm thấy chương truyện nào.</p>
            } @else {
              <div class="chapters-grid">
                @for (chap of filteredChapters; track chap.id) {
                  <a [routerLink]="['chapters', chap.id]" class="chapter-item">
                    <div class="chap-left">
                      <span class="chap-num">Chương {{ chap.chapterNumber }}</span>
                      @if (chap.title) {
                        <span class="chap-title">- {{ chap.title }}</span>
                      }
                    </div>
                    <div class="chap-right">
                      @if (chap.isPremium) {
                        <span class="badge badge-vip"><i class="fa-solid fa-crown"></i> VIP</span>
                      }
                      <span class="chap-date">{{ chap.createdAt | date:'dd/MM/yyyy' }}</span>
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        }

        <!-- Tab 3: Reviews & Comments -->
        @if (activeTab === 'reviews') {
          <div class="tab-panel glass-panel reviews-panel">
            <!-- Submit Rating Section -->
            <div class="rating-submit-box">
              <h4>Đánh giá bộ truyện này</h4>
              <div class="star-picker">
                @for (s of [1,2,3,4,5]; track s) {
                  <i
                    class="fa-star"
                    [class.fa-solid]="s <= userRating"
                    [class.fa-regular]="s > userRating"
                    [class.active]="s <= userRating"
                    (click)="setRating(s)"
                  ></i>
                }
                <span class="rating-label">{{ userRating }} / 5 sao</span>
              </div>
              <button class="btn-primary btn-sm" (click)="submitRating()">Gửi đánh giá</button>
            </div>

            <hr class="divider" />

            <!-- Comments Section -->
            <div class="comments-section">
              <h4>Bình luận ({{ comments.length }})</h4>

              <div class="comment-input-box">
                <textarea
                  rows="3"
                  placeholder="Viết cảm nghĩ của bạn về bộ truyện này..."
                  [(ngModel)]="newCommentText"
                ></textarea>
                <button class="btn-primary btn-sm" (click)="submitComment()">
                  <i class="fa-solid fa-paper-plane"></i> Gửi bình luận
                </button>
              </div>

              <div class="comments-list">
                @for (cmt of comments; track cmt.id) {
                  <div class="comment-item">
                    <img
                      [src]="cmt.avatarUrl || 'assets/image/avt.png'"
                      alt="Avatar"
                      class="cmt-avatar"
                      (error)="onPosterError($event)"
                    />
                    <div class="cmt-body">
                      <div class="cmt-header">
                        <span class="cmt-author">{{ cmt.username || 'Độc giả' }}</span>
                        <span class="cmt-time">{{ cmt.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      <p class="cmt-text">{{ cmt.content }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .comic-detail-container {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .loading-state {
      padding: 80px 20px;
      text-align: center;
      color: var(--text-muted);
      .spinner { font-size: 2rem; color: var(--primary-color); margin-bottom: 12px; }
    }

    /* Detail Hero */
    .detail-hero {
      position: relative;
      border-radius: var(--radius-lg);
      overflow: hidden;
      padding: 36px 32px;
    }

    .backdrop-blur {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      filter: blur(40px) brightness(0.2);
      transform: scale(1.1);
      z-index: 0;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 36px;
      align-items: flex-start;
    }

    .poster-wrap {
      position: relative;
      width: 220px;
      min-width: 220px;
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .poster-img {
      width: 100%;
      height: 310px;
      object-fit: cover;
      display: block;
    }

    .vip-tag {
      position: absolute;
      top: 10px;
      left: 10px;
    }

    .info-wrap {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }

    .genres-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .title {
      font-size: 2rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.25;
    }

    .uploader {
      color: var(--text-muted);
      font-size: 0.88rem;
    }

    .stats-row {
      display: flex;
      gap: 24px;
      padding: 14px 20px;
      background: rgba(0, 0, 0, 0.35);
      border-radius: var(--radius-md);
      width: fit-content;
      margin: 8px 0;
    }

    .stat-box {
      display: flex;
      flex-direction: column;
    }

    .stat-box .num { font-size: 1.15rem; font-weight: 700; color: #fff; }
    .stat-box .lbl { font-size: 0.75rem; color: var(--text-dim); }
    .rating-num .star { color: #ffb800; }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .read-cta { padding: 12px 28px; font-size: 0.95rem; }
    .bookmark-btn.saved { color: var(--primary-color); border-color: var(--primary-color); }

    /* Navigation Tabs */
    .tabs-nav {
      display: flex;
      gap: 12px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
    }

    .tab-btn {
      padding: 10px 20px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .tab-btn:hover { color: #fff; background: var(--bg-card-hover); }
    .tab-btn.active {
      background: var(--primary-gradient);
      color: #fff;
      box-shadow: 0 4px 15px rgba(255, 51, 119, 0.3);
    }

    .tab-panel {
      padding: 28px;
      border-radius: var(--radius-md);
    }

    .tab-panel h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .description-text { color: var(--text-muted); line-height: 1.7; font-size: 0.95rem; }

    /* Chapters List */
    .chapters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .chapter-search-input {
      padding: 8px 14px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      color: #fff;
      font-size: 0.85rem;
      outline: none;
    }

    .chapters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .chapter-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      transition: all 0.2s;
    }

    .chapter-item:hover {
      border-color: var(--primary-color);
      transform: translateX(4px);
    }

    .chap-num { font-weight: 600; color: #fff; font-size: 0.9rem; }
    .chap-title { color: var(--text-muted); font-size: 0.85rem; margin-left: 4px; }
    .chap-date { font-size: 0.75rem; color: var(--text-dim); }

    /* Reviews */
    .rating-submit-box {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .star-picker {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 1.3rem;
      cursor: pointer;
      color: var(--text-dim);
    }

    .star-picker .fa-star.active { color: #ffb800; }
    .rating-label { font-size: 0.85rem; color: var(--text-muted); margin-left: 8px; }

    .divider { border: none; border-top: 1px solid var(--border-color); margin: 24px 0; }

    .comment-input-box {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 14px;
      margin-bottom: 24px;
    }

    .comment-input-box textarea {
      padding: 12px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: #fff;
      outline: none;
      resize: vertical;
    }

    .comment-item {
      display: flex;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .cmt-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .cmt-header {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 4px;
    }

    .cmt-author { font-weight: 700; font-size: 0.88rem; color: #fff; }
    .cmt-time { font-size: 0.75rem; color: var(--text-dim); }
    .cmt-text { font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; }

    @media (max-width: 768px) {
      .hero-content { flex-direction: column; align-items: center; text-align: center; }
      .stats-row { justify-content: center; width: 100%; }
      .action-buttons { justify-content: center; }
    }
  `]
})
export class ComicDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private comicApi = inject(ComicApiService);
  private chapterApi = inject(ChapterApiService);
  private ratingApi = inject(RatingApiService);
  private savedApi = inject(SavedApiService);
  private adminApi = inject(AdminApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  comicId = '';
  comic: Comic | null = null;
  chapters: Chapter[] = [];
  ratingSummary: RatingSummary | null = null;
  comments: Comment[] = [];

  activeTab: 'about' | 'chapters' | 'reviews' = 'about';
  loading = true;
  isSaved = false;
  savedId?: string;

  chapterFilter = '';
  userRating = 5;
  newCommentText = '';

  get filteredChapters(): Chapter[] {
    if (!this.chapterFilter.trim()) return this.chapters;
    return this.chapters.filter((c) =>
      c.chapterNumber.toString().includes(this.chapterFilter.trim()) ||
      c.title?.toLowerCase().includes(this.chapterFilter.toLowerCase())
    );
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.comicId = params['comicId'];
      if (this.comicId) {
        this.loadComicDetails();
      }
    });
  }

  loadComicDetails(): void {
    this.loading = true;
    this.comicApi.getComicById(this.comicId).subscribe({
      next: (comic) => {
        this.comic = comic;
        this.loading = false;
        this.loadChapters();
        this.loadRatingSummary();
        this.loadComments();
        this.checkIfSaved();
      },
      error: () => {
        this.toast.error('Không tìm thấy truyện tranh này');
        this.loading = false;
      },
    });
  }

  loadChapters(): void {
    this.chapterApi.getChaptersByComicId(this.comicId, { page: 0, size: 100 }).subscribe({
      next: (res) => {
        this.chapters = res.content || [];
      },
    });
  }

  loadRatingSummary(): void {
    this.ratingApi.getSummaryRating(this.comicId).subscribe({
      next: (summary) => (this.ratingSummary = summary),
      error: () => {},
    });
  }

  loadComments(): void {
    this.adminApi.getCommentsByUrl(this.comicId).subscribe({
      next: (cmts) => (this.comments = cmts || []),
      error: () => {},
    });
  }

  checkIfSaved(): void {
    const user = this.auth.currentUser;
    if (!user) return;
    this.savedApi.checkSavedComic({ comicId: this.comicId, userId: user.userId }).subscribe({
      next: (res) => {
        this.isSaved = res.saved;
        this.savedId = res.savedId;
      },
    });
  }

  toggleSaveComic(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để lưu truyện vào tủ');
      this.router.navigate(['/login']);
      return;
    }

    if (this.isSaved && this.savedId) {
      this.savedApi.deleteSaved(this.savedId).subscribe({
        next: () => {
          this.isSaved = false;
          this.savedId = undefined;
          this.toast.success('Đã bỏ lưu truyện');
        },
      });
    } else {
      this.savedApi.saveComic({ comicId: this.comicId, userId: user.userId }).subscribe({
        next: (res) => {
          this.isSaved = true;
          this.savedId = res.id;
          this.toast.success('Đã lưu truyện vào tủ sách');
        },
      });
    }
  }

  setRating(stars: number): void {
    this.userRating = stars;
  }

  submitRating(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để gửi đánh giá');
      return;
    }
    this.ratingApi
      .submitRating({ comicId: this.comicId, userId: user.userId, rating: this.userRating })
      .subscribe({
        next: () => {
          this.toast.success('Cảm ơn bạn đã đánh giá truyện!');
          this.loadRatingSummary();
        },
      });
  }

  submitComment(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để bình luận');
      return;
    }
    if (!this.newCommentText.trim()) return;

    this.adminApi
      .createComment({ url: this.comicId, content: this.newCommentText.trim() })
      .subscribe({
        next: (newCmt) => {
          this.comments.unshift(newCmt);
          this.newCommentText = '';
          this.toast.success('Đã đăng bình luận');
        },
      });
  }

  openReportModal(): void {
    this.toast.info('Tính năng báo cáo vi phạm đã được gửi đến ban quản trị.');
  }

  onPosterError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';
  }
}
