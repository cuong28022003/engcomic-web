import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-state.component.html',
  styleUrls: ['./error-state.component.scss']
})
export class ErrorStateComponent {
  readonly title = input<string>('Đã xảy ra sự cố');
  readonly message = input<string>('Không thể tải dữ liệu, vui lòng thử lại.');
  readonly retry = output<void>();

  onRetry(): void {
    this.retry.emit();
  }
}