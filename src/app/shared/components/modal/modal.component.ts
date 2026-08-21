import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  readonly isOpen = model<boolean>(false);
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly closeOnBackdrop = input<boolean>(true);

  readonly closed = output<void>();
  readonly close = output<void>();

  closeModal(): void {
    this.isOpen.set(false);
    this.closed.emit();
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop()) {
      this.closeModal();
    }
  }
}