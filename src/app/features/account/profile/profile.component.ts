import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserApiService } from '@core/services/user-api.service';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { ToastService } from '@core/services/toast.service';
import { CurrentUser, UserStats } from '@models/index';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-panel glass-panel">
      <div class="panel-header">
        <h2><i class="fa-solid fa-id-card highlight"></i> Thông Tin Cá Nhân</h2>
        <p class="subtitle">Quản lý hồ sơ và cập nhật thông tin hiển thị của bạn</p>
      </div>

      <!-- Stats Overview Cards -->
      <div class="stats-overview-grid">
        <div class="stat-card">
          <i class="fa-solid fa-bolt bolt"></i>
          <div>
            <span class="num">{{ (userStats?.xp || 0) | number }}</span>
            <span class="lbl">Điểm kinh nghiệm (XP)</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa-solid fa-gem gem"></i>
          <div>
            <span class="num">{{ (userStats?.diamonds || 0) | number }}</span>
            <span class="lbl">Kim cương hiện có</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="fa-solid fa-fire fire"></i>
          <div>
            <span class="num">{{ userStats?.streakDays || 1 }} ngày</span>
            <span class="lbl">Chuỗi đọc truyện</span>
          </div>
        </div>
      </div>

      <form (ngSubmit)="saveProfile()" class="profile-form">
        <div class="form-group">
          <label>Tên đăng nhập (Username)</label>
          <input type="text" [value]="user?.username" disabled class="input-disabled" />
        </div>

        <div class="form-group">
          <label>Địa chỉ Email</label>
          <input type="email" [value]="user?.email" disabled class="input-disabled" />
        </div>

        <div class="form-group">
          <label>Thay đổi ảnh đại diện (Avatar URL)</label>
          <input
            type="text"
            name="avatarUrl"
            [(ngModel)]="avatarUrl"
            placeholder="https://example.com/avatar.jpg"
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="saving">
            @if (saving) {
              <i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...
            } @else {
              <i class="fa-solid fa-check"></i> Lưu thay đổi
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .profile-panel {
      padding: 32px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .panel-header h2 { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 4px; }
    .highlight { color: var(--primary-color); }
    .subtitle { color: var(--text-muted); font-size: 0.9rem; }

    .stats-overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .stat-card i { font-size: 1.8rem; }
    .bolt { color: #f59e0b; }
    .gem { color: #38bdf8; }
    .fire { color: #f97316; }

    .stat-card .num { font-size: 1.2rem; font-weight: 800; color: #fff; display: block; }
    .stat-card .lbl { font-size: 0.72rem; color: var(--text-dim); }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
      max-width: 500px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
    .form-group input {
      padding: 10px 14px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: #fff;
      outline: none;
    }

    .input-disabled { opacity: 0.6; cursor: not-allowed; }

    .form-actions { margin-top: 10px; }
  `]
})
export class ProfileComponent implements OnInit {
  private userApi = inject(UserApiService);
  private auth = inject(AuthService);
  private userState = inject(UserStateService);
  private toast = inject(ToastService);

  user: CurrentUser | null = null;
  userStats: UserStats | null = null;
  avatarUrl = '';
  saving = false;

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    if (this.user?.avatarUrl) this.avatarUrl = this.user.avatarUrl;
    this.userState.userStats$.subscribe((s) => (this.userStats = s));
  }

  saveProfile(): void {
    if (!this.user) return;
    this.saving = true;
    this.auth.updateUser({ avatarUrl: this.avatarUrl });
    this.saving = false;
    this.toast.success('Cập nhật thông tin thành công!');
  }
}
