import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AdminApiService } from '@core/services/admin-api.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="admin-dashboard-layout">
      <!-- Admin Header -->
      <div class="admin-top-banner glass-panel">
        <div class="banner-title">
          <span class="badge badge-vip"><i class="fa-solid fa-shield-halved"></i> Hệ Thống Quản Trị</span>
          <h1>Trung Tâm Quản Trị EngComic</h1>
        </div>

        <nav class="admin-nav-tabs">
          <a routerLink="/admin/users" routerLinkActive="active" class="admin-tab">
            <i class="fa-solid fa-users"></i> Quản lý Thành viên
          </a>
          <a routerLink="/admin/comics" routerLinkActive="active" class="admin-tab">
            <i class="fa-solid fa-book-journal-whills"></i> Quản lý Truyện
          </a>
          <a routerLink="/admin/reports" routerLinkActive="active" class="admin-tab">
            <i class="fa-solid fa-flag"></i> Báo cáo vi phạm
          </a>
          <a routerLink="/admin/ranks" routerLinkActive="active" class="admin-tab">
            <i class="fa-solid fa-trophy"></i> Cấp bậc học tập
          </a>
          <a routerLink="/admin/topups" routerLinkActive="active" class="admin-tab">
            <i class="fa-solid fa-credit-card"></i> Duyệt nạp tiền
          </a>
        </nav>
      </div>

      <!-- Nested Module View -->
      <main class="admin-outlet-view">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-dashboard-layout {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .admin-top-banner {
      padding: 28px 32px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .banner-title h1 { font-size: 1.8rem; font-weight: 800; color: #fff; margin-top: 6px; }

    .admin-nav-tabs {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .admin-tab {
      padding: 10px 18px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 0.88rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .admin-tab:hover {
      background: var(--bg-card-hover);
      color: #fff;
    }

    .admin-tab.active {
      background: var(--primary-gradient);
      border-color: var(--primary-color);
      color: #fff;
      box-shadow: 0 4px 15px rgba(255, 51, 119, 0.35);
    }
  `]
})
export class AdminComponent {}
