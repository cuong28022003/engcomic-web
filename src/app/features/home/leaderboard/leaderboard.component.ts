import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { AuthService } from '@core/services/auth.service';
import { LeaderboardEntry } from '@models/index';
import { AvatarFrameComponent } from '@shared/components/avatar-frame/avatar-frame.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

const TIER_COLORS = [
  '#cd7f32',
  '#cbd5e1',
  '#eab308',
  '#38bdf8',
  '#a855f7',
  '#f43f5e',
  '#f97316'
];

interface LeaderboardResponse {
  content?: LeaderboardEntry[];
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, AvatarFrameComponent, PageHeaderComponent],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  private userStatsApi = inject(UserStatsApiService);
  private auth = inject(AuthService);

  readonly users = signal<LeaderboardEntry[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<boolean>(false);

  readonly myUserId = computed<string>(() => this.auth.currentUser?.userId || '');

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.loading.set(true);
    this.error.set(false);
    this.userStatsApi.getLeaderboard({ page: 0, size: 30 }).subscribe({
      next: (res) => {
        this.users.set(this.normalizeResponse(res));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  private normalizeResponse(res: LeaderboardEntry[] | LeaderboardResponse | null | undefined): LeaderboardEntry[] {
    if (Array.isArray(res)) return res;
    const wrapped = (res as LeaderboardResponse | null | undefined)?.content;
    return Array.isArray(wrapped) ? wrapped : [];
  }

  retry(): void {
    this.loadLeaderboard();
  }

  tierOf(user: LeaderboardEntry): number {
    const name = (user.rank?.name || '').toLowerCase();
    if (name.includes('legend')) return 6;
    if (name.includes('master')) return 5;
    if (name.includes('diamond')) return 4;
    if (name.includes('platinum')) return 3;
    if (name.includes('gold')) return 2;
    if (name.includes('silver')) return 1;
    return 0;
  }

  tierColor(user: LeaderboardEntry): string {
    return TIER_COLORS[this.tierOf(user)] ?? TIER_COLORS[0];
  }

  maxXp(): number {
    const list = this.users();
    if (!list.length) return 1;
    return Math.max(...list.map(u => u.xp), 1);
  }

  barWidth(user: LeaderboardEntry): number {
    const max = this.maxXp();
    return Math.max(6, Math.round((user.xp / max) * 100));
  }

  medalIcon(index: number): string {
    if (index === 0) return 'fa-solid fa-crown';
    if (index === 1) return 'fa-solid fa-medal';
    if (index === 2) return 'fa-solid fa-award';
    return '';
  }
}