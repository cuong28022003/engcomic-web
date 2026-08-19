import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComicApiService } from '@core/services/comic-api.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { ComicCardComponent } from '@shared/components/comic-card/comic-card.component';
import { Comic, LeaderboardEntry } from '@models/index';
import { ComicGenres } from '@shared/constants/genres';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ComicCardComponent],
  template: `
    <div class="home-container">
      <!-- Hero Banner Section -->
      <section class="hero-section glass-panel">
        <div class="hero-content">
          <span class="hero-badge badge badge-primary">
            <i class="fa-solid fa-sparkles"></i> Nâng tầm tiếng Anh với truyện tranh
          </span>
          <h1 class="hero-title">
            Vừa Đọc Truyện Hay, <br/>
            <span class="gradient-text">Vừa Luyện Tiếng Anh Tự Nhiên</span>
          </h1>
          <p class="hero-desc">
            Khám phá hàng ngàn bộ truyện tranh lôi cuốn với hệ thống dịch thông minh 1-chạm, lưu từ vựng vào bộ thẻ nhớ Spaced Repetition và thách đấu cùng bạn bè.
          </p>
          <div class="hero-actions">
            <a routerLink="/comics" class="btn-primary">
              <i class="fa-solid fa-compass"></i> Khám phá ngay
            </a>
            <a routerLink="/deck" class="btn-secondary">
              <i class="fa-solid fa-layer-group"></i> Bộ thẻ từ vựng
            </a>
          </div>
        </div>

        <div class="hero-visual">
          <div class="floating-card stat-card">
            <i class="fa-solid fa-bolt icon"></i>
            <div>
              <p class="num">5,000+</p>
              <p class="lbl">Từ vựng tra mỗi ngày</p>
            </div>
          </div>
          <div class="floating-card game-card">
            <i class="fa-solid fa-dice-d20 icon"></i>
            <div>
              <p class="num">Gacha & Game</p>
              <p class="lbl">Học mà chơi cực vui</p>
            </div>
          </div>
          <img src="assets/image/banner-home.png" alt="EngComic Hero" class="hero-img" (error)="onHeroImgError($event)" />
        </div>
      </section>

      <!-- Quick Genre Pills -->
      <div class="genres-bar">
        @for (genre of genres.slice(0, 8); track genre) {
          <a [routerLink]="['/search']" [queryParams]="{ genre: genre }" class="genre-pill">
            {{ genre }}
          </a>
        }
        <a routerLink="/search" class="genre-pill view-all">Tất cả thể loại →</a>
      </div>

      <!-- Main Content Layout -->
      <div class="home-main-layout">
        <!-- Left / Center: Comic Listings -->
        <div class="comics-column">
          <!-- Hot Comics -->
          <section class="section-block">
            <div class="section-header">
              <div class="title-wrap">
                <i class="fa-solid fa-fire title-icon hot-icon"></i>
                <h2>Truyện Nổi Bật</h2>
              </div>
              <a routerLink="/comics" [queryParams]="{ sort: 'views' }" class="view-more">Xem thêm →</a>
            </div>

            @if (loadingHot) {
              <div class="loading-grid">
                <div class="skeleton-card" *ngFor="let i of [1,2,3,4]"></div>
              </div>
            } @else {
              <div class="comic-grid">
                @for (comic of hotComics; track comic.id) {
                  <app-comic-card [comic]="comic"></app-comic-card>
                }
              </div>
            }
          </section>

          <!-- Recent Comics -->
          <section class="section-block">
            <div class="section-header">
              <div class="title-wrap">
                <i class="fa-solid fa-clock-rotate-left title-icon recent-icon"></i>
                <h2>Mới Cập Nhật</h2>
              </div>
              <a routerLink="/comics" class="view-more">Xem tất cả →</a>
            </div>

            @if (loadingRecent) {
              <div class="loading-grid">
                <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]"></div>
              </div>
            } @else {
              <div class="comic-grid">
                @for (comic of recentComics; track comic.id) {
                  <app-comic-card [comic]="comic"></app-comic-card>
                }
              </div>
            }
          </section>
        </div>

        <!-- Right Sidebar: Leaderboard & Quick Game CTA -->
        <aside class="sidebar-column">
          <!-- Top Readers Widget -->
          <div class="sidebar-widget glass-panel">
            <div class="widget-header">
              <h3><i class="fa-solid fa-trophy trophy-icon"></i> Top Học Giả</h3>
              <a routerLink="/leaderboard" class="widget-link">Toàn bộ</a>
            </div>

            <div class="leaderboard-list">
              @for (user of topUsers; track user.userId; let idx = $index) {
                <a [routerLink]="['/user', user.userId, 'profile']" class="leaderboard-item">
                  <div class="rank-num" [ngClass]="'rank-' + (idx + 1)">#{{ idx + 1 }}</div>
                  <img
                    [src]="user.avatarUrl || 'assets/image/avt.png'"
                    alt="User"
                    class="user-avatar"
                    (error)="onAvatarError($event, user.username)"
                  />
                  <div class="user-meta">
                    <p class="name">{{ user.username }}</p>
                    <span class="xp-val"><i class="fa-solid fa-bolt"></i> {{ user.xp | number }} XP</span>
                  </div>
                </a>
              }
            </div>
          </div>

          <!-- Feature Promo Card -->
          <div class="sidebar-widget promo-widget">
            <div class="promo-badge"><i class="fa-solid fa-gamepad"></i> Minigame</div>
            <h4>Đấu Tướng Từ Vựng</h4>
            <p>Dùng bộ bài và từ vựng của bạn để thi triển kỹ năng, hạ gục quái vật và leo tháp xếp hạng!</p>
            <a routerLink="/fighting-game" class="btn-primary btn-sm">Chơi ngay</a>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      gap: 36px;
    }

    /* Hero Section */
    .hero-section {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      align-items: center;
      gap: 40px;
      padding: 48px 40px;
      border-radius: var(--radius-lg);
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at 10% 20%, rgba(255, 51, 119, 0.12) 0%, rgba(22, 25, 38, 0.9) 90%);
    }

    .hero-badge {
      margin-bottom: 18px;
    }

    .hero-title {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 16px;
      color: #fff;
    }

    .gradient-text {
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-desc {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 28px;
      max-width: 520px;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
    }

    .hero-visual {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .hero-img {
      max-width: 100%;
      height: 280px;
      object-fit: contain;
      filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.6));
    }

    .floating-card {
      position: absolute;
      background: rgba(22, 25, 38, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      animation: float 4s ease-in-out infinite alternate;
    }

    .stat-card {
      top: 10px;
      left: -20px;
      .icon { color: #f59e0b; font-size: 1.4rem; }
    }

    .game-card {
      bottom: 10px;
      right: -20px;
      animation-delay: 2s;
      .icon { color: #a855f7; font-size: 1.4rem; }
    }

    .floating-card .num { font-weight: 700; font-size: 0.95rem; }
    .floating-card .lbl { font-size: 0.75rem; color: var(--text-muted); }

    @keyframes float {
      from { transform: translateY(0); }
      to { transform: translateY(-10px); }
    }

    /* Genres Bar */
    .genres-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 6px;
    }

    .genre-pill {
      padding: 8px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
      white-space: nowrap;
      transition: all 0.2s;
    }

    .genre-pill:hover {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: #fff;
    }

    .genre-pill.view-all {
      color: var(--primary-color);
      border-color: rgba(255, 51, 119, 0.3);
    }

    /* Layout Columns */
    .home-main-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 32px;
      align-items: start;
    }

    .comics-column {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .section-block {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .title-wrap h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
    }

    .title-icon {
      font-size: 1.25rem;
    }

    .hot-icon { color: #f97316; }
    .recent-icon { color: #38bdf8; }

    .view-more {
      color: var(--primary-color);
      font-size: 0.88rem;
      font-weight: 600;
    }

    /* Sidebar */
    .sidebar-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .sidebar-widget {
      padding: 20px;
      border-radius: var(--radius-md);
    }

    .widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .widget-header h3 {
      font-size: 1.05rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .trophy-icon { color: #ffb800; }
    .widget-link { font-size: 0.82rem; color: var(--primary-color); }

    .leaderboard-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .leaderboard-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      transition: background 0.15s;
    }

    .leaderboard-item:hover {
      background: var(--bg-card-hover);
    }

    .rank-num {
      font-weight: 800;
      font-size: 0.85rem;
      width: 24px;
      color: var(--text-dim);
    }

    .rank-1 { color: #ffb800; font-size: 1rem; }
    .rank-2 { color: #94a3b8; font-size: 0.95rem; }
    .rank-3 { color: #cd7f32; font-size: 0.9rem; }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-meta .name {
      font-weight: 600;
      font-size: 0.88rem;
    }

    .xp-val {
      font-size: 0.78rem;
      color: #38bdf8;
    }

    .promo-widget {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
      border: 1px solid rgba(99, 102, 241, 0.3);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .promo-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #a5b4fc;
      text-transform: uppercase;
    }

    .promo-widget h4 { font-size: 1.1rem; color: #fff; }
    .promo-widget p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

    /* Skeletons */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }

    .skeleton-card {
      height: 320px;
      border-radius: var(--radius-md);
      background: linear-gradient(90deg, #161926 25%, #222638 50%, #161926 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (max-width: 1024px) {
      .home-main-layout { grid-template-columns: 1fr; }
      .hero-section { grid-template-columns: 1fr; }
      .hero-visual { display: none; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private comicApi = inject(ComicApiService);
  private userStatsApi = inject(UserStatsApiService);

  hotComics: Comic[] = [];
  recentComics: Comic[] = [];
  topUsers: LeaderboardEntry[] = [];
  genres = ComicGenres;

  loadingHot = true;
  loadingRecent = true;

  ngOnInit(): void {
    this.loadHotComics();
    this.loadRecentComics();
    this.loadTopUsers();
  }

  loadHotComics(): void {
    this.comicApi.getComics({ page: 0, size: 4, sort: 'views' }).subscribe({
      next: (res) => {
        this.hotComics = res.content || [];
        this.loadingHot = false;
      },
      error: () => {
        this.loadingHot = false;
      },
    });
  }

  loadRecentComics(): void {
    this.comicApi.getComics({ page: 0, size: 8 }).subscribe({
      next: (res) => {
        this.recentComics = res.content || [];
        this.loadingRecent = false;
      },
      error: () => {
        this.loadingRecent = false;
      },
    });
  }

  loadTopUsers(): void {
    this.userStatsApi.getLeaderboard({ page: 0, size: 5 }).subscribe({
      next: (res) => {
        this.topUsers = res || [];
      },
      error: () => {},
    });
  }

  onHeroImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80';
  }

  onAvatarError(event: Event, name: string): void {
    const img = event.target as HTMLImageElement;
    img.src = `https://ui-avatars.com/api/?name=${name || 'User'}&background=6366f1&color=fff`;
  }
}
