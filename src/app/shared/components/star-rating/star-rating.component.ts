import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
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
