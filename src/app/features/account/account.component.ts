import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { CurrentUser, UserStats } from '@models/index';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="account-layout">
      <!-- Sidebar Nav -->
      <aside class="account-sidebar glass-panel">
        <div class="user-card-header">
          <img
            [src]="currentUser?.avatarUrl || 'assets/image/avt.png'"
            alt="Avatar"
            class="sidebar-avatar"
            (error)="onAvatarError($event)"
          />
          <h3 class="username">{{ currentUser?.username }}</h3>
          <p class="email">{{ currentUser?.email }}</p>
          @if (userStats?.rank) {
            <span class="badge badge-primary">{{ userStats?.rank?.name }}</span>
          }
        </div>

        <nav class="sidebar-links">
          <a [routerLink]="['/user', userId, 'profile']" routerLinkActive="active" class="side-link">
            <i class="fa-solid fa-user"></i> Hồ sơ cá nhân
          </a>
          <a [routerLink]="['/user', userId, 'bookshelf']" routerLinkActive="active" class="side-link">
            <i class="fa-solid fa-bookmark"></i> Tủ truyện đã lưu
          </a>
          <a routerLink="/deck" class="side-link">
            <i class="fa-solid fa-layer-group"></i> Quản lý bộ thẻ SRS
          </a>
          <a [routerLink]="['/user', userId, 'rank']" routerLinkActive="active" class="side-link">
            <i class="fa-solid fa-trophy"></i> Cấp bậc & Thành tích
          </a>
          <a [routerLink]="['/user', userId, 'collection']" routerLinkActive="active" class="side-link">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Bộ sưu tập Gacha
          </a>
          <a [routerLink]="['/user', userId, 'change-password']" routerLinkActive="active" class="side-link">
            <i class="fa-solid fa-key"></i> Đổi mật khẩu
          </a>
          <a [routerLink]="['/user', userId, 'topup-history']" routerLinkActive="active" class="side-link">
            <i class="fa-solid fa-clock-rotate-left"></i> Lịch sử nạp tiền
          </a>
        </nav>
      </aside>

      <!-- Main Outlet Content -->
      <main class="account-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .account-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 32px;
      align-items: start;
    }

    .account-sidebar {
      padding: 28px 20px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .user-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }

    .sidebar-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--primary-color);
      box-shadow: 0 4px 15px rgba(255, 51, 119, 0.3);
    }

    .username { font-size: 1.15rem; font-weight: 700; color: #fff; }
    .email { font-size: 0.8rem; color: var(--text-muted); }

    .sidebar-links {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .side-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .side-link:hover {
      background: var(--bg-card-hover);
      color: #fff;
    }

    .side-link.active {
      background: var(--primary-gradient);
      color: #fff;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(255, 51, 119, 0.3);
    }

    @media (max-width: 900px) {
      .account-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class AccountComponent implements OnInit {
  private auth = inject(AuthService);
  private userState = inject(UserStateService);
  private route = inject(ActivatedRoute);

  userId = '';
  currentUser: CurrentUser | null = null;
  userStats: UserStats | null = null;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = params['userId'] || this.auth.currentUser?.userId || '';
    });
    this.currentUser = this.auth.currentUser;
    this.userState.userStats$.subscribe((s) => (this.userStats = s));
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = `https://ui-avatars.com/api/?name=${this.currentUser?.username || 'User'}&background=ff3377&color=fff`;
  }
}
