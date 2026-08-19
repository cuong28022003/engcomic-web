import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Comic } from '@models/index';

@Component({
  selector: 'app-comic-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="comic-card-wrapper">
      <a [routerLink]="['/comics', comic.id]" class="comic-card">
        <!-- Thumbnail Cover -->
        <div class="cover-wrapper">
          <img
            [src]="comic.imageUrl || comic.coverImage || comic.backgroundUrl || 'assets/image/banner-home.png'"
            [alt]="comic.title || comic.name || 'Truyện tranh'"
            class="cover-image"
            loading="lazy"
            (error)="onImageError($event)"
          />

          <!-- Overlay Badges -->
          <div class="card-badges">
            @if (comic.isPremium) {
              <span class="badge badge-vip"><i class="fa-solid fa-crown"></i> VIP</span>
            }
            @if (comic.rating) {
              <span class="badge rating-badge">
                <i class="fa-solid fa-star star-icon"></i> {{ comic.rating | number:'1.1-1' }}
              </span>
            }
          </div>

          <!-- Quick Action Hover Overlay -->
          <div class="card-hover-overlay">
            <span class="read-btn btn-primary">Đọc ngay</span>
          </div>
        </div>

        <!-- Meta info -->
        <div class="comic-info">
          <h3 class="comic-title" [title]="comic.title || comic.name || ''">{{ comic.title || comic.name }}</h3>

          <div class="meta-row">
            <span class="views">
              <i class="fa-regular fa-eye"></i> {{ (comic.views || 0) | number }}
            </span>
            @if (comic.totalChapters) {
              <span class="chapters">
                <i class="fa-regular fa-bookmark"></i> {{ comic.totalChapters }} chương
              </span>
            }
          </div>

          <!-- Genres -->
          @if (comic.genres && comic.genres.length > 0) {
            <div class="genre-tags">
              @for (genre of comic.genres.slice(0, 2); track genre) {
                <span class="genre-tag">{{ genre }}</span>
              }
            </div>
          } @else if (comic.genre) {
            <div class="genre-tags">
              <span class="genre-tag">{{ comic.genre }}</span>
            </div>
          }
        </div>
      </a>
    </div>
  `,
  styles: [`
    .comic-card-wrapper {
      height: 100%;
    }

    .comic-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .comic-card:hover {
      transform: translateY(-6px);
      border-color: var(--border-glow);
      box-shadow: 0 12px 30px rgba(255, 51, 119, 0.2);
    }

    .cover-wrapper {
      position: relative;
      width: 100%;
      padding-top: 140%; /* 1:1.4 aspect ratio */
      overflow: hidden;
      background: #11131d;
    }

    .cover-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .comic-card:hover .cover-image {
      transform: scale(1.06);
    }

    .card-badges {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2;
    }

    .rating-badge {
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      color: #ffc107;
      font-size: 0.75rem;
      border: 1px solid rgba(255, 193, 7, 0.3);
    }

    .star-icon { color: #ffc107; }

    .card-hover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(13, 15, 23, 0.65);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
      z-index: 3;
    }

    .comic-card:hover .card-hover-overlay {
      opacity: 1;
    }

    .read-btn {
      padding: 8px 18px;
      font-size: 0.85rem;
      pointer-events: none;
    }

    .comic-info {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    .comic-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.35;
      min-height: 2.7em;
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--text-dim);
    }

    .genre-tags {
      display: flex;
      gap: 6px;
      margin-top: auto;
    }

    .genre-tag {
      font-size: 0.72rem;
      padding: 2px 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-sm);
      color: var(--text-muted);
    }
  `]
})
export class ComicCardComponent {
  @Input({ required: true }) comic!: Comic;

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';
  }
}
