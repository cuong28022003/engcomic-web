import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-level-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './level-indicator.component.html',
  styleUrls: ['./level-indicator.component.scss'],
})
export class LevelIndicatorComponent {
  currentLevel = input<number>(1);

  readonly levels = [
    { level: 1, label: 'Nhận Biết', desc: 'Trắc nghiệm nghĩa từ', icon: 'fa-eye' },
    { level: 2, label: 'Ngữ Cảnh', desc: 'Điền cụm từ (Collocations)', icon: 'fa-quote-left' },
    { level: 3, label: 'Tái Hiện', desc: 'Sắp xếp câu hội thoại', icon: 'fa-puzzle-piece' },
    { level: 4, label: 'Thực Tế', desc: 'Tình huống giao tiếp & Tự tin', icon: 'fa-star' },
  ];
}
