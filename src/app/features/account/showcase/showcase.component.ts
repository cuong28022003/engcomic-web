import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { ToastService } from '@core/services/toast.service';
import { AvatarFrameComponent, LoadingComponent } from '@shared/components';
import { UserStats, CurrentUser } from '@models/index';

export interface FrameItem {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'mythic' | 'legendary';
  description: string;
  unlockCondition: string;
  previewClass: string;
  isUnlocked: boolean;
}

export interface TitleItem {
  id: string;
  titleText: string;
  rarity: 'common' | 'rare' | 'mythic' | 'legendary';
  description: string;
  unlockCondition: string;
  isUnlocked: boolean;
}

export interface SeasonMilestone {
  level: number;
  xpRequired: number;
  rewardName: string;
  rewardType: 'diamond' | 'title' | 'frame';
  rewardIcon: string;
  isClaimed: boolean;
}

@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarFrameComponent, LoadingComponent],
  templateUrl: './showcase.component.html',
  styleUrls: ['./showcase.component.scss']
})
export class ShowcaseComponent implements OnInit {
  private auth = inject(AuthService);
  private userState = inject(UserStateService);
  private userStatsApi = inject(UserStatsApiService);
  private toast = inject(ToastService);

  readonly loading = signal<boolean>(true);
  readonly equipping = signal<boolean>(false);
  readonly activeTab = signal<'frames' | 'titles' | 'season'>('frames');

  readonly stats = signal<UserStats | null>(null);

  // Selected preview in Hero Showcase
  readonly previewFrameId = signal<string>('frame_default');
  readonly previewTitleId = signal<string>('title_rookie');

  readonly currentUser = computed<CurrentUser | null>(() => this.auth.currentUser);

  readonly userAvatarUrl = computed(() => {
    return this.currentUser()?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=EngComicChampion';
  });

  readonly allFrames = computed<FrameItem[]>(() => {
    const s = this.stats();
    const streak = s?.currentStreak || s?.streakDays || 0;
    const xp = s?.xp || 0;
    const unlocked = s?.unlockedAvatarFrames || ['frame_default'];

    return [
      {
        id: 'frame_default',
        name: 'Khung Cơ Bản (Classic)',
        rarity: 'common',
        description: 'Khung viền xám bạc thanh lịch dành cho mọi học viên mới bắt đầu hành trình.',
        unlockCondition: 'Mặc định có sẵn',
        previewClass: 'frame-default',
        isUnlocked: true
      },
      {
        id: 'frame_flame_streak',
        name: 'Ngọn Lửa Bất Diệt (Streak Aura)',
        rarity: 'rare',
        description: 'Hào quang ngọn lửa rực cháy quanh avatar minh chứng cho sự kiên trì bền bỉ.',
        unlockCondition: 'Đạt Chuỗi Ngày Học Tập từ 7 ngày trở lên',
        previewClass: 'frame-flame_streak',
        isUnlocked: streak >= 7 || unlocked.includes('frame_flame_streak')
      },
      {
        id: 'frame_gold_master',
        name: 'Hoàng Gia Vinh Diệu (Gold Tier)',
        rarity: 'rare',
        description: 'Viền vàng kim óng ánh khẳng định đẳng cấp học viên xuất sắc.',
        unlockCondition: 'Đạt Hạng Vàng (Gold Rank - từ 1,500 XP)',
        previewClass: 'frame-gold_master',
        isUnlocked: xp >= 1500 || unlocked.includes('frame_gold_master')
      },
      {
        id: 'frame_diamond_elite',
        name: 'Kim Cương Tinh Anh (Diamond Aura)',
        rarity: 'mythic',
        description: 'Khung kim cương lấp lánh với vệt sáng xoay quanh tinh khiết tuyệt mỹ.',
        unlockCondition: 'Đạt Hạng Kim Cương (Diamond Rank - từ 7,000 XP)',
        previewClass: 'frame-diamond_elite',
        isUnlocked: xp >= 7000 || unlocked.includes('frame_diamond_elite')
      },
      {
        id: 'frame_cyber_violet',
        name: 'Cyberpunk Neon Glow',
        rarity: 'mythic',
        description: 'Hào quang Neon Cyberpunk sắc tím hồng thời thượng thu hút mọi ánh nhìn.',
        unlockCondition: 'Hoàn thành Mastery Level 4 cho 50 từ vựng',
        previewClass: 'frame-cyber_violet',
        isUnlocked: unlocked.includes('frame_cyber_violet') || xp >= 5000
      },
      {
        id: 'frame_mythic_legend',
        name: 'Vương Miện Thần Thoại (Mythic Crown)',
        rarity: 'legendary',
        description: 'Vương miện vàng hoàng đế kèm vòng hào quang 3D tỏa sáng đỉnh cao toàn server.',
        unlockCondition: 'Đạt Hạng Huyền Thoại (Legend Rank - từ 20,000 XP)',
        previewClass: 'frame-mythic_legend',
        isUnlocked: xp >= 20000 || unlocked.includes('frame_mythic_legend')
      },
      {
        id: 'frame_season_alpha',
        name: 'Băng Phong Bắc Cực (Season Alpha)',
        rarity: 'legendary',
        description: 'Khung tuyết băng cực hiếm chỉ có trong Mùa Giải Alpha khởi nguyên.',
        unlockCondition: 'Đạt Cấp 50 Con Đường Mùa Giải Alpha',
        previewClass: 'frame-season_alpha',
        isUnlocked: unlocked.includes('frame_season_alpha')
      }
    ];
  });

