import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() icon = 'fa-regular fa-folder-open';
  @Input() title = 'Không có dữ liệu';
  @Input() description = '';
  @Input() actionText = '';
  @Input() actionIcon = '';

  @Output() actionClick = new EventEmitter<void>();
}
