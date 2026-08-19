import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CharacterApiService } from '@core/services/character-api.service';
import { UserStateService } from '@core/services/user-state.service';
import { UserStatsApiService } from '@core/services/user-stats-api.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { GachaCharacter } from '@models/index';

interface BattleFighter {
  name: string;
  maxHp: number;
  currentHp: number;
  atk: number;
  def: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-fighting-game',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="game-container">
      <div class="game-header">
        <span class="badge badge-primary"><i class="fa-solid fa-gamepad"></i> Minigame Arena</span>
        <h1>Đấu Trường Chiến Binh Từ Vựng</h1>
        <p class="subtitle">Sử dụng sức mạnh tướng gacha và vốn từ vựng của bạn để hạ gục quái vật</p>
      </div>

      <!-- Battle Arena Stage -->
      <div class="arena-stage glass-panel">
        <!-- Player Side -->
        <div class="fighter-side player-side">
          <div class="health-bar-wrap">
            <div class="name-row">
              <span class="fighter-name">{{ player.name }}</span>
              <span class="hp-text">{{ player.currentHp }} / {{ player.maxHp }} HP</span>
            </div>
            <div class="hp-bar-bg">
              <div class="hp-bar-fill player-hp" [style.width.%]="(player.currentHp / player.maxHp) * 100"></div>
            </div>
          </div>

          <div class="avatar-ring player-avatar" [class.hit]="playerHit">
            <img [src]="player.imageUrl || 'assets/image/avt.png'" alt="Player" />
          </div>
        </div>

        <div class="vs-badge">VS</div>

        <!-- Enemy Side -->
        <div class="fighter-side enemy-side">
          <div class="health-bar-wrap">
            <div class="name-row">
              <span class="fighter-name">{{ enemy.name }}</span>
              <span class="hp-text">{{ enemy.currentHp }} / {{ enemy.maxHp }} HP</span>
            </div>
            <div class="hp-bar-bg">
              <div class="hp-bar-fill enemy-hp" [style.width.%]="(enemy.currentHp / enemy.maxHp) * 100"></div>
            </div>
          </div>

          <div class="avatar-ring enemy-avatar" [class.hit]="enemyHit">
            <img [src]="enemy.imageUrl || 'assets/image/banner-home.png'" alt="Enemy" />
          </div>
        </div>
      </div>

      <!-- Battle Log & Actions -->
      <div class="battle-control-panel glass-panel">
        @if (battleEnded) {
          <div class="battle-ended-box">
            @if (playerWon) {
              <h2 class="victory-text"><i class="fa-solid fa-trophy"></i> CHIẾN THẮNG!</h2>
              <p>Bạn đã xuất sắc đánh bại quái vật và nhận được <strong>+50 XP & 1 Kim cương</strong>!</p>
            } @else {
              <h2 class="defeat-text"><i class="fa-solid fa-skull"></i> THẤT BẠI!</h2>
              <p>Hãy nâng cấp bộ thẻ từ vựng và quay thêm tướng mạnh mẽ để phục thù nhé!</p>
            }
            <button class="btn-primary" (click)="startNewBattle()"><i class="fa-solid fa-rotate-right"></i> Trận Đấu Mới</button>
          </div>
        } @else {
          <!-- Action Buttons -->
          <div class="action-buttons-grid">
            <button class="game-btn btn-attack" (click)="playerAttack('normal')" [disabled]="turn !== 'player'">
              <i class="fa-solid fa-hand-fist icon"></i>
              <div>
                <span class="title">Đòn Đánh Thường</span>
                <span class="sub">Gây sát thương cơ bản</span>
              </div>
            </button>

            <button class="game-btn btn-skill" (click)="playerAttack('skill')" [disabled]="turn !== 'player' || skillCooldown > 0">
              <i class="fa-solid fa-wand-magic-sparkles icon"></i>
              <div>
                <span class="title">Tuyệt Kỹ Từ Vựng</span>
                <span class="sub">
                  @if (skillCooldown > 0) {
                    Hồi chiêu ({{ skillCooldown }} lượt)
                  } @else {
                    Gây x2.5 sát thương bạo kích!
                  }
                </span>
              </div>
            </button>

            <button class="game-btn btn-heal" (click)="playerHeal()" [disabled]="turn !== 'player' || healCooldown > 0">
              <i class="fa-solid fa-heart-pulse icon"></i>
              <div>
                <span class="title">Hồi Phục Sinh Lực</span>
                <span class="sub">
                  @if (healCooldown > 0) {
                    Hồi chiêu ({{ healCooldown }} lượt)
                  } @else {
                    Hồi 40 HP
                  }
                </span>
              </div>
            </button>
          </div>
        }