  readonly allTitles = computed<TitleItem[]>(() => {
    const s = this.stats();
    const streak = s?.currentStreak || s?.streakDays || 0;
    const xp = s?.xp || 0;
    const unlocked = s?.unlockedTitles || ['title_rookie'];

    return [
      {
        id: 'title_rookie',
        titleText: 'Tân Binh Học Thuật 🌱',
        rarity: 'common',
        description: 'Bước chân đầu tiên trên con đường làm chủ tiếng Anh.',
        unlockCondition: 'Mặc định có sẵn',
        isUnlocked: true
      },
      {
        id: 'title_vocab_hunter',
        titleText: 'Thợ Săn Từ Vựng 🏹',
        rarity: 'common',
        description: 'Đã tích lũy và học hơn 50 từ vựng trong Vocab Vault.',
        unlockCondition: 'Học từ vựng trong phòng luyện tập',
        isUnlocked: xp >= 200 || unlocked.includes('title_vocab_hunter')
      },
      {
        id: 'title_iron_discipline',
        titleText: 'Kỷ Luật Thép 🔥',
        rarity: 'rare',
        description: 'Duy trì chuỗi học tập không ngừng nghỉ suốt 14 ngày.',
        unlockCondition: 'Đạt Chuỗi Streak 14 ngày',
        isUnlocked: streak >= 14 || unlocked.includes('title_iron_discipline')
      },
      {
        id: 'title_context_master',
        titleText: 'Bậc Thầy Ngữ Cảnh 📖',
        rarity: 'rare',
        description: 'Thuần thục Level 2 Ngữ cảnh và các cụm liên kết tự nhiên.',
        unlockCondition: 'Hoàn thành 30 bài tập Level 2',
        isUnlocked: xp >= 2500 || unlocked.includes('title_context_master')
      },
      {
        id: 'title_toeic_990',
        titleText: 'Chinh Phục 990 TOEIC 🎯',
        rarity: 'mythic',
        description: 'Hoàn thành bài thi TOEIC Full Test với điểm số xuất sắc.',
        unlockCondition: 'Đạt điểm thi TOEIC cao trong phòng thi',
        isUnlocked: xp >= 8000 || unlocked.includes('title_toeic_990')
      },
      {
        id: 'title_living_dictionary',
        titleText: 'Từ Điển Sống 📚',
        rarity: 'mythic',
        description: 'Kho từ vựng đồ sộ với hơn 500 từ đạt Mastery Level 4.',
        unlockCondition: 'Đạt cấp Bậc Thầy (Master Rank)',
        isUnlocked: xp >= 12000 || unlocked.includes('title_living_dictionary')
      },
      {
        id: 'title_dual_legend',
        titleText: '👑 Huyền Thoại Song Toàn',
        rarity: 'legendary',
        description: 'Thành tựu tối thượng: Giữ vững ngọn lửa Streak 30 ngày ở cả Học Tập và Đọc Truyện!',
        unlockCondition: 'Duy trì Streak 30 ngày ở cả 2 nền tảng',
        isUnlocked: streak >= 30 || unlocked.includes('title_dual_legend')
      },
      {
        id: 'title_season_alpha_champ',
        titleText: '⚡ Quán Quân Alpha S1',
        rarity: 'legendary',
        description: 'Danh hiệu danh giá vĩnh cửu của những người tiên phong Mùa Giải 1.',
        unlockCondition: 'Lọt Top 10 Bảng Xếp Hạng Mùa Giải Alpha',
        isUnlocked: unlocked.includes('title_season_alpha_champ')
      }
    ];
  });

