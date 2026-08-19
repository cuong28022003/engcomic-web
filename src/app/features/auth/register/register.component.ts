import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="auth-page-container">
      <div class="auth-card glass-panel">
        <div class="auth-header">
          <div class="logo-icon">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <h2>Tạo tài khoản mới</h2>
          <p class="subtitle">Bắt đầu hành trình đọc truyện và học tiếng Anh cùng EngComic</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="username">Tên đăng nhập</label>
            <div class="input-wrapper">
              <i class="fa-solid fa-user input-icon"></i>
              <input
                id="username"
                type="text"
                name="username"
                [(ngModel)]="username"
                placeholder="Chọn username của bạn"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="email">Địa chỉ Email</label>
            <div class="input-wrapper">
              <i class="fa-solid fa-envelope input-icon"></i>
              <input
                id="email"
                type="email"
                name="email"
                [(ngModel)]="email"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <div class="input-wrapper">
              <i class="fa-solid fa-lock input-icon"></i>
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                name="password"
                [(ngModel)]="password"
                placeholder="Tối thiểu 6 ký tự"
                required
              />
              <button
                type="button"
                class="toggle-pwd-btn"
                (click)="showPassword = !showPassword"
              >
                <i [class]="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Xác nhận mật khẩu</label>
            <div class="input-wrapper">
              <i class="fa-solid fa-shield-check input-icon"></i>
              <input
                id="confirmPassword"
                [type]="showPassword ? 'text' : 'password'"
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
          </div>

          <button type="submit" class="btn-primary submit-btn" [disabled]="loading">
            @if (loading) {
              <i class="fa-solid fa-circle-notch fa-spin"></i> Đang đăng ký...
            } @else {
              <i class="fa-solid fa-check"></i> Hoàn tất đăng ký
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Đã có tài khoản? <a routerLink="/login" class="link-highlight">Đăng nhập</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page-container {
      min-height: calc(100vh - var(--header-height) - 150px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
    }

    .auth-card {
      width: 100%;
      max-width: 460px;
      padding: 40px 36px;
      border-radius: var(--radius-lg);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--primary-gradient);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 1.3rem;
      margin-bottom: 16px;
      box-shadow: 0 4px 20px rgba(255, 51, 119, 0.4);
    }

    .auth-header h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 0.88rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: var(--text-dim);
      font-size: 0.9rem;
    }

    .input-wrapper input {
      width: 100%;
      padding: 12px 42px 12px 40px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: #fff;
      font-size: 0.92rem;
      outline: none;
      transition: all 0.2s;
    }

    .input-wrapper input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(255, 51, 119, 0.15);
    }

    .toggle-pwd-btn {
      position: absolute;
      right: 12px;
      background: transparent;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      font-size: 0.9rem;
    }

    .toggle-pwd-btn:hover { color: #fff; }

    .submit-btn {
      width: 100%;
      padding: 13px;
      font-size: 0.95rem;
      margin-top: 8px;
    }

    .submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 0.88rem;
      color: var(--text-muted);
    }

    .link-highlight {
      color: var(--primary-color);
      font-weight: 600;
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  loading = false;

  onSubmit(): void {
    if (!this.username.trim() || !this.email.trim() || !this.password.trim()) {
      this.toast.warning('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (this.password.length < 6) {
      this.toast.warning('Mật khẩu cần có tối thiểu 6 ký tự');
      return;
    }

    this.loading = true;
    this.authService
      .register({ username: this.username, email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.success('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading = false;
          this.toast.error(err || 'Đăng ký thất bại. Tên đăng nhập hoặc email có thể đã tồn tại.');
        },
      });
  }
}
