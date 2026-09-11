import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

export interface EcosystemLink {
  label: string;
  sublabel: string;
  url: string;
  icon: string;
  tag?: string;
  badgeClass?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EcosystemService {
  readonly comicAppBaseUrl = environment.comicAppUrl || 'http://localhost:3000';

  /** Link tới trang danh sách truyện tranh */
  get comicsUrl(): string {
    return `${this.comicAppBaseUrl}/comics`;
  }

  /** Link tới chi tiết bộ truyện tranh */
  comicDetailUrl(comicId: string): string {
    return `${this.comicAppBaseUrl}/comics/${comicId}`;
  }

  /** Link tới trang Gacha quay tướng */
  get gachaUrl(): string {
    return `${this.comicAppBaseUrl}/gacha`;
  }

  /** Link tới Đấu trường Fighting Game */
  get fightingGameUrl(): string {
    return `${this.comicAppBaseUrl}/fighting-game`;
  }

  /** Link tới Nạp Kim Cương Topup */
  get topupUrl(): string {
    return `${this.comicAppBaseUrl}/diamond-topup`;
  }

  /** Danh sách các cổng chuyển hướng nhanh */
  get quickLinks(): EcosystemLink[] {
    return [
      {
        label: 'Đọc Truyện Tranh',
        sublabel: 'Song ngữ 1-chạm & OCR',
        url: this.comicsUrl,
        icon: 'fa-solid fa-book-open',
        tag: 'Reading',
        badgeClass: 'badge-comic'
      },
      {
        label: 'Quay Gacha Nhân Vật',
        sublabel: 'Dùng Kim Cương chiêu mộ tướng SSR',
        url: this.gachaUrl,
        icon: 'fa-solid fa-gem',
        tag: 'Gacha RPG',
        badgeClass: 'badge-gacha'
      },
      {
        label: 'Đấu Trường Fighting Game',
        sublabel: 'So tài võ đài với dàn tướng Gacha',
        url: this.fightingGameUrl,
        icon: 'fa-solid fa-gamepad',
        tag: 'Combat Game',
        badgeClass: 'badge-game'
      },
      {
        label: 'Nạp Kim Cương',
        sublabel: 'Nhận thêm vé quay Gacha',
        url: this.topupUrl,
        icon: 'fa-solid fa-credit-card',
        tag: 'Topup',
        badgeClass: 'badge-topup'
      }
    ];
  }

  /** Mở đường link trong tab mới hoặc tab hiện tại */
  openExternal(url: string, newTab = true): void {
    if (newTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  }

  openComics(newTab = true): void {
    this.openExternal(this.comicsUrl, newTab);
  }

  openGacha(newTab = true): void {
    this.openExternal(this.gachaUrl, newTab);
  }

  openFightingGame(newTab = true): void {
    this.openExternal(this.fightingGameUrl, newTab);
  }
}
