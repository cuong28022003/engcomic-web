import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer-wrapper">
      <div class="footer-container">
        <div class="footer-grid">
          <!-- Brand col -->
          <div class="footer-col brand-col">
            <div class="logo-brand">
              <div class="logo-icon">
                <i class="fa-solid fa-book-open-reader"></i>
              </div>
              <span class="logo-text">Eng<span class="highlight">Comic</span></span>
            </div>
            <p class="brand-desc">
              Nền tảng đọc truyện tranh song ngữ Anh - Việt thông minh, tích hợp tra từ điển tức thì, thẻ nhớ Spaced Repetition và minigame đấu tướng giải trí.
            </p>
            <div class="social-links">
              <a href="#" class="btn-icon" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
              <a href="#" class="btn-icon" aria-label="Discord"><i class="fa-brands fa-discord"></i></a>
              <a href="#" class="btn-icon" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
            </div>
          </div>

          <!-- Quick links -->
          <div class="footer-col">
            <h4>Khám phá</h4>
            <ul>
              <li><a routerLink="/comics">Danh sách truyện tranh</a></li>
              <li><a routerLink="/leaderboard">Bảng xếp hạng độc giả</a></li>
              <li><a routerLink="/gacha">Vòng quay may mắn Gacha</a></li>
              <li><a routerLink="/fighting-game">Đấu tướng từ vựng</a></li>
            </ul>
          </div>

          <!-- Features -->
          <div class="footer-col">
            <h4>Tính năng học tập</h4>
            <ul>
              <li><a routerLink="/deck">Hệ thống thẻ ghi nhớ SRS</a></li>
              <li><a routerLink="/upgrade-premium">Gói thành viên VIP</a></li>
              <li><a routerLink="/diamond-topup">Nạp kim cương</a></li>
              <li><a routerLink="/comics/create">Đăng tải truyện của bạn</a></li>
            </ul>
          </div>

          <!-- Support -->
          <div class="footer-col">
            <h4>Hỗ trợ</h4>
            <ul>
              <li><a href="#">Điều khoản sử dụng</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Báo cáo vi phạm</a></li>
              <li><a href="#">Liên hệ ban quản trị</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 EngComic. Bản quyền thuộc về EngComic Team. Phát triển với Angular.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-wrapper {
      background: #090a10;
      border-top: 1px solid var(--border-color);
      margin-top: auto;
      padding: 60px 20px 24px;
    }

    .footer-container {
      max-width: 1360px;
      margin: 0 auto;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }

    .brand-col .logo-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.35rem;
      font-weight: 800;
      margin-bottom: 14px;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .highlight { color: var(--primary-color); }

    .brand-desc {
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 20px;
      max-width: 380px;
    }

    .social-links {
      display: flex;
      gap: 10px;
    }

    .footer-col h4 {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 18px;
    }

    .footer-col ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .footer-col a {
      color: var(--text-muted);
      font-size: 0.88rem;
      transition: color 0.2s;
    }

    .footer-col a:hover {
      color: var(--primary-color);
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 24px;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.85rem;
    }

    @media (max-width: 900px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 30px;
      }
      .brand-col {
        grid-column: span 2;
      }
    }

    @media (max-width: 600px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }
      .brand-col {
        grid-column: span 1;
      }
    }
  `]
})
export class FooterComponent {}
