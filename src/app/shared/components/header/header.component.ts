import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { ComicGenres } from '@shared/constants/genres';
import { CurrentUser, UserStats } from '@models/index';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="navbar-wrapper">
      <div class="navbar-container">
        <!-- Logo -->
        <a routerLink="/" class="logo-brand">
          <div class="logo-icon">
            <i class="fa-solid fa-book-open-reader"></i>
          </div>
          <span class="logo-text">Eng<span class="highlight">Comic</span></span>
        </a>

        <!-- Desktop Navigation -->
        <nav class="nav-links">
          <div class="dropdown-trigger" (click)="toggleCategoryModal()">
            <span>Thể loại</span>
            <i class="fa-solid fa-chevron-down chevron"></i>
          </div>
          <a routerLink="/comics" routerLinkActive="active" class="nav-item">Truyện tranh</a>
          <a routerLink="/leaderboard" routerLinkActive="active" class="nav-item">Bảng xếp hạng</a>
          <a routerLink="/gacha" routerLinkActive="active" class="nav-item gacha-link">
            <i class="fa-solid fa-dice-d20"></i> Gacha
          </a>
          <a routerLink="/fighting-game" routerLinkActive="active" class="nav-item game-link">
            <i class="fa-solid fa-gamepad"></i> Game
          </a>
          <a routerLink="/vocab" routerLinkActive="active" class="nav-item vocab-link">
            <i class="fa-solid fa-brain"></i> Vocab
          </a>
          <a routerLink="/upgrade-premium" routerLinkActive="active" class="nav-item premium-link">
            <i class="fa-solid fa-crown"></i> VIP
          </a>
        </nav>

        <!-- Search Bar -->
        <div class="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm truyện tranh..."
            [(ngModel)]="searchKeyword"
            (keyup.enter)="onSearch()"
          />
          <button (click)="onSearch()" aria-label="Search" class="search-btn">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>

        <!-- User Actions / Profile -->
        <div class="user-section">
          @if (currentUser) {
            <!-- Streak counter -->
            <div class="stat-badge streak-badge" title="Chuỗi ngày đăng nhập">
              <i class="fa-solid fa-fire fire-icon"></i>
              <span>{{ userStats?.streakDays || 1 }} ngày</span>
            </div>

            <!-- Diamonds counter -->
            <a routerLink="/diamond-topup" class="stat-badge diamond-badge" title="Kim cương - Nạp thêm">
              <i class="fa-solid fa-gem gem-icon"></i>
              <span>{{ userStats?.diamonds || 0 }}</span>
              <i class="fa-solid fa-plus plus-icon"></i>
            </a>

            <!-- Upload Comic CTA -->
            <a routerLink="/comics/create" class="btn-primary upload-btn">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span class="btn-text">Đăng truyện</span>
            </a>

            <!-- Avatar & Menu Dropdown -->
            <div class="profile-dropdown-wrapper">
              <button class="profile-btn" (click)="toggleProfileMenu()">
                <img
                  [src]="currentUser.avatarUrl || 'assets/image/avt.png'"
                  alt="Avatar"
                  class="user-avatar"
                  (error)="onAvatarError($event)"
                />
                <span class="user-name">{{ currentUser.username }}</span>
                <i class="fa-solid fa-angle-down"></i>
              </button>

              @if (isProfileMenuOpen) {
                <div class="dropdown-menu glass-panel" (click)="$event.stopPropagation()">
                  <div class="menu-header">
                    <p class="name">{{ currentUser.username }}</p>
                    <p class="email">{{ currentUser.email }}</p>
                    @if (userStats?.rank) {
                      <span class="badge badge-primary">{{ userStats?.rank?.name }}</span>
                    }
                  </div>
                  <hr class="menu-divider" />
                  <a [routerLink]="['/user', currentUser.userId, 'profile']" (click)="closeProfileMenu()" class="menu-item">
                    <i class="fa-solid fa-user"></i> Hồ sơ cá nhân
                  </a>
                  <a [routerLink]="['/user', currentUser.userId, 'bookshelf']" (click)="closeProfileMenu()" class="menu-item">
                    <i class="fa-solid fa-bookmark"></i> Tủ truyện
                  </a>
                  <a routerLink="/deck" (click)="closeProfileMenu()" class="menu-item">
                    <i class="fa-solid fa-layer-group"></i> Quản lý thẻ từ vựng
                  </a>
                  <a [routerLink]="['/user', currentUser.userId, 'collection']" (click)="closeProfileMenu()" class="menu-item">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Bộ sưu tập Gacha
                  </a>
                  <a [routerLink]="['/user', currentUser.userId, 'rank']" (click)="closeProfileMenu()" class="menu-item">
                    <i class="fa-solid fa-trophy"></i> Cấp bậc & Thành tích
                  </a>
                  @if (isAdmin) {
                    <hr class="menu-divider" />
                    <a routerLink="/admin" (click)="closeProfileMenu()" class="menu-item admin-item">
                      <i class="fa-solid fa-shield-halved"></i> Quản trị Admin
                    </a>
                  }
                  <hr class="menu-divider" />
                  <button (click)="logout()" class="menu-item logout-btn">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
                  </button>
                </div>
              }
            </div>
          } @else {
            <div class="auth-buttons">
              <a routerLink="/login" class="btn-secondary btn-sm">Đăng nhập</a>
              <a routerLink="/register" class="btn-primary btn-sm">Đăng ký</a>
            </div>
          }
        </div>
      </div>
    </header>

    <!-- Categories Modal / Backdrop -->
    @if (isCategoryModalOpen) {
      <div class="category-modal-backdrop" (click)="toggleCategoryModal()">
        <div class="category-modal glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-tags"></i> Khám phá theo thể loại</h3>
            <button class="close-btn" (click)="toggleCategoryModal()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="genre-grid">
            @for (genre of genres; track genre) {
              <a
                [routerLink]="['/search']"
                [queryParams]="{ genre: genre }"
                (click)="toggleCategoryModal()"
                class="genre-chip"
              >
                {{ genre }}
              </a>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .navbar-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--header-height);
      background: rgba(13, 15, 23, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-color);
      z-index: 1000;
    }

    .navbar-container {
      max-width: 1360px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 0 20px;
    }

    .logo-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
    }

    .logo-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 1.1rem;
      box-shadow: 0 4px 15px rgba(255, 51, 119, 0.4);
    }

    .logo-text .highlight {
      color: var(--primary-color);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .nav-item, .dropdown-trigger {
      font-size: 0.92rem;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: color 0.2s;
    }

    .nav-item:hover, .dropdown-trigger:hover, .nav-item.active {
      color: #fff;
    }

    .gacha-link:hover { color: #a855f7 !important; }
    .game-link:hover { color: #06b6d4 !important; }
    .premium-link { color: #ffb800 !important; font-weight: 600; }

    .search-box {
      flex: 1;
      max-width: 320px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-box input {
      width: 100%;
      padding: 9px 40px 9px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      color: var(--text-main);
      font-size: 0.88rem;
      outline: none;
      transition: all 0.2s;
    }

    .search-box input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(255, 51, 119, 0.15);
    }

    .search-btn {
      position: absolute;
      right: 6px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .search-btn:hover { color: var(--primary-color); }

    .user-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 0.82rem;
      font-weight: 600;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }

    .streak-badge .fire-icon { color: #f97316; }
    .diamond-badge {
      color: #38bdf8;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .diamond-badge:hover { transform: scale(1.04); }
    .diamond-badge .gem-icon { color: #38bdf8; }
    .diamond-badge .plus-icon { font-size: 0.7rem; opacity: 0.7; }

    .upload-btn {
      padding: 8px 16px;
      font-size: 0.88rem;
    }

    .profile-dropdown-wrapper {
      position: relative;
    }

    .profile-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-full);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--primary-color);
    }

    .user-name {
      font-weight: 600;
      font-size: 0.9rem;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 240px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      animation: fadeIn 0.15s ease;
    }

    .menu-header {
      padding: 4px 8px;
    }

    .menu-header .name { font-weight: 700; font-size: 0.95rem; }
    .menu-header .email { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; }

    .menu-divider {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 6px 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.88rem;
      color: var(--text-muted);
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s;
    }

    .menu-item:hover {
      background: var(--bg-card-hover);
      color: #fff;
    }

    .menu-item.admin-item { color: #f59e0b; }
    .menu-item.logout-btn { color: #ef4444; }

    /* Category Modal */
    .category-modal-backdrop {
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

    .category-modal {
      width: 100%;
      max-width: 600px;
      padding: 24px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      color: var(--text-muted);
      cursor: pointer;
    }

    .genre-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
    }

    .genre-chip {
      padding: 10px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      text-align: center;
      font-size: 0.88rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .genre-chip:hover {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: #fff;
      transform: translateY(-2px);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 992px) {
      .nav-links { display: none; }
      .search-box { max-width: 200px; }
      .btn-text { display: none; }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userState = inject(UserStateService);
  private userStatsApi = inject(UserStatsApiService);
  private router = inject(Router);

  currentUser: CurrentUser | null = null;
  userStats: UserStats | null = null;
  searchKeyword = '';
  isProfileMenuOpen = false;
  isCategoryModalOpen = false;
  genres = ComicGenres;

  private subs = new Subscription();

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.subs.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadUserStats(user.userId);
        }
      })
    );

    this.subs.add(
      this.userState.userStats$.subscribe((stats) => {
        this.userStats = stats;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadUserStats(userId: string): void {
    this.userStatsApi.getUserStats(userId).subscribe({
      next: (stats) => this.userState.setUserStats(stats),
      error: () => {},
    });
  }

  onSearch(): void {
    if (this.searchKeyword.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { keyword: this.searchKeyword.trim() },
      });
    }
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  toggleCategoryModal(): void {
    this.isCategoryModalOpen = !this.isCategoryModalOpen;
  }

  logout(): void {
    this.closeProfileMenu();
    this.authService.logout();
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://ui-avatars.com/api/?name=' + (this.currentUser?.username || 'User') + '&background=ff3377&color=fff';
  }
}
