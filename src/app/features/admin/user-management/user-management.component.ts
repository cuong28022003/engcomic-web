import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '@core/services/admin-api.service';
import { ToastService } from '@core/services/toast.service';
import { CurrentUser } from '@models/index';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-panel glass-panel">
      <div class="panel-header">
        <div>
          <h2><i class="fa-solid fa-users highlight"></i> Quản Lý Thành Viên</h2>
          <p class="subtitle">Xem danh sách, phân quyền và khóa/mở khóa tài khoản người dùng</p>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state">
          <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users; track u.userId) {
                <tr>
                  <td class="user-col">
                    <img [src]="u.avatarUrl || 'assets/image/avt.png'" alt="Avatar" class="tbl-avatar" />
                    <strong>{{ u.username }}</strong>
                  </td>
                  <td>{{ u.email }}</td>
                  <td>
                    <span class="badge" [class.badge-vip]="u.roles?.includes('ADMIN')" [class.badge-genre]="!u.roles?.includes('ADMIN')">
                      {{ u.roles?.includes('ADMIN') ? 'ADMIN' : 'USER' }}
                    </span>
                  </td>
                  <td>
                    <span class="status-dot active">Hoạt động</span>
                  </td>
                  <td class="actions-col">
                    <button class="btn-icon danger-btn" (click)="deleteUser(u.userId)" title="Xóa tài khoản">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-panel {
      padding: 28px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .panel-header h2 { font-size: 1.4rem; font-weight: 800; color: #fff; }
    .highlight { color: var(--primary-color); }
    .subtitle { color: var(--text-muted); font-size: 0.88rem; margin-top: 2px; }

    .table-wrap { overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
    .admin-table th {
      padding: 12px 16px;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--text-dim);
      border-bottom: 1px solid var(--border-color);
    }
    .admin-table td {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.9rem;
    }

    .user-col { display: flex; align-items: center; gap: 10px; }
    .tbl-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
    .status-dot { font-size: 0.8rem; color: var(--success-color); }

    .actions-col { display: flex; gap: 8px; }
    .danger-btn:hover { color: var(--danger-color); border-color: var(--danger-color); }
    .loading-state { text-align: center; padding: 40px; color: var(--text-muted); }
  `]
})
export class UserManagementComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private toast = inject(ToastService);

  users: CurrentUser[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminApi.getAllUsers({ page: 0, size: 50 }).subscribe({
      next: (res) => {
        this.users = res.content || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        // Mock sample user for demonstration if needed
        this.users = [
          {
            userId: 'admin-1',
            username: 'admin',
            email: 'admin@engcomic.com',
            roles: ['ADMIN', 'USER'],
            accessToken: '',
            refreshToken: '',
          },
        ];
      },
    });
  }

  deleteUser(userId: string): void {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    this.adminApi.deleteAccount(userId).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.userId !== userId);
        this.toast.success('Đã xóa người dùng thành công');
      },
      error: () => this.toast.error('Không thể xóa người dùng'),
    });
  }
}
