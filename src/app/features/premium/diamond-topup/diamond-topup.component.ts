import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopupApiService } from '@core/services/topup-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { TopupRequest } from '@models/index';

@Component({
  selector: 'app-diamond-topup',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="topup-page">
      <div class="topup-header">
        <span class="badge badge-primary"><i class="fa-solid fa-gem"></i> Cửa Hàng Kim Cương</span>
        <h1>Nạp Kim Cương EngComic</h1>
        <p class="subtitle">Dùng kim cương để mở khóa gói VIP, quay tướng Gacha và mua các vật phẩm trợ giúp</p>
      </div>

      <!-- Packages Grid -->
      <div class="packages-grid">
        @for (pkg of diamondPackages; track pkg.diamonds) {
          <div
            class="package-card glass-panel"
            [class.selected]="selectedPackage === pkg"
            (click)="selectedPackage = pkg"
          >
            @if (pkg.bonus) {
              <span class="bonus-tag">+{{ pkg.bonus }} KM</span>
            }
            <div class="gem-icon-wrap">
              <i class="fa-solid fa-gem gem"></i>
            </div>
            <h3 class="diamond-num">{{ pkg.diamonds | number }} <span>Kim cương</span></h3>
            <p class="price-vnd">{{ pkg.price | number }} VNĐ</p>
            <button class="btn-primary select-btn">Chọn gói</button>
          </div>
        }
      </div>

      <!-- Payment Section -->
      @if (selectedPackage) {
        <div class="payment-section glass-panel">
          <h3><i class="fa-solid fa-credit-card highlight"></i> Xác Nhận Thanh Toán</h3>
          <div class="payment-details">
            <div class="detail-row">
              <span>Gói nạp đã chọn:</span>
              <strong>{{ selectedPackage.diamonds }} Kim cương</strong>
            </div>
            <div class="detail-row">
              <span>Tổng số tiền:</span>
              <strong class="price-highlight">{{ selectedPackage.price | number }} VNĐ</strong>
            </div>
            <div class="detail-row">
              <span>Phương thức:</span>
              <span>Chuyển khoản QR Ngân hàng / Momo</span>
            </div>
          </div>

          <button class="btn-primary create-order-btn" (click)="submitTopupRequest()" [disabled]="submitting">
            @if (submitting) {
              <i class="fa-solid fa-circle-notch fa-spin"></i> Đang tạo yêu cầu...
            } @else {
              <i class="fa-solid fa-qrcode"></i> Tạo mã nạp tiền & Thanh toán
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .topup-page {
      display: flex;
      flex-direction: column;
      gap: 36px;
      max-width: 960px;
      margin: 0 auto;
    }

    .topup-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .topup-header h1 { font-size: 2.2rem; font-weight: 800; color: #fff; }
    .subtitle { color: var(--text-muted); font-size: 0.95rem; }

    .packages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .package-card {
      padding: 28px 20px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      cursor: pointer;
      position: relative;
      transition: all 0.25s;
    }

    .package-card:hover { transform: translateY(-4px); border-color: var(--border-glow); }
    .package-card.selected {
      border-color: #38bdf8;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.35);
      background: radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.15) 0%, rgba(22, 25, 38, 0.95) 80%);
    }

    .bonus-tag {
      position: absolute;
      top: 10px;
      right: 10px;
      background: var(--danger-color);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: var(--radius-full);
    }

    .gem-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .gem { font-size: 1.8rem; color: #38bdf8; }
    .diamond-num { font-size: 1.4rem; font-weight: 800; color: #fff; }
    .diamond-num span { font-size: 0.8rem; display: block; color: var(--text-muted); font-weight: 500; }
    .price-vnd { font-size: 1.15rem; font-weight: 700; color: #ffb800; }
    .select-btn { width: 100%; padding: 8px; font-size: 0.85rem; }

    /* Payment section */
    .payment-section {
      padding: 32px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 540px;
      margin: 0 auto;
      width: 100%;
    }

    .payment-section h3 { font-size: 1.2rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
    .highlight { color: var(--primary-color); }

    .payment-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--bg-main);
      padding: 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.92rem;
      color: var(--text-muted);
    }

    .detail-row strong { color: #fff; }
    .price-highlight { color: #ffb800 !important; font-size: 1.15rem; }
    .create-order-btn { padding: 14px; font-size: 1rem; }
  `]
})
export class DiamondTopupComponent {
  private topupApi = inject(TopupApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  diamondPackages = [
    { diamonds: 100, price: 20000, bonus: 0 },
    { diamonds: 300, price: 50000, bonus: 20 },
    { diamonds: 650, price: 100000, bonus: 50 },
    { diamonds: 1400, price: 200000, bonus: 150 },
    { diamonds: 3800, price: 500000, bonus: 500 },
  ];

  selectedPackage = this.diamondPackages[1];
  submitting = false;

  submitTopupRequest(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để nạp kim cương');
      this.router.navigate(['/login']);
      return;
    }

    this.submitting = true;
    this.topupApi.createTopupRequest({ amount: this.selectedPackage.price }).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('Tạo yêu cầu nạp kim cương thành công! Vui lòng quét mã thanh toán.');
      },
      error: () => {
        this.submitting = false;
        this.toast.error('Lỗi khi gửi yêu cầu nạp tiền');
      },
    });
  }
}
