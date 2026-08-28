import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { RankApiService } from '@core/services/rank-api.service';
import { ToastService } from '@core/services/toast.service';
import { CurrentUser, UserStats, Rank } from '@models/index';

export interface RankTierDisplay {
  id?: string;
  name: string;
  minXp: number;
  maxXp: number;
  icon: string;
  badgeUrl?: string;
  color: string;
  gradient: string;
  benefits: string[];
  rewardDiamonds: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  category: 'streak' | 'vocab' | 'practice' | 'economy';
  icon: string;
  iconBg: string;
  desc: string;
  currentVal: number;
  targetVal: number;
  rewardXp: number;
  rewardDiamond: number;
  isClaimed?: boolean;
}

export const PRESET_RANKS: RankTierDisplay[] = [
  {
    name: 'ĐỒNG (Bronze)',
    minXp: 0,
    maxXp: 500,
    icon: 'fa-solid fa-shield',
    color: '#cd7f32',
    gradient: 'linear-gradient(135deg, #cd7f32 0%, #8c531e 100%)',
    benefits: ['Truy cập toàn bộ kho từ vựng và bài tập cơ bản', 'Điểm danh nhận Streak hàng ngày'],
    rewardDiamonds: 10
  },
  {
    name: 'BẠC (Silver)',
    minXp: 500,
    maxXp: 1500,
    icon: 'fa-solid fa-shield-halved',
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
    benefits: ['Tăng 10% XP khi hoàn thành phiên luyện tập', 'Mở khóa bộ bài tập Level 2 (Ngữ cảnh)'],
    rewardDiamonds: 25
  },
  {
    name: 'VÀNG (Gold)',
    minXp: 1500,
    maxXp: 3500,
    icon: 'fa-solid fa-crown',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
    benefits: ['Mở khóa bài tập Level 3 (Tái hiện)', 'Khung avatar Vàng lấp lánh', 'Thưởng +50 Kim Cương'],
    rewardDiamonds: 50
  },
  {
    name: 'BẠCH KIM (Platinum)',
    minXp: 3500,
    maxXp: 7000,
    icon: 'fa-solid fa-gem',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #bae6fd 0%, #38bdf8 50%, #0284c7 100%)',
    benefits: ['Mở khóa bài tập Level 4 (Thực tế)', 'Giảm 20% thời gian hồi phục Streak', 'Thưởng +100 Kim Cương'],
    rewardDiamonds: 100
  },
  {
    name: 'KIM CƯƠNG (Diamond)',
    minXp: 7000,
    maxXp: 12000,
    icon: 'fa-solid fa-star',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #f3e8ff 0%, #c084fc 50%, #7e22ce 100%)',
    benefits: ['Quyền truy cập toàn bộ đề thi TOEIC độc quyền', 'Huy hiệu Kim Cương danh dự', 'Thưởng +200 Kim Cương'],
    rewardDiamonds: 200
  },
  {
    name: 'BẬC THẦY (Master)',
    minXp: 12000,
    maxXp: 20000,
    icon: 'fa-solid fa-trophy',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #ffe4e6 0%, #fb7185 50%, #e11d48 100%)',
    benefits: ['Nhân đôi XP toàn bộ bài học', 'Danh hiệu Bậc Thầy Ngôn Ngữ', 'Khung Avatar Thần Thoại'],
    rewardDiamonds: 400
  },
  {
    name: 'HUYỀN THOẠI (Legend)',
    minXp: 20000,
    maxXp: 999999,
    icon: 'fa-solid fa-dragon',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #ffedd5 0%, #f97316 50%, #c2410c 100%)',
    benefits: ['Vinh danh bảng vàng Đại Sảnh Danh Vọng', 'Đặc quyền VIP trọn đời', 'Thưởng +1000 Kim Cương'],
    rewardDiamonds: 1000
  }
];

