import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { KeycloakService } from '@core/services/keycloak.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="auth-page-container">
      <div class="auth-card glass-panel">
        <div class="auth-header">
          <div class="logo-icon">
            <i class="fa-solid fa-book-open-reader"></i>
          </div>
          <h2>Chào mừng trở lại!</h2>
          <p class="subtitle">Đăng nhập vào tài khoản EngComic của bạn</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          @if (keycloakEnabled) {
            <button type="button" class="btn-keycloak submit-btn" (click)="onLoginWithKeycloak()">
              <i class="fa-solid fa-key"></i> Đăng nhập với Keycloak
            </button>
            <button type="button" class="btn-keycloak submit-btn" (click)="onRegisterWithKeycloak($event)">
              <i class="fa-solid fa-user-plus"></i> Đăng ký tài khoản
            </button>
          } @else {
            <div class="form-group">
              <label for="username">Tên đăng nhập</label>
              <div class="input-wrapper">
                <i class="fa-solid fa-user input-icon"></i>
                <input
                  id="username"
                  type="text"
                  name="username"
                  [(ngModel)]="username"
                  placeholder="Nhập username"
                  required
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label for="password">Mật khẩu</label>
                <a href="#" class="forgot-link" (click)="onForgotPassword($event)">Quên mật khẩu?</a>
              </div>
              <div class="input-wrapper">
                <i class="fa-solid fa-lock input-icon"></i>
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="password"
                  placeholder="Nhập mật khẩu"
                  required
                  autocomplete="current-password"
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

            <button type="submit" class="btn-primary submit-btn" [disabled]="loading">
              @if (loading) {
                <i class="fa-solid fa-circle-notch fa-spin"></i> Đang đăng nhập...
              } @else {
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Đăng nhập
              }
            </button>
          }
        </form>

        <div class="auth-footer">
          @if (keycloakEnabled) {
            <p>Chưa có tài khoản? <a href="#" class="link-highlight" (click)="onRegisterWithKeycloak($event)">Đăng ký ngay</a></p>
          } @else {
            <p>Chưa có tài khoản? <a routerLink="/register" class="link-highlight">Đăng ký ngay</a></p>
          }
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
      max-width: 440px;
      padding: 40px 36px;
      border-radius: var(--radius-lg);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 32px;
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
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .forgot-link {
      font-size: 0.8rem;
      color: var(--primary-color);
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

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-dim);
      font-size: 0.8rem;
    }

    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-color);
    }

    .btn-keycloak {
      width: 100%;
      padding: 13px;
      font-size: 0.95rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: #4f9deb;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-keycloak:hover {
      background: #3d8bd8;
      box-shadow: 0 4px 18px rgba(79, 157, 235, 0.4);
    }

    .auth-footer {
      text-align: center;
      margin-top: 28px;
      font-size: 0.88rem;
      color: var(--text-muted);
    }

    .link-highlight {
      color: var(--primary-color);
      font-weight: 600;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private keycloak = inject(KeycloakService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly keycloakEnabled = this.keycloak.enabled;
  username = '';
  password = '';
  showPassword = false;
  loading = false;

  onLoginWithKeycloak(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    const redirectUri = returnUrl
      ? `${window.location.origin}${returnUrl}`
      : `${window.location.origin}/`;
    this.keycloak.login(redirectUri).catch((err) => {
      this.toast.error('Không thể kết nối Keycloak');
      console.error(err);
    });
  }

  onRegisterWithKeycloak(event?: Event): void {
    event?.preventDefault();
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    const redirectUri = returnUrl
      ? `${window.location.origin}${returnUrl}`
      : `${window.location.origin}/`;
    this.keycloak.register(redirectUri).catch((err) => {
      this.toast.error('Không thể kết nối Keycloak');
      console.error(err);
    });
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.toast.warning('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    this.loading = true;
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (user) => {
        this.loading = false;
        this.toast.success(`Đăng nhập thành công! Chào mừng ${user.username}`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      },
    });
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.toast.info('Vui lòng liên hệ ban quản trị để được hỗ trợ đặt lại mật khẩu.');
  }
}
