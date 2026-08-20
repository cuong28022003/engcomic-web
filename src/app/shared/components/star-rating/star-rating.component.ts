import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-star-rating" [class.readonly]="readonly">
      <button
        *ngFor="let star of stars; let idx = index"
        type="button"
        class="star-btn"
        [class.filled]="idx < rating"
        [class.hovered]="!readonly && idx < hoverIndex"
        [disabled]="readonly"
        (mouseenter)="onHover(idx + 1)"
        (mouseleave)="onHover(0)"
        (click)="setRating(idx + 1)"
        [title]="starTitles[idx] || (idx + 1) + ' sao'"
      >
        <i class="fa-solid fa-star"></i>
      </button>
      <span class="rating-text" *ngIf="showLabel && (rating > 0 || hoverIndex > 0)">
        {{ starTitles[(hoverIndex || rating) - 1] || ((hoverIndex || rating) + '/5') }}
      </span>
    </div>
  `,
  styles: [`
    .app-star-rating {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      user-select: none;
    }

    .star-btn {
      background: transparent;
      border: none;
      padding: 3px;
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.18);
      cursor: pointer;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover:not(:disabled) {
        transform: scale(1.22);
      }

      &.filled {
        color: #ffb800;
        text-shadow: 0 0 10px rgba(255, 184, 0, 0.5);
      }

      &.hovered {
        color: #ffc933;
      }
    }

    .readonly .star-btn {
      cursor: default;
      font-size: 1rem;
      padding: 1px;
    }

    .rating-text {
      margin-left: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #ffb800;
      white-space: nowrap;
    }
  `]
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() maxStars = 5;
  @Input() readonly = false;
  @Input() showLabel = false;
  @Input() starTitles: string[] = [
    'Rất kém / Hoàn toàn không nhớ',
    'Kém / Khó nhớ',
    'Bình thường / Nhớ một phần',
    'Tốt / Nhớ rõ',
    'Thành thạo / Rất tự tin',
  ];

  @Output() ratingChange = new EventEmitter<number>();

  hoverIndex = 0;

  get stars(): number[] {
    return Array.from({ length: this.maxStars }, (_, i) => i);
  }

  onHover(index: number): void {
    if (!this.readonly) {
      this.hoverIndex = index;
    }
  }

  setRating(value: number): void {
    if (!this.readonly) {
      this.rating = value;
      this.ratingChange.emit(value);
    }
  }
}