@Component({
  selector: 'app-rank',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rank.component.html',
  styleUrls: ['./rank.component.scss']
})
export class RankComponent implements OnInit {
  private auth = inject(AuthService);
  private userState = inject(UserStateService);
  private userStatsApi = inject(UserStatsApiService);
  private rankApi = inject(RankApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  userId = signal<string>('');
  currentUser = signal<CurrentUser | null>(null);
  userStats = signal<UserStats | null>(null);
  ranks = signal<RankTierDisplay[]>(PRESET_RANKS);
  loading = signal<boolean>(true);
  activeTab = signal<'ranks' | 'achievements' | 'season'>('ranks');
  claimedAchievementIds = signal<Set<string>>(new Set());

  readonly userXp = computed(() => this.userStats()?.xp || 0);
  readonly userDiamonds = computed(() => this.userStats()?.diamond ?? this.userStats()?.diamonds ?? 0);
  readonly userStreak = computed(() => this.userStats()?.currentStreak ?? this.userStats()?.streakDays ?? 0);
  readonly longestStreak = computed(() => this.userStats()?.longestStreak ?? this.userStreak());

  // Current Rank Index & Tier
  readonly currentRankIndex = computed(() => {
    const xp = this.userXp();
    const list = this.ranks();
    for (let i = list.length - 1; i >= 0; i--) {
      if (xp >= list[i].minXp) {
        return i;
      }
    }
    return 0;
  });

  readonly currentTier = computed<RankTierDisplay>(() => {
    return this.ranks()[this.currentRankIndex()] || this.ranks()[0];
  });

  readonly nextTier = computed<RankTierDisplay | null>(() => {
    const nextIdx = this.currentRankIndex() + 1;
    const list = this.ranks();
    if (nextIdx < list.length) {
      return list[nextIdx];
    }
    return null;
  });

  readonly tierProgressPercent = computed<number>(() => {
    const current = this.currentTier();
    const next = this.nextTier();
    if (!next) return 100;

    const xp = this.userXp();
    const range = next.minXp - current.minXp;
    if (range <= 0) return 100;

    const gained = xp - current.minXp;
    const pct = Math.round((gained / range) * 100);
    return Math.min(100, Math.max(0, pct));
  });

  readonly xpNeededForNextTier = computed<number>(() => {
    const next = this.nextTier();
    if (!next) return 0;
    return Math.max(0, next.minXp - this.userXp());
  });

  // Dynamic Achievements List
  readonly achievements = computed<AchievementItem[]>(() => {
    const streak = this.userStreak();
    const maxStreak = this.longestStreak();
    const xp = this.userXp();
    const diamonds = this.userDiamonds();
    const claimed = this.claimedAchievementIds();

    const items: AchievementItem[] = [
      // 1. Streak & Consistency
      {
        id: 'ach_streak_3',
        title: 'Khởi Đầu Rực Rỡ',
        category: 'streak',
        icon: 'fa-solid fa-fire',
        iconBg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        desc: 'Đạt chuỗi học tập 3 ngày liên tiếp',
        currentVal: Math.min(3, maxStreak),
        targetVal: 3,
        rewardXp: 20,
        rewardDiamond: 5,
        isClaimed: claimed.has('ach_streak_3')
      },
      {
        id: 'ach_streak_7',
        title: 'Ý Chí Thép',
        category: 'streak',
        icon: 'fa-solid fa-fire-flame-curved',
        iconBg: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
        desc: 'Đạt chuỗi học tập 7 ngày liên tiếp',
        currentVal: Math.min(7, maxStreak),
        targetVal: 7,
        rewardXp: 50,
        rewardDiamond: 20,
        isClaimed: claimed.has('ach_streak_7')
      },
      {
        id: 'ach_streak_30',
        title: 'Kỷ Luật Tối Thượng',
        category: 'streak',
        icon: 'fa-solid fa-fire-flame-simple',
        iconBg: 'linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)',
        desc: 'Duy trì chuỗi học tập 30 ngày liên tục',
        currentVal: Math.min(30, maxStreak),
        targetVal: 30,
        rewardXp: 200,
        rewardDiamond: 100,
        isClaimed: claimed.has('ach_streak_30')
      },

      // 2. XP & Rank Progression
      {
        id: 'ach_xp_500',
        title: 'Tân Binh Tiềm Năng',
        category: 'practice',
        icon: 'fa-solid fa-bolt',
        iconBg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
        desc: 'Tích lũy tổng cộng 500 điểm kinh nghiệm (XP)',
        currentVal: Math.min(500, xp),
        targetVal: 500,
        rewardXp: 50,
        rewardDiamond: 15,
        isClaimed: claimed.has('ach_xp_500')
      },
      {
        id: 'ach_xp_1500',
        title: 'Chuyên Gia Tốc Độ',
        category: 'practice',
        icon: 'fa-solid fa-wand-magic-sparkles',
        iconBg: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
        desc: 'Tích lũy tổng cộng 1,500 điểm kinh nghiệm (XP) để thăng hạng Vàng',
        currentVal: Math.min(1500, xp),
        targetVal: 1500,
        rewardXp: 100,
        rewardDiamond: 35,
        isClaimed: claimed.has('ach_xp_1500')
      },
      {
        id: 'ach_xp_5000',
        title: 'Học Giả Uyên Bác',
        category: 'practice',
        icon: 'fa-solid fa-graduation-cap',
        iconBg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        desc: 'Tích lũy 5,000 XP trong suốt hành trình học tập',
        currentVal: Math.min(5000, xp),
        targetVal: 5000,
        rewardXp: 300,
        rewardDiamond: 150,
        isClaimed: claimed.has('ach_xp_5000')
      },

      // 3. Economy & Diamonds
      {
        id: 'ach_dia_50',
        title: 'Nhà Tích Lũy',
        category: 'economy',
        icon: 'fa-solid fa-gem',
        iconBg: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
        desc: 'Sở hữu từ 50 Kim Cương trong kho báu',
        currentVal: Math.min(50, diamonds),
        targetVal: 50,
        rewardXp: 30,
        rewardDiamond: 10,
        isClaimed: claimed.has('ach_dia_50')
      },
      {
        id: 'ach_dia_200',
        title: 'Đại Gia Kho Báu',
        category: 'economy',
        icon: 'fa-solid fa-coins',
        iconBg: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)',
        desc: 'Tích lũy đạt 200 Kim Cương từ các hoạt động học tập',
        currentVal: Math.min(200, diamonds),
        targetVal: 200,
        rewardXp: 150,
        rewardDiamond: 50,
        isClaimed: claimed.has('ach_dia_200')
      }
    ];

    return items;
  });

