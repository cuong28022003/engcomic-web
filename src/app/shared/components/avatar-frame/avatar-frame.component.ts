import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar-frame, app-rank-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-frame.component.html',
  styleUrls: ['./avatar-frame.component.scss']
})
export class AvatarFrameComponent {
  /** Avatar URL của user (nếu truyền vào sẽ hiển thị avatar trong khiên) */
  readonly avatarUrl = input<string>('');

  /** Badge Image URL của bậc rank (nếu dùng làm huy hiệu độc lập) */
  readonly badgeImgUrl = input<string>('');

  /** Tên frame hoặc id (hỗ trợ cả frame_xxx và tên tier) */
  readonly frameId = input<string | number>('frame_default');

  /** Tier trực tiếp: 0..6 hoặc 'bronze'..'legend' */
  readonly tier = input<string | number | undefined>(undefined);

  /** Kích cỡ: sm (38px), md (52px), lg (82px), xl (120px) */
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  /** Bật/tắt hiệu ứng hào quang sáng */
  readonly showGlow = input<boolean>(true);

  /** Xác định tier index (0: Bronze .. 6: Legend) */
  readonly tierIndex = computed<number>(() => {
    const rawTier = this.tier();
    if (rawTier !== undefined && rawTier !== null) {
      if (typeof rawTier === 'number') {
        return Math.min(6, Math.max(0, rawTier));
      }
      return this.parseTierString(String(rawTier));
    }

    const rawFrame = this.frameId();
    if (typeof rawFrame === 'number') {
      return Math.min(6, Math.max(0, rawFrame));
    }
    return this.parseTierString(String(rawFrame || ''));
  });

  /** CSS class tên tier tương ứng */
  readonly tierClass = computed<string>(() => {
    const classes = [
      'tier-bronze',
      'tier-silver',
      'tier-gold',
      'tier-platinum',
      'tier-diamond',
      'tier-master',
      'tier-legend'
    ];
    return classes[this.tierIndex()] ?? 'tier-bronze';
  });

  /** URL avatar hợp lệ */
  readonly displayAvatarUrl = computed<string>(() => {
    const url = this.avatarUrl();
    if (url && url.trim().length > 0) return url;
    return '';
  });

  /** URL ảnh huy hiệu (nếu không có avatar) */
  readonly displayBadgeImgUrl = computed<string>(() => {
    const customBadge = this.badgeImgUrl();
    if (customBadge && customBadge.trim().length > 0) return customBadge;

    const defaultBadges = [
      'assets/image/ranks/bronze.png',
      'assets/image/ranks/silver.png',
      'assets/image/ranks/gold.png',
      'assets/image/ranks/platinum.png',
      'assets/image/ranks/diamond.png',
      'assets/image/ranks/master.png',
      'assets/image/ranks/legend.png'
    ];
    return defaultBadges[this.tierIndex()] || defaultBadges[0];
  });

  private parseTierString(str: string): number {
    const id = str.toLowerCase();
    if (id.includes('legend') || id.includes('mythic') || id === '6') return 6;
    if (id.includes('master') || id.includes('cyber') || id === '5') return 5;
    if (id.includes('diamond') || id === '4') return 4;
    if (id.includes('platinum') || id.includes('season') || id.includes('ice') || id === '3') return 3;
    if (id.includes('gold') || id.includes('flame') || id === '2') return 2;
    if (id.includes('silver') || id === '1') return 1;
    return 0; // Bronze / Default
  }

  /** Fallback khi ảnh badge local chưa có */
  onBadgeImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (!target) return;
    const seeds = [
      'BronzeDragon',
      'SilverDragon',
      'GoldDragon',
      'PlatinumDragon',
      'DiamondDragon',
      'MasterDragon',
      'LegendDragon'
    ];
    const seed = seeds[this.tierIndex()] || 'Dragon';
    target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&radius=20`;
  }
}
