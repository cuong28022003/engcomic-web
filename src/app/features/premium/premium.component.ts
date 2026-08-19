import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="premium-page">
      <div class="premium-header">
        <span class="badge badge-vip"><i class="fa-solid fa-crown"></i> Gói Thành Viên EngComic VIP</span>
        <h1>Mở Khóa Toàn Bộ Đặc Quyền Học Tập</h1>
        <p class="subtitle">Đọc không giới hạn mọi chương VIP, chụp màn hình tra từ điển OCR siêu tốc và x2 kinh nghiệm (XP)</p>
      </div>

      <!-- Plans Comparison Grid -->
      <div class="plans-grid">
        <!-- Free Plan -->
        <div class="plan-card glass-panel">
          <div class="plan-header">
            <h3>Tài Khoản Miễn Phí</h3>
            <div class="plan-price">0đ <span>/ vĩnh viễn</span></div>
          </div>
          <ul class="features-list">
            <li><i class="fa-solid fa-check check"></i> Đọc truyện tranh cơ bản</li>
            <li><i class="fa-solid fa-check check"></i> Tra từ điển song ngữ thủ công</li>
            <li><i class="fa-solid fa-check check"></i> Tạo tối đa 3 bộ thẻ Flashcard</li>
            <li class="disabled"><i class="fa-solid fa-xmark cross"></i> Đọc các chương truyện VIP</li>
            <li class="disabled"><i class="fa-solid fa-xmark cross"></i> Nhận diện từ vựng qua ảnh chụp (OCR)</li>
            <li class="disabled"><i class="fa-solid fa-xmark cross"></i> Không có huy hiệu VIP độc quyền</li>
          </ul>
          <button class="btn-secondary" disabled>Đang sử dụng</button>
        </div>

        <!-- 1 Month VIP -->
        <div class="plan-card glass-panel featured-plan">
          <div class="popular-ribbon">Phổ biến nhất</div>
          <div class="plan-header">
            <h3>VIP 1 Tháng (30 Ngày)</h3>
            <div class="plan-price">500 <span><i class="fa-solid fa-gem gem"></i> Kim cương</span></div>
          </div>
          <ul class="features-list">
            <li><i class="fa-solid fa-check check"></i> Mở khóa toàn bộ chương truyện VIP</li>
            <li><i class="fa-solid fa-check check"></i> Chụp ảnh màn hình tra từ OCR không giới hạn</li>
            <li><i class="fa-solid fa-check check"></i> Tạo không giới hạn bộ thẻ nhớ SRS</li>
            <li><i class="fa-solid fa-check check"></i> x2 Điểm kinh nghiệm (XP) khi học từ</li>
            <li><i class="fa-solid fa-check check"></i> Huy hiệu Hoàng Gia trên bảng xếp hạng</li>
          </ul>
          <button class="btn-primary upgrade-btn" (click)="upgrade(30, 500)">
            <i class="fa-solid fa-crown"></i> Nâng cấp ngay
          </button>
        </div>

        <!-- 1 Year VIP -->
        <div class="plan-card glass-panel">
          <div class="plan-header">
            <h3>VIP 1 Năm (Tiết Kiệm 30%)</h3>
            <div class="plan-price">4,200 <span><i class="fa-solid fa-gem gem"></i> Kim cương</span></div>
          </div>
          <ul class="features-list">
            <li><i class="fa-solid fa-check check"></i> Toàn bộ đặc quyền VIP trọn gói</li>
            <li><i class="fa-solid fa-check check"></i> Tặng kèm 3 Vé quay tướng Gacha SSR</li>
            <li><i class="fa-solid fa-check check"></i> Khung avatar VIP phát sáng đặc biệt</li>
            <li><i class="fa-solid fa-check check"></i> Ưu tiên hỗ trợ từ đội ngũ phát triển</li>
          </ul>
          <button class="btn-primary upgrade-btn" (click)="upgrade(365, 4200)">
            <i class="fa-solid fa-gem"></i> Nâng cấp 1 Năm
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .premium-page {
      display: flex;
      flex-direction: column;
      gap: 40px;
      max-width: 1080px;
      margin: 0 auto;
    }

    .premium-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .premium-header h1 { font-size: 2.3rem; font-weight: 800; color: #fff; }
    .subtitle { color: var(--text-muted); max-width: 600px; font-size: 1rem; }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 28px;
      align-items: stretch;
    }

    .plan-card {
      padding: 36px 28px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      position: relative;
      background: var(--bg-card);
    }

    .featured-plan {
      border-color: rgba(255, 184, 0, 0.4);
      background: radial-gradient(circle at 50% 10%, rgba(255, 184, 0, 0.12) 0%, rgba(22, 25, 38, 0.95) 80%);
      box-shadow: 0 0 30px rgba(255, 184, 0, 0.2);
      transform: scale(1.03);
    }

    .popular-ribbon {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ffb800 0%, #ff7300 100%);
      color: #000;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 4px 16px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .plan-header { margin-bottom: 24px; }
    .plan-header h3 { font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .plan-price { font-size: 2rem; font-weight: 800; color: #fff; }
    .plan-price span { font-size: 0.9rem; font-weight: 500; color: var(--text-muted); }
    .gem { color: #38bdf8; }

    .features-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 32px;
      flex: 1;
    }

    .features-list li {
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-main);
    }

    .features-list li.disabled { color: var(--text-dim); text-decoration: line-through; }
    .check { color: var(--success-color); }
    .cross { color: var(--danger-color); }

    .upgrade-btn { width: 100%; padding: 13px; font-size: 0.95rem; }
  `]
})
export class PremiumComponent {
  private userStatsApi = inject(UserStatsApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  upgrade(days: number, cost: number): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để nâng cấp gói VIP');
      this.router.navigate(['/login']);
      return;
    }

    this.userStatsApi.upgradePremium({ userId: user.userId, days }).subscribe({
      next: () => {
        this.toast.success(`Chúc mừng bạn đã nâng cấp thành công gói VIP ${days} ngày!`);
      },
      error: () => {
        this.toast.error('Số lượng kim cương không đủ hoặc có lỗi phát sinh. Vui lòng nạp thêm kim cương.');
      },
    });
  }
}