  readonly seasonMilestones = computed<SeasonMilestone[]>(() => {
    const s = this.stats();
    const xp = s?.xp || 0;
    return [
      { level: 5, xpRequired: 500, rewardName: '+50 Kim Cương', rewardType: 'diamond', rewardIcon: 'fa-gem', isClaimed: xp >= 500 },
      { level: 10, xpRequired: 1200, rewardName: 'Danh hiệu: Thợ Săn Từ Vựng', rewardType: 'title', rewardIcon: 'fa-tag', isClaimed: xp >= 1200 },
      { level: 20, xpRequired: 3000, rewardName: 'Khung: Hoàng Gia Vinh Diệu', rewardType: 'frame', rewardIcon: 'fa-circle-notch', isClaimed: xp >= 3000 },
      { level: 35, xpRequired: 7500, rewardName: '+200 Kim Cương', rewardType: 'diamond', rewardIcon: 'fa-gem', isClaimed: xp >= 7500 },
      { level: 50, xpRequired: 15000, rewardName: 'Khung: Băng Phong Bắc Cực (S1)', rewardType: 'frame', rewardIcon: 'fa-snowflake', isClaimed: xp >= 15000 }
    ];
  });

  readonly currentEquippedFrame = computed<string>(() => {
    return this.stats()?.equippedAvatarFrame || 'frame_default';
  });

  readonly currentEquippedTitle = computed<string>(() => {
    return this.stats()?.equippedTitle || 'title_rookie';
  });

  readonly previewTitleObj = computed(() => {
    return this.allTitles().find(t => t.id === this.previewTitleId()) || this.allTitles()[0];
  });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.userStatsApi.getMyStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        this.previewFrameId.set(res.equippedAvatarFrame || 'frame_default');
        this.previewTitleId.set(res.equippedTitle || 'title_rookie');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  setTab(tab: 'frames' | 'titles' | 'season'): void {
    this.activeTab.set(tab);
  }

  selectPreviewFrame(frameId: string): void {
    this.previewFrameId.set(frameId);
  }

  selectPreviewTitle(titleId: string): void {
    this.previewTitleId.set(titleId);
  }

  equipCurrentFrame(frame: FrameItem): void {
    if (!frame.isUnlocked) {
      this.toast.info(`Khung này chưa mở khóa! Điều kiện: ${frame.unlockCondition}`);
      return;
    }
    if (this.equipping()) return;
    this.equipping.set(true);

    this.userStatsApi.equipItem({ itemType: 'frame', itemId: frame.id }).subscribe({
      next: (res) => {
        this.equipping.set(false);
        this.stats.set(res.stats);
        this.previewFrameId.set(frame.id);
        this.toast.success(`Đã trang bị khung: ${frame.name}! ✨`);
      },
      error: () => {
        this.equipping.set(false);
        this.toast.error('Không thể trang bị khung lúc này.');
      }
    });
  }

  equipCurrentTitle(title: TitleItem): void {
    if (!title.isUnlocked) {
      this.toast.info(`Danh hiệu này chưa mở khóa! Điều kiện: ${title.unlockCondition}`);
      return;
    }
    if (this.equipping()) return;
    this.equipping.set(true);

    this.userStatsApi.equipItem({ itemType: 'title', itemId: title.id }).subscribe({
      next: (res) => {
        this.equipping.set(false);
        this.stats.set(res.stats);
        this.previewTitleId.set(title.id);
        this.toast.success(`Đã vinh danh danh hiệu: ${title.titleText}! ✨`);
      },
      error: () => {
        this.equipping.set(false);
        this.toast.error('Không thể vinh danh danh hiệu lúc này.');
      }
    });
  }
}