        <!-- Battle Logs -->
        <div class="battle-logs">
          <h4><i class="fa-solid fa-scroll"></i> Nhật Ký Trận Đấu</h4>
          <div class="logs-scroll">
            @for (log of battleLogs; track log) {
              <p class="log-line">{{ log }}</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      flex-direction: column;
      gap: 32px;
      max-width: 860px;
      margin: 0 auto;
    }

    .game-header { text-align: center; }
    .game-header h1 { font-size: 2.2rem; font-weight: 800; color: #fff; margin: 8px 0; }
    .subtitle { color: var(--text-muted); font-size: 0.95rem; }

    /* Arena Stage */
    .arena-stage {
      padding: 40px 32px;
      border-radius: var(--radius-lg);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(22, 25, 38, 0.95) 80%);
      border-color: rgba(99, 102, 241, 0.3);
    }

    .fighter-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      width: 220px;
    }

    .health-bar-wrap { width: 100%; display: flex; flex-direction: column; gap: 6px; }
    .name-row { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: #fff; }
    .hp-bar-bg { width: 100%; height: 10px; background: rgba(0, 0, 0, 0.5); border-radius: var(--radius-full); overflow: hidden; border: 1px solid var(--border-color); }
    .hp-bar-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.3s ease; }
    .player-hp { background: var(--success-color); }
    .enemy-hp { background: var(--danger-color); }

    .avatar-ring {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      border: 4px solid var(--border-color);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      transition: transform 0.15s;
    }

    .player-avatar { border-color: #38bdf8; }
    .enemy-avatar { border-color: #ef4444; }
    .avatar-ring img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-ring.hit { animation: shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97); filter: brightness(1.8); }

    .vs-badge {
      font-size: 1.8rem;
      font-weight: 900;
      color: #ffb800;
      background: rgba(0, 0, 0, 0.4);
      padding: 8px 16px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(255, 184, 0, 0.4);
    }

    /* Control Panel */
    .battle-control-panel {
      padding: 28px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .action-buttons-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .game-btn {
      padding: 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: #fff;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }

    .game-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--primary-color); }
    .game-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .game-btn .icon { font-size: 1.6rem; }
    .game-btn .title { font-weight: 700; font-size: 0.92rem; display: block; }
    .game-btn .sub { font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px; }

    .btn-attack .icon { color: #f97316; }
    .btn-skill .icon { color: #a855f7; }
    .btn-heal .icon { color: #10b981; }

    /* Ended Box */
    .battle-ended-box {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 20px;
    }

    .victory-text { color: #ffb800; font-size: 1.8rem; font-weight: 800; }
    .defeat-text { color: #ef4444; font-size: 1.8rem; font-weight: 800; }

    /* Logs */
    .battle-logs h4 { font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .logs-scroll {
      max-height: 140px;
      overflow-y: auto;
      background: var(--bg-main);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid var(--border-color);
    }

    .log-line { font-size: 0.85rem; color: var(--text-muted); }

    @keyframes shake {
      10%, 90% { transform: translate3d(-2px, 0, 0); }
      20%, 80% { transform: translate3d(4px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
      40%, 60% { transform: translate3d(6px, 0, 0); }
    }

    @media (max-width: 700px) {
      .arena-stage { flex-direction: column; gap: 24px; }
      .action-buttons-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class FightingGameComponent implements OnInit {
  private userStatsApi = inject(UserStatsApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  player: BattleFighter = {
    name: 'Chiến Binh EngComic',
    maxHp: 100,
    currentHp: 100,
    atk: 20,
    def: 5,
    imageUrl: 'assets/image/avt.png',
  };

  enemy: BattleFighter = {
    name: 'Quái Vật Ngữ Pháp (Level 5)',
    maxHp: 120,
    currentHp: 120,
    atk: 18,
    def: 4,
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80',
  };

  turn: 'player' | 'enemy' = 'player';
  skillCooldown = 0;
  healCooldown = 0;

  playerHit = false;
  enemyHit = false;
  battleEnded = false;
  playerWon = false;

  battleLogs: string[] = ['Trận đấu bắt đầu! Hãy tung chiêu để hạ gục quái vật.'];

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user) {
      this.player.name = user.username;
      if (user.avatarUrl) this.player.imageUrl = user.avatarUrl;
    }
  }

  playerAttack(type: 'normal' | 'skill'): void {
    if (this.turn !== 'player' || this.battleEnded) return;

    let dmg = Math.max(5, this.player.atk - this.enemy.def + Math.floor(Math.random() * 8));
    if (type === 'skill') {
      dmg = Math.round(dmg * 2.5);
      this.skillCooldown = 3;
      this.addLog(`⚡ Bạn thi triển [Tuyệt Kỹ Từ Vựng], đánh trúng điểm yếu gây ${dmg} sát thương!`);
    } else {
      this.addLog(`⚔️ Bạn tung đòn đánh thường gây ${dmg} sát thương lên đối thủ.`);
    }

    this.enemyHit = true;
    setTimeout(() => (this.enemyHit = false), 350);

    this.enemy.currentHp = Math.max(0, this.enemy.currentHp - dmg);

    if (this.enemy.currentHp === 0) {
      this.endBattle(true);
      return;
    }

    this.advanceTurn();
  }

  playerHeal(): void {
    if (this.turn !== 'player' || this.healCooldown > 0 || this.battleEnded) return;

    const healAmt = 40;
    this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + healAmt);
    this.healCooldown = 4;
    this.addLog(`💚 Bạn sử dụng thuốc hồi phục, hồi lại ${healAmt} HP.`);

    this.advanceTurn();
  }

  enemyTurn(): void {
    if (this.battleEnded) return;

    setTimeout(() => {
      const dmg = Math.max(5, this.enemy.atk - this.player.def + Math.floor(Math.random() * 6));
      this.playerHit = true;
      setTimeout(() => (this.playerHit = false), 350);

      this.player.currentHp = Math.max(0, this.player.currentHp - dmg);
      this.addLog(`🔥 Quái vật phản công gây ${dmg} sát thương lên bạn!`);

      if (this.player.currentHp === 0) {
        this.endBattle(false);
        return;
      }

      this.turn = 'player';
      if (this.skillCooldown > 0) this.skillCooldown--;
      if (this.healCooldown > 0) this.healCooldown--;
    }, 1000);
  }

  advanceTurn(): void {
    this.turn = 'enemy';
    this.enemyTurn();
  }

  endBattle(victory: boolean): void {
    this.battleEnded = true;
    this.playerWon = victory;

    if (victory) {
      this.addLog('🏆 Bạn đã giành chiến thắng vang dội!');
      const user = this.auth.currentUser;
      if (user) {
        this.userStatsApi.addXp({ userId: user.userId, xp: 50 }).subscribe({ error: () => {} });
      }
    } else {
      this.addLog('💀 Bạn đã bị hạ gục trong đấu trường!');
    }
  }

  startNewBattle(): void {
    this.player.currentHp = this.player.maxHp;
    this.enemy.currentHp = this.enemy.maxHp;
    this.turn = 'player';
    this.skillCooldown = 0;
    this.healCooldown = 0;
    this.battleEnded = false;
    this.playerWon = false;
    this.battleLogs = ['Trận đấu mới bắt đầu!'];
  }

  addLog(msg: string): void {
    this.battleLogs.unshift(msg);
  }
}