  readonly completedAchievementsCount = computed(() => {
    return this.achievements().filter(a => a.currentVal >= a.targetVal).length;
  });

  ngOnInit(): void {
    const user = this.auth.currentUser;
    this.currentUser.set(user);
    const uId = this.route.parent?.snapshot.params['userId'] || user?.userId || '';
    this.userId.set(uId);

    // Restore claimed achievements from local storage
    try {
      const stored = localStorage.getItem(`claimed_achievements_${uId}`);
      if (stored) {
        this.claimedAchievementIds.set(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }

    this.loadStats(uId);
  }

  loadStats(uId: string): void {
    this.loading.set(true);
    const targetId = uId || this.auth.currentUser?.userId;
    if (!targetId) {
      this.loading.set(false);
      return;
    }

    this.userStatsApi.getUserStats(targetId).subscribe({
      next: (stats) => {
        this.userStats.set(stats);
        this.userState.setUserStats(stats);
        this.loading.set(false);
      },
      error: () => {
        // Fallback to local state if available
        const s = this.userState.userStats;
        if (s) this.userStats.set(s);
        this.loading.set(false);
      }
    });
  }

  setActiveTab(tab: 'ranks' | 'achievements' | 'season'): void {
    this.activeTab.set(tab);
  }

  claimAchievement(ach: AchievementItem, event: MouseEvent): void {
    event.stopPropagation();
    if (ach.currentVal < ach.targetVal || ach.isClaimed) return;

    this.claimedAchievementIds.update(set => {
      const next = new Set(set);
      next.add(ach.id);
      try {
        localStorage.setItem(`claimed_achievements_${this.userId()}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    // Update user state with rewards
    this.userStats.update(s => {
      if (!s) return null;
      return {
        ...s,
        xp: s.xp + ach.rewardXp,
        diamond: (s.diamond || s.diamonds || 0) + ach.rewardDiamond,
        diamonds: (s.diamonds || s.diamond || 0) + ach.rewardDiamond,
      };
    });

    if (this.userStats()) {
      this.userState.setUserStats(this.userStats()!);
    }

    this.toast.success(`🎉 Nhận thưởng thành công: +${ach.rewardXp} XP & +${ach.rewardDiamond} 💎!`);
  }

  goToPractice(): void {
    this.router.navigate(['/vocab/practice']);
  }
}
