import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusBadgeType = 'success' | 'warning' | 'danger' | 'info' | 'vip' | 'rarity' | 'level' | 'default';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  readonly type = input<StatusBadgeType>('default');
  readonly label = input<string>('');
  readonly icon = input<string>('');
}