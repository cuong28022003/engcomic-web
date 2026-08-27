import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selection-checkbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selection-checkbox.component.html',
  styleUrls: ['./selection-checkbox.component.scss']
})
export class SelectionCheckboxComponent {
  readonly checked = model<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly label = input<string>('');

  readonly changed = output<boolean>();

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    const nextVal = !this.checked();
    this.checked.set(nextVal);
    this.changed.emit(nextVal);
  }
}
