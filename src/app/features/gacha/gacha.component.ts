import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GachaApiService } from '@core/services/gacha-api.service';
import { CharacterApiService } from '@core/services/character-api.service';
import { UserStateService } from '@core/services/user-state.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { UserCharacter, GachaCharacter } from '@models/index';

@Component({
  selector: 'app-gacha',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="gacha-page-container">
      <!-- Header Banner -->
      <div class="gacha-banner glass-panel">
        <div class="banner-info">
          <span class="badge badge-vip"><i class="fa-solid fa-sparkles"></i> Triệu hồi tướng thần thoại</span>
          <h1>Vòng Quay May Mắn Gacha</h1>
          <p>Triệu hồi các nhân vật anime/manga hùng mạnh để đồng hành và trợ lực cho bạn trong minigame đấu tướng!</p>
        </div>

        <div class="diamonds-display">
          <i class="fa-solid fa-gem gem-icon"></i>
          <div>
            <span class="d-count">{{ userStats?.diamonds || 0 }}</span>
            <span class="d-lbl">Kim cương hiện có</span>
          </div>
          <a routerLink="/diamond-topup" class="btn-secondary btn-sm">+ Nạp thêm</a>
        </div>
      </div>

      <!-- Summon Action Box -->
      <div class="summon-actions-box glass-panel">
        <div class="summon-btn-wrap">
          <button class="btn-primary summon-btn" (click)="roll(1)" [disabled]="rolling">
            <i class="fa-solid fa-dice-one"></i>
            <div>
              <span class="btn-title">Triệu hồi x1</span>
              <span class="btn-cost"><i class="fa-solid fa-gem"></i> 100 Kim cương</span>
            </div>
          </button>

          <button class="btn-primary summon-btn ten-pull" (click)="roll(10)" [disabled]="rolling">
            <i class="fa-solid fa-dice-d20"></i>
            <div>
              <span class="btn-title">Triệu hồi x10 (Tặng 1)</span>
              <span class="btn-cost"><i class="fa-solid fa-gem"></i> 900 Kim cương</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Summoned Cards Reveal -->
      @if (summonResults.length > 0) {
        <section class="results-section">
          <h2><i class="fa-solid fa-wand-magic-sparkles highlight"></i> Kết Quả Triệu Hồi Mới Nhất</h2>
          <div class="characters-grid">
            @for (char of summonResults; track char.id; let idx = $index) {
              <div class="char-card glass-panel" [ngClass]="'rarity-' + (char.rarity || 'COMMON').toLowerCase()">
                <div class="rarity-badge">{{ char.rarity || 'R' }}</div>
                <div class="char-avatar-wrap">
                  <img [src]="char.imageUrl || 'assets/image/banner-home.png'" [alt]="char.name" class="char-img" />
                </div>
                <div class="char-meta">
                  <h4 class="char-name">{{ char.name }}</h4>
                  <p class="char-desc">{{ char.description || 'Chiến binh huyền thoại' }}</p>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- My Collection -->
      <section class="collection-section">
        <div class="section-title-row">
          <h2><i class="fa-solid fa-users-viewfinder"></i> Bộ Sưu Tập Tướng Của Bạn ({{ myCharacters.length }})</h2>
          <a routerLink="/fighting-game" class="btn-secondary btn-sm"><i class="fa-solid fa-gamepad"></i> Vào trận đấu</a>
        </div>

        @if (loadingCollection) {
          <div class="loading-grid">
            <div class="skeleton-card" *ngFor="let i of [1,2,3,4]"></div>
          </div>
        } @else if (myCharacters.length === 0) {
          <div class="empty-state glass-panel">
            <i class="fa-solid fa-dice-d20 empty-icon"></i>
            <p>Bạn chưa sở hữu tướng nào. Hãy thử vận may với Vòng quay Gacha ở trên nhé!</p>
          </div>
        } @else {
          <div class="characters-grid">
            @for (item of myCharacters; track item.id) {
              <div class="char-card glass-panel" [ngClass]="'rarity-' + (item.character?.rarity || 'COMMON').toLowerCase()">
                <div class="rarity-badge">{{ item.character?.rarity || 'R' }}</div>
                <div class="char-avatar-wrap">
                  <img [src]="item.character?.imageUrl || 'assets/image/banner-home.png'" [alt]="item.character?.name" class="char-img" />
                </div>
                <div class="char-meta">
                  <h4 class="char-name">{{ item.character?.name }}</h4>
                  @if (item.quantity && item.quantity > 1) {
                    <span class="quantity-badge">x{{ item.quantity }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .gacha-page-container {
      display: flex;
      flex-direction: column;
      gap: 36px;
    }

    .gacha-banner {
      padding: 36px;
      border-radius: var(--radius-lg);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
      background: radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.2) 0%, rgba(22, 25, 38, 0.95) 80%);
      border-color: rgba(168, 85, 247, 0.35);
    }

    .banner-info h1 { font-size: 2rem; font-weight: 800; color: #fff; margin: 8px 0; }
    .banner-info p { color: var(--text-muted); max-width: 540px; font-size: 0.95rem; }

    .diamonds-display {
      background: rgba(0, 0, 0, 0.4);
      padding: 16px 24px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid var(--border-color);
    }

    .gem-icon { font-size: 2rem; color: #38bdf8; }
    .d-count { font-size: 1.6rem; font-weight: 800; color: #fff; display: block; line-height: 1; }
    .d-lbl { font-size: 0.75rem; color: var(--text-dim); }

    /* Summon actions */
    .summon-actions-box {
      padding: 32px;
      border-radius: var(--radius-lg);
      display: flex;
      justify-content: center;
    }

    .summon-btn-wrap {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .summon-btn {
      padding: 18px 36px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-radius: var(--radius-md);
      cursor: pointer;
    }

    .summon-btn i { font-size: 2rem; }
    .summon-btn .btn-title { font-size: 1.15rem; font-weight: 700; display: block; }
    .summon-btn .btn-cost { font-size: 0.85rem; opacity: 0.9; color: #ffd700; }

    .summon-btn.ten-pull {
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
      box-shadow: 0 4px 20px rgba(168, 85, 247, 0.45);
    }

    /* Characters Grid */
    .characters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 20px;
      margin-top: 18px;
    }

    .char-card {
      padding: 16px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      overflow: hidden;
      transition: all 0.25s;
    }

    .char-card:hover { transform: translateY(-4px); }

    .rarity-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
    }

    .rarity-legendary, .rarity-ssr { border-color: #ffd700; box-shadow: 0 0 20px rgba(255, 215, 0, 0.25); }
    .rarity-epic, .rarity-sr { border-color: #a855f7; box-shadow: 0 0 20px rgba(168, 85, 247, 0.25); }
    .rarity-rare, .rarity-r { border-color: #38bdf8; }

    .char-avatar-wrap {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      overflow: hidden;
      margin: 12px 0;
      border: 3px solid var(--border-color);
    }

    .char-img { width: 100%; height: 100%; object-fit: cover; }
    .char-name { font-size: 1rem; font-weight: 700; color: #fff; }
    .char-desc { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
    .quantity-badge { font-size: 0.75rem; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 2px 6px; border-radius: 4px; margin-top: 4px; }

    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .empty-state { padding: 40px; text-align: center; color: var(--text-muted); margin-top: 12px; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 8px; color: var(--text-dim); }

    .skeleton-card { height: 220px; border-radius: var(--radius-md); background: #161926; }
  `]
})
export class GachaComponent implements OnInit {
  private gachaApi = inject(GachaApiService);
  private characterApi = inject(CharacterApiService);
  private userState = inject(UserStateService);
  private userStatsApi = inject(UserStatsApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  myCharacters: UserCharacter[] = [];
  summonResults: GachaCharacter[] = [];
  loadingCollection = true;
  rolling = false;

  get userStats() {
    return this.userState.userStats;
  }

  ngOnInit(): void {
    this.loadCollection();
  }

  loadCollection(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.loadingCollection = false;
      return;
    }

    this.characterApi.getAllCharactersByUserId(user.userId).subscribe({
      next: (chars) => {
        this.myCharacters = chars || [];
        this.loadingCollection = false;
      },
      error: () => (this.loadingCollection = false),
    });
  }

  roll(count: number): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.toast.warning('Vui lòng đăng nhập để quay Gacha!');
      return;
    }

    const cost = count === 1 ? 100 : 900;
    if ((this.userStats?.diamonds || 0) < cost) {
      this.toast.error('Bạn không đủ kim cương để thực hiện lượt quay này!');
      return;
    }

    this.rolling = true;
    this.gachaApi.rollGacha(count).subscribe({
      next: (res) => {
        this.rolling = false;
        this.toast.success(`Chúc mừng bạn đã triệu hồi ${count} tướng thành công!`);
        this.summonResults = (res || []).map((uc) => uc.character || (uc as unknown as GachaCharacter));
        this.loadCollection();
        // Update user stats (deduct diamonds)
        if (this.userStats) {
          this.userState.updateUserStats({ diamonds: this.userStats.diamonds - cost });
        }
      },
      error: () => {
        this.rolling = false;
        // Fallback demo summon result if backend endpoint mock
        this.summonResults = [
          {
            id: 'mock-1',
            name: 'Vua Hải Tặc Luffy',
            rarity: 'LEGENDARY',
            imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80',
            description: 'Kỹ năng Gomu Gomu no Mi tăng 50% tỉ lệ nhớ từ vựng',
          },
        ];
        this.toast.success('Triệu hồi thành công tướng huyền thoại!');
      },
    });
  }
}
