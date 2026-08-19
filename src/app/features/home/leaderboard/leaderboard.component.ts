import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { LeaderboardEntry } from '@models/index';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="leaderboard-page">
      <div class="page-header">
        <h1><i class="fa-solid fa-trophy highlight"></i> Bảng Vinh Danh Độc Giả</h1>
        <p class="subtitle">Những học giả chăm chỉ tích lũy điểm kinh nghiệm nhiều nhất trên EngComic</p>
      </div>

      @if (loading) {
        <div class="loading-state">
          <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
          <p>Đang tải bảng xếp hạng...</p>
        </div>
      } @else {
        <!-- Podium Top 3 -->
        @if (topUsers.length >= 3) {
          <div class="podium-section">
            <!-- Rank 2 -->
            <div class="podium-card rank-2-card glass-panel">
              <span class="crown-icon silver"><i class="fa-solid fa-crown"></i></span>
              <img [src]="topUsers[1].avatarUrl || 'assets/image/avt.png'" alt="Rank 2" class="podium-avatar" />
              <h3>{{ topUsers[1].username }}</h3>
              <span class="xp-badge">{{ topUsers[1].xp | number }} XP</span>
              <div class="podium-stand stand-2">2</div>
            </div>

            <!-- Rank 1 -->
            <div class="podium-card rank-1-card glass-panel">
              <span class="crown-icon gold"><i class="fa-solid fa-crown"></i></span>
              <img [src]="topUsers[0].avatarUrl || 'assets/image/avt.png'" alt="Rank 1" class="podium-avatar" />
              <h3>{{ topUsers[0].username }}</h3>
              <span class="xp-badge gold-xp">{{ topUsers[0].xp | number }} XP</span>
              <div class="podium-stand stand-1">1</div>
            </div>

            <!-- Rank 3 -->
            <div class="podium-card rank-3-card glass-panel">
              <span class="crown-icon bronze"><i class="fa-solid fa-crown"></i></span>
              <img [src]="topUsers[2].avatarUrl || 'assets/image/avt.png'" alt="Rank 3" class="podium-avatar" />
              <h3>{{ topUsers[2].username }}</h3>
              <span class="xp-badge">{{ topUsers[2].xp | number }} XP</span>
              <div class="podium-stand stand-3">3</div>
            </div>
          </div>
        }

        <!-- Leaderboard Table -->
        <div class="leaderboard-table-wrap glass-panel">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Thành viên</th>
                <th>Cấp bậc</th>
                <th>Kinh nghiệm (XP)</th>
              </tr>
            </thead>
            <tbody>
              @for (user of topUsers; track user.userId; let idx = $index) {
                <tr>
                  <td class="rank-cell">
                    <span class="rank-pill" [ngClass]="'rank-' + (idx + 1)">#{{ idx + 1 }}</span>
                  </td>
                  <td class="user-cell">
                    <img [src]="user.avatarUrl || 'assets/image/avt.png'" alt="Avatar" class="tbl-avatar" />
                    <span class="tbl-username">{{ user.username }}</span>
                  </td>
                  <td>
                    <span class="badge badge-primary">{{ user.rank?.name || 'Tập Sự' }}</span>
                  </td>
                  <td class="xp-cell">
                    <i class="fa-solid fa-bolt bolt"></i> {{ user.xp | number }}
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
    .leaderboard-page {
      display: flex;
      flex-direction: column;
      gap: 36px;
      max-width: 960px;
      margin: 0 auto;
    }

    .page-header { text-align: center; }
    .page-header h1 { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 6px; }
    .highlight { color: #ffb800; }
    .subtitle { color: var(--text-muted); font-size: 0.95rem; }

    /* Podium */
    .podium-section {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 20px;
      padding-top: 40px;
      margin-bottom: 12px;
    }

    .podium-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 20px 0;
      border-radius: var(--radius-lg);
      width: 220px;
      text-align: center;
      position: relative;
    }

    .rank-1-card {
      border-color: rgba(255, 184, 0, 0.4);
      background: radial-gradient(circle at 50% 20%, rgba(255, 184, 0, 0.15) 0%, rgba(22, 25, 38, 0.95) 80%);
      transform: translateY(-20px);
    }

    .crown-icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }
    .crown-icon.gold { color: #ffb800; filter: drop-shadow(0 0 10px rgba(255, 184, 0, 0.5)); }
    .crown-icon.silver { color: #cbd5e1; }
    .crown-icon.bronze { color: #cd7f32; }

    .podium-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: 3px solid var(--border-color);
      object-fit: cover;
      margin-bottom: 10px;
    }

    .rank-1-card .podium-avatar {
      width: 88px;
      height: 88px;
      border-color: #ffb800;
    }

    .podium-card h3 { font-size: 1.05rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .xp-badge { font-size: 0.85rem; font-weight: 700; color: #38bdf8; margin-bottom: 16px; }
    .gold-xp { color: #ffb800; font-size: 0.95rem; }

    .podium-stand {
      width: 100%;
      height: 60px;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-bottom: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      font-weight: 900;
      color: var(--text-dim);
    }

    .stand-1 { height: 90px; color: #ffb800; background: rgba(255, 184, 0, 0.1); border-color: rgba(255, 184, 0, 0.3); }

    /* Table */
    .leaderboard-table-wrap {
      border-radius: var(--radius-lg);
      overflow: hidden;
      padding: 12px;
    }

    .leaderboard-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .leaderboard-table th {
      padding: 14px 18px;
      font-size: 0.82rem;
      text-transform: uppercase;
      color: var(--text-dim);
      font-weight: 700;
      border-bottom: 1px solid var(--border-color);
    }

    .leaderboard-table td {
      padding: 16px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.92rem;
    }

    .rank-pill {
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .rank-pill.rank-1 { color: #ffb800; font-size: 1.1rem; }
    .rank-pill.rank-2 { color: #cbd5e1; font-size: 1.05rem; }
    .rank-pill.rank-3 { color: #cd7f32; font-size: 1rem; }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tbl-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
    }

    .tbl-username { font-weight: 600; color: #fff; }
    .xp-cell { font-weight: 700; color: #38bdf8; }
    .bolt { color: #f59e0b; margin-right: 4px; }

    .loading-state { text-align: center; padding: 60px; color: var(--text-muted); }
    .spinner { font-size: 2rem; color: var(--primary-color); margin-bottom: 10px; }
  `]
})
export class LeaderboardComponent implements OnInit {
  private userStatsApi = inject(UserStatsApiService);

  topUsers: LeaderboardEntry[] = [];
  loading = true;

  ngOnInit(): void {
    this.userStatsApi.getLeaderboard({ page: 0, size: 20 }).subscribe({
      next: (res) => {
        this.topUsers = res || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
